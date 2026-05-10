
// "use client";

// import React, { useEffect, useState } from "react";
// import { collection, onSnapshot, doc } from "firebase/firestore";
// import { ref, onValue, off, DataSnapshot } from "firebase/database";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { db, rtdb } from "@/lib/firebase";
// import styles from "./ProgressBar.module.css";
// import { useParams } from "next/navigation";

// // ── Constants ─────────────────────────────────────────────────────────────────

// const MARKER_CATEGORIES = {
//   locationmarkers: "locationMarkers",
//   specialmarkers: "specialMarkers",
//   QRcodeMarkers: "qrcodemarkers",
// } as const;

// type CategoryKey = keyof typeof MARKER_CATEGORIES;
// type RTDBCategoryKey = (typeof MARKER_CATEGORIES)[CategoryKey];

// const CATEGORY_INFO: Record<CategoryKey, { label: string; color: string; doneColor: string; firestorePath: string }> = {
//   locationmarkers: {
//     label: "Location",
//     color: "#ef4444",
//     doneColor: "#22c55e",
//     firestorePath: "locationmarkers",
//   },
//   QRcodeMarkers: {
//     label: "QRCode",
//     color: "#8b5cf6",
//     doneColor: "#22c55e",
//     firestorePath: "qrcodemarkers",
//   },
//   specialmarkers: {
//     label: "Special",
//     color: "#f59e0b",
//     doneColor: "#22c55e",
//     firestorePath: "specialmarkers",
//   },
// };

// // ── Types ─────────────────────────────────────────────────────────────────────

// interface AdminSettings {
//   enabled: boolean;
//   activeCategories: string[];
// }

// interface ProgressData {
//   total: number;
//   completed: number;
// }

