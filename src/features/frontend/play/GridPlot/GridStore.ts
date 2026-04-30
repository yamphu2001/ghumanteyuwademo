import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MapMode = 'today' | 'history' | 'global';

interface GridState {
  geoData: { [key in MapMode]: GeoJSON.FeatureCollection };
  visitedIds: string[]; // Store as array for JSON compatibility
  mode: MapMode;
  isSimulating: boolean;
  simSpeed: number;
  setMode: (mode: MapMode) => void;
  setSimSpeed: (ms: number) => void;
  toggleSimulation: () => void;
  addCell: (id: string, feature: GeoJSON.Feature) => void;
  clearGrid: () => void;
  bulkAdd: (features: GeoJSON.Feature[]) => void;
}

export const useGridStore = create<GridState>()(
  persist(
    (set) => ({
      geoData: {
        today: { type: 'FeatureCollection', features: [] },
        history: { type: 'FeatureCollection', features: [] },
        global: { type: 'FeatureCollection', features: [] },
      },
      visitedIds: [],
      mode: 'today',
      isSimulating: false,
      simSpeed: 100,

      setMode: (mode) => set({ mode }),
      setSimSpeed: (simSpeed) => set({ simSpeed }),
      toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),

      addCell: (id, feature) => set((state) => {
        if (state.visitedIds.includes(id)) return state;
        
        return {
          visitedIds: [...state.visitedIds, id],
          geoData: {
            ...state.geoData,
            [state.mode]: {
              ...state.geoData[state.mode],
              features: [...state.geoData[state.mode].features, feature]
            }
          }
        };
      }),

      clearGrid: () => set((state) => ({
        visitedIds: [],
        geoData: {
          ...state.geoData,
          [state.mode]: { type: 'FeatureCollection', features: [] }
        }
      })),

      bulkAdd: (features) => set((state) => {
        const currentIds = new Set(state.visitedIds);
        const newFeatures: GeoJSON.Feature[] = [];

        features.forEach(f => {
          const id = f.properties?.id;
          if (id && !currentIds.has(id)) {
            currentIds.add(id);
            newFeatures.push(f);
          }
        });

        return {
          visitedIds: Array.from(currentIds),
          geoData: {
            ...state.geoData,
            [state.mode]: {
              ...state.geoData[state.mode],
              features: [...state.geoData[state.mode].features, ...newFeatures]
            }
          }
        };
      })
    }),
    {
      name: 'grid-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);