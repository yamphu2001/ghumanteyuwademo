

// "use client";
// import React, {
//   useEffect, useState, useCallback, useMemo, useRef,
// } from 'react';
// import { createPortal } from 'react-dom';
// import styles from './LocationMarkers.module.css';
// import { Landmark } from './Landmark';
// import MarkerPopup from './Popup';

// const HOLD_MS     = 5000;
// const BASE_ZOOM   = 14;
// const RING_SIZE   = 64;
// const RING_RADIUS = 28;
// const RING_CIRC   = 2 * Math.PI * RING_RADIUS;

// interface Props {
//   map: React.MutableRefObject<any>;
//   landmarks: Landmark[];
//   capturedIds: Set<string>;
//   nearbyIds: Set<string>;
//   onMarkerMount: (id: string, el: HTMLDivElement | null) => void;
//   onMarkerClick?: (landmark: Landmark) => void;
//   triggerCapture: (id: string) => void;
// }

// interface ProjectedMarker extends Landmark {
//   x: number;
//   y: number;
// }

// export default function LocationMarkers({
//   map, landmarks, capturedIds, nearbyIds,
//   onMarkerMount, onMarkerClick, triggerCapture,
// }: Props) {
//   const [positions, setPositions]               = useState<ProjectedMarker[]>([]);
//   const [zoom, setZoom]                         = useState<number>(BASE_ZOOM);

//   // ── Popup: only ONE landmark open at a time ──────────────────────────────
//   const [popupId, setPopupId]   = useState<string | null>(null);

//   // ── Hold state ───────────────────────────────────────────────────────────
//   const [holdId, setHoldId]         = useState<string | null>(null);
//   const [holdProgress, setHoldProgress] = useState(0); // 0–1
//   const holdStart   = useRef<number>(0);
//   const holdRafId   = useRef<number>(0);
//   const holdIdRef   = useRef<string | null>(null);

//   // ── Toast ────────────────────────────────────────────────────────────────
//   const [farToastId, setFarToastId] = useState<string | null>(null);
//   const farToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const popupLandmark = useMemo(
//     () => positions.find((p) => p.id === popupId) ?? null,
//     [positions, popupId],
//   );

//   // ── Map projection ───────────────────────────────────────────────────────
//   const updatePositions = useCallback(() => {
//     if (!map.current) return;
//     setZoom(map.current.getZoom());
//     setPositions(
//       landmarks.map((lm) => {
//         const pt = map.current.project(lm.coordinates);
//         return { ...lm, x: pt.x, y: pt.y };
//       }),
//     );
//   }, [map, landmarks]);

//   useEffect(() => {
//     const m = map.current;
//     if (!m) return;
//     updatePositions();
//     const events = ['move', 'zoom', 'resize', 'moveend'];
//     events.forEach((e) => m.on(e, updatePositions));
//     return () => events.forEach((e) => m.off(e, updatePositions));
//   }, [map, updatePositions]);

//   const markerScale = useMemo(() => {
//     const s = Math.pow(2, (zoom - BASE_ZOOM) * 0.3);
//     return Math.max(0.4, Math.min(1.5, s));
//   }, [zoom]);

//   // ── Hold animation loop ──────────────────────────────────────────────────
//   const startHold = useCallback((marker: ProjectedMarker) => {
//     // Only allow hold if nearby and not captured
//     if (!nearbyIds.has(marker.id) || capturedIds.has(marker.id)) return;

//     holdIdRef.current = marker.id;
//     holdStart.current = performance.now();
//     setHoldId(marker.id);
//     setHoldProgress(0);

//     const tick = () => {
//       const elapsed  = performance.now() - holdStart.current;
//       const progress = Math.min(elapsed / HOLD_MS, 1);
//       setHoldProgress(progress);

//       if (progress < 1) {
//         holdRafId.current = requestAnimationFrame(tick);
//       } else {
//         // Hold complete → capture + open popup
//         triggerCapture(holdIdRef.current!);
//         setPopupId(holdIdRef.current);
//         setHoldId(null);
//         setHoldProgress(0);
//         holdIdRef.current = null;
//       }
//     };

//     holdRafId.current = requestAnimationFrame(tick);
//   }, [nearbyIds, capturedIds, triggerCapture]);

