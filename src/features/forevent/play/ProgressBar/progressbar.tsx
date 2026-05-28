// "use client";

// import React, { useEffect, useState } from "react";
// import { collection, onSnapshot, doc } from "firebase/firestore";
// import { ref, onValue, off, DataSnapshot } from "firebase/database";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { db, rtdb } from "@/lib/firebase";
// import styles from "./ProgressBar.module.css";
// import { useParams } from "next/navigation";

// export default function ProgressBar() {
//   const params = useParams();
//   const eventId = (params?.eventId ?? params?.id) as string | undefined;

//   const [enabled, setEnabled] = useState(false);
//   const [totalQR, setTotalQR] = useState(0);
//   const [scannedQR, setScannedQR] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [expanded, setExpanded] = useState(false);
//   const [animate, setAnimate] = useState(false);
//   const [userId, setUserId] = useState<string | null>(null);

//   // 1. Track Auth
//   useEffect(() => {
//     const unsub = onAuthStateChanged(getAuth(), (user) => {
//       setUserId(user?.uid ?? null);
//     });
//     return () => unsub();
//   }, []);

//  // 2. Read Remote Configuration Panel Config directly under the event root
//   useEffect(() => {
//     if (!eventId) return;
//     const unsubscribe = onSnapshot(
//       doc(db, "events", eventId, "progressbar", "config"), // 🟢 Points directly to the clean collection layout
//       (snapshot) => {
//         if (snapshot.exists()) {
//           const data = snapshot.data();
//           setEnabled(data.enabled ?? false);
//         }
//       },
//       (error) => console.error("[ProgressBar] Settings loading error:", error)
//     );
//     return () => unsubscribe();
//   }, [eventId]);
  

//   // 3. Total QR markers from Firestore
//   useEffect(() => {
//     if (!eventId) return;
//     setIsLoading(true);
//     const unsub = onSnapshot(
//       collection(db, "events", eventId, "qrcodemarkers"),
//       (snap) => {
//         setTotalQR(snap.docs.length);
//         setIsLoading(false);
//       },
//       (err) => {
//         console.error("[ProgressBar] qrcodemarkers error:", err);
//         setIsLoading(false);
//       }
//     );
//     return () => unsub();
//   }, [eventId]);

//   // 4. Scanned QR count from RTDB
//   useEffect(() => {
//     if (!userId || !eventId) return;
//     const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
//     const handler = (snapshot: DataSnapshot) => {
//       const data = snapshot.val();
//       setScannedQR(data && typeof data === "object" ? Object.keys(data).length : 0);
//       setAnimate(true);
//     };
//     onValue(scannedRef, handler);
//     return () => off(scannedRef, "value", handler);
//   }, [userId, eventId]);

//   // Animate reset
//   useEffect(() => {
//     if (!animate) return;
//     const t = setTimeout(() => setAnimate(false), 800);
//     return () => clearTimeout(t);
//   }, [animate]);

//   // ── Derived Calculations ───────────────────────────────────────────────────

//   const pct = totalQR === 0 ? 0 : Math.min(100, Math.round((scannedQR / totalQR) * 100));
//   const allDone = totalQR > 0 && scannedQR >= totalQR;

//   if (!enabled) return null;

//   const R = 26;
//   const CIRC = 2 * Math.PI * R;
//   const dash = (pct / 100) * CIRC;

//   return (
//     <div className={styles.root}>
//       {/* ── Circle Button ── */}
//       <button
//         className={`${styles.circleBtn} ${allDone ? styles.circleDone : ""}`}
//         onClick={() => setExpanded((v) => !v)}
//         disabled={isLoading}
//       >
//         <svg className={styles.ring} viewBox="0 0 65 65">
//           <circle cx="32.5" cy="32.5" r={R} className={styles.ringBg} />
//           <circle
//             cx="32.5"
//             cy="32.5"
//             r={R}
//             className={`${styles.ringFill} ${allDone ? styles.ringDone : ""}`}
//             strokeDasharray={`${dash} ${CIRC}`}
//             style={{ transition: animate ? "stroke-dasharray 0.8s ease-out" : "none" }}
//           />
//         </svg>
//         <span className={`${styles.pctLabel} ${allDone ? styles.pctDone : ""}`}>
//           {isLoading ? "…" : allDone ? "✓" : `${pct}%`}
//         </span>
//       </button>

