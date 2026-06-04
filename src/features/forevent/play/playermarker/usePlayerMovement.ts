
// "use client";

// import { useEffect, useRef } from "react";
// import maplibregl from "maplibre-gl";
// import { auth } from "@/lib/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { type QueuedOperation } from "@/features/forevent/play/useOfflineQueue";

// interface MovementHookProps {
//   map: maplibregl.Map | null;
//   eventId: string;
//   onPositionUpdate: (latitude: number, longitude: number) => void;
//   /** Pass enqueue from useOfflineQueue so location writes are queued when offline */
//   enqueue: (op: QueuedOperation) => Promise<void>;
// }

// interface CachedPosition {
//   latitude: number;
//   longitude: number;
// }

// export function usePlayerMovement({ map, eventId, onPositionUpdate, enqueue }: MovementHookProps) {
//   const currentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
//   const isMockingRef = useRef<boolean>(false);
//   const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
//   // FIX: Added a ref to prevent overlapping GPS requests from jamming the browser queue
//   const isFetchingRef = useRef<boolean>(false);
  
//   // FIX: Position history for averaging to smooth out GPS jitter (2-5m natural variance)
//   const positionHistoryRef = useRef<CachedPosition[]>([]);
//   const lastSyncRef = useRef<CachedPosition | null>(null);
  
//   // FIX: Minimum distance threshold (2.5m) to filter out GPS noise even when stationary
//   const MIN_MOVEMENT_THRESHOLD_METERS = 2.5;

//   useEffect(() => {
//     if (!map || !eventId) return;

//     // Restore last known position from localStorage so keyboard mocking works
//     try {
//       const saved = localStorage.getItem(`player_trail_${eventId}`);
//       if (saved) {
//         const parsed = JSON.parse(saved);
//         if (Array.isArray(parsed) && parsed.length > 0) {
//           const last = parsed[parsed.length - 1];
//           if (last && Array.isArray(last.coordinates)) {
//             const [lng, lat] = last.coordinates;
//             currentCoordsRef.current = { latitude: lat, longitude: lng };
//           }
//         }
//       }
//     } catch (err) {
//       // ignore parse errors
//     }

//     // FIX: Calculate distance between two positions to filter out GPS jitter
//     const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//       const R = 6371000;
//       const dLat = ((lat2 - lat1) * Math.PI) / 180;
//       const dLon = ((lon2 - lon1) * Math.PI) / 180;
//       const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos((lat1 * Math.PI) / 180) *
//           Math.cos((lat2 * Math.PI) / 180) *
//           Math.sin(dLon / 2) ** 2;
//       return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     };

//     const syncLocation = (latitude: number, longitude: number) => {
//       // FIX: Filter out GPS noise (2-5m jitter even when stationary)
//       // Only update if movement >= MIN_MOVEMENT_THRESHOLD_METERS
//       if (lastSyncRef.current) {
//         const moved = distanceMeters(
//           lastSyncRef.current.latitude,
//           lastSyncRef.current.longitude,
//           latitude,
//           longitude
//         );
//         if (moved < MIN_MOVEMENT_THRESHOLD_METERS) {
//           return; // Ignore tiny jitter movements
//         }
//       }

//       lastSyncRef.current = { latitude, longitude };

//       // FIX: Add to position history buffer for averaging (smooth out remaining jitter)
//       positionHistoryRef.current.push({ latitude, longitude });
//       if (positionHistoryRef.current.length > 3) {
//         positionHistoryRef.current.shift(); // Keep last 3 positions
//       }

//       // FIX: Average the last N positions to smooth GPS noise
//       const avgPosition = positionHistoryRef.current.reduce(
//         (acc, pos) => ({
//           latitude: acc.latitude + pos.latitude / positionHistoryRef.current.length,
//           longitude: acc.longitude + pos.longitude / positionHistoryRef.current.length,
//         }),
//         { latitude: 0, longitude: 0 }
//       );

//       // Update marker and trail with averaged position — this is purely local/visual
//       onPositionUpdate(avgPosition.latitude, avgPosition.longitude);

//       // Save last known position to localStorage for offline restore
//       try {
//         localStorage.setItem(
//           `last_position_${eventId}`,
//           JSON.stringify({ latitude: avgPosition.latitude, longitude: avgPosition.longitude })
//         );
//       } catch (_) { /* ignore */ }

//       // Firebase write only needs a uid — skip silently if not authed yet
//       const uid = auth.currentUser?.uid;
//       if (!uid) return;

//       enqueue({
//         type: 'rtdbSet',
//         path: `eventsProgress/${eventId}/${uid}/location`,
//         data: {
//           latitude: avgPosition.latitude,
//           longitude: avgPosition.longitude,
//           updatedAt: new Date().toLocaleString(),
//         },
//       });
//     };

