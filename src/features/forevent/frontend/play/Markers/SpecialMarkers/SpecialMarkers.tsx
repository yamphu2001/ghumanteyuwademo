

// "use client";

// import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
// import styles from './SpecialMarkers.module.css';
// import { LocationData } from './logic';
// import { MarkerPopup } from './popup';
// import {
//   useGameAssignment,
//   resetIfMarkersChanged,
//   syncCompletedSession,
// } from '../../../../../../app/MiniGames/Usegameassignment';
// import { getProximityDistances, saveUnlocked, loadUnlockedFromDB } from '@/lib/EventMarkerProgress';
// import { getAuth } from "firebase/auth";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// // ── Session Storage (event-scoped keys to prevent cross-event bleed) ──────────

// function visitedKey(eventId: string) { return `special_visited_${eventId}`; }
// function completedKey(eventId: string) { return `special_completed_${eventId}`; }

// function getVisitedSet(eventId: string): Set<string> {
//   try {
//     const raw = sessionStorage.getItem(visitedKey(eventId));
//     if (raw) return new Set(JSON.parse(raw) as string[]);
//   } catch { }
//   return new Set();
// }

// function saveVisitedSet(visited: Set<string>, eventId: string) {
//   try {
//     sessionStorage.setItem(visitedKey(eventId), JSON.stringify([...visited]));
//   } catch { }
// }

// function getSessionCompleted(eventId: string): Set<string> {
//   try {
//     const raw = sessionStorage.getItem(completedKey(eventId));
//     if (raw) return new Set(JSON.parse(raw) as string[]);
//   } catch { }
//   return new Set();
// }

// function saveSessionCompleted(ids: Set<string>, eventId: string) {
//   try {
//     sessionStorage.setItem(completedKey(eventId), JSON.stringify([...ids]));
//   } catch { }
// }

// // ── Distance Helper ────────────────────────────────────────────────────────────

// function getDistanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6_371_000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLng = ((lng2 - lng1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//     Math.cos((lat2 * Math.PI) / 180) *
//     Math.sin(dLng / 2) *
//     Math.sin(dLng / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// // ── Types ──────────────────────────────────────────────────────────────────────

// interface Props {
//   map: any;
//   eventId: string;
// }

// interface ProjectedPosition extends LocationData {
//   x: number;
//   y: number;
// }

// // ── Component ──────────────────────────────────────────────────────────────────

// export default function SpecialLocationMarkers({ map, eventId }: Props) {
//   const [markers, setMarkers] = useState<LocationData[]>([]);
//   const [positions, setPositions] = useState<ProjectedPosition[]>([]);
//   const [zoom, setZoom] = useState<number>(14);
//   const [selectedMarker, setSelectedMarker] = useState<ProjectedPosition | null>(null);

//   const [visited, setVisited] = useState<Set<string>>(new Set());
//   const [completedDocs, setCompletedDocs] = useState<Set<string>>(new Set());

//   const [playerPos, setPlayerPos] = useState<{ lat: number; lng: number } | null>(null);
//   const [rtdbLoaded, setRtdbLoaded] = useState(false);
//   const [proximityM, setProximityM] = useState<number>(5);
//   const proximityRef = useRef<number>(5);
//   const watchIdRef = useRef<number | null>(null);
//   const { assignAllMarkers, hydrated } = useGameAssignment();

//   // 0. Seed state from session storage once eventId is available
//   useEffect(() => {
//     if (!eventId) return;
//     setVisited(getVisitedSet(eventId));
//     setCompletedDocs(getSessionCompleted(eventId));
//   }, [eventId]);

  
//   useEffect(() => {
//     const uid = getAuth().currentUser?.uid;
//     if (!uid || !eventId) { setRtdbLoaded(true); return; }

//     loadUnlockedFromDB('specialMarkers', eventId)
//       .then((record) => {
//         // record values are normalised "unlocked" strings by loadUnlockedFromDB
//         const idsFromFirebase = new Set<string>(
//           Object.entries(record)
//             .filter(([, state]) => state === 'unlocked')
//             .map(([id]) => id)
//         );

//         // 1a. Keep our own event-scoped session in sync with Firebase
//         saveSessionCompleted(idsFromFirebase, eventId);
//         setCompletedDocs(idsFromFirebase);

