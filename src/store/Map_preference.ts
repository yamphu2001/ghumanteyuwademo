import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MapTheme = 'light' | 'dark' | 'liberty' | 'satellite' | 'outdoors';

export interface MapPreferenceState {
  theme: MapTheme;
  is3D: boolean;
  zoom: number;
  pitch: number;
  
  setTheme: (theme: MapTheme) => void;
  toggle3D: () => void;
  setZoom: (zoom: number) => void;
}

export const useMapPreferenceStore = create<MapPreferenceState>()(
  persist(
    (set) => ({
      theme: 'liberty', 
      is3D: true,
      zoom: 15,
      pitch: 50,

      setTheme: (theme) => set({ theme }),
      
      toggle3D: () => set((state) => ({ 
        is3D: !state.is3D,
        pitch: !state.is3D ? 50 : 0 
      })),

      setZoom: (zoom) => set({ zoom }),
    }),
    {
      name: 'ghumante-map-prefs',
    }
  )
);