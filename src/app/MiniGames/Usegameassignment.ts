
// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { rtdb } from "@/lib/firebase";
// import { ref, get, set, update } from "firebase/database";
// import { getAuth } from "firebase/auth";

// export type GameId = 'colorhunt' | 'yuwatravel' | 'dailyquest';

// export const GAME_META: Record<GameId, { title: string; emoji: string; gradient: string; description: string }> = {
//   colorhunt:   { title: 'Color Hunt',       emoji: '', gradient: 'from-orange-400 to-pink-500',   description: 'Hunt for colors using your camera.' },
//   yuwatravel:  { title: 'Landmark Session', emoji: '', gradient: 'from-blue-400 to-indigo-600',   description: 'Pose Yuwa at famous landmarks.' },
//   dailyquest:  { title: 'Aaja Ko Khoj',     emoji: '', gradient: 'from-amber-400 to-orange-600', description: 'Find and photograph 3 heritage items.' },
// };

// export const ALL_GAME_IDS: GameId[] = ['colorhunt', 'yuwatravel', 'dailyquest'];

// function shuffle<T>(arr: T[]): T[] {
//   const a = [...arr];
//   for (let i = a.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [a[i], a[j]] = [a[j], a[i]];
//   }
//   return a;
// }

// // ── sessionStorage keys ───────────────────────────────────────────────────────
// const SESSION_ASSIGNMENT_KEY = 'yuwa_doc_assignment';
// const SESSION_COMPLETED_KEY  = 'yuwa_completed_docs';
// const MARKER_SET_KEY         = 'yuwa_marker_set';

// function getSessionAssignment(): Record<string, GameId> {
//   try {
//     const raw = sessionStorage.getItem(SESSION_ASSIGNMENT_KEY);
//     return raw ? JSON.parse(raw) : {};
//   } catch { return {}; }
// }
// function saveSessionAssignment(a: Record<string, GameId>) {
//   try { sessionStorage.setItem(SESSION_ASSIGNMENT_KEY, JSON.stringify(a)); } catch {}
// }
// function getSessionCompleted(): Set<string> {
//   try {
//     const raw = sessionStorage.getItem(SESSION_COMPLETED_KEY);
//     return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
//   } catch { return new Set(); }
// }
// function saveSessionCompleted(s: Set<string>) {
//   try { sessionStorage.setItem(SESSION_COMPLETED_KEY, JSON.stringify([...s])); } catch {}
// }

// function getUid(): string | null {
//   return getAuth().currentUser?.uid ?? null;
// }

// // ── Load everything from RTDB in one read ─────────────────────────────────────
// async function loadAllFromRTDB(): Promise<{
//   assignment: Record<string, GameId>;
//   completed: Set<string>;
// }> {
//   const uid = getUid();
//   if (!uid) return { assignment: {}, completed: new Set() };
//   try {
//     const snap = await get(ref(rtdb, `userProgress/${uid}`));
//     if (!snap.exists()) return { assignment: {}, completed: new Set() };
//     const data = snap.val();
//     const assignment: Record<string, GameId> = data.gameAssignment ?? {};
//     const completed = new Set<string>();
//     if (data.completedDocs) {
//       Object.keys(data.completedDocs)
//         .filter(k => data.completedDocs[k] === true)
//         .forEach(k => completed.add(k));
//     }
//     // legacy path
//     if (data.specialMarkers) {
//       Object.entries(data.specialMarkers as Record<string, string>)
//         .filter(([, v]) => v === 'unlocked')
//         .forEach(([k]) => completed.add(k));
//     }
//     return { assignment, completed };
//   } catch (err) {
//     console.warn('[GameAssignment] RTDB load error:', err);
//     return { assignment: {}, completed: new Set() };
//   }
// }