//   const cancelHold = useCallback(() => {
//     cancelAnimationFrame(holdRafId.current);
//     setHoldId(null);
//     setHoldProgress(0);
//     holdIdRef.current = null;
//   }, []);

//   // Cancel hold if finger/mouse leaves
//   useEffect(() => {
//     const up = () => cancelHold();
//     window.addEventListener('pointerup', up);
//     window.addEventListener('pointercancel', up);
//     return () => {
//       window.removeEventListener('pointerup', up);
//       window.removeEventListener('pointercancel', up);
//     };
//   }, [cancelHold]);

//   // ── Click / tap handler ──────────────────────────────────────────────────
//   const showFarToast = useCallback((id: string) => {
//     setFarToastId(id);
//     if (farToastTimer.current) clearTimeout(farToastTimer.current);
//     farToastTimer.current = setTimeout(() => setFarToastId(null), 3000);
//   }, []);

//   const handlePointerDown = useCallback((marker: ProjectedMarker) => {
//     map.current?.flyTo({ center: marker.coordinates, zoom: 18 });
//     onMarkerClick?.(marker);

//     // Already captured → reopen popup regardless of distance
//     if (capturedIds.has(marker.id)) {
//       setPopupId(marker.id);
//       return;
//     }

//     // Not nearby → toast
//     if (!nearbyIds.has(marker.id)) {
//       showFarToast(marker.id);
//       return;
//     }

//     // Nearby + not captured → begin hold
//     startHold(marker);
//   }, [capturedIds, nearbyIds, map, onMarkerClick, showFarToast, startHold]);

//   return (
//     <div className={styles.overlayLayer}>
//       {positions.map((marker) => {
//         const captured     = capturedIds.has(marker.id);
//         const isHolding    = holdId === marker.id;
//         const progress     = isHolding ? holdProgress : 0;
//         const strokeOffset = RING_CIRC * (1 - progress);
//         const holdScale    = isHolding ? 1 + progress * 0.3 : 1;
//         const showFar      = farToastId === marker.id;

//         return (
//           <div
//             key={marker.id}
//             className={styles.markerContainer}
//             style={{
//               transform: `translate3d(${marker.x}px, ${marker.y}px, 0) scale(${markerScale})`,
//               zIndex: popupId === marker.id ? 100 : 1,
//             }}
//           >
//             {showFar && (
//               <div className={styles.farToast}>
//                 📍 You&apos;re too far! Walk closer.
//               </div>
//             )}

//             <div className={styles.pinWrapper}>
//               {/* Progress ring while holding */}
//               {isHolding && (
//                 <svg
//                   className={styles.progressRing}
//                   width={RING_SIZE}
//                   height={RING_SIZE}
//                   viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
//                 >
//                   <circle
//                     cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
//                     fill="none"
//                     stroke="rgba(255,238,0,0.2)"
//                     strokeWidth="4"
//                   />
//                   <circle
//                     cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
//                     fill="none"
//                     stroke="#ffee00"
//                     strokeWidth="4"
//                     strokeLinecap="round"
//                     strokeDasharray={RING_CIRC}
//                     strokeDashoffset={strokeOffset}
//                     transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
//                   />
//                 </svg>
//               )}

//               <div
//                 ref={(el) => onMarkerMount(marker.id, el)}
//                 className={`${styles.markerPin} ${captured ? styles.captured : ''}`}
//                 style={{
//                   backgroundImage: `url(${marker.image})`,
//                   transform: `scale(${holdScale})`,
//                   transition: 'transform 0.1s ease',
//                 }}
//                 onPointerDown={(e) => {
//                   e.preventDefault(); // prevent text selection / scroll
//                   handlePointerDown(marker);
//                 }}
//               />
//             </div>

//             {/* Hold hint — only when nearby and not captured */}
//             {nearbyIds.has(marker.id) && !captured && (
//               <div className={styles.holdHint}>
//                 {isHolding
//                   ? `${Math.ceil((1 - progress) * 5)}s…`
//                   : 'Hold 5s'}
//               </div>
//             )}

//             <div className={`${styles.label} ${captured ? styles.labelCaptured : ''}`}>
//               {captured && <span className={styles.capturedDot} />}
//               {marker.name}
//             </div>
//           </div>
//         );
//       })}

