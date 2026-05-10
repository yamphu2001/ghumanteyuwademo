
// "use client";

// import React, { useEffect, useState, useCallback, useRef } from "react";
// import styles from "./LocationMarkers.module.css";
// import Popup, { PopupData } from "./Popup";
// import { db } from "@/lib/firebase";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import {
//   loadUnlockedFromDB,
//   saveUnlocked,
//   getProximityDistances,
//   type MarkerState
// } from "@/lib/EventMarkerProgress";

// interface Props {
//   map: React.MutableRefObject<any>;
//   eventId: string;
// }

// interface MarkerData {
//   id: string;
//   name: string;
//   lat: number;
//   lng: number;
//   type: string;
//   image: string;
//   popupImage?: string;
//   description?: string;
//   status: string;
//   points?: number;
//   eventlocation: string;
// }

// interface Position extends MarkerData {
//   x: number;
//   y: number;
//   coordinates: [number, number];
// }

// function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLng = ((lng2 - lng1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//     Math.cos((lat2 * Math.PI) / 180) *
//     Math.sin(dLng / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// const FALLBACK_PIN = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%233b82f6'/%3E%3Ctext x='20' y='27' text-anchor='middle' font-size='20' fill='white'%3E%F0%9F%93%8D%3C/text%3E%3C/svg%3E`;

// export default function LocationMarkers({ map, eventId }: Props) {
//   const [markers, setMarkers] = useState<MarkerData[]>([]);
//   const [positions, setPositions] = useState<Position[]>([]);
//   const [popup, setPopup] = useState<PopupData | null>(null);
//   const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
//   const [isMapReady, setIsMapReady] = useState(false);
//   const [isHydrated, setIsHydrated] = useState(false);
//   const [, setTick] = useState(0);

//   const rerender = useCallback(() => setTick((t) => t + 1), []);

//   // Stable Close Handler
//   const handleClosePopup = useCallback(() => {
//   setPopup(null);
// }, []);

//   const markersRef = useRef<MarkerData[]>([]);
//   const playerRef = useRef<{ lat: number; lng: number } | null>(null);
//   const statesRef = useRef<Record<string, MarkerState>>({});
//   const progressRef = useRef<Record<string, number>>({});
//   const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
//   const holdingId = useRef<string | null>(null);
//   const nearbyDistRef = useRef<number>(5);

//   useEffect(() => {
//     getProximityDistances().then(distances => {
//       nearbyDistRef.current = distances.locationMarkers;
//     });
//   }, []);

//   useEffect(() => {
//     const auth = getAuth();
//     const unsub = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         setIsHydrated(true);
//         return;
//       }
//       if (!eventId) return;

//       loadUnlockedFromDB("locationMarkers", eventId).then((saved) => {
//         statesRef.current = { ...statesRef.current, ...saved };
//         setIsHydrated(true);
//         rerender();
//       });
//     });
//     return () => unsub();
//   }, [rerender, eventId]);

//   useEffect(() => {
//     if (!eventId) return;
//     (async () => {
//       try {
//         const markersCollectionRef = collection(db, "events", eventId, "locationmarkers");
//         const q = query(markersCollectionRef, where("status", "==", "active"));
//         const snap = await getDocs(q);

//         const data: MarkerData[] = snap.docs.map((d) => {
//           const raw = d.data();
//           return {
//             id: d.id,
//             name: raw.name ?? "",
//             lat: Number(raw.lat ?? 0),
//             lng: Number(raw.lng ?? 0),
//             type: raw.type ?? "",
//             image: raw.image ?? "",
//             popupImage: raw.popupImage ?? "",
//             description: raw.description ?? "",
//             status: raw.status ?? "active",
//             points: raw.points ?? 0,
//             eventlocation: raw.eventlocation ?? "",
//           };
//         });

//         markersRef.current = data;
//         setMarkers(data);
//       } catch (e: any) {
//         console.error("[LocationMarkers] Fetch error:", e);
//       }
//     })();
//   }, [eventId]);

//   const updateProximity = useCallback(() => {
//     const player = playerRef.current;
//     if (!player || markersRef.current.length === 0 || !isHydrated) return;

//     let changed = false;
//     const currentNearbyDist = nearbyDistRef.current;

//     markersRef.current.forEach((m) => {
//       const prev = statesRef.current[m.id] ?? "default";
//       if (prev === "unlocked") return;
//       const dist = getDistanceMeters(player.lat, player.lng, m.lat, m.lng);
//       const isInsideRange = dist <= currentNearbyDist;
//       const next: MarkerState = isInsideRange ? "nearby" : "default";
//       if (next !== prev) {
//         if (holdingId.current === m.id) return;
//         statesRef.current[m.id] = next;
//         changed = true;
//       }
//     });

