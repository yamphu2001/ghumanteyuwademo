

// "use client";

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import styles from "./QRcodeMarkers.module.css";
// import { getAuth, onAuthStateChanged } from "firebase/auth";

// import {
//   loadUnlockedFromDB,
//   saveUnlocked,
//   getProximityDistances,
//   type MarkerState,
// } from "@/lib/EventMarkerProgress";
// import {
//   fetchMuseumMarkers,
//   projectMarkers,
//   watchPlayerPosition,
//   type QRcodeMarkerData,
//   type MarkerPosition,
//   type PopupState,
// } from "./Logic";
// import QRcodeMarkersPopup from "./Popup";

// function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6_371_000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLng = ((lng2 - lng1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLng / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// interface Props {
//   map: any;
//   eventId: string;
// }

// export default function QRcodeMarkers({ map, eventId }: Props) {
//   const [markers, setMarkers] = useState<QRcodeMarkerData[]>([]);
//   const [positions, setPositions] = useState<MarkerPosition[]>([]);
//   const statesRef = useRef<Record<string, MarkerState>>({});
//   const [tick, setTick] = useState(0);
//   const rerender = useCallback(() => setTick((t) => t + 1), []);

//   const nearbyDistRef = useRef<number>(5);

//   const markersRef = useRef<QRcodeMarkerData[]>([]);
//   const playerRef = useRef<{ lat: number; lng: number } | null>(null);
//   const [popup, setPopup] = useState<PopupState | null>(null);
//   const blockClickRef = useRef(false);

//   /**
//    * isHydrated gates proximity logic until Firebase has been read.
//    * Without this, a marker already saved as "unlocked" would flicker
//    * back to "default" during the brief window before the DB response arrives.
//    */
//   const isHydratedRef = useRef(false);

//   // 1. Proximity Config
//   useEffect(() => {
//     getProximityDistances().then((distances) => {
//       nearbyDistRef.current = distances.qrcodemarkers;
//     });
//   }, []);

//   // 2. Load Progress
//   // loadUnlockedFromDB now returns Record<string, MarkerState> with normalised
//   // "unlocked" strings, so merging directly into statesRef is safe and all
//   // === "unlocked" checks below will work correctly after a page refresh.
//   useEffect(() => {
//     const auth = getAuth();
//     const unsub = onAuthStateChanged(auth, (user) => {
//       if (!user || !eventId) {
//         isHydratedRef.current = true;
//         return;
//       }
//       loadUnlockedFromDB("qrcodemarkers", eventId).then((saved) => {
//         statesRef.current = { ...statesRef.current, ...saved };
//         isHydratedRef.current = true;
//         rerender();
//       });
//     });
//     return () => unsub();
//   }, [rerender, eventId]);

//   // 3. Load Markers — only for this eventId
//   useEffect(() => {
//     if (!eventId) return;
//     fetchMuseumMarkers(eventId).then((data) => {
//       markersRef.current = data;
//       setMarkers(data);
//     });
//   }, [eventId]);

//   // 4. GPS & Proximity Logic
//   const updateProximity = useCallback(() => {
//     const player = playerRef.current;

//     // Gate on hydration so already-unlocked markers are never flipped back.
//     if (!player || markersRef.current.length === 0 || !isHydratedRef.current) return;

//     let changed = false;
//     const next = { ...statesRef.current };

//     markersRef.current.forEach((m) => {
//       const prev = statesRef.current[m.id] ?? "default";

//       // statesRef now contains clean "unlocked" strings after hydration — safe to compare.
//       if (prev === "unlocked") return;

//       const dist = getDistanceMeters(player.lat, player.lng, m.lat, m.lng);
//       const computed: MarkerState = dist <= nearbyDistRef.current ? "nearby" : "default";

//       if (computed !== prev) {
//         next[m.id] = computed;
//         changed = true;
//       }
//     });

//     if (changed) {
//       statesRef.current = next;
//       rerender();
//     }
//   }, [rerender]);

//   useEffect(() => {
//     return watchPlayerPosition((pos) => {
//       playerRef.current = pos;
//       updateProximity();
//     });
//   }, [updateProximity]);

  
//   // 5. Map Projection
// const updatePositions = useCallback(() => {
//   const inst = map.current;
//   if (!inst || markersRef.current.length === 0) return;

//   // Use requestAnimationFrame to decouple map events from the React render cycle
//   requestAnimationFrame(() => {
//     // Check again if ref is still valid when this fires
//     if (map.current) {
//       setPositions(projectMarkers(inst, markersRef.current));
//     }
//   });
// }, [map]);