// /**
//  * Assign games to ALL markers at once in a single RTDB write.
//  */
// function buildAssignment(
//   docIds: string[],
//   existingAssignment: Record<string, GameId>,
// ): Record<string, GameId> {
//   const result: Record<string, GameId> = { ...existingAssignment };

//   const newDocIds = docIds.filter(id => !result[id]);
//   if (newDocIds.length === 0) return result;

//   const usedGames = new Set(
//     docIds.filter(id => result[id]).map(id => result[id])
//   );

//   const pool: GameId[] = [];
//   const shuffled = shuffle([...ALL_GAME_IDS]);

//   while (pool.length < newDocIds.length) {
//     for (const g of shuffled) {
//       if (!usedGames.has(g)) {
//         pool.push(g);
//         usedGames.add(g);
//         if (pool.length >= newDocIds.length) break;
//       }
//     }
//     usedGames.clear();
//     docIds.filter(id => result[id]).forEach(id => usedGames.add(result[id]));
//   }

//   newDocIds.forEach((id, i) => {
//     result[id] = pool[i];
//   });

//   return result;
// }

// async function saveAssignmentToRTDB(assignment: Record<string, GameId>) {
//   const uid = getUid();
//   if (!uid) return;
//   try {
//     const updates: Record<string, GameId> = {};
//     Object.entries(assignment).forEach(([docId, gameId]) => {
//       updates[`userProgress/${uid}/gameAssignment/${docId}`] = gameId;
//     });
//     await update(ref(rtdb), updates);
//   } catch (err) {
//     console.warn('[GameAssignment] RTDB save error:', err);
//   }
// }

// async function saveCompletedToRTDB(docId: string) {
//   const uid = getUid();
//   if (!uid) return;
//   try {
//     await set(ref(rtdb, `userProgress/${uid}/completedDocs/${docId}`), true);
//   } catch (err) {
//     console.warn('[GameAssignment] RTDB completed save error:', err);
//   }
// }

// // ── resetIfMarkersChanged — session cache only, never touches RTDB ────────────
// export function resetIfMarkersChanged(currentDocIds: string[]) {
//   try {
//     const sorted = [...currentDocIds].sort().join(',');
//     const stored = sessionStorage.getItem(MARKER_SET_KEY);
//     if (stored !== sorted) {
//       sessionStorage.removeItem(SESSION_ASSIGNMENT_KEY);
//       sessionStorage.removeItem(SESSION_COMPLETED_KEY);
//       sessionStorage.setItem(MARKER_SET_KEY, sorted);
//     }
//   } catch {}
// }

// /**
//  * Call this after hydrating from eventsProgress (Firebase).
//  * Removes from sessionStorage any docIds that are no longer present in Firebase,
//  * so that markers deleted by an admin are correctly shown as playable again.
//  *
//  * This also dispatches a custom event so that any mounted useGameAssignment
//  * hook instances can update their in-memory `completed` state reactively.
//  *
//  * @param validIds  The set of docIds currently marked as completed in Firebase.
//  */
// export function syncCompletedSession(validIds: Set<string>): void {
//   try {
//     const current = getSessionCompleted();
//     let changed = false;

//     // Remove any id that is no longer backed by Firebase
//     current.forEach((id) => {
//       if (!validIds.has(id)) {
//         current.delete(id);
//         changed = true;
//       }
//     });

//     if (changed) {
//       saveSessionCompleted(current);
//       // Notify mounted hook instances to re-read from sessionStorage
//       window.dispatchEvent(
//         new CustomEvent('yuwa:completed-synced', { detail: { validIds: [...validIds] } })
//       );
//     }
//   } catch {}
// }

// // ── Main hook ─────────────────────────────────────────────────────────────────
// export function useGameAssignment() {
//   const [assignment, setAssignment] = useState<Record<string, GameId>>(() => getSessionAssignment());
//   const [completed, setCompleted]   = useState<Set<string>>(() => getSessionCompleted());
//   const [hydrated, setHydrated]     = useState(false);

