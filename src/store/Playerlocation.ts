import { create } from 'zustand';

// ─── Haversine Distance ───────────────────────────────────────────────────────
// Returns distance in metres between two [lng, lat] points
export function getDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Store Types ──────────────────────────────────────────────────────────────
interface PlayerLocationState {
  // Current position as [lng, lat] — matches Mapbox coordinate order
  position: [number, number] | null;
  accuracy: number | null;
  isWatching: boolean;
  error: string | null;

  // Actions
  startWatching: () => void;
  stopWatching: () => void;
  _setPosition: (position: [number, number], accuracy: number) => void;
  _setError: (error: string) => void;
}

// ─── Internal GPS watcher ID ──────────────────────────────────────────────────
let watcherId: number | null = null;

// ─── Store ────────────────────────────────────────────────────────────────────
export const usePlayerLocation = create<PlayerLocationState>((set) => ({
  position: null,
  accuracy: null,
  isWatching: false,
  error: null,

  startWatching: () => {
    if (watcherId !== null) return; // Already watching
    if (!navigator.geolocation) {
      set({ error: 'Geolocation is not supported by this device.' });
      return;
    }

    set({ isWatching: true, error: null });

    watcherId = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;
        set({
          position: [longitude, latitude],
          accuracy,
          error: null,
        });
      },
      (err) => {
        set({ error: err.message });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,       // Accept positions up to 1s old
        timeout: 10000,         // Wait up to 10s for a fix
      }
    );
  },

  stopWatching: () => {
    if (watcherId !== null) {
      navigator.geolocation.clearWatch(watcherId);
      watcherId = null;
    }
    set({ isWatching: false });
  },

  // Internal setters — called by the GPS watcher above
  _setPosition: (position, accuracy) => set({ position, accuracy }),
  _setError: (error) => set({ error }),
}));