import { create } from 'zustand';

export type MapMode = 'today' | 'history' | 'global';

interface GridState {
  geoData: { [key in MapMode]: GeoJSON.FeatureCollection };
  visitedIds: Set<string>;
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

export const useGridStore = create<GridState>((set) => ({
  geoData: {
    today: { type: 'FeatureCollection', features: [] },
    history: { type: 'FeatureCollection', features: [] },
    global: { type: 'FeatureCollection', features: [] },
  },
  visitedIds: new Set<string>(),
  mode: 'today',
  isSimulating: false,
  simSpeed: 100, // 0.1s Turbo Speed

  setMode: (mode) => set({ mode }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),
  
  addCell: (id, feature) => set((state) => {
    if (state.visitedIds.has(id)) return state;
    const newVisited = new Set(state.visitedIds).add(id);
    return {
      visitedIds: newVisited,
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
    visitedIds: new Set(),
    geoData: {
      ...state.geoData,
      [state.mode]: { type: 'FeatureCollection', features: [] }
    }
  })),

  bulkAdd: (features) => set((state) => {
    const newVisited = new Set(state.visitedIds);
    features.forEach(f => {
        const id = f.properties?.id;
        if (id) newVisited.add(id);
    });
    return {
      visitedIds: newVisited,
      geoData: {
        ...state.geoData,
        [state.mode]: { 
          ...state.geoData[state.mode], 
          features: [...state.geoData[state.mode].features, ...features] 
        }
      }
    };
  })
}));