//         // 1b. Tell useGameAssignment to drop any ids no longer in Firebase.
//         //     This handles the "admin deleted from eventsProgress" case.
//         syncCompletedSession(idsFromFirebase);

//         setRtdbLoaded(true);
//       })
//       .catch((err) => {
//         console.warn('[SpecialMarkers] RTDB hydration error:', err);
//         setRtdbLoaded(true);
//       });
//   }, [eventId]);

//   // 2. Handle Game Completion
//   useEffect(() => {
//     const handler = (e: Event) => {
//       const detail = (e as CustomEvent<{ docId: string }>).detail;
//       const docId = detail?.docId;

//       const markerData = markers.find(m => m.id === docId);
//       const pointsToSave = markerData?.points || 0;

//       if (docId) {
//         setCompletedDocs((prev) => {
//           const next = new Set(prev);
//           next.add(docId);
//           saveSessionCompleted(next, eventId);
//           return next;
//         });

//         saveUnlocked('specialMarkers', docId, eventId, pointsToSave)
//           .catch((err) => console.warn('[SpecialMarkers] RTDB save error:', err));
//       }
//     };

//     window.addEventListener('yuwa:game-completed', handler);
//     return () => window.removeEventListener('yuwa:game-completed', handler);
//   }, [eventId, markers]);

//   /**
//    * isDone is the single source of truth for marker completion.
//    * It reads from completedDocs which is always hydrated from eventsProgress
//    * in Firebase, so it resets correctly when an admin deletes the Firebase entry.
//    */
//   const isDone = useCallback((docId: string) => completedDocs.has(docId), [completedDocs]);

//   // 3. Proximity Config
//   useEffect(() => {
//     getProximityDistances().then((distances) => {
//       proximityRef.current = distances.specialMarkers;
//       setProximityM(distances.specialMarkers);
//     });
//   }, []);

//   // 4. GPS Watch
//   useEffect(() => {
//     if (!navigator.geolocation) return;
//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => setPlayerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//       (err) => console.warn('[SpecialMarkers] GPS error:', err.message),
//       { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
//     );
//     return () => {
//       if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
//     };
//   }, []);

//   // 5. Proximity Check
//   useEffect(() => {
//     if (!playerPos || markers.length === 0 || !eventId) return;
//     const currentVisited = getVisitedSet(eventId);
//     let changed = false;

//     markers.forEach((marker) => {
//       if (currentVisited.has(marker.id)) return;
//       const dist = getDistanceMetres(playerPos.lat, playerPos.lng, marker.lat, marker.lng);
//       if (dist <= proximityRef.current) {
//         currentVisited.add(marker.id);
//         changed = true;
//       }
//     });

//     if (changed) {
//       saveVisitedSet(currentVisited, eventId);
//       setVisited(new Set(currentVisited));
//     }
//   }, [playerPos, markers, proximityM, eventId]);

//   // 6. Fetch Markers
//   useEffect(() => {
//     const fetchMarkers = async () => {
//       if (!eventId) return;
//       try {
//         const colRef = collection(db, "events", eventId, "specialmarkers");
//         const snapshot = await getDocs(colRef);

//         const markerList: LocationData[] = snapshot.docs.map((doc) => {
//           const data = doc.data();
//           return {
//             id: doc.id,
//             name: data.name ?? 'Special Marker',
//             popupText: data.popupText ?? '',
//             lat: data.lat,
//             lng: data.lng,
//             type: data.type ?? 'special',
//             image: data.image ?? undefined,
//             coordinates: [data.lng, data.lat] as [number, number],
//             points: data.points ?? 0,
//           };
//         });

//         setMarkers(markerList);
//         resetIfMarkersChanged(markerList.map((m) => m.id));
//       } catch (err) {
//         console.error('[SpecialMarkers] Firestore fetch error:', err);
//       }
//     };

//     fetchMarkers();
//   }, [eventId]);

//   // 7. Assign Markers to Game
//   useEffect(() => {
//     if (!hydrated || markers.length === 0) return;
//     assignAllMarkers(markers.map((m) => m.id));
//   }, [hydrated, markers, assignAllMarkers]);

