import { LngLat } from '@/features/frontend/play/PlayerMarker/type';

const getDistance = (coord1: LngLat, coord2: LngLat): number => {
  const R = 6371000;
  const dLat = (coord2[1] - coord1[1]) * (Math.PI / 180);
  const dLng = (coord2[0] - coord1[0]) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[1] * (Math.PI / 180)) *
      Math.cos(coord2[1] * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// State management for the filter
let lastValidCoords: LngLat | null = null;
const MOVE_THRESHOLD_METERS = 2.5; 

export const startPlayerTracking = (
  onUpdate: (coords: LngLat) => void,
  onError: (error: GeolocationPositionError) => void
): number | null => {
  if (typeof window === "undefined" || !navigator.geolocation) return null;

  return navigator.geolocation.watchPosition(
    (pos) => {
      const newCoords: LngLat = [pos.coords.longitude, pos.coords.latitude];
      
      // If accuracy is very poor (e.g. > 30m), you might want to ignore it too
      // if (pos.coords.accuracy > 30) return; 

      if (!lastValidCoords) {
        lastValidCoords = newCoords;
        onUpdate(newCoords);
        return;
      }

      const distance = getDistance(lastValidCoords, newCoords);

      if (distance > MOVE_THRESHOLD_METERS) {
        lastValidCoords = newCoords;
        onUpdate(newCoords);
      }
    },
    onError,
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
};

export const stopPlayerTracking = (watchId: number | null) => {
  if (watchId !== null && typeof window !== "undefined") {
    navigator.geolocation.clearWatch(watchId);
    // CRITICAL: Reset the filter so the next time it starts, it's fresh
    lastValidCoords = null; 
  }
};