//     const runLocationCheck = () => {
//       // Do NOT gate on auth here — GPS + marker display must work offline too.
//       // The uid check lives inside syncLocation, only blocking the Firebase write.
//       if (isMockingRef.current && currentCoordsRef.current) {
//         syncLocation(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
//       } else {
//         // FIX: Gate the check so we don't spam the location API while it's still thinking
//         if (!navigator.geolocation || isFetchingRef.current) return;
        
//         isFetchingRef.current = true;
        
//         navigator.geolocation.getCurrentPosition(
//           (pos) => {
//             const { latitude, longitude } = pos.coords;
//             currentCoordsRef.current = { latitude, longitude };
//             syncLocation(latitude, longitude);
//             isFetchingRef.current = false;
//           },
//           (err) => {
//             // FIX: Offline Fallback. If pure high-accuracy hardware fix fails/times out, 
//             // request again allowing the device to return its last cached OS location.
//             // FIX: Reduced maximumAge from 30000 to 5000ms to prevent stale 30s old data
//             navigator.geolocation.getCurrentPosition(
//               (fallbackPos) => {
//                 const { latitude, longitude } = fallbackPos.coords;
//                 currentCoordsRef.current = { latitude, longitude };
//                 syncLocation(latitude, longitude);
//                 isFetchingRef.current = false;
//               },
//               () => {
//                 isFetchingRef.current = false; // Reset so the interval can try again
//               },
//               { enableHighAccuracy: false, timeout: 8000, maximumAge: 5000 }
//             );
//           },
//           // FIX: Reduced maximumAge from 5000 to 1000ms for fresher GPS data online
//           { enableHighAccuracy: true, timeout: 8000, maximumAge: 1000 }
//         );
//       }
//     };

//     // If no cached position exists for this event, fire an immediate GPS request
//     // so the marker appears instantly on first load (new event, no trail yet).
//     const hasCachedPosition = !!localStorage.getItem(`last_position_${eventId}`);
//     if (!hasCachedPosition && navigator.geolocation) {
//       isFetchingRef.current = true;
//       // FIX: Reduced maximumAge from 5000 to 1000ms for fresher initial position
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           const { latitude, longitude } = pos.coords;
//           currentCoordsRef.current = { latitude, longitude };
//           syncLocation(latitude, longitude);
//           isFetchingRef.current = false;
//         },
//         () => {
//           isFetchingRef.current = false;
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
//       );
//     }

//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (!currentCoordsRef.current) return;
//       const step = 0.000004;
//       let moved = false;

//       switch (e.key.toLowerCase()) {
//         case "w": currentCoordsRef.current.latitude  += step; moved = true; break;
//         case "s": currentCoordsRef.current.latitude  -= step; moved = true; break;
//         case "a": currentCoordsRef.current.longitude -= step; moved = true; break;
//         case "d": currentCoordsRef.current.longitude += step; moved = true; break;
//       }

//       if (moved) {
//         isMockingRef.current = true;
//         syncLocation(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     runLocationCheck();
//     intervalIdRef.current = setInterval(runLocationCheck, 1000);

//     const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
//       if (user) runLocationCheck();
//     });

//     return () => {
//       if (intervalIdRef.current) clearInterval(intervalIdRef.current);
//       window.removeEventListener("keydown", handleKeyDown);
//       unsubscribeAuth();
//     };
//   }, [map, eventId, onPositionUpdate, enqueue]);
// }





"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { type QueuedOperation } from "@/features/forevent/play/useOfflineQueue";

interface MovementHookProps {
  map: maplibregl.Map | null;
  eventId: string;
  onPositionUpdate: (latitude: number, longitude: number) => void;
  /** Pass enqueue from useOfflineQueue so location writes are queued when offline */
  enqueue: (op: QueuedOperation) => Promise<void>;
}

interface CachedPosition {
  latitude: number;
  longitude: number;
}