//   // 8. Map Projection
// const updatePositions = useCallback(() => {
//   const mapInstance = map?.current || map;
//   if (!mapInstance) return;

//   // Use requestAnimationFrame to decouple from the map's synchronous event loop
//   requestAnimationFrame(() => {
//     // Safety check: make sure the map hasn't been destroyed
//     if (!mapInstance) return;

//     const currentZoom = mapInstance.getZoom();
//     const projected = markers.map((marker) => ({
//       ...marker,
//       x: mapInstance.project(marker.coordinates).x,
//       y: mapInstance.project(marker.coordinates).y,
//     }));

//     // Update both states safely
//     setZoom(currentZoom);
//     setPositions(projected);
//   });
// }, [map, markers]);


//   const markerScale = useMemo(() => {
//     const scale = Math.pow(2, (zoom - 14) * 0.3);
//     return Math.max(0.4, Math.min(1.5, scale));
//   }, [zoom]);

//   const visibleMarkers = useMemo(() => {
//     const occupiedAreas: { x1: number; y1: number; x2: number; y2: number }[] = [];
//     const MARKER_WIDTH = 60 * markerScale;
//     const MARKER_HEIGHT = 85 * markerScale;
//     return positions.filter((pos) => {
//       const x1 = pos.x - MARKER_WIDTH / 2;
//       const y1 = pos.y - MARKER_HEIGHT / 2;
//       const x2 = x1 + MARKER_WIDTH;
//       const y2 = y1 + MARKER_HEIGHT;
//       const isOverlapping = occupiedAreas.some(
//         (area) => !(x2 < area.x1 || x1 > area.x2 || y2 < area.y1 || y1 > area.y2)
//       );
//       if (!isOverlapping) { occupiedAreas.push({ x1, y1, x2, y2 }); return true; }
//       return false;
//     });
//   }, [positions, markerScale]);

//   useEffect(() => {
//     const mapInstance = map?.current || map;
//     if (!mapInstance) return;
//     updatePositions();
//     const events = ['move', 'zoom', 'resize', 'moveend', 'render']; // ← add "render"
//     events.forEach((e) => mapInstance.on(e, updatePositions));
//     return () => events.forEach((e) => mapInstance.off(e, updatePositions));
//   }, [map, updatePositions]);

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <div className={styles.overlayLayer}>
//       {visibleMarkers.map((marker) => {
//         const done = isDone(marker.id);
//         const hasVisited = visited.has(marker.id);
//         const liveNearby = playerPos
//           ? getDistanceMetres(playerPos.lat, playerPos.lng, marker.lat, marker.lng) <= proximityM
//           : false;
//         const unlocked = done || hasVisited;
//         const locked = !unlocked;

//         return (
//           <div
//             key={marker.id}
//             className={styles.markerContainer}
//             style={{
//               transform: `translate3d(${marker.x}px, ${marker.y}px, 0) scale(${markerScale})`,
//               zIndex: selectedMarker?.id === marker.id ? 10 : 1,
//             }}
//           >
//             <div style={{ position: 'relative', display: 'inline-block' }}>
//               {done && (
//                 <div style={{
//                   position: 'absolute', inset: -4, borderRadius: '50%',
//                   border: '3px solid #6b7280',
//                   boxShadow: 'none',
//                   pointerEvents: 'none', zIndex: 2,
//                 }} />
//               )}

//               {liveNearby && !done && (
//                 <div style={{
//                   position: 'absolute', inset: -6, borderRadius: '50%',
//                   border: '2.5px solid #f59e0b',
//                   boxShadow: '0 0 0 3px rgba(245,158,11,0.2), 0 0 14px rgba(245,158,11,0.5)',
//                   pointerEvents: 'none', zIndex: 2,
//                   animation: 'nearbyPulse 1.6s ease-in-out infinite',
//                 }} />
//               )}

//               <div
//                 className={`${styles.markerPin} ${marker.type === 'special' ? styles.starShape : styles.circleShape}`}
//                 style={{
//                   backgroundImage: `url(${marker.image})`,
//                   outline: done ? '3px solid #475569' : undefined,
//                   outlineOffset: done ? '2px' : undefined,
//                   filter: done
//                     ? 'grayscale(100%) opacity(0.5)'
//                     : locked
//                       ? 'grayscale(80%) brightness(0.7)'
//                       : undefined,
//                   cursor: 'pointer',
//                 }}
//                 onClick={() => setSelectedMarker(marker)}
//               />