//     if (changed) rerender();
//   }, [rerender, isHydrated]);

//   useEffect(() => {
//     if (!navigator.geolocation) return;
//     const wid = navigator.geolocation.watchPosition(
//       (pos) => {
//         playerRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
//         updateProximity();
//       },
//       (err) => console.warn("GPS error:", err),
//       { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
//     );
//     return () => navigator.geolocation.clearWatch(wid);
//   }, [updateProximity]);

//   const stopHold = useCallback(() => {
//     if (holdTimer.current) { clearInterval(holdTimer.current); holdTimer.current = null; }
//     if (holdingId.current) progressRef.current[holdingId.current] = 0;
//     holdingId.current = null;
//     rerender();
//   }, [rerender]);

//   const startHold = useCallback((markerId: string) => {
//     const state = statesRef.current[markerId] ?? "default";
//     if (state !== "nearby" || holdingId.current === markerId) return;

//     holdingId.current = markerId;
//     progressRef.current[markerId] = 0;
//     rerender();

//     const DURATION = 5000, TICK = 50;
//     let elapsed = 0;
//     holdTimer.current = setInterval(() => {
//       elapsed += TICK;
//       progressRef.current[markerId] = Math.min((elapsed / DURATION) * 100, 100);
//       rerender();

//       if (elapsed >= DURATION) {
//         clearInterval(holdTimer.current!);
//         holdTimer.current = null;
//         progressRef.current[markerId] = 0;
//         holdingId.current = null;
//         statesRef.current[markerId] = "unlocked";

//         const m = markersRef.current.find((x) => x.id === markerId);
//         const pointsToAward = m?.points || 0;
//         saveUnlocked("locationMarkers", markerId, eventId, pointsToAward);
//         rerender();

//         if (m) {
//           setPopup({
//             id: m.id,
//             name: m.name,
//             image: m.image || FALLBACK_PIN,
//             popupImage: m.popupImage,
//             description: m.description,
//             points: m.points,
//             isUnlocked: true
//           });
//         }
//       }
//     }, TICK);
//   }, [rerender, eventId]);

//   const handleClick = useCallback((marker: Position) => {
//     if (holdingId.current !== null) return;
//     const state = statesRef.current[marker.id] ?? "default";
//     setPopup({
//       id: marker.id,
//       name: marker.name,
//       image: marker.image || FALLBACK_PIN,
//       popupImage: marker.popupImage,
//       description: marker.description,
//       points: marker.points,
//       isUnlocked: state === "unlocked"
//     });
//   }, []);

//   const updatePositions = useCallback(() => {
//     const inst = map.current;
//     if (!inst || markersRef.current.length === 0) return;
//     const sync = () => {
//       const newPos = markersRef.current.map((m) => {
//         const pt = inst.project([m.lng, m.lat]);
//         return {
//           ...m,
//           coordinates: [m.lng, m.lat] as [number, number],
//           x: pt.x,
//           y: pt.y,
//         };
//       });
//       setPositions(newPos);
//     };
//     requestAnimationFrame(sync);
//   }, [map]);

//   useEffect(() => {
//     const inst = map.current;
//     if (!inst) return;
//     const onIdle = () => { updatePositions(); setIsMapReady(true); };
//     inst.once("idle", onIdle);
//     const evs = ["move", "zoom", "resize", "moveend", "render", "rotate", "pitch"];
//     evs.forEach((e) => inst.on(e, updatePositions));
//     return () => {
//       inst.off("idle", onIdle);
//       evs.forEach((e) => inst.off(e, updatePositions));
//     };
//   }, [updatePositions, map, markers]);

//   return (
//     <>
//       <div
//         className={styles.markerOverlay}
//         style={{
//           opacity: isMapReady ? 1 : 0,
//           transition: "opacity 0.4s ease-out",
//           pointerEvents: "none"
//         }}
//       >
//         {positions.map((marker) => {
//           const state = statesRef.current[marker.id] ?? "default";
//           const progress = progressRef.current[marker.id] ?? 0;
//           const R = 22;
//           const circ = 2 * Math.PI * R;
//           const offset = circ - (progress / 100) * circ;
//           const imgSrc = imgErrors[marker.id] || !marker.image ? FALLBACK_PIN : marker.image;
//           const scale = progress > 0 ? 1.4 : 1;