export function usePlayerMovement({ map, eventId, onPositionUpdate, enqueue }: MovementHookProps) {
  const currentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isMockingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // FIX: Added a ref to prevent overlapping GPS requests from jamming the browser queue
  const isFetchingRef = useRef<boolean>(false);
  
  // FIX: Position history for averaging to smooth out GPS jitter (2-5m natural variance)
  const positionHistoryRef = useRef<CachedPosition[]>([]);
  const lastSyncRef = useRef<CachedPosition | null>(null);
  
  // FIX: Minimum distance threshold (2.5m) to filter out GPS noise even when stationary
  const MIN_MOVEMENT_THRESHOLD_METERS = 2.5;

  useEffect(() => {
    if (!map || !eventId) return;

    // Restore last known position from localStorage so keyboard mocking works
    try {
      const saved = localStorage.getItem(`player_trail_${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          if (last && Array.isArray(last.coordinates)) {
            const [lng, lat] = last.coordinates;
            currentCoordsRef.current = { latitude: lat, longitude: lng };
          }
        }
      }
    } catch (err) {
      // ignore parse errors
    }

    // FIX: Calculate distance between two positions to filter out GPS jitter
    const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const syncLocation = (latitude: number, longitude: number) => {
      // FIX: Filter out GPS noise (2-5m jitter even when stationary)
      // Only update if movement >= MIN_MOVEMENT_THRESHOLD_METERS
      if (lastSyncRef.current) {
        const moved = distanceMeters(
          lastSyncRef.current.latitude,
          lastSyncRef.current.longitude,
          latitude,
          longitude
        );
        if (moved < MIN_MOVEMENT_THRESHOLD_METERS) {
          return; // Ignore tiny jitter movements
        }
      }

      lastSyncRef.current = { latitude, longitude };

      // FIX: Add to position history buffer for averaging (smooth out remaining jitter)
      positionHistoryRef.current.push({ latitude, longitude });
      if (positionHistoryRef.current.length > 3) {
        positionHistoryRef.current.shift(); // Keep last 3 positions
      }

      // FIX: Average the last N positions to smooth GPS noise
      const avgPosition = positionHistoryRef.current.reduce(
        (acc, pos) => ({
          latitude: acc.latitude + pos.latitude / positionHistoryRef.current.length,
          longitude: acc.longitude + pos.longitude / positionHistoryRef.current.length,
        }),
        { latitude: 0, longitude: 0 }
      );

      // Update marker and trail with averaged position — this is purely local/visual
      onPositionUpdate(avgPosition.latitude, avgPosition.longitude);

      // Save last known position to localStorage for offline restore
      try {
        localStorage.setItem(
          `last_position_${eventId}`,
          JSON.stringify({ latitude: avgPosition.latitude, longitude: avgPosition.longitude })
        );
      } catch (_) { /* ignore */ }

      // Firebase write only needs a uid — skip silently if not authed yet
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      enqueue({
        type: 'rtdbSet',
        path: `eventsProgress/${eventId}/${uid}/location`,
        data: {
          latitude: avgPosition.latitude,
          longitude: avgPosition.longitude,
          updatedAt: new Date().toLocaleString(),
        },
      });
    };

    const runLocationCheck = () => {
      // Do NOT gate on auth here — GPS + marker display must work offline too.
      // The uid check lives inside syncLocation, only blocking the Firebase write.
      if (isMockingRef.current && currentCoordsRef.current) {
        syncLocation(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
      } else {
        // FIX: Gate the check so we don't spam the location API while it's still thinking
        if (!navigator.geolocation || isFetchingRef.current) return;
        
        isFetchingRef.current = true;
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            currentCoordsRef.current = { latitude, longitude };
            syncLocation(latitude, longitude);
            isFetchingRef.current = false;
          },
          (err) => {
            // FIX: Offline Fallback. If pure high-accuracy hardware fix fails/times out, 
            // request again allowing the device to return its last cached OS location.
            // FIX: Reduced maximumAge from 30000 to 5000ms to prevent stale 30s old data
            navigator.geolocation.getCurrentPosition(
              (fallbackPos) => {
                const { latitude, longitude } = fallbackPos.coords;
                currentCoordsRef.current = { latitude, longitude };
                syncLocation(latitude, longitude);
                isFetchingRef.current = false;
              },
              () => {
                isFetchingRef.current = false; // Reset so the interval can try again
              },
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 5000 }
            );
          },
          // FIX: Reduced maximumAge from 5000 to 1000ms for fresher GPS data online
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 1000 }
        );
      }
    };

    // If no cached position exists for this event, fire an immediate GPS request
    // so the marker appears instantly on first load (new event, no trail yet).
    const hasCachedPosition = !!localStorage.getItem(`last_position_${eventId}`);
    if (!hasCachedPosition && navigator.geolocation) {
      isFetchingRef.current = true;
      // FIX: Reduced maximumAge from 5000 to 1000ms for fresher initial position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          currentCoordsRef.current = { latitude, longitude };
          syncLocation(latitude, longitude);
          isFetchingRef.current = false;
        },
        () => {
          isFetchingRef.current = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCoordsRef.current) return;
      const step = 0.000004;
      let moved = false;

      switch (e.key.toLowerCase()) {
        case "w": currentCoordsRef.current.latitude  += step; moved = true; break;
        case "s": currentCoordsRef.current.latitude  -= step; moved = true; break;
        case "a": currentCoordsRef.current.longitude -= step; moved = true; break;
        case "d": currentCoordsRef.current.longitude += step; moved = true; break;
      }

      if (moved) {
        isMockingRef.current = true;
        syncLocation(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    runLocationCheck();
    intervalIdRef.current = setInterval(runLocationCheck, 1000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) runLocationCheck();
    });

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      unsubscribeAuth();
    };
  }, [map, eventId, onPositionUpdate, enqueue]);
}