//   // ── Hydrate from RTDB once on mount ───────────────────────────────────────
//   useEffect(() => {
//     loadAllFromRTDB().then(({ assignment: rtdbAssignment, completed: rtdbCompleted }) => {
//       const merged = { ...getSessionAssignment(), ...rtdbAssignment };
//       saveSessionAssignment(merged);
//       setAssignment(merged);
//       saveSessionCompleted(rtdbCompleted);
//       setCompleted(rtdbCompleted);
//       setHydrated(true);
//     }).catch(err => {
//       console.warn('[GameAssignment] hydration error:', err);
//       setHydrated(true);
//     });
//   }, []);

  
// // Inside useGameAssignment hook
// useEffect(() => {
//   const handler = (e: Event) => {
//     const { validIds } = (e as CustomEvent<{ validIds: string[] }>).detail;
//     const validSet = new Set<string>(validIds);

//     setCompleted(validSet);
    
//     // CRITICAL: Update sessionStorage so the 'true' value is actually removed
//     try {
//       sessionStorage.setItem('yuwa_completed_docs', JSON.stringify([...validSet]));
//     } catch (err) {
//       console.error("Failed to sync sessionStorage", err);
//     }
//   };

//   window.addEventListener('yuwa:completed-synced', handler);
//   return () => window.removeEventListener('yuwa:completed-synced', handler);
// }, []);
//   const assignAllMarkers = useCallback((docIds: string[]) => {
//     if (!hydrated) return;

//     const current = getSessionAssignment();
//     const allAssigned = docIds.every(id => current[id]);
//     if (allAssigned) return;

//     const complete = buildAssignment(docIds, current);
//     saveSessionAssignment(complete);
//     setAssignment(complete);

//     const newEntries = Object.fromEntries(
//       Object.entries(complete).filter(([id]) => !current[id])
//     ) as Record<string, GameId>;
//     if (Object.keys(newEntries).length > 0) {
//       saveAssignmentToRTDB(newEntries);
//     }
//   }, [hydrated]);

//   const getGameForDoc = useCallback((docId: string): GameId => {
//     return assignment[docId] ?? ALL_GAME_IDS[0];
//   }, [assignment]);

//   const markComplete = useCallback((docId: string) => {
//     setCompleted(prev => {
//       const next = new Set(prev);
//       next.add(docId);
//       saveSessionCompleted(next);
//       return next;
//     });
//     saveCompletedToRTDB(docId);
//   }, []);

//   const isCompleted = useCallback((docId: string) => completed.has(docId), [completed]);

//   return { getGameForDoc, assignAllMarkers, markComplete, isCompleted, hydrated };
// }


'use client';

import { useState, useEffect, useCallback } from 'react';
import { rtdb } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";
import { getAuth } from "firebase/auth";

export type GameId = 'colorhunt' | 'yuwatravel' | 'dailyquest';

export const GAME_META: Record<GameId, { title: string; emoji: string; gradient: string; description: string }> = {
  colorhunt:   { title: 'Color Hunt',       emoji: '', gradient: 'from-orange-400 to-pink-500',   description: 'Hunt for colors using your camera.' },
  yuwatravel:  { title: 'Landmark Session', emoji: '', gradient: 'from-blue-400 to-indigo-600',   description: 'Pose Yuwa at famous landmarks.' },
  dailyquest:  { title: 'Aaja Ko Khoj',     emoji: '', gradient: 'from-amber-400 to-orange-600', description: 'Find and photograph 3 heritage items.' },
};