//               {done && (
//                 <div style={{
//                   position: 'absolute', bottom: -2, right: -2,
//                   width: 18, height: 18, borderRadius: '50%',
//                   background: '#475569', border: '2px solid white',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   fontSize: 10, fontWeight: 900, color: 'white',
//                   boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 3, pointerEvents: 'none',
//                 }}>✓</div>
//               )}

//               {locked && (
//                 <div style={{
//                   position: 'absolute', bottom: -2, right: -2,
//                   width: 18, height: 18, borderRadius: '50%',
//                   background: '#6b7280', border: '2px solid white',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   fontSize: 9, boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
//                   zIndex: 3, pointerEvents: 'none',
//                 }}>🔒</div>
//               )}
//             </div>

//             <div
//               className={styles.label}
//               style={{ color: done ? '#6b7280' : undefined, opacity: done ? 0.6 : 1 }}
//             >
//               {marker.name}
//             </div>
//           </div>
//         );
//       })}

//       {selectedMarker && (
//         <MarkerPopup
//           marker={selectedMarker}
//           isNearby={
//             playerPos
//               ? getDistanceMetres(playerPos.lat, playerPos.lng, selectedMarker.lat, selectedMarker.lng) <= proximityM
//               : false
//           }
//           // isAlreadyDone comes from completedDocs, which is hydrated from
//           // eventsProgress in Firebase. This overrides the popup's own
//           // isCompleted() call (which reads userProgress — a separate path
//           // not cleared by admin deletions).
//           isAlreadyDone={isDone(selectedMarker.id)}
//           onClose={() => setSelectedMarker(null)}
//         />
//       )}

//       <style>{`
//         @keyframes nearbyPulse {
//           0%, 100% { opacity: 0.5; transform: scale(1); }
//           50%       { opacity: 1;   transform: scale(1.08); }
//         }
//       `}</style>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import styles from './SpecialMarkers.module.css';
import { LocationData } from './logic';
import { MarkerPopup } from './popup';
import {
  useGameAssignment,
  resetIfMarkersChanged,
  syncCompletedSession,
} from '../../../../../../app/MiniGames/Usegameassignment';
import { getProximityDistances, saveUnlocked, loadUnlockedFromDB } from '@/lib/EventMarkerProgress';
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Session Storage (event-scoped keys to prevent cross-event bleed) ──────────

function visitedKey(eventId: string) { return `special_visited_${eventId}`; }
function completedKey(eventId: string) { return `special_completed_${eventId}`; }

function getVisitedSet(eventId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(visitedKey(eventId));
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { }
  return new Set();
}

function saveVisitedSet(visited: Set<string>, eventId: string) {
  try {
    sessionStorage.setItem(visitedKey(eventId), JSON.stringify([...visited]));
  } catch { }
}

function getSessionCompleted(eventId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(completedKey(eventId));
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { }
  return new Set();
}

function saveSessionCompleted(ids: Set<string>, eventId: string) {
  try {
    sessionStorage.setItem(completedKey(eventId), JSON.stringify([...ids]));
  } catch { }
}

// ── Distance Helper ────────────────────────────────────────────────────────────

function getDistanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  map: any;
  eventId: string;
}

