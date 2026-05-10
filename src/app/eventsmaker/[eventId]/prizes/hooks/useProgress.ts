'use client';
import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { rtdb } from "@/lib/firebase";

export function useProgress(eventId: string | undefined) {
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => setUserId(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId || !eventId) return;
    const progressRef = ref(rtdb, `eventsProgress/${eventId}/${userId}`);

    const handler = (snapshot: any) => {
      const data = snapshot.val() || {};
      let count = 0;
      // Categories matching your ProgressBar constants
      const categories = ['locationMarkers', 'specialMarkers', 'qrcodemarkers'];
      categories.forEach(cat => {
        if (data[cat]) count += Object.keys(data[cat]).length;
      });
      setTotalCompleted(count);
    };

    onValue(progressRef, handler);
    return () => off(progressRef, "value", handler);
  }, [userId, eventId]);

  return { completedCount: totalCompleted, userId };
}