export const ALL_GAME_IDS: GameId[] = ['colorhunt', 'yuwatravel', 'dailyquest'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── sessionStorage keys ───────────────────────────────────────────────────────
const SESSION_ASSIGNMENT_KEY = 'yuwa_doc_assignment';
const SESSION_COMPLETED_KEY  = 'yuwa_completed_docs';
const MARKER_SET_KEY         = 'yuwa_marker_set';

function getSessionAssignment(): Record<string, GameId> {
  try {
    const raw = sessionStorage.getItem(SESSION_ASSIGNMENT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveSessionAssignment(a: Record<string, GameId>) {
  try { sessionStorage.setItem(SESSION_ASSIGNMENT_KEY, JSON.stringify(a)); } catch {}
}
function getSessionCompleted(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_COMPLETED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}
function saveSessionCompleted(s: Set<string>) {
  try { sessionStorage.setItem(SESSION_COMPLETED_KEY, JSON.stringify([...s])); } catch {}
}

function getUid(): string | null {
  return getAuth().currentUser?.uid ?? null;
}

// ── Load everything from RTDB in one read ─────────────────────────────────────
async function loadAllFromRTDB(): Promise<{
  assignment: Record<string, GameId>;
  completed: Set<string>;
}> {
  const uid = getUid();
  if (!uid) return { assignment: {}, completed: new Set() };
  try {
    const snap = await get(ref(rtdb, `userProgress/${uid}`));
    if (!snap.exists()) return { assignment: {}, completed: new Set() };
    const data = snap.val();
    const assignment: Record<string, GameId> = data.gameAssignment ?? {};
    const completed = new Set<string>();
    if (data.completedDocs) {
      Object.keys(data.completedDocs)
        .filter(k => data.completedDocs[k] === true)
        .forEach(k => completed.add(k));
    }
    // legacy path
    if (data.specialMarkers) {
      Object.entries(data.specialMarkers as Record<string, string>)
        .filter(([, v]) => v === 'unlocked')
        .forEach(([k]) => completed.add(k));
    }
    return { assignment, completed };
  } catch (err) {
    console.warn('[GameAssignment] RTDB load error:', err);
    return { assignment: {}, completed: new Set() };
  }
}

/**
 * Assign games to ALL markers at once in a single RTDB write.
 */
function buildAssignment(
  docIds: string[],
  existingAssignment: Record<string, GameId>,
): Record<string, GameId> {
  const result: Record<string, GameId> = { ...existingAssignment };

  const newDocIds = docIds.filter(id => !result[id]);
  if (newDocIds.length === 0) return result;

  const usedGames = new Set(
    docIds.filter(id => result[id]).map(id => result[id])
  );

  const pool: GameId[] = [];
  const shuffled = shuffle([...ALL_GAME_IDS]);

  while (pool.length < newDocIds.length) {
    for (const g of shuffled) {
      if (!usedGames.has(g)) {
        pool.push(g);
        usedGames.add(g);
        if (pool.length >= newDocIds.length) break;
      }
    }
    usedGames.clear();
    docIds.filter(id => result[id]).forEach(id => usedGames.add(result[id]));
  }

  newDocIds.forEach((id, i) => {
    result[id] = pool[i];
  });

  return result;
}

async function saveAssignmentToRTDB(assignment: Record<string, GameId>) {
  const uid = getUid();
  if (!uid) return;
  try {
    const updates: Record<string, GameId> = {};
    Object.entries(assignment).forEach(([docId, gameId]) => {
      updates[`userProgress/${uid}/gameAssignment/${docId}`] = gameId;
    });
    await update(ref(rtdb), updates);
  } catch (err) {
    console.warn('[GameAssignment] RTDB save error:', err);
  }
}

async function saveCompletedToRTDB(docId: string) {
  const uid = getUid();
  if (!uid) return;
  try {
    await set(ref(rtdb, `userProgress/${uid}/completedDocs/${docId}`), true);
  } catch (err) {
    console.warn('[GameAssignment] RTDB completed save error:', err);
  }
}

// ── resetIfMarkersChanged — session cache only, never touches RTDB ────────────
export function resetIfMarkersChanged(currentDocIds: string[]) {
  try {
    const sorted = [...currentDocIds].sort().join(',');
    const stored = sessionStorage.getItem(MARKER_SET_KEY);
    if (stored !== sorted) {
      sessionStorage.removeItem(SESSION_ASSIGNMENT_KEY);
      sessionStorage.removeItem(SESSION_COMPLETED_KEY);
      sessionStorage.setItem(MARKER_SET_KEY, sorted);
    }
  } catch {}
}

/**
 * Call this after hydrating from eventsProgress (Firebase).
 * Removes from sessionStorage any docIds that are no longer present in Firebase,
 * so that markers deleted by an admin are correctly shown as playable again.
 *
 * This also dispatches a custom event so that any mounted useGameAssignment
 * hook instances can update their in-memory `completed` state reactively.
 *
 * @param validIds  The set of docIds currently marked as completed in Firebase.
 */
export function syncCompletedSession(validIds: Set<string>): void {
  try {
    // 1. Force update the specific key used by the hook
    sessionStorage.setItem('yuwa_completed_docs', JSON.stringify([...validIds]));

    // 2. Dispatch event to update all active hooks
    window.dispatchEvent(
      new CustomEvent('yuwa:completed-synced', { 
        detail: { validIds: [...validIds] } 
      })
    );
  } catch (err) {
    console.error("Sync failed", err);
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useGameAssignment() {
  const [assignment, setAssignment] = useState<Record<string, GameId>>(() => getSessionAssignment());
  const [completed, setCompleted]   = useState<Set<string>>(() => getSessionCompleted());
  const [hydrated, setHydrated]     = useState(false);

  // ── Hydrate from RTDB once on mount ───────────────────────────────────────
  useEffect(() => {
    loadAllFromRTDB().then(({ assignment: rtdbAssignment, completed: rtdbCompleted }) => {
      const merged = { ...getSessionAssignment(), ...rtdbAssignment };
      saveSessionAssignment(merged);
      setAssignment(merged);
      saveSessionCompleted(rtdbCompleted);
      setCompleted(rtdbCompleted);
      setHydrated(true);
    }).catch(err => {
      console.warn('[GameAssignment] hydration error:', err);
      setHydrated(true);
    });
  }, []);

  
// Inside useGameAssignment hook
useEffect(() => {
  const handler = (e: Event) => {
    const { validIds } = (e as CustomEvent<{ validIds: string[] }>).detail;
    const validSet = new Set<string>(validIds);

    setCompleted(validSet);
    
    // CRITICAL: Update sessionStorage so the 'true' value is actually removed
    try {
      sessionStorage.setItem('yuwa_completed_docs', JSON.stringify([...validSet]));
    } catch (err) {
      console.error("Failed to sync sessionStorage", err);
    }
  };

  window.addEventListener('yuwa:completed-synced', handler);
  return () => window.removeEventListener('yuwa:completed-synced', handler);
}, []);
  const assignAllMarkers = useCallback((docIds: string[]) => {
    if (!hydrated) return;

    const current = getSessionAssignment();
    const allAssigned = docIds.every(id => current[id]);
    if (allAssigned) return;

    const complete = buildAssignment(docIds, current);
    saveSessionAssignment(complete);
    setAssignment(complete);

    const newEntries = Object.fromEntries(
      Object.entries(complete).filter(([id]) => !current[id])
    ) as Record<string, GameId>;
    if (Object.keys(newEntries).length > 0) {
      saveAssignmentToRTDB(newEntries);
    }
  }, [hydrated]);

  const getGameForDoc = useCallback((docId: string): GameId => {
    return assignment[docId] ?? ALL_GAME_IDS[0];
  }, [assignment]);

  const markComplete = useCallback((docId: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(docId);
      saveSessionCompleted(next);
      return next;
    });
    saveCompletedToRTDB(docId);
  }, []);

  const isCompleted = useCallback((docId: string) => completed.has(docId), [completed]);

  return { getGameForDoc, assignAllMarkers, markComplete, isCompleted, hydrated };
}