interface ProjectedPosition extends LocationData {
  x: number;
  y: number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpecialLocationMarkers({ map, eventId }: Props) {
  const [markers, setMarkers] = useState<LocationData[]>([]);
  const [positions, setPositions] = useState<ProjectedPosition[]>([]);
  const [zoom, setZoom] = useState<number>(14);
  const [selectedMarker, setSelectedMarker] = useState<ProjectedPosition | null>(null);

  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [completedDocs, setCompletedDocs] = useState<Set<string>>(new Set());

  const [playerPos, setPlayerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [rtdbLoaded, setRtdbLoaded] = useState(false);
  const [proximityM, setProximityM] = useState<number>(5);
  const proximityRef = useRef<number>(5);
  const watchIdRef = useRef<number | null>(null);
  const { assignAllMarkers, hydrated } = useGameAssignment();

  // 0. Seed state from session storage once eventId is available
  useEffect(() => {
    if (!eventId) return;
    setVisited(getVisitedSet(eventId));
    setCompletedDocs(getSessionCompleted(eventId));
  }, [eventId]);

  
  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid || !eventId) { setRtdbLoaded(true); return; }

    loadUnlockedFromDB('specialMarkers', eventId)
      .then((record) => {
        const idsFromFirebase = new Set<string>(
          Object.entries(record)
            .filter(([, state]) => state === 'unlocked')
            .map(([id]) => id)
        );

        saveSessionCompleted(idsFromFirebase, eventId);
        setCompletedDocs(idsFromFirebase);
        syncCompletedSession(idsFromFirebase);
        setRtdbLoaded(true);
      })
      .catch((err) => {
        console.warn('[SpecialMarkers] RTDB hydration error:', err);
        setRtdbLoaded(true);
      });
  }, [eventId]);

  // 2. Handle Game Completion
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ docId: string }>).detail;
      const docId = detail?.docId;

      const markerData = markers.find(m => m.id === docId);
      const pointsToSave = markerData?.points || 0;

      if (docId) {
        setCompletedDocs((prev) => {
          const next = new Set(prev);
          next.add(docId);
          saveSessionCompleted(next, eventId);
          return next;
        });

        saveUnlocked('specialMarkers', docId, eventId, pointsToSave)
          .catch((err) => console.warn('[SpecialMarkers] RTDB save error:', err));
      }
    };

    window.addEventListener('yuwa:game-completed', handler);
    return () => window.removeEventListener('yuwa:game-completed', handler);
  }, [eventId, markers]);

  const isDone = useCallback((docId: string) => completedDocs.has(docId), [completedDocs]);

  // ── FIX: Proximity Config Fetching ──────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return; // Guard against empty eventId

    getProximityDistances(eventId).then((distances) => {
      proximityRef.current = distances.specialMarkers;
      setProximityM(distances.specialMarkers);
    });
  }, [eventId]); // Re-fetch if event changes
  // ─────────────────────────────────────────────────────────────────────────────

  // 4. GPS Watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setPlayerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn('[SpecialMarkers] GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // 5. Proximity Check
  useEffect(() => {
    if (!playerPos || markers.length === 0 || !eventId) return;
    const currentVisited = getVisitedSet(eventId);
    let changed = false;

    markers.forEach((marker) => {
      if (currentVisited.has(marker.id)) return;
      const dist = getDistanceMetres(playerPos.lat, playerPos.lng, marker.lat, marker.lng);
      if (dist <= proximityRef.current) {
        currentVisited.add(marker.id);
        changed = true;
      }
    });

    if (changed) {
      saveVisitedSet(currentVisited, eventId);
      setVisited(new Set(currentVisited));
    }
  }, [playerPos, markers, proximityM, eventId]);

  // 6. Fetch Markers
  useEffect(() => {
    const fetchMarkers = async () => {
      if (!eventId) return;
      try {
        const colRef = collection(db, "events", eventId, "specialmarkers");
        const snapshot = await getDocs(colRef);

        const markerList: LocationData[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? 'Special Marker',
            popupText: data.popupText ?? '',
            lat: data.lat,
            lng: data.lng,
            type: data.type ?? 'special',
            image: data.image ?? undefined,
            coordinates: [data.lng, data.lat] as [number, number],
            points: data.points ?? 0,
          };
        });

        setMarkers(markerList);
        resetIfMarkersChanged(markerList.map((m) => m.id));
      } catch (err) {
        console.error('[SpecialMarkers] Firestore fetch error:', err);
      }
    };

    fetchMarkers();
  }, [eventId]);

  // 7. Assign Markers to Game
  useEffect(() => {
    if (!hydrated || markers.length === 0) return;
    assignAllMarkers(markers.map((m) => m.id));
  }, [hydrated, markers, assignAllMarkers]);

  // 8. Map Projection