//       {/* ── Expanded Panel ── */}
//       {expanded && (
//         <div className={styles.panel}>
//           <p className={styles.panelTitle}>Explorer Progress</p>

//           {/* ── QR Code Row ── */}
//           <div style={{
//             marginBottom: 10,
//             padding: "12px 14px",
//             background: "#f8fafc",
//             borderRadius: 10,
//             border: "1px solid #e2e8f0",
//           }}>
//             <div style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: 8,
//             }}>
//               <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
//                 🔲 QR Code
//               </span>
//               {isLoading ? (
//                 <span style={{ fontSize: 13, color: "#94a3b8" }}>…</span>
//               ) : (
//                 <span style={{
//                   fontSize: 14,
//                   fontWeight: 700,
//                   color: allDone ? "#16a34a" : "#475569",
//                 }}>
//                   {scannedQR}/{totalQR}
//                 </span>
//               )}
//             </div>
            
//             {/* Inner Subcategory Horizontal Tracker */}
//             <div style={{
//               height: 7,
//               background: "#e2e8f0",
//               borderRadius: 999,
//               overflow: "hidden",
//             }}>
//               {!isLoading && (
//                 <div style={{
//                   height: "100%",
//                   width: `${pct}%`,
//                   background: allDone ? "#22c55e" : "#8b5cf6",
//                   borderRadius: 999,
//                   transition: "width 0.6s ease-out",
//                 }} />
//               )}
//             </div>
//           </div>

//           {/* ── Total Combined Summary Footer Row ── */}
//           <div style={{
//             marginTop: 4,
//             padding: "12px 14px",
//             background: allDone ? "#f0fdf4" : "#f8fafc",
//             borderRadius: 10,
//             border: `1px solid ${allDone ? "#86efac" : "#e2e8f0"}`,
//           }}>
//             <div style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: 8,
//             }}>
//               <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
//                 🗺️ Total
//               </span>
//               {isLoading ? (
//                 <span style={{ fontSize: 13, color: "#94a3b8" }}>…</span>
//               ) : (
//                 <span style={{
//                   fontSize: 14,
//                   fontWeight: 700,
//                   color: allDone ? "#16a34a" : "#0f172a",
//                 }}>
//                   {scannedQR}/{totalQR}
//                 </span>
//               )}
//             </div>
            
//             <div style={{
//               height: 8,
//               background: "#e2e8f0",
//               borderRadius: 999,
//               overflow: "hidden",
//             }}>
//               {!isLoading && (
//                 <div style={{
//                   height: "100%",
//                   width: `${pct}%`,
//                   background: allDone ? "#22c55e" : "#3b82f6",
//                   borderRadius: 999,
//                   transition: "width 0.6s ease-out",
//                 }} />
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { ref, onValue, off, DataSnapshot, set } from "firebase/database"; // 📥 Added 'set'
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, rtdb } from "@/lib/firebase";
import styles from "./ProgressBar.module.css";
import { useParams } from "next/navigation";