//           return (
//             <div
//               key={marker.id}
//               className={styles.markerContainer}
//               style={{
//                 transform: `translate3d(${marker.x}px, ${marker.y}px, 0)`,
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 willChange: 'transform',
//                 pointerEvents: 'auto'
//               }}
//               onPointerDown={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 e.currentTarget.setPointerCapture(e.pointerId);
//                 startHold(marker.id);
//               }}
//               onPointerUp={() => stopHold()}
//               onPointerCancel={() => stopHold()}
//               onClick={(e) => { e.stopPropagation(); handleClick(marker); }}
//             >
//               <div
//                 className={styles.pinWrapper}
//                 style={{
//                   transform: `scale(${scale})`,
//                   transformOrigin: "center bottom",
//                   transition: progress === 0 ? "transform 0.2s ease" : "none",
//                 }}
//               >
//                 {state === "nearby" && progress > 0 && (
//                   <svg className={styles.progressRing} viewBox="0 0 50 50">
//                     <circle cx="25" cy="25" r={R} className={styles.ringTrack} />
//                     <circle
//                       cx="25" cy="25" r={R}
//                       className={styles.ringFill}
//                       strokeDasharray={circ}
//                       strokeDashoffset={offset}
//                     />
//                   </svg>
//                 )}
//                 <div
//                   className={[
//                     styles.markerPin,
//                     state === "nearby" ? styles.pinNearby : "",
//                     state === "unlocked" ? styles.pinUnlocked : "",
//                   ].filter(Boolean).join(" ")}
//                   style={{ backgroundImage: `url(${imgSrc})` }}
//                 >
//                   {marker.image && !imgErrors[marker.id] && (
//                     <img
//                       src={marker.image}
//                       alt=""
//                       style={{ display: "none" }}
//                       onError={() => setImgErrors((p) => ({ ...p, [marker.id]: true }))}
//                     />
//                   )}
//                 </div>
//               </div>
//               <div className={styles.label}>{marker.eventlocation || marker.name}</div>
//               {state === "nearby" && progress === 0 && (
//                 <div className={styles.holdHint}>Hold 5s</div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//       <Popup popup={popup} onClose={handleClosePopup} />
//     </>
//   );
// }


"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import styles from "./LocationMarkers.module.css";
import Popup, { PopupData } from "./Popup";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  loadUnlockedFromDB,
  saveUnlocked,
  getProximityDistances,
  type MarkerState
} from "@/lib/EventMarkerProgress";

interface Props {
  map: React.MutableRefObject<any>;
  eventId: string;
}

interface MarkerData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  image: string;
  popupImage?: string;
  description?: string;
  status: string;
  points?: number;
  eventlocation: string;
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FALLBACK_PIN = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%233b82f6'/%3E%3Ctext x='20' y='27' text-anchor='middle' font-size='20' fill='white'%3E%F0%9F%93%8D%3C/text%3E%3C/svg%3E`;