const updatePositions = useCallback(() => {
  const mapInstance = map?.current || map;
  if (!mapInstance) return;

  requestAnimationFrame(() => {
    if (!mapInstance) return;

    const currentZoom = mapInstance.getZoom();
    const projected = markers.map((marker) => ({
      ...marker,
      x: mapInstance.project(marker.coordinates).x,
      y: mapInstance.project(marker.coordinates).y,
    }));

    setZoom(currentZoom);
    setPositions(projected);
  });
}, [map, markers]);


  const markerScale = useMemo(() => {
    const scale = Math.pow(2, (zoom - 14) * 0.3);
    return Math.max(0.4, Math.min(1.5, scale));
  }, [zoom]);

  const visibleMarkers = useMemo(() => {
    const occupiedAreas: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const MARKER_WIDTH = 60 * markerScale;
    const MARKER_HEIGHT = 85 * markerScale;
    return positions.filter((pos) => {
      const x1 = pos.x - MARKER_WIDTH / 2;
      const y1 = pos.y - MARKER_HEIGHT / 2;
      const x2 = x1 + MARKER_WIDTH;
      const y2 = y1 + MARKER_HEIGHT;
      const isOverlapping = occupiedAreas.some(
        (area) => !(x2 < area.x1 || x1 > area.x2 || y2 < area.y1 || y1 > area.y2)
      );
      if (!isOverlapping) { occupiedAreas.push({ x1, y1, x2, y2 }); return true; }
      return false;
    });
  }, [positions, markerScale]);

  useEffect(() => {
    const mapInstance = map?.current || map;
    if (!mapInstance) return;
    updatePositions();
    const events = ['move', 'zoom', 'resize', 'moveend', 'render']; 
    events.forEach((e) => mapInstance.on(e, updatePositions));
    return () => events.forEach((e) => mapInstance.off(e, updatePositions));
  }, [map, updatePositions]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlayLayer}>
      {visibleMarkers.map((marker) => {
        const done = isDone(marker.id);
        const hasVisited = visited.has(marker.id);
        const liveNearby = playerPos
          ? getDistanceMetres(playerPos.lat, playerPos.lng, marker.lat, marker.lng) <= proximityM
          : false;
        const unlocked = done || hasVisited;
        const locked = !unlocked;

        return (
          <div
            key={marker.id}
            className={styles.markerContainer}
            style={{
              transform: `translate3d(${marker.x}px, ${marker.y}px, 0) scale(${markerScale})`,
              zIndex: selectedMarker?.id === marker.id ? 10 : 1,
            }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {done && (
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: '3px solid #6b7280',
                  boxShadow: 'none',
                  pointerEvents: 'none', zIndex: 2,
                }} />
              )}

              {liveNearby && !done && (
                <div style={{
                  position: 'absolute', inset: -6, borderRadius: '50%',
                  border: '2.5px solid #f59e0b',
                  boxShadow: '0 0 0 3px rgba(245,158,11,0.2), 0 0 14px rgba(245,158,11,0.5)',
                  pointerEvents: 'none', zIndex: 2,
                  animation: 'nearbyPulse 1.6s ease-in-out infinite',
                }} />
              )}

              <div
                className={`${styles.markerPin} ${marker.type === 'special' ? styles.starShape : styles.circleShape}`}
                style={{
                  backgroundImage: `url(${marker.image})`,
                  outline: done ? '3px solid #475569' : undefined,
                  outlineOffset: done ? '2px' : undefined,
                  filter: done
                    ? 'grayscale(100%) opacity(0.5)'
                    : locked
                      ? 'grayscale(80%) brightness(0.7)'
                      : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedMarker(marker)}
              />

              {done && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#475569', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 3, pointerEvents: 'none',
                }}>✓</div>
              )}

              {locked && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#6b7280', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  zIndex: 3, pointerEvents: 'none',
                }}>🔒</div>
              )}
            </div>

            <div
              className={styles.label}
              style={{ color: done ? '#6b7280' : undefined, opacity: done ? 0.6 : 1 }}
            >
              {marker.name}
            </div>
          </div>
        );
      })}

      {selectedMarker && (
        <MarkerPopup
          marker={selectedMarker}
          isNearby={
            playerPos
              ? getDistanceMetres(playerPos.lat, playerPos.lng, selectedMarker.lat, selectedMarker.lng) <= proximityM
              : false
          }
          isAlreadyDone={isDone(selectedMarker.id)}
          onClose={() => setSelectedMarker(null)}
        />
      )}

      <style>{`
        @keyframes nearbyPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}