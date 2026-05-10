

import { create } from 'zustand';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

/** Returns today's date as a string key e.g. "2026-04-06" */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export type MapMode = 'today' | 'history' | 'global';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Waits for Firebase Auth to restore session, then returns username.
 * On reload, auth.currentUser is null for a moment — this waits for it.
 */
function waitForUsername(): Promise<string | null> {
  return new Promise((resolve) => {
    // If already signed in, fetch immediately
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid))
        .then((snap) => {
          if (snap.exists()) {
            resolve(snap.data()?.username ?? snap.data()?.name ?? null);
          } else {
            resolve(null);
          }
        })
        .catch(() => resolve(null));
      return;
    }

    // Otherwise wait for auth to restore (fires once on page load)
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub(); // unsubscribe immediately after first event
      if (!user) { resolve(null); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          resolve(snap.data()?.username ?? snap.data()?.name ?? null);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  });
}

/** Parse a Firestore cell doc into a GeoJSON Feature */
function docToFeature(data: any): GeoJSON.Feature | null {
  try {
    const geometry = data.geometryJson
      ? (JSON.parse(data.geometryJson) as GeoJSON.Geometry)
      : null;
    if (!geometry) return null;
    return {
      type: 'Feature',
      geometry,
      properties: data.properties ?? {},
    };
  } catch {
    console.warn('[GridStore] Failed to parse geometryJson for', data.id);
    return null;
  }
}

/**
 * Every plotted cell is written to 3 tables simultaneously:
 * TODAY   → Gridplot/Today/{date}/{username}/cells/{cellId}
 * HISTORY → Gridplot/History/users/{username}/cells/{cellId}
 * GLOBAL  → Gridplot/Global/cells/{username}_{cellId}
 */
async function persistCell(
  cellId: string,
  feature: GeoJSON.Feature,
  mode: MapMode
): Promise<void> {
  try {
    const username = await waitForUsername();
    if (!username) {
      console.warn('[GridStore] No username — cell not saved.');
      return;
    }

    const date = todayKey();
    const geometry = feature.geometry ?? null;
    const payload = {
      id: cellId,
      username,
      date,
      geometryJson: geometry ? JSON.stringify(geometry) : null,
      properties: feature.properties ?? {},
      savedAt: serverTimestamp(),
    };

    const todayRef   = doc(db, 'Gridplot', 'Today', date, username, 'cells', cellId);
    const historyRef = doc(db, 'Gridplot', 'History', 'users', username, 'cells', cellId);
    const globalRef  = doc(db, 'Gridplot', 'Global', 'cells', `${username}_${cellId}`);

    await Promise.all([
      setDoc(todayRef,   payload, { merge: true }),
      setDoc(historyRef, payload, { merge: true }),
      setDoc(globalRef,  { ...payload, cellId }, { merge: true }),
    ]);
  } catch (e) {
    console.error('[GridStore] Firestore write failed:', e);
  }
}

