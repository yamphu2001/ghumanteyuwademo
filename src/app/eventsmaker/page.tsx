"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface ClientEvent {
  id: string;
  locationName: string;
  imageUrl: string;
  coords: { lat: number; lng: number };
  radius: number;
  launchPath: string;
  description: string;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function EventPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Live Geolocation Watch (updates in real-time)
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("GPS Signal Error:", err),
        { enableHighAccuracy: true }
      );
    }

    // 2. Fetch Events from DB
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), where("status", "==", "active"));
        const snap = await getDocs(q);
        // Inside fetchEvents logic in eventsmarker/page.tsx:
const list = snap.docs.map(doc => {
  const d = doc.data();
  return {
    id: doc.id,
    locationName: d.name || "Untitled",
    imageUrl: d.image || "",
    coords: { lat: d.lat ?? 0, lng: d.lng ?? 0 },
    radius: d.radius ?? 1000,
    // This generates: /eventsmarker/basantapur
    launchPath: `/eventsmaker/${doc.id}`, 
    description: d.description || ""
  } as ClientEvent;
});
        setEvents(list);
      } catch (e) {
        console.error("Firestore Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    return () => { if(watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const isNear = (target: {lat: number, lng: number}, radius: number) => {
    if (!userPos) return false;
    const dist = getDistance(userPos.lat, userPos.lng, target.lat, target.lng);
    return dist <= radius;
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black animate-pulse text-2xl">LOCATING_EVENTS...</div>;

  return (
    <div className="relative min-h-screen bg-white text-black font-mono p-6 md:p-10 select-none overflow-x-hidden">
      <header className="pt-10 mb-10 border-b-[6px] border-black pb-6 bg-white/90 sticky top-0 z-20">
        <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Events</h1>
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-3 h-3 rounded-full ${userPos ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <p className="text-[10px] font-black uppercase tracking-widest">
            {userPos ? `GPS ACTIVE: ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : "ACQUIRING GPS SIGNAL..."}
          </p>
        </div>
      </header>

      <main className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const near = isNear(event.coords, event.radius);
          return (
            <div 
              key={event.id} 
              onClick={() => setSelectedEvent(event)}
              className="group relative aspect-[4/5] border-[6px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all cursor-pointer overflow-hidden bg-white"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" 
                style={{ backgroundImage: `url(${event.imageUrl})` }} 
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-0 p-5 w-full text-white bg-gradient-to-t from-black/90 to-transparent">
                <h2 className="text-3xl font-black uppercase mb-2 leading-none">{event.locationName}</h2>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-[10px] font-black border ${near ? 'bg-green-500 text-black border-green-500' : 'bg-black text-white border-white'}`}>
                    {near ? "READY TO ENTER" : "AREA LOCKED"}
                  </span>
                  <span className="px-2 py-1 text-[10px] font-black border border-white bg-white/20">
                    {event.radius}M RADIUS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-white border-t-[8px] md:border-[10px] border-black w-full md:max-w-xl p-8 animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-start mb-6">
                <h2 className="text-4xl font-black uppercase leading-tight">{selectedEvent.locationName}</h2>
                <button onClick={() => setSelectedEvent(null)} className="text-3xl font-black hover:rotate-90 transition-transform">✕</button>
             </div>
             
             <p className="font-bold border-l-8 border-black pl-4 mb-10 text-sm italic leading-relaxed">
                {selectedEvent.description}
             </p>

             <button
                onClick={() => isNear(selectedEvent.coords, selectedEvent.radius) && router.push(selectedEvent.launchPath)}
                disabled={!isNear(selectedEvent.coords, selectedEvent.radius)}
                className={`w-full py-5 text-2xl font-black uppercase border-4 border-black transition-all 
                  ${isNear(selectedEvent.coords, selectedEvent.radius) 
                    ? 'bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-green-500 hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1' 
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
             >
                {isNear(selectedEvent.coords, selectedEvent.radius) ? "Enter Event →" : "Target Area Locked"}
             </button>
             
             {!isNear(selectedEvent.coords, selectedEvent.radius) && (
               <p className="text-[10px] text-center mt-4 font-black uppercase text-red-500 tracking-tighter">
                 📍 You must be within {selectedEvent.radius} meters of the site coordinates.
               </p>
             )}
          </div>
        </div>
      )}
    </div>
  );
}