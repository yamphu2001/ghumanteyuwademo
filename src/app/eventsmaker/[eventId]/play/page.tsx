"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { flushQueue } from "@/features/forevent/play/useOfflineQueue";
import MapContainer from "@/features/forevent/play/MapContainer/MapContainer";

const startAtKey = (eventId: string, uid: string) =>
  `startat_recorded_${eventId}_${uid}`;

function PlayPageInner({
  eventId,
  user,
}: {
  eventId: string;
  user: User;
}) {
  const hasLoggedLanding = useRef(false);

  useEffect(() => {
    if (hasLoggedLanding.current) return;
    hasLoggedLanding.current = true;

    const key = startAtKey(eventId, user.uid);
    const alreadyRecorded = localStorage.getItem(key);
    if (alreadyRecorded) {
      console.log("[PlayPage] startat already recorded, skipping.");
      return;
    }

    const humanReadableTime = new Date().toLocaleString();

    const writeStartAt = async () => {
      try {
        console.log("[PlayPage] Triggering persistStartAt...");
        const { persistStartAt } = await import("./_persistStartAt");

        await persistStartAt(eventId, user.uid, humanReadableTime);
        localStorage.setItem(key, humanReadableTime);
        console.log("[PlayPage] Process complete.");
      } catch (err) {
        console.error("[PlayPage] Failed:", err);
      }
    };

    writeStartAt();
  }, [eventId, user.uid]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-white text-black">
      <MapContainer eventId={eventId} userId={user.uid} />
    </main>
  );
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();

  // Safely grab the eventId string when Next.js populates it
  const eventId =
    typeof params?.eventId === "string" ? params.eventId : undefined;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (authChecked && !user) {
      router.replace("/eventsmaker");
    }
  }, [authChecked, user, router]);

  // 🌟 FIX: If params are still hydrating (!eventId), keep showing the clean spinner
  if (loading || !user || !eventId) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
          <p className="text-black text-xs font-bold tracking-[0.2em] uppercase">
            Entering Map Arena...
          </p>
        </div>
      </div>
    );
  }

  // Once both User and EventId are fully locked and loaded, mount the play area!
  return <PlayPageInner eventId={eventId} user={user} />;
}