//   useEffect(() => {
//     const inst = map.current;
//     if (!inst) return;
//     updatePositions();
//     const evs = ["move", "zoom", "resize", "moveend", "render"]; // ← add "render"
// evs.forEach((e) => inst.on(e, updatePositions));
//     return () => evs.forEach((e) => inst.off(e, updatePositions));
//   }, [map, updatePositions]);

//   // 6. QR Scan Logic
//   useEffect(() => {
//     const handleScanSuccess = (e: Event) => {
//       const { markerId, marker } = (
//         e as CustomEvent<{ markerId: string; marker: QRcodeMarkerData }>
//       ).detail;

//       // Ensure marker belongs to the current loaded event
//       if (!markersRef.current.some((m) => m.id === markerId)) return;

//       statesRef.current = { ...statesRef.current, [markerId]: "unlocked" };

//       const pointsToAward = marker.points || 0;
//       saveUnlocked("qrcodemarkers", markerId, eventId, pointsToAward);

//       rerender();
//       setPopup({ type: "success", marker });
//     };

//     window.addEventListener("qr-scan-success", handleScanSuccess);
//     return () => window.removeEventListener("qr-scan-success", handleScanSuccess);
//   }, [rerender, eventId]);

//   // 7. Click Handlers
//   const handleMarkerClick = useCallback((marker: MarkerPosition) => {
//     if (blockClickRef.current) return;
//     const state = statesRef.current[marker.id] ?? "default";

//     const fullMarker = markersRef.current.find((m) => m.id === marker.id);
//     if (!fullMarker) return;

//     if (state === "unlocked")    setPopup({ type: "success", marker: fullMarker });
//     else if (state === "nearby") setPopup({ type: "nearby",  marker: fullMarker });
//     else                         setPopup({ type: "far",     marker: fullMarker });
//   }, []);

//   const closePopup = useCallback(() => {
//     blockClickRef.current = true;
//     setPopup(null);
//     const t = setTimeout(() => { blockClickRef.current = false; }, 400);
//     return () => clearTimeout(t);
//   }, []);

//   return (
//     <>
//       <div className={styles.overlayLayer}>
//         {positions.map((marker) => {
//           const state = statesRef.current[marker.id] ?? "default";
//           return (
//             <div
//               key={marker.id}
//               className={styles.markerContainer}
//               style={{ transform: `translate(${marker.x}px, ${marker.y}px)` }}
//               onClick={(e) => { e.stopPropagation(); handleMarkerClick(marker); }}
//             >
//               <div
//                 className={[
//                   styles.markerPin,
//                   state === "nearby"   ? styles.pinNearby   : "",
//                   state === "unlocked" ? styles.pinUnlocked : "",
//                 ].filter(Boolean).join(" ")}
//                 style={marker.image ? { backgroundImage: `url(${marker.image})` } : {}}
//               />
//               <div className={styles.label}>{marker.name}</div>
//               {state === "unlocked" && (
//                 <div className={`${styles.hint} ${styles.hintUnlocked}`}>✓ Done</div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//       <QRcodeMarkersPopup popup={popup} onClose={closePopup} />
//     </>
//   );
// }

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./QRcodeMarkers.module.css";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  loadUnlockedFromDB,
  saveUnlocked,
  getProximityDistances,
  type MarkerState,
} from "@/lib/EventMarkerProgress";
import {
  fetchMuseumMarkers,
  projectMarkers,
  watchPlayerPosition,
  type QRcodeMarkerData,
  type MarkerPosition,
  type PopupState,
} from "./Logic";
import QRcodeMarkersPopup from "./Popup";

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  map: any;
  eventId: string;
}