export default function ProgressBar() {
  const params = useParams();
  const eventId = (params?.eventId ?? params?.id) as string | undefined;

  const [enabled, setEnabled] = useState(false);
  const [totalQR, setTotalQR] = useState(0);
  const [scannedQR, setScannedQR] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Track Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // 2. Read Remote Configuration Panel Config directly under the event root
  useEffect(() => {
    if (!eventId) return;
    const unsubscribe = onSnapshot(
      doc(db, "events", eventId, "progressbar", "config"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setEnabled(data.enabled ?? false);
        }
      },
      (error) => console.error("[ProgressBar] Settings loading error:", error)
    );
    return () => unsubscribe();
  }, [eventId]);
  

  // 3. Total QR markers from Firestore
  useEffect(() => {
    if (!eventId) return;
    setIsLoading(true);
    const unsub = onSnapshot(
      collection(db, "events", eventId, "qrcodemarkers"),
      (snap) => {
        setTotalQR(snap.docs.length);
        setIsLoading(false);
      },
      (err) => {
        console.error("[ProgressBar] qrcodemarkers error:", err);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [eventId]);

  // 4. Scanned QR count from RTDB
  useEffect(() => {
    if (!userId || !eventId) return;
    const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
    const handler = (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      setScannedQR(data && typeof data === "object" ? Object.keys(data).length : 0);
      setAnimate(true);
    };
    onValue(scannedRef, handler);
    return () => off(scannedRef, "value", handler);
  }, [userId, eventId]);

  // Animate reset
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setAnimate(false), 800);
    return () => clearTimeout(t);
  }, [animate]);

  // ── Derived Calculations ───────────────────────────────────────────────────

  const pct = totalQR === 0 ? 0 : Math.min(100, Math.round((scannedQR / totalQR) * 100));
  const allDone = totalQR > 0 && scannedQR >= totalQR;

  // 5. Sync live progress percentage to RTDB for Quiz Access verification
useEffect(() => {
  if (isLoading || !userId || !eventId) return;

  // 📁 Removed /userInfo/ to store directly under the user ID
  const progressRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/progress`);
  
  set(progressRef, `${pct}%`).catch((err) => {
    console.error("[ProgressBar] Failed syncing progress percentage to RTDB:", err);
  });
}, [pct, userId, eventId, isLoading]);

  if (!enabled) return null;

  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const dash = (pct / 100) * CIRC;

  return (
    <div className={styles.root}>
      {/* ── Circle Button ── */}
      <button
        className={`${styles.circleBtn} ${allDone ? styles.circleDone : ""}`}
        onClick={() => setExpanded((v) => !v)}
        disabled={isLoading}
      >
        <svg className={styles.ring} viewBox="0 0 65 65">
          <circle cx="32.5" cy="32.5" r={R} className={styles.ringBg} />
          <circle
            cx="32.5"
            cy="32.5"
            r={R}
            className={`${styles.ringFill} ${allDone ? styles.ringDone : ""}`}
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: animate ? "stroke-dasharray 0.8s ease-out" : "none" }}
          />
        </svg>
        <span className={`${styles.pctLabel} ${allDone ? styles.pctDone : ""}`}>
          {isLoading ? "…" : allDone ? "✓" : `${pct}%`}
        </span>
      </button>

      {/* ── Expanded Panel ── */}
      {expanded && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Explorer Progress</p>

          {/* ── QR Code Row ── */}
          <div style={{
            marginBottom: 10,
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                🔲 QR Code
              </span>
              {isLoading ? (
                <span style={{ fontSize: 13, color: "#94a3b8" }}>…</span>
              ) : (
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: allDone ? "#16a34a" : "#475569",
                }}>
                  {scannedQR}/{totalQR}
                </span>
              )}
            </div>
            
            {/* Inner Subcategory Horizontal Tracker */}
            <div style={{
              height: 7,
              background: "#e2e8f0",
              borderRadius: 999,
              overflow: "hidden",
            }}>
              {!isLoading && (
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: allDone ? "#22c55e" : "#8b5cf6",
                  borderRadius: 999,
                  transition: "width 0.6s ease-out",
                }} />
              )}
            </div>
          </div>

          {/* ── Total Combined Summary Footer Row ── */}
          <div style={{
            marginTop: 4,
            padding: "12px 14px",
            background: allDone ? "#f0fdf4" : "#f8fafc",
            borderRadius: 10,
            border: `1px solid ${allDone ? "#86efac" : "#e2e8f0"}`,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                🗺️ Total
              </span>
              {isLoading ? (
                <span style={{ fontSize: 13, color: "#94a3b8" }}>…</span>
              ) : (
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: allDone ? "#16a34a" : "#0f172a",
                }}>
                  {scannedQR}/{totalQR}
                </span>
              )}
            </div>
            
            <div style={{
              height: 8,
              background: "#e2e8f0",
              borderRadius: 999,
              overflow: "hidden",
            }}>
              {!isLoading && (
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: allDone ? "#22c55e" : "#3b82f6",
                  borderRadius: 999,
                  transition: "width 0.6s ease-out",
                }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}