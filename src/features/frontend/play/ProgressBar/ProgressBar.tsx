"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, rtdb } from "@/lib/firebase";
import styles from "./ProgressBar.module.css";
import { useParams } from "next/navigation";

const MARKER_CATEGORIES = {
  locationmarkers: "locationMarkers",
  MuseumMarkers: "museumMarkers",
  specialmarkers: "specialMarkers",
} as const;

type CategoryKey = keyof typeof MARKER_CATEGORIES;
type RTDBCategoryKey = (typeof MARKER_CATEGORIES)[CategoryKey];

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

const CATEGORY_INFO: Record<
  CategoryKey,
  {
    label: string;
    color: string;
    doneColor: string;
    firestorePath: string;
  }
> = {
  locationmarkers: {
    label: "Location",
    color: "#ef4444",
    doneColor: "#22c55e",
    firestorePath: "locationmarkers",
  },
  MuseumMarkers: {
    label: "Museum",
    color: "#ef4444",
    doneColor: "#22c55e",
    firestorePath: "MuseumMarkers",
  },
  specialmarkers: {
    label: "Special",
    color: "#ef4444",
    doneColor: "#22c55e",
    firestorePath: "specialmarkers",
  },
};

function isCategoryKey(value: string): value is CategoryKey {
  return value in MARKER_CATEGORIES;
}

function countMarkersFromRTDB(
  rtdbData: RTDBProgressData,
  categoryRtdbKey: RTDBCategoryKey
): number {
  const categoryData = rtdbData[categoryRtdbKey];
  if (!categoryData || typeof categoryData !== "object") {
    return 0;
  }
  return Object.keys(categoryData).length;
}

export default function ProgressBar() {
  const params = useParams();
  const eventId = (params?.eventId || params?.id) as string | undefined;

  const [settings, setSettings] = useState<AdminSettings>({
    enabled: false,
    activeCategories: [],
  });
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [expanded, setExpanded] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Track Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // 2. Read Event Settings
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
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

  // 3. Sync User Progress (Completed Count)
  useEffect(() => {
    if (!userId || !eventId) return;

    const progressRef = ref(rtdb, `eventsProgress/${eventId}/${userId}`);

    const handler = (snapshot: any) => {
      const rtdbData = snapshot.val() as RTDBProgressData | null;
      
      setProgress((prev) => {
        const next = { ...prev };
        Object.keys(MARKER_CATEGORIES).forEach((key) => {
          const adminKey = key as CategoryKey;
          const rtdbKey = MARKER_CATEGORIES[adminKey];
          
          next[adminKey] = {
            // CRITICAL: Keep existing total if it exists
            total: prev[adminKey]?.total ?? 0,
            completed: rtdbData ? countMarkersFromRTDB(rtdbData, rtdbKey) : 0,
          };
        });
        return next;
      });

      setAnimate(true);
      setTimeout(() => setAnimate(false), 800);
    };

    onValue(progressRef, handler);
    return () => off(progressRef, "value", handler);
  }, [userId, eventId]);

  // 4. Sync Collection Totals (Total Count)
  useEffect(() => {
    if (!settings.enabled || !eventId || settings.activeCategories.length === 0) return;

    const unsubscribers: Array<() => void> = [];

    settings.activeCategories.forEach((adminKey) => {
      if (!isCategoryKey(adminKey)) return;

      const collectionName = CATEGORY_INFO[adminKey].firestorePath;
      const unsub = onSnapshot(
        collection(db, "events", eventId, collectionName),
        (snapshot) => {
          setProgress((prev) => ({
            ...prev,
            [adminKey]: {
              // CRITICAL: Keep existing completed count if it exists
              completed: prev[adminKey]?.completed ?? 0,
              total: snapshot.docs.length,
            },
          }));
        },
        (error) => console.error(`[ProgressBar] Collection error for ${collectionName}:`, error)
      );

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [settings.activeCategories, settings.enabled, eventId]);

  if (!settings.enabled) return null;

  // Derived Calculations
  const activeProgress = settings.activeCategories.map(key => progress[key] || { total: 0, completed: 0 });
  const totalMarkers = activeProgress.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalCompleted = activeProgress.reduce((acc, curr) => acc + curr.completed, 0);
  
  const overallPct = totalMarkers === 0 ? 0 : Math.round((totalCompleted / totalMarkers) * 100);
  const allDone = totalMarkers > 0 && totalCompleted >= totalMarkers;

  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const dash = (overallPct / 100) * CIRC;

  return (
    <div className={styles.root}>
      <button
        className={`${styles.circleBtn} ${allDone ? styles.circleDone : ""}`}
        onClick={() => setExpanded((v) => !v)}
        aria-label="Toggle progress details"
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
          {allDone ? "✓" : <>{overallPct}%</>}
        </span>
      </button>

      {expanded && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Explorer Progress</p>
          {settings.activeCategories.map((key) => (
            <CategoryRow key={key} categoryKey={key} data={progress[key] || { total: 0, completed: 0 }} />
          ))}
          <TotalRow totalCompleted={totalCompleted} totalMarkers={totalMarkers} allDone={allDone} />
        </div>
      )}
    </div>
  );
}

function CategoryRow({ categoryKey, data }: { categoryKey: string; data: ProgressData }) {
  if (!isCategoryKey(categoryKey)) return null;

  const pct = data.total === 0 ? 0 : Math.round((data.completed / data.total) * 100);
  const done = data.total > 0 && data.completed >= data.total;
  const { label, color, doneColor } = CATEGORY_INFO[categoryKey];

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.track}>
        <div 
          className={styles.trackFill} 
          style={{ width: `${pct}%`, background: done ? doneColor : color }} 
        />
      </div>
      <span className={styles.rowCount}>{data.completed}/{data.total}</span>
    </div>
  );
}

function TotalRow({ totalCompleted, totalMarkers, allDone }: { totalCompleted: number; totalMarkers: number; allDone: boolean }) {
  return (
    <div className={styles.totalRow} style={{ borderTop: "1px solid #e2e8f0", marginTop: "12px", paddingTop: "12px" }}>
      <span className={styles.rowLabel} style={{ fontWeight: "bold" }}>Total</span>
      <span className={styles.rowCount} style={{ fontWeight: "bold", color: allDone ? "#22c55e" : "#0f172a" }}>
        {totalCompleted} / {totalMarkers}
      </span>
    </div>
  );
}