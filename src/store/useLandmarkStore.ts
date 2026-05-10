// @/store/useLandmarkStore.ts
import { create } from 'zustand';
import type { Landmark } from '@/features/frontend/play/LocationMarkers/Landmark';
import { fetchLandmarks } from '@/lib/landmarkService';

interface LandmarkStore {
  landmarks: Landmark[];
  isLoading: boolean;
  error: string | null;
  fetchLandmarks: () => Promise<void>;
}

export const useLandmarkStore = create<LandmarkStore>((set) => ({
  landmarks: [],
  isLoading: false,
  error: null,

  fetchLandmarks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchLandmarks();
      set({ landmarks: data, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to load landmarks', isLoading: false });
    }
  },
}));