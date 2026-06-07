"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import OfflineSync from '@/features/forevent/play/OfflineSync';

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
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function EventPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true }
      );
    }

    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), where("status", "==", "active"));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            locationName: data.name || "Untitled",
            imageUrl: data.image || "",
            coords: { lat: data.lat ?? 0, lng: data.lng ?? 0 },
            radius: data.radius ?? 1000,
            launchPath: `/eventsmaker/${d.id}/play`,
            description: data.description || "",
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
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const isNear = (target: { lat: number; lng: number }, radius: number) => {
    if (!userPos) return false;
    return getDistance(userPos.lat, userPos.lng, target.lat, target.lng) <= radius;
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center font-medium text-gray-600 animate-pulse">
      Loading events...
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black px-6 py-12 md:px-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Events</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full ${userPos ? 'bg-red-500' : 'bg-gray-300'}`} />
          <span>{userPos ? 'GPS Signal Active' : 'Acquiring GPS Signal...'}</span>
        </div>
      </header>

      <main className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const near = isNear(event.coords, event.radius);
          return (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-2 transition-all duration-300 hover:shadow-lg hover:border-gray-300"
            >
              <div
                className="aspect-video w-full rounded-xl bg-gray-100 bg-cover bg-center mb-4 transition-transform duration-500 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${event.imageUrl})` }}
              />
              <div className="px-2 pb-2">
                <h2 className="text-lg font-semibold mb-1">{event.locationName}</h2>
                <div className="flex gap-2 mt-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${near ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {near ? "Ready to enter" : "Out of range"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 pr-8">{selectedEvent.locationName}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              {selectedEvent.description}
            </p>

            {/* OfflineSync component handles all download/cache logic */}
            <OfflineSync eventId={selectedEvent.id} />

            <button
  onClick={() => isNear(selectedEvent.coords, selectedEvent.radius) && router.push(selectedEvent.launchPath)}
  disabled={!isNear(selectedEvent.coords, selectedEvent.radius)}
  className={`w-full py-3.5 font-semibold uppercase tracking-wider transition-all duration-150
    ${isNear(selectedEvent.coords, selectedEvent.radius)
      ? 'bg-red-600 text-white border-2 border-[#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
      : 'bg-zinc-100 text-zinc-400 border-2 border-zinc-300 cursor-not-allowed'}`}
  style={{
    borderRadius: "0px",
    boxShadow: isNear(selectedEvent.coords, selectedEvent.radius) ? "4px 4px 0px #111827" : "none",
  }}
>
  {isNear(selectedEvent.coords, selectedEvent.radius) ? "Enter Event" : "Location Locked"}
</button>

            {!isNear(selectedEvent.coords, selectedEvent.radius) && (
              <p className="text-xs text-center mt-4 text-gray-400">
                You must be within {selectedEvent.radius}m to enter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
