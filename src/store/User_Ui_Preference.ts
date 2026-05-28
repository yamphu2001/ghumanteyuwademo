import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Exporting this allows your logic.ts to stay synced with these options
export type HandPreference = 'left' | 'right' | 'center';

export interface UIPreferenceState {
  handPreference: HandPreference;
  setHandPreference: (preference: HandPreference) => void;
}

export const useUIPreference = create<UIPreferenceState>()(
  persist(
    (set) => ({
      handPreference: 'left', // Games usually default to center
      setHandPreference: (preference) => set({ handPreference: preference }),
    }),
    {
      name: 'ghumante-yuwa-ui-prefs', // Key in localStorage
    }
  )
);