export default function LocationMarkers({ map, eventId }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [isMapReady, setIsMapReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [, setTick] = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const markersRef = useRef<MarkerData[]>([]);
  const playerRef = useRef<{ lat: number; lng: number } | null>(null);
  const statesRef = useRef<Record<string, MarkerState>>({});
  const progressRef = useRef<Record<string, number>>({});
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdingId = useRef<string | null>(null);
  const nearbyDistRef = useRef<number>(5);
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const updateProximity = useCallback(() => {
    const player = playerRef.current;
    if (!player || markersRef.current.length === 0 || !isHydrated) return;
    let changed = false;
    markersRef.current.forEach((m) => {
      const prev = statesRef.current[m.id] ?? "default";
      if (prev === "unlocked") return;
      const dist = getDistanceMeters(player.lat, player.lng, m.lat, m.lng);
      const next: MarkerState = dist <= nearbyDistRef.current ? "nearby" : "default";
      if (next !== prev && holdingId.current !== m.id) {
        statesRef.current[m.id] = next;
        changed = true;
      }
    });
    if (changed) rerender();
  }, [rerender, isHydrated]);

  const syncToMap = useCallback(() => {
    const inst = map.current;
    if (!inst) return;
    markersRef.current.forEach((m) => {
      const el = elementRefs.current[m.id];
      if (!el) return;
      const pt = inst.project([m.lng, m.lat]);
      el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
    });
  }, [map]);

  const stopHold = useCallback(() => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    if (holdingId.current) progressRef.current[holdingId.current] = 0;
    holdTimer.current = null;
    holdingId.current = null;
    rerender();
  }, [rerender]);

  const startHold = useCallback((markerId: string) => {
    const state = statesRef.current[markerId] ?? "default";
    if (state !== "nearby" || holdingId.current === markerId) return;
    holdingId.current = markerId;
    progressRef.current[markerId] = 0;
    rerender();
    const DURATION = 5000, TICK = 50;
    let elapsed = 0;
    holdTimer.current = setInterval(() => {
      elapsed += TICK;
      progressRef.current[markerId] = Math.min((elapsed / DURATION) * 100, 100);
      rerender();
      if (elapsed >= DURATION) {
        clearInterval(holdTimer.current!);
        statesRef.current[markerId] = "unlocked";
        const m = markersRef.current.find(x => x.id === markerId);
        saveUnlocked("locationMarkers", markerId, eventId, m?.points || 0);
        if (m) setPopup({ ...m, image: m.image || FALLBACK_PIN, isUnlocked: true } as any);
        stopHold();
      }
    }, TICK);
  }, [rerender, eventId, stopHold]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // 1. Fetch Proximity Distances (Specific to EventID)
  useEffect(() => {
    if (!eventId) return;
    getProximityDistances(eventId).then(d => { 
      nearbyDistRef.current = d.locationMarkers; 
      updateProximity();
    });
  }, [eventId, updateProximity]);

  // 2. Auth & Progress Loading
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setIsHydrated(true); return; }
      if (!eventId) return;
      loadUnlockedFromDB("locationMarkers", eventId).then((saved) => {
        statesRef.current = { ...statesRef.current, ...saved };
        setIsHydrated(true);
        rerender();
      });
    });
    return () => unsub();
  }, [rerender, eventId]);

  // 3. Fetch Event Markers
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const ref = collection(db, "events", eventId, "locationmarkers");
        const snap = await getDocs(query(ref, where("status", "==", "active")));
        const data: MarkerData[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarkerData));
        markersRef.current = data;
        setMarkers(data);
      } catch (e) { console.error(e); }
    })();
  }, [eventId]);

  // 4. Mapbox Render Sync
  useEffect(() => {
    const inst = map.current;
    if (!inst) return;
    inst.on("render", syncToMap);
    if (inst.isStyleLoaded() && !inst.isMoving()) {
      syncToMap();
      setIsMapReady(true);
    } else {
      inst.once("idle", () => {
        syncToMap();
        setIsMapReady(true);
      });
    }
    return () => { inst.off("render", syncToMap); };
  }, [syncToMap, map, markers]);

  // 5. Geolocation Watcher
  useEffect(() => {
    if (!navigator.geolocation) return;
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        playerRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateProximity();
      },
      null,
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [updateProximity]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className={styles.markerOverlay} style={{ opacity: isMapReady ? 1 : 0 }}>
        {markers.map((marker) => {
          const state = statesRef.current[marker.id] ?? "default";
          const progress = progressRef.current[marker.id] ?? 0;
          const R = 22, circ = 2 * Math.PI * R;
          const offset = circ - (progress / 100) * circ;
          const imgSrc = imgErrors[marker.id] || !marker.image ? FALLBACK_PIN : marker.image;

          return (
            <div
              key={marker.id}
              ref={(el) => { elementRefs.current[marker.id] = el; }}
              className={styles.markerContainer}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); startHold(marker.id); }}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onClick={() => {
                if (holdingId.current !== null) return;
                setPopup({ ...marker, image: imgSrc, isUnlocked: state === "unlocked" } as any);
              }}
            >
              <div
                className={styles.pinWrapper}
                style={{
                  transform: `scale(${progress > 0 ? 1.4 : 1})`,
                  transformOrigin: "center center",
                  transition: progress === 0 ? "transform 0.2s ease" : "none",
                }}
              >
                {state === "nearby" && progress > 0 && (
                  <svg className={styles.progressRing} viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r={R} className={styles.ringTrack} />
                    <circle cx="25" cy="25" r={R} className={styles.ringFill}
                      strokeDasharray={circ} strokeDashoffset={offset} />
                  </svg>
                )}
                <div
                  className={`${styles.markerPin} ${state === "nearby" ? styles.pinNearby : ""} ${state === "unlocked" ? styles.pinUnlocked : ""}`}
                  style={{ backgroundImage: `url(${imgSrc})` }}
                />
              </div>
              {state === "nearby" && progress === 0 && (
                <div className={styles.holdHint}>Hold 5s</div>
              )}
            </div>
          );
        })}
      </div>
      <Popup popup={popup} onClose={() => setPopup(null)} />
    </>
  );
}