// interface RTDBProgressData {
//   [key: string]: {
//     [markerId: string]: unknown;
//   };
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function isCategoryKey(value: string): value is CategoryKey {
//   return value in MARKER_CATEGORIES;
// }

// function countMarkersFromRTDB(rtdbData: RTDBProgressData, categoryRtdbKey: string): number {
//   const categoryData = rtdbData[categoryRtdbKey];
//   if (!categoryData || typeof categoryData !== "object") return 0;
//   return Object.keys(categoryData).length;
// }

// // ── Component ─────────────────────────────────────────────────────────────────

// export default function ProgressBar() {
//   const params = useParams();
//   const eventId = (params?.eventId ?? params?.id) as string | undefined;

//   const [settings, setSettings] = useState<AdminSettings>({
//     enabled: false,
//     activeCategories: [],
//   });
//   const [progress, setProgress] = useState<Record<string, ProgressData>>({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [expanded, setExpanded] = useState(false);
//   const [animate, setAnimate] = useState(false);
//   const [userId, setUserId] = useState<string | null>(null);


  

//   // 1. Track Auth
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
//       setUserId(user?.uid ?? null);
//     });
//     return () => unsubscribe();
//   }, []);

//   // 2. Read Settings — from events/{eventId}/settings/progressBar
//   useEffect(() => {
//     if (!eventId) return;

//     const unsubscribe = onSnapshot(
//       doc(db, "events", eventId, "settings", "progressBar"),
//       (snapshot) => {
//         if (snapshot.exists()) {
//           const data = snapshot.data();
//           const validCategories = (data.activeCategories ?? []).filter(isCategoryKey);
//           setSettings({
//             enabled: data.enabled ?? false,
//             activeCategories: validCategories,
//           });
//         }
//       },
//       (error) => console.error("[ProgressBar] Settings error:", error)
//     );

//     return () => unsubscribe();
//   }, [eventId]);

//   // 3. Sync User Progress (RTDB)
//   useEffect(() => {
//     if (!userId || !eventId) return;

//     const progressRef = ref(rtdb, `eventsProgress/${eventId}/${userId}`);

//     const handler = (snapshot: DataSnapshot) => {
//       const rtdbData = snapshot.val() as RTDBProgressData | null;

//       /**
//        * ─── FIX ────────────────────────────────────────────────────────────────
//        * Firebase RTDB can invoke `onValue` synchronously when data is already
//        * cached locally. If another component (e.g. PrizeSystem) writes to RTDB
//        * inside a React interval tick, Firebase may fire this handler in the
//        * same call stack — which React treats as "setState during render" and
//        * throws a warning.
//        *
//        * Wrapping in setTimeout(, 0) defers the state update to the next
//        * macrotask, safely outside React's render phase.
//        * ────────────────────────────────────────────────────────────────────────
//        */
//       setTimeout(() => {
//         setProgress((prev) => {
//           const next = { ...prev };
//           Object.keys(MARKER_CATEGORIES).forEach((key) => {
//             const adminKey = key as CategoryKey;
//             const rtdbKey = MARKER_CATEGORIES[adminKey];

//             next[adminKey] = {
//               total: prev[adminKey]?.total ?? 0,
//               completed: rtdbData ? countMarkersFromRTDB(rtdbData, rtdbKey) : 0,
//             };
//           });
//           return next;
//         });
//         setAnimate(true);
//       }, 0);
//     };

//     onValue(progressRef, handler);
//     return () => off(progressRef, "value", handler);
//   }, [userId, eventId]);

//   useEffect(() => {
//     if (!animate) return;
//     const t = setTimeout(() => setAnimate(false), 800);
//     return () => clearTimeout(t);
//   }, [animate]);

//   // 4. Sync Collection Totals (Firestore)
//   useEffect(() => {
//     if (!settings.enabled || !eventId || settings.activeCategories.length === 0) {
//       setIsLoading(false);
//       return;
//     }

//     setIsLoading(true);
//     let loadedCount = 0;
//     const totalToLoad = settings.activeCategories.length;
//     const unsubscribers: Array<() => void> = [];

//     settings.activeCategories.forEach((adminKey) => {
//       if (!isCategoryKey(adminKey)) return;

//       const info = CATEGORY_INFO[adminKey];
//       const unsub = onSnapshot(
//         collection(db, "events", eventId, info.firestorePath),
//         (snapshot) => {
//           setProgress((prev) => ({
//             ...prev,
//             [adminKey]: {
//               completed: prev[adminKey]?.completed ?? 0,
//               total: snapshot.docs.length,
//             },
//           }));

//           loadedCount += 1;
//           if (loadedCount >= totalToLoad) setIsLoading(false);
//         },
//         (error) => {
//           console.error(`[ProgressBar] Error for ${adminKey}:`, error);
//           loadedCount += 1;
//           if (loadedCount >= totalToLoad) setIsLoading(false);
//         }
//       );

//       unsubscribers.push(unsub);
//     });

//     return () => unsubscribers.forEach((unsub) => unsub());
//   }, [settings.activeCategories, settings.enabled, eventId]);

//   if (!settings.enabled) return null;

//   // ── Derived Calcs ─────────────────────────────────────────────────────────

//   const activeProgress = settings.activeCategories.map(
//     (key) => progress[key] || { total: 0, completed: 0 }
//   );
//   const totalMarkers = activeProgress.reduce((acc, curr) => acc + curr.total, 0);
//   const totalCompleted = activeProgress.reduce((acc, curr) => acc + curr.completed, 0);
//   const overallPct = totalMarkers === 0 ? 0 : Math.round((totalCompleted / totalMarkers) * 100);
//   const allDone = totalMarkers > 0 && totalCompleted >= totalMarkers;

//   const R = 26;
//   const CIRC = 2 * Math.PI * R;
//   const dash = (overallPct / 100) * CIRC;

//   return (
//     <div className={styles.root}>
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
//           {isLoading ? "…" : allDone ? "✓" : <>{overallPct}%</>}
//         </span>
//       </button>

//       {expanded && (
//         <div className={styles.panel}>
//           <p className={styles.panelTitle}>Explorer Progress</p>
//           {settings.activeCategories.map((key) => (
//             <CategoryRow
//               key={key}
//               categoryKey={key}
//               data={progress[key] || { total: 0, completed: 0 }}
//               isLoading={isLoading}
//             />
//           ))}
//           <TotalRow
//             totalCompleted={totalCompleted}
//             totalMarkers={totalMarkers}
//             allDone={allDone}
//             isLoading={isLoading}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Sub-components ────────────────────────────────────────────────────────────

// function CategoryRow({ categoryKey, data, isLoading }: { categoryKey: string; data: ProgressData; isLoading: boolean }) {
//   if (!isCategoryKey(categoryKey)) return null;

//   const pct = data.total === 0 ? 0 : Math.round((data.completed / data.total) * 100);
//   const done = data.total > 0 && data.completed >= data.total;
//   const { label, color, doneColor } = CATEGORY_INFO[categoryKey];

//   return (
//     <div className={styles.row}>
//       <span className={styles.rowLabel}>{label}</span>
//       <div className={styles.track}>
//         {!isLoading && (
//           <div
//             className={styles.trackFill}
//             style={{ width: `${pct}%`, background: done ? doneColor : color }}
//           />
//         )}
//       </div>
//       <span className={styles.rowCount}>
//         {isLoading ? "…" : `${data.completed}/${data.total}`}
//       </span>
//     </div>
//   );
// }

// function TotalRow({ totalCompleted, totalMarkers, allDone, isLoading }: any) {
//   return (
//     <div className={styles.totalRow} style={{ borderTop: "1px solid #e2e8f0", marginTop: "12px", paddingTop: "12px" }}>
//       <span className={styles.rowLabel} style={{ fontWeight: "bold" }}>Total</span>
//       <span className={styles.rowCount} style={{ fontWeight: "bold", color: allDone ? "#22c55e" : "#0f172a" }}>
//         {isLoading ? "…" : `${totalCompleted} / ${totalMarkers}`}
//       </span>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
// Added 'update' to imports to modify specific fields in RTDB
import { ref, onValue, off, DataSnapshot, update } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, rtdb } from "@/lib/firebase";
import styles from "./ProgressBar.module.css";
import { useParams } from "next/navigation";

