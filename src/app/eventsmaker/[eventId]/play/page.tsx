"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { flushQueue } from "@/features/forevent/play/useOfflineQueue";
import MapContainer from "@/features/forevent/play/MapContainer/MapContainer";

// localStorage key that marks the start time as already recorded for this player+event.
// Using localStorage as the guard means it works 100% offline — no Firestore read needed.
const startAtKey = (eventId: string, uid: string) => `startat_recorded_${eventId}_${uid}`;

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = typeof params?.eventId === 'string' ? params.eventId : undefined;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Guard against React StrictMode double-invoke
  const hasLoggedLanding = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        if (eventId && !hasLoggedLanding.current) {
          hasLoggedLanding.current = true;

          const key = startAtKey(eventId, currentUser.uid);
          const alreadyRecorded = localStorage.getItem(key);

          if (!alreadyRecorded) {
            const humanReadableTime = new Date().toLocaleString();

            // Mark locally first — this is instant and works offline.
            // Even if the app is killed before the Firestore write completes,
            // the timestamp is preserved here and won't be overwritten on reload.
            localStorage.setItem(key, humanReadableTime);

            try {
              if (navigator.onLine) {
                // Online: write directly to Firestore
                const { doc, setDoc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                const logDocRef = doc(db, "events", eventId, "player_log", currentUser.uid);
                await setDoc(logDocRef, { startat: humanReadableTime }, { merge: true });
                console.log("[PlayPage] Landing recorded online:", humanReadableTime);
              } else {
                // Offline: push into the offline queue — will flush when reconnected
                const { persistStartAt } = await import("./_persistStartAt");
                await persistStartAt(eventId, currentUser.uid, humanReadableTime);
                console.log("[PlayPage] Landing queued for offline sync:", humanReadableTime);
              }
            } catch (err) {
              // Write failed — the localStorage key is already set so the time is safe.
              // The offline queue will retry on next reconnect.
              console.warn("[PlayPage] startat write failed, will retry on reconnect:", err);
              try {
                const { persistStartAt } = await import("./_persistStartAt");
                await persistStartAt(eventId, currentUser.uid, humanReadableTime);
              } catch (_) { /* queue also failed — non-fatal, localStorage still has it */ }
            }
          } else {
            console.log("[PlayPage] startat already recorded, skipping.");
          }

          // Flush any previously queued operations now that we have auth
          if (navigator.onLine) {
            flushQueue().catch(() => {});
          }
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
          <p className="text-black text-xs font-bold tracking-[0.2em] uppercase">
            Verifying Identity...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !eventId) {
    router.replace("/eventsmaker");
    return null;
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-white text-black">
      <MapContainer eventId={eventId} userId={user.uid} />
    </main>
  );
}