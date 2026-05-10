// questStore.ts
// Zustand store + IndexedDB helpers for DailyQuest persistence

import { create } from 'zustand';

// ── IndexedDB helpers ──────────────────────────────────────────────────────────

const DB_NAME  = 'ghumante-yuwa';
const DB_VER   = 1;
const ST_META  = 'quest-meta';   // stores quest list + screen + activeItemId
const ST_PHOTO = 'quest-photos'; // stores photos keyed by item id

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(ST_META);
      req.result.createObjectStore(ST_PHOTO);
    };
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db  = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result as T);
    req.onerror   = () => rej(req.error);
  });
}

async function idbSet(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value, key);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

async function idbDel(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

async function idbClearStore(store: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeritageItem {
  id:     number;
  name:   string;
  nepali: string;
  icon:   string;
}

export type Screen = 'list' | 'camera' | 'review' | 'done';

interface QuestMeta {
  quests:       HeritageItem[];
  screen:       Screen;
  activeItemId: number | null;
}

interface QuestState {
  quests:       HeritageItem[];
  photos:       Record<number, string>;  // id → data-url
  activeItem:   HeritageItem | null;
  screen:       Screen;
  hydrated:     boolean;

  // actions
  hydrate:      () => Promise<void>;
  setQuests:    (items: HeritageItem[]) => void;
  setScreen:    (s: Screen) => void;
  setActive:    (item: HeritageItem | null) => void;
  savePhoto:    (itemId: number, dataUrl: string) => Promise<void>;
  deletePhoto:  (itemId: number) => Promise<void>;
  resetAll:     (newQuests: HeritageItem[]) => Promise<void>;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useQuestStore = create<QuestState>((set, get) => ({
  quests:     [],
  photos:     {},
  activeItem: null,
  screen:     'list',
  hydrated:   false,

  hydrate: async () => {
    try {
      const meta   = await idbGet<QuestMeta>(ST_META, 'meta');
      const photoIds: number[] = meta?.quests.map(q => q.id) ?? [];

      const photos: Record<number, string> = {};
      await Promise.all(
        photoIds.map(async id => {
          const url = await idbGet<string>(ST_PHOTO, String(id));
          if (url) photos[id] = url;
        })
      );

      set({
        quests:     meta?.quests      ?? [],
        screen:     meta?.screen      ?? 'list',
        activeItem: meta?.quests.find(q => q.id === meta.activeItemId) ?? null,
        photos,
        hydrated:   true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setQuests: (items) => {
    set({ quests: items });
    const { screen, activeItem } = get();
    idbSet(ST_META, 'meta', { quests: items, screen, activeItemId: activeItem?.id ?? null });
  },

  setScreen: (s) => {
    set({ screen: s });
    const { quests, activeItem } = get();
    idbSet(ST_META, 'meta', { quests, screen: s, activeItemId: activeItem?.id ?? null });
  },

  setActive: (item) => {
    set({ activeItem: item });
    const { quests, screen } = get();
    idbSet(ST_META, 'meta', { quests, screen, activeItemId: item?.id ?? null });
  },

  savePhoto: async (itemId, dataUrl) => {
    await idbSet(ST_PHOTO, String(itemId), dataUrl);
    set(state => ({ photos: { ...state.photos, [itemId]: dataUrl } }));
  },

  deletePhoto: async (itemId) => {
    await idbDel(ST_PHOTO, String(itemId));
    set(state => {
      const next = { ...state.photos };
      delete next[itemId];
      return { photos: next };
    });
  },

  resetAll: async (newQuests) => {
    await idbClearStore(ST_PHOTO);
    await idbSet(ST_META, 'meta', { quests: newQuests, screen: 'list', activeItemId: null });
    set({ quests: newQuests, photos: {}, activeItem: null, screen: 'list' });
  },
}));