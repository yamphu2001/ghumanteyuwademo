"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function UniversalLobby() {
  const router = useRouter();
  // Ensure we get the param safely
  const params = useParams();
  const eventId = params?.eventId as string; 
  
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Guard: If no eventId, stop
    if (!eventId) return;

    const initLobby = async () => {
      try {
        // Fetch Event Details
        const eventDoc = await getDoc(doc(db, "events", eventId));
        
        if (!eventDoc.exists()) {
          router.push('/eventsmaker'); 
          return;
        }
        
        setEventData(eventDoc.data());

        // Check for active sessions
        const q = query(
          collection(db, "event_sessions"),
          where("eventId", "==", eventId),
          where("status", "==", "started"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          router.replace(`/eventsmaker/${eventId}/play`);
        }
      } catch (err) {
        console.error("Lobby Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initLobby();
  }, [eventId, router]);

  if (loading || !eventData) {
    return <div className="p-10 font-mono">LOADING_LOBBY...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col max-w-md mx-auto">
      <header className="p-4 border-b-[4px] border-red-600 flex justify-between items-center">
        <h1 className="text-xl font-black uppercase italic">{eventData.name || "Event"} Lobby</h1>
      </header>
      
      <main className="flex-1 p-6">
         <h2 className="text-3xl font-black uppercase">Entry Requirements</h2>
         <p className="mt-4 font-bold">{eventData.description}</p>
      </main>
    </div>
  );
}