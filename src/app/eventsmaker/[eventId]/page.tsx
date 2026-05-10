
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, rtdb, auth } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { ref, update } from 'firebase/database';
import QRScanner from '@/features/frontend/play/qrscanner/qrscanner';

export default function UniversalLobby() {
  const router = useRouter();
  const { eventId } = useParams(); 
  const [eventData, setEventData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const REDIRECT_PATH = `/eventsmaker/${eventId}/play`;

  useEffect(() => {
    const initLobby = async () => {
      try {
        if (!eventId) return;

        // 1. Fetch Event Details
        const eventDoc = await getDoc(doc(db, "events", eventId as string));
        if (!eventDoc.exists()) {
          router.push('/eventsmaker'); 
          return;
        }
        setEventData(eventDoc.data());

        // 2. Check if a session already exists
        const q = query(
          collection(db, "event_sessions"),
          where("eventId", "==", eventId),
          where("status", "==", "started"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          router.replace(REDIRECT_PATH);
        } else {
          setMounted(true);
        }
      } catch (err) {
        console.error("Lobby Init Error:", err);
        setMounted(true);
      }
    };
    initLobby();
  }, [eventId, router, REDIRECT_PATH]);


const handleScan = async (data: string | null) => {
  const user = auth.currentUser;

  if (!data || !eventData || !user) {
    if (!user) alert("Please login first");
    return;
  }

  const validUrlPart = eventData.validUrl || `ghumanteyuwa.com/eventsmaker/${eventId}/play`;

  if (data.includes(validUrlPart)) {
    try {
      // 1. Fetch Username from Firestore 'users' collection
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const fetchedUsername = userDocSnap.exists() 
        ? userDocSnap.data().username 
        : "Guest Player";

      // 2. Format the date to be Human Readable
      // Result Example: "4/24/2026, 3:15:22 PM"
      const humanReadableTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // 3. Firestore: Save session log
      await addDoc(collection(db, "event_sessions"), {
        eventId: eventId,
        userId: user.uid,
        startTime: serverTimestamp(),
        status: "started",
      });

      // 4. Realtime DB: Save to new 'scannedTimes' node
      // Path: eventsProgress/{eventId}/{useruid}/scannedTimes
      const scanRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/scannedTimes`);
      
      await update(scanRef, {
        scannedAt: humanReadableTime, // Saved as "Apr 24, 2026, 03:15 PM"
        username: fetchedUsername    // From Firestore users table
      });

      router.push(REDIRECT_PATH);
    } catch (e) { 
      console.error("Sync Error:", e);
      alert("Error saving scan data."); 
    }
  }
};

  if (!mounted || !eventData) {
    return <div className="p-10 font-mono">LOADING_LOBBY...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col max-w-md mx-auto">
      <header className="p-4 border-b-[4px] border-black flex justify-between items-center">
        <h1 className="text-xl font-black uppercase italic">{eventData.name || "Event"} Lobby</h1>
        <div className="px-2 py-1 text-[10px] font-black bg-yellow-300 border-2 border-black">QR_REQUIRED</div>
      </header>
      
      <main className="flex-1 p-6">
         <h2 className="text-3xl font-black uppercase">Entry Requirements</h2>
         <p className="mt-4 font-bold">{eventData.description}</p>
         <button 
           onClick={() => setShowScanner(true)} 
           className="w-full mt-10 py-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-black text-2xl active:shadow-none active:translate-x-1 active:translate-y-1"
         >
           SCAN TO START
         </button>
      </main>
      
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black">
          <QRScanner onScan={handleScan} />
          <button 
            onClick={() => setShowScanner(false)} 
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white p-4 border-4 border-black font-black uppercase"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}