//       {/* Single portal — only one popup ever shown */}
//       {popupLandmark && createPortal(
//         <MarkerPopup
//           marker={popupLandmark}
//           onClose={() => setPopupId(null)}
//         />,
//         document.body,
//       )}
//     </div>
//   );
// }

"use client";
import React, {
  useEffect, useState, useCallback, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './LocationMarkers.module.css';
import { Landmark } from './Landmark';
import MarkerPopup from './Popup';

// --- Firebase Imports ---
import { db, rtdb } from '@/lib/firebase';
import { ref, push, set, serverTimestamp, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const HOLD_MS = 5000;
const BASE_ZOOM = 14;
const RING_SIZE = 64;
const RING_RADIUS = 28;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

interface Props {
  map: React.MutableRefObject<any>;
  landmarks: Landmark[];
  capturedIds: Set<string>;
  nearbyIds: Set<string>;
  onMarkerMount: (id: string, el: HTMLDivElement | null) => void;
  onMarkerClick?: (landmark: Landmark) => void;
  triggerCapture: (id: string) => void;
}

interface ProjectedMarker extends Landmark {
  x: number;
  y: number;
}

export default function LocationMarkers({
  map, landmarks, capturedIds, nearbyIds,
  onMarkerMount, onMarkerClick, triggerCapture,
}: Props) {
  const [positions, setPositions] = useState<ProjectedMarker[]>([]);
  const [zoom, setZoom] = useState<number>(BASE_ZOOM);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStart = useRef<number>(0);
  const holdRafId = useRef<number>(0);
  const holdIdRef = useRef<string | null>(null);
  const [farToastId, setFarToastId] = useState<string | null>(null);
  const farToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popupLandmark = useMemo(
    () => positions.find((p) => p.id === popupId) ?? null,
    [positions, popupId],
  );

  // ── Persistence: Sync with Firebase on Load ─────────────────────────────
  useEffect(() => {
    const auth = getAuth();

    // Listen for authentication state
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Get user's custom username from Firestore 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const username = userSnap.exists() ? userSnap.data().username : null;

        if (username) {
          // 2. Point to the RTDB table
          const captureRef = ref(rtdb, 'mainProgress/locationinfocapture');

          // 3. Query records where playerLogin matches our username
          const userQuery = query(captureRef, orderByChild('playerLogin'), equalTo(username));

          // 4. Listen for data (this also handles removals from Firebase in real-time)
          const unsubscribeDb = onValue(userQuery, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              // Iterate through database entries and update local UI state
              Object.values(data).forEach((entry: any) => {
                if (entry.markerUid) {
                  triggerCapture(entry.markerUid);
                }
              });
            }
          });

          return () => unsubscribeDb();
        }
      }
    });

    return () => unsubscribeAuth();
  }, [triggerCapture]);

  // ── Firebase Storage Logic (Pushing new capture) ───────────────────────
  const saveCaptureToFirebase = async (markerId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      const username = userSnap.exists() ? userSnap.data().username : "Unknown Player";

      const captureRef = ref(rtdb, 'mainProgress/locationinfocapture');
      const newCaptureEntry = push(captureRef);

      await set(newCaptureEntry, {
        playerLogin: username,
        markerUid: markerId,
        timestamp: serverTimestamp(),
        status: "completed"
      });
    } catch (error) {
      console.error("Firebase save failed:", error);
    }
  };

  const updatePositions = useCallback(() => {
    if (!map.current) return;
    setZoom(map.current.getZoom());
    setPositions(
      landmarks.map((lm) => {
        const pt = map.current.project(lm.coordinates);
        return { ...lm, x: pt.x, y: pt.y };
      }),
    );
  }, [map, landmarks]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    updatePositions();
    const events = ['move', 'zoom', 'resize', 'moveend'];
    events.forEach((e) => m.on(e, updatePositions));
    return () => events.forEach((e) => m.off(e, updatePositions));
  }, [map, updatePositions]);

  const markerScale = useMemo(() => {
    const s = Math.pow(2, (zoom - BASE_ZOOM) * 0.3);
    return Math.max(0.4, Math.min(1.5, s));
  }, [zoom]);

  // ... inside startHold function ...

  const startHold = useCallback((marker: ProjectedMarker) => {
    // 1. INITIAL CHECK: You still must be nearby to START
    if (!nearbyIds.has(marker.id) || capturedIds.has(marker.id)) return;

    holdIdRef.current = marker.id;
    holdStart.current = performance.now();
    setHoldId(marker.id);
    setHoldProgress(0);

    const tick = () => {
      // 2. THE FIX: We NO LONGER check nearbyIds.has() inside the tick.
      // As long as the user's finger is down (holdIdRef is set), 
      // we ignore coordinates until finished.

      const elapsed = performance.now() - holdStart.current;
      const progress = Math.min(elapsed / HOLD_MS, 1);
      setHoldProgress(progress);

      if (progress < 1) {
        holdRafId.current = requestAnimationFrame(tick);
      } else {
        const finalId = holdIdRef.current!;
        triggerCapture(finalId);
        setPopupId(finalId);
        setHoldId(null);
        setHoldProgress(0);
        holdIdRef.current = null;
        saveCaptureToFirebase(finalId);
      }
    };

    holdRafId.current = requestAnimationFrame(tick);

    // 3. IMPORTANT: Remove nearbyIds from this dependency array 
    // so the 'tick' closure doesn't restart/reset if nearbyIds changes.
  }, [capturedIds, triggerCapture]);

  const cancelHold = useCallback(() => {
    cancelAnimationFrame(holdRafId.current);
    setHoldId(null);
    setHoldProgress(0);
    holdIdRef.current = null;
  }, []);

  useEffect(() => {
    const up = () => cancelHold();
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [cancelHold]);

  const showFarToast = useCallback((id: string) => {
    setFarToastId(id);
    if (farToastTimer.current) clearTimeout(farToastTimer.current);
    farToastTimer.current = setTimeout(() => setFarToastId(null), 3000);
  }, []);

  const handlePointerDown = useCallback((marker: ProjectedMarker) => {
    map.current?.flyTo({ center: marker.coordinates, zoom: 18 });
    onMarkerClick?.(marker);

    if (capturedIds.has(marker.id)) {
      setPopupId(marker.id);
      return;
    }

    if (!nearbyIds.has(marker.id)) {
      showFarToast(marker.id);
      return;
    }

    startHold(marker);
  }, [capturedIds, nearbyIds, map, onMarkerClick, showFarToast, startHold]);

  return (
    <div className={styles.overlayLayer}>
      {positions.map((marker) => {
        const captured = capturedIds.has(marker.id);
        const isHolding = holdId === marker.id;
        const progress = isHolding ? holdProgress : 0;
        const strokeOffset = RING_CIRC * (1 - progress);
        const holdScale = isHolding ? 1 + progress * 0.3 : 1;
        const showFar = farToastId === marker.id;

        return (
          <div
            key={marker.id}
            className={styles.markerContainer}
            style={{
              transform: `translate3d(${marker.x}px, ${marker.y}px, 0) scale(${markerScale})`,
              zIndex: popupId === marker.id ? 100 : 1,
            }}
          >
            {showFar && (
              <div className={styles.farToast}>
                📍 You&apos;re too far! Walk closer.
              </div>
            )}

            <div className={styles.pinWrapper}>
              {isHolding && (
                <svg
                  className={styles.progressRing}
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                >
                  <circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
                    fill="none"
                    stroke="rgba(255,238,0,0.2)"
                    strokeWidth="4"
                  />
                  <circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
                    fill="none"
                    stroke="#ffee00"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRC}
                    strokeDashoffset={strokeOffset}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </svg>
              )}

              <div
                ref={(el) => onMarkerMount(marker.id, el)}
                className={`${styles.markerPin} ${captured ? styles.captured : ''}`}
                style={{
                  backgroundImage: `url(${marker.image})`,
                  transform: `scale(${holdScale})`,
                  transition: 'transform 0.1s ease',
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(marker);
                }}
              />
            </div>

            
            {(nearbyIds.has(marker.id) || isHolding) && !captured && (
              <div className={styles.holdHint}>
                {isHolding
                  ? `${Math.ceil((1 - progress) * 5)}s…`
                  : 'Hold 5s'}
              </div>
            )}

            <div className={`${styles.label} ${captured ? styles.labelCaptured : ''}`}>
              {captured && <span className={styles.capturedDot} />}
              {marker.name}
            </div>
          </div>
        );
      })}

      {popupLandmark && createPortal(
        <MarkerPopup
          marker={popupLandmark}
          onClose={() => setPopupId(null)}
        />,
        document.body,
      )}
    </div>
  );
}