"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase"; 
import MapContainer from "@/features/forevent/frontend/play/MapContainer/MapContainer";
import OneHandedMenu from "@/features/forevent/frontend/play/OneHandedMenu/OneHandedMenu";

export default function PlayPage() {
  const { eventId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Listen for Auth State
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // 2. Redirect to landing/login if not signed in
        router.push("/"); 
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 3. Loading State (Prevents map flicker)
  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00f2ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#00f2ff] text-xs font-bold tracking-[0.2em] uppercase">
            Verifying Identity...
          </p>
        </div>
      </div>
    );
  }

  // 4. Final Guard (Ensure we have a user and an eventId)
  if (!user || !eventId) return null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Game Components */}
      <MapContainer eventId={eventId as string} />
      <OneHandedMenu eventId={eventId as string}/>
    </main>
  );
}