async function persistCells(features: GeoJSON.Feature[]): Promise<void> {
  await Promise.all(
    features.map((f) => {
      const id = f.properties?.id;
      if (!id) return Promise.resolve();
      return persistCell(id, f, 'today');
    })
  );
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface GridState {
  geoData: { [key in MapMode]: GeoJSON.FeatureCollection };
  visitedIds: Set<string>;
  mode: MapMode;
  isSimulating: boolean;
  simSpeed: number;
  isSyncing: boolean;
  setMode: (mode: MapMode) => void;
  setSimSpeed: (ms: number) => void;
  toggleSimulation: () => void;
  addCell: (id: string, feature: GeoJSON.Feature) => void;
  clearGrid: () => void;
  bulkAdd: (features: GeoJSON.Feature[]) => void;
  loadTodayCells: () => Promise<void>;
  loadHistoryCells: () => Promise<void>;
  loadGlobalCells: () => Promise<void>;
}

export const useGridStore = create<GridState>((set) => ({
  geoData: {
    today:   { type: 'FeatureCollection', features: [] },
    history: { type: 'FeatureCollection', features: [] },
    global:  { type: 'FeatureCollection', features: [] },
  },
  visitedIds: new Set<string>(),
  mode: 'today',
  isSimulating: false,
  simSpeed: 100,
  isSyncing: false,

  setMode: (mode) => set({ mode }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  toggleSimulation: () =>
    set((state) => ({ isSimulating: !state.isSimulating })),

  addCell: (id, feature) => {
    set((state) => {
      if (state.visitedIds.has(id)) return state;
      const newVisited = new Set(state.visitedIds).add(id);
      const mode = state.mode;
      if (mode === 'today') persistCell(id, feature, mode);
      return {
        visitedIds: newVisited,
        geoData: {
          ...state.geoData,
          [mode]: {
            ...state.geoData[mode],
            features: [...state.geoData[mode].features, feature],
          },
        },
      };
    });
  },

  clearGrid: () =>
    set((state) => ({
      visitedIds: new Set(),
      geoData: {
        ...state.geoData,
        [state.mode]: { type: 'FeatureCollection', features: [] },
      },
    })),

  bulkAdd: (features) => {
    set((state) => {
      const newVisited = new Set(state.visitedIds);
      const fresh: GeoJSON.Feature[] = [];
      features.forEach((f) => {
        const id = f.properties?.id;
        if (id && !newVisited.has(id)) {
          newVisited.add(id);
          fresh.push(f);
        }
      });
      const mode = state.mode;
      if (mode === 'today' && fresh.length > 0) persistCells(fresh);
      return {
        visitedIds: newVisited,
        geoData: {
          ...state.geoData,
          [mode]: {
            ...state.geoData[mode],
            features: [...state.geoData[mode].features, ...fresh],
          },
        },
      };
    });
  },

  // ── TODAY ─────────────────────────────────────────────────────────────────
  loadTodayCells: async () => {
    set({ isSyncing: true });
    try {
      const username = await waitForUsername(); // waits for auth
      if (!username) { set({ isSyncing: false }); return; }

      const snap = await getDocs(
        collection(db, 'Gridplot', 'Today', todayKey(), username, 'cells')
      );
      const features: GeoJSON.Feature[] = [];
      const ids = new Set<string>();
      snap.forEach((d) => {
        const f = docToFeature(d.data());
        if (!f) return;
        ids.add(d.data().id);
        features.push(f);
      });
      set((state) => ({
        isSyncing: false,
        visitedIds: new Set([...state.visitedIds, ...ids]),
        geoData: { ...state.geoData, today: { type: 'FeatureCollection', features } },
      }));
    } catch (e) {
      console.error('[GridStore] loadTodayCells failed:', e);
      set({ isSyncing: false });
    }
  },

  // ── HISTORY ───────────────────────────────────────────────────────────────
  loadHistoryCells: async () => {
    set({ isSyncing: true });
    try {
      const username = await waitForUsername(); // waits for auth
      if (!username) { set({ isSyncing: false }); return; }

      const snap = await getDocs(
        collection(db, 'Gridplot', 'History', 'users', username, 'cells')
      );
      const features: GeoJSON.Feature[] = [];
      snap.forEach((d) => {
        const f = docToFeature(d.data());
        if (f) features.push(f);
      });
      set((state) => ({
        isSyncing: false,
        geoData: { ...state.geoData, history: { type: 'FeatureCollection', features } },
      }));
    } catch (e) {
      console.error('[GridStore] loadHistoryCells failed:', e);
      set({ isSyncing: false });
    }
  },

  // ── GLOBAL ────────────────────────────────────────────────────────────────
  loadGlobalCells: async () => {
    set({ isSyncing: true });
    try {
      // Global has no username filter so no auth wait needed
      const snap = await getDocs(
        collection(db, 'Gridplot', 'Global', 'cells')
      );
      const features: GeoJSON.Feature[] = [];
      snap.forEach((d) => {
        const f = docToFeature(d.data());
        if (f) features.push(f);
      });
      set((state) => ({
        isSyncing: false,
        geoData: { ...state.geoData, global: { type: 'FeatureCollection', features } },
      }));
    } catch (e) {
      console.error('[GridStore] loadGlobalCells failed:', e);
      set({ isSyncing: false });
    }
  },
}));