// ── Constants ─────────────────────────────────────────────────────────────────

const MARKER_CATEGORIES = {
  locationmarkers: "locationMarkers",
  specialmarkers: "specialMarkers",
  QRcodeMarkers: "qrcodemarkers",
} as const;

type CategoryKey = keyof typeof MARKER_CATEGORIES;

const CATEGORY_INFO: Record<CategoryKey, { label: string; color: string; doneColor: string; firestorePath: string }> = {
  locationmarkers: {
    label: "Location",
    color: "#ef4444",
    doneColor: "#22c55e",
    firestorePath: "locationmarkers",
  },
  QRcodeMarkers: {
    label: "QRCode",
    color: "#8b5cf6",
    doneColor: "#22c55e",
    firestorePath: "qrcodemarkers",
  },
  specialmarkers: {
    label: "Special",
    color: "#f59e0b",
    doneColor: "#22c55e",
    firestorePath: "specialmarkers",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminSettings {
  enabled: boolean;
  activeCategories: string[];
}

interface ProgressData {
  total: number;
  completed: number;
}

interface RTDBProgressData {
  [key: string]: {
    [markerId: string]: unknown;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCategoryKey(value: string): value is CategoryKey {
  return value in MARKER_CATEGORIES;
}

function countMarkersFromRTDB(rtdbData: RTDBProgressData, categoryRtdbKey: string): number {
  const categoryData = rtdbData[categoryRtdbKey];
  if (!categoryData || typeof categoryData !== "object") return 0;
  return Object.keys(categoryData).length;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProgressBar() {
  const params = useParams();
  const eventId = (params?.eventId ?? params?.id) as string | undefined;

  const [settings, setSettings] = useState<AdminSettings>({
    enabled: false,
    activeCategories: [],
  });
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Track Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // 2. Read Settings — from events/{eventId}/settings/progressBar
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = onSnapshot(
      doc(db, "events", eventId, "settings", "progressBar"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const validCategories = (data.activeCategories ?? []).filter(isCategoryKey);
          setSettings({
            enabled: data.enabled ?? false,
            activeCategories: validCategories,
          });
        }
      },
      (error) => console.error("[ProgressBar] Settings error:", error)
    );

    return () => unsubscribe();
  }, [eventId]);

  // 3. Sync User Progress (RTDB)
  useEffect(() => {
    if (!userId || !eventId) return;

    const progressRef = ref(rtdb, `eventsProgress/${eventId}/${userId}`);

    const handler = (snapshot: DataSnapshot) => {
      const rtdbData = snapshot.val() as RTDBProgressData | null;

      setTimeout(() => {
        setProgress((prev) => {
          const next = { ...prev };
          Object.keys(MARKER_CATEGORIES).forEach((key) => {
            const adminKey = key as CategoryKey;
            const rtdbKey = MARKER_CATEGORIES[adminKey];

            next[adminKey] = {
              total: prev[adminKey]?.total ?? 0,
              completed: rtdbData ? countMarkersFromRTDB(rtdbData, rtdbKey) : 0,
            };
          });
          return next;
        });
        setAnimate(true);
      }, 0);
    };

    onValue(progressRef, handler);
    return () => off(progressRef, "value", handler);
  }, [userId, eventId]);

  // 4. Sync Collection Totals (Firestore)
  useEffect(() => {
    if (!settings.enabled || !eventId || settings.activeCategories.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let loadedCount = 0;
    const totalToLoad = settings.activeCategories.length;
    const unsubscribers: Array<() => void> = [];

    settings.activeCategories.forEach((adminKey) => {
      if (!isCategoryKey(adminKey)) return;

      const info = CATEGORY_INFO[adminKey];
      const unsub = onSnapshot(
        collection(db, "events", eventId, info.firestorePath),
        (snapshot) => {
          setProgress((prev) => ({
            ...prev,
            [adminKey]: {
              completed: prev[adminKey]?.completed ?? 0,
              total: snapshot.docs.length,
            },
          }));

          loadedCount += 1;
          if (loadedCount >= totalToLoad) setIsLoading(false);
        },
        (error) => {
          console.error(`[ProgressBar] Error for ${adminKey}:`, error);
          loadedCount += 1;
          if (loadedCount >= totalToLoad) setIsLoading(false);
        }
      );

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [settings.activeCategories, settings.enabled, eventId]);

  // ── Derived Calcs ─────────────────────────────────────────────────────────

  const activeProgress = settings.activeCategories.map(
    (key) => progress[key] || { total: 0, completed: 0 }
  );
  const totalMarkers = activeProgress.reduce((acc, curr) => acc + curr.total, 0);
  const totalCompleted = activeProgress.reduce((acc, curr) => acc + curr.completed, 0);
  const overallPct = totalMarkers === 0 ? 0 : Math.round((totalCompleted / totalMarkers) * 100);
  const allDone = totalMarkers > 0 && totalCompleted >= totalMarkers;

  // ── NEW: Real-time DB Sync Logic ──────────────────────────────────────────
  
  useEffect(() => {
    // Only update if we have a valid user and event, and initial loading is done
    if (!userId || !eventId || isLoading) return;

    const updateDBProgress = async () => {
      try {
        const userInfoRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/userInfo`);
        // update() is used to modify only the 'progress' field without deleting other data
        await update(userInfoRef, {
          progress: `${overallPct}%`
        });
      } catch (err) {
        console.error("Failed to sync progress to RTDB:", err);
      }
    };

    updateDBProgress();
  }, [overallPct, userId, eventId, isLoading]);

  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setAnimate(false), 800);
    return () => clearTimeout(t);
  }, [animate]);

  if (!settings.enabled) return null;

  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const dash = (overallPct / 100) * CIRC;

  return (
    <div className={styles.root}>
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
          {isLoading ? "…" : allDone ? "✓" : <>{overallPct}%</>}
        </span>
      </button>

      {expanded && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Explorer Progress</p>
          {settings.activeCategories.map((key) => (
            <CategoryRow
              key={key}
              categoryKey={key}
              data={progress[key] || { total: 0, completed: 0 }}
              isLoading={isLoading}
            />
          ))}
          <TotalRow
            totalCompleted={totalCompleted}
            totalMarkers={totalMarkers}
            allDone={allDone}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryRow({ categoryKey, data, isLoading }: { categoryKey: string; data: ProgressData; isLoading: boolean }) {
  if (!isCategoryKey(categoryKey)) return null;

  const pct = data.total === 0 ? 0 : Math.round((data.completed / data.total) * 100);
  const done = data.total > 0 && data.completed >= data.total;
  const { label, color, doneColor } = CATEGORY_INFO[categoryKey];

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.track}>
        {!isLoading && (
          <div
            className={styles.trackFill}
            style={{ width: `${pct}%`, background: done ? doneColor : color }}
          />
        )}
      </div>
      <span className={styles.rowCount}>
        {isLoading ? "…" : `${data.completed}/${data.total}`}
      </span>
    </div>
  );
}

function TotalRow({ totalCompleted, totalMarkers, allDone, isLoading }: any) {
  return (
    <div className={styles.totalRow} style={{ borderTop: "1px solid #e2e8f0", marginTop: "12px", paddingTop: "12px" }}>
      <span className={styles.rowLabel} style={{ fontWeight: "bold" }}>Total</span>
      <span className={styles.rowCount} style={{ fontWeight: "bold", color: allDone ? "#22c55e" : "#0f172a" }}>
        {isLoading ? "…" : `${totalCompleted} / ${totalMarkers}`}
      </span>
    </div>
  );
}