export default function QRcodeMarkers({ map, eventId }: Props) {
  const [markers, setMarkers] = useState<QRcodeMarkerData[]>([]);
  const [positions, setPositions] = useState<MarkerPosition[]>([]);
  const statesRef = useRef<Record<string, MarkerState>>({});
  const [tick, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const nearbyDistRef = useRef<number>(5);
  const markersRef = useRef<QRcodeMarkerData[]>([]);
  const playerRef = useRef<{ lat: number; lng: number } | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const blockClickRef = useRef(false);
  const isHydratedRef = useRef(false);

  // 1. GPS & Proximity Logic (Declared early to avoid hosting/order issues)
  const updateProximity = useCallback(() => {
    const player = playerRef.current;
    if (!player || markersRef.current.length === 0 || !isHydratedRef.current) return;

    let changed = false;
    const next = { ...statesRef.current };

    markersRef.current.forEach((m) => {
      const prev = statesRef.current[m.id] ?? "default";
      if (prev === "unlocked") return;

      const dist = getDistanceMeters(player.lat, player.lng, m.lat, m.lng);
      const computed: MarkerState = dist <= nearbyDistRef.current ? "nearby" : "default";

      if (computed !== prev) {
        next[m.id] = computed;
        changed = true;
      }
    });

    if (changed) {
      statesRef.current = next;
      rerender();
    }
  }, [rerender]);

  // 2. Proximity Config — FIXED: Added eventId
  useEffect(() => {
    if (!eventId) return;
    getProximityDistances(eventId).then((distances) => {
      nearbyDistRef.current = distances.qrcodemarkers;
      updateProximity(); // Check proximity as soon as we have the distance
    });
  }, [eventId, updateProximity]);

  // 3. Load Progress
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || !eventId) {
        isHydratedRef.current = true;
        return;
      }
      loadUnlockedFromDB("qrcodemarkers", eventId).then((saved) => {
        statesRef.current = { ...statesRef.current, ...saved };
        isHydratedRef.current = true;
        rerender();
      });
    });
    return () => unsub();
  }, [rerender, eventId]);

  // 4. Load Markers
  useEffect(() => {
    if (!eventId) return;
    fetchMuseumMarkers(eventId).then((data) => {
      markersRef.current = data;
      setMarkers(data);
    });
  }, [eventId]);

  // 5. Watch GPS
  useEffect(() => {
    return watchPlayerPosition((pos) => {
      playerRef.current = pos;
      updateProximity();
    });
  }, [updateProximity]);

  // 6. Map Projection
  const updatePositions = useCallback(() => {
    const inst = map.current;
    if (!inst || markersRef.current.length === 0) return;

    requestAnimationFrame(() => {
      if (map.current) {
        setPositions(projectMarkers(inst, markersRef.current));
      }
    });
  }, [map]);

  useEffect(() => {
    const inst = map.current;
    if (!inst) return;
    updatePositions();
    const evs = ["move", "zoom", "resize", "moveend", "render"];
    evs.forEach((e) => inst.on(e, updatePositions));
    return () => evs.forEach((e) => inst.off(e, updatePositions));
  }, [map, updatePositions]);

  // 7. QR Scan Logic
  useEffect(() => {
    const handleScanSuccess = (e: Event) => {
      const { markerId, marker } = (
        e as CustomEvent<{ markerId: string; marker: QRcodeMarkerData }>
      ).detail;

      if (!markersRef.current.some((m) => m.id === markerId)) return;

      statesRef.current = { ...statesRef.current, [markerId]: "unlocked" };
      const pointsToAward = marker.points || 0;
      saveUnlocked("qrcodemarkers", markerId, eventId, pointsToAward);

      rerender();
      setPopup({ type: "success", marker });
    };

    window.addEventListener("qr-scan-success", handleScanSuccess);
    return () => window.removeEventListener("qr-scan-success", handleScanSuccess);
  }, [rerender, eventId]);

  // 8. Click Handlers
  const handleMarkerClick = useCallback((marker: MarkerPosition) => {
    if (blockClickRef.current) return;
    const state = statesRef.current[marker.id] ?? "default";

    const fullMarker = markersRef.current.find((m) => m.id === marker.id);
    if (!fullMarker) return;

    if (state === "unlocked")    setPopup({ type: "success", marker: fullMarker });
    else if (state === "nearby") setPopup({ type: "nearby",  marker: fullMarker });
    else                         setPopup({ type: "far",     marker: fullMarker });
  }, []);

  const closePopup = useCallback(() => {
    blockClickRef.current = true;
    setPopup(null);
    const t = setTimeout(() => { blockClickRef.current = false; }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className={styles.overlayLayer}>
        {positions.map((marker) => {
          const state = statesRef.current[marker.id] ?? "default";
          return (
            <div
              key={marker.id}
              className={styles.markerContainer}
              style={{ transform: `translate(${marker.x}px, ${marker.y}px)` }}
              onClick={(e) => { e.stopPropagation(); handleMarkerClick(marker); }}
            >
              <div
                className={[
                  styles.markerPin,
                  state === "nearby"   ? styles.pinNearby   : "",
                  state === "unlocked" ? styles.pinUnlocked : "",
                ].filter(Boolean).join(" ")}
                style={marker.image ? { backgroundImage: `url(${marker.image})` } : {}}
              />
              <div className={styles.label}>{marker.name}</div>
              {state === "unlocked" && (
                <div className={`${styles.hint} ${styles.hintUnlocked}`}>✓ Done</div>
              )}
            </div>
          );
        })}
      </div>
      <QRcodeMarkersPopup popup={popup} onClose={closePopup} />
    </>
  );
}