// "use client";

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { db } from "@/lib/firebase";
// import { collection, getDocs, query, where } from "firebase/firestore";

// interface ClientEvent {
//   id: string;
//   locationName: string;
//   imageUrl: string;
//   coords: { lat: number; lng: number };
//   radius: number;
//   launchPath: string;
//   description: string;
// }

// function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
//   const R = 6371e3;
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
//   return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
// }

// export default function EventPage() {
//   const router = useRouter();
//   const [events, setEvents] = useState<ClientEvent[]>([]);
//   const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);
//   const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let watchId: number;
//     if ("geolocation" in navigator) {
//       watchId = navigator.geolocation.watchPosition(
//         (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//         (err) => console.error("GPS Error:", err),
//         { enableHighAccuracy: true }
//       );
//     }

//     const fetchEvents = async () => {
//       try {
//         const q = query(collection(db, "events"), where("status", "==", "active"));
//         const snap = await getDocs(q);
//         const list = snap.docs.map(doc => {
//           const d = doc.data();
//           return {
//             id: doc.id,
//             locationName: d.name || "Untitled",
//             imageUrl: d.image || "",
//             coords: { lat: d.lat ?? 0, lng: d.lng ?? 0 },
//             radius: d.radius ?? 1000,
//             launchPath: `/eventsmaker/${doc.id}/play`, 
//             description: d.description || ""
//           } as ClientEvent;
//         });
//         setEvents(list);
//       } catch (e) {
//         console.error("Firestore Error:", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEvents();
//     return () => { if(watchId) navigator.geolocation.clearWatch(watchId); };
//   }, []);

//   const isNear = (target: {lat: number, lng: number}, radius: number) => {
//     if (!userPos) return false;
//     const dist = getDistance(userPos.lat, userPos.lng, target.lat, target.lng);
//     return dist <= radius;
//   };

//   if (loading) return (
//     <div className="min-h-screen bg-white flex items-center justify-center font-medium text-gray-600 animate-pulse">
//       Loading events...
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-white text-black px-6 py-12 md:px-12">
//       <header className="mb-12">
//         <h1 className="text-4xl font-bold tracking-tight mb-2">Events</h1>
//         <div className="flex items-center gap-2 text-sm text-gray-600">
//           <div className={`w-2 h-2 rounded-full ${userPos ? 'bg-red-500' : 'bg-gray-300'}`} />
//           <span>{userPos ? `GPS Signal Active` : "Acquiring GPS Signal..."}</span>
//         </div>
//       </header>

//       <main className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//         {events.map((event) => {
//           const near = isNear(event.coords, event.radius);
//           return (
//             <div 
//               key={event.id} 
//               onClick={() => setSelectedEvent(event)}
//               className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-2 transition-all duration-300 hover:shadow-lg hover:border-gray-300"
//             >
//               <div 
//                 className="aspect-video w-full rounded-xl bg-gray-100 bg-cover bg-center mb-4 transition-transform duration-500 group-hover:scale-[1.02]" 
//                 style={{ backgroundImage: `url(${event.imageUrl})` }} 
//               />
//               <div className="px-2 pb-2">
//                 <h2 className="text-lg font-semibold mb-1">{event.locationName}</h2>
//                 <div className="flex gap-2 mt-3">
//                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${near ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
//                     {near ? "Ready to enter" : "Out of range"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </main>

//       {/* MODAL */}
//       {selectedEvent && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
//           <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
//             <button 
//               onClick={() => setSelectedEvent(null)} 
//               className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
//             >
//               ✕
//             </button>
//             <h2 className="text-2xl font-bold mb-4 pr-8">{selectedEvent.locationName}</h2>
//             <p className="text-gray-600 mb-8 leading-relaxed text-sm">
//               {selectedEvent.description}
//             </p>

//             <button
//               onClick={() => isNear(selectedEvent.coords, selectedEvent.radius) && router.push(selectedEvent.launchPath)}
//               disabled={!isNear(selectedEvent.coords, selectedEvent.radius)}
//               className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 
//                 ${isNear(selectedEvent.coords, selectedEvent.radius) 
//                   ? 'bg-red-600 text-white hover:bg-red-700' 
//                   : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
//             >
//               {isNear(selectedEvent.coords, selectedEvent.radius) ? "Enter Event" : "Location Locked"}
//             </button>
            
//             {!isNear(selectedEvent.coords, selectedEvent.radius) && (
//               <p className="text-xs text-center mt-4 text-gray-400">
//                 You must be within {selectedEvent.radius}m to enter.
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import localforage from 'localforage';

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

  // Sync state tracking variables managed inside the modal instance
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

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
        const list = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            locationName: d.name || "Untitled",
            imageUrl: d.image || "",
            coords: { lat: d.lat ?? 0, lng: d.lng ?? 0 },
            radius: d.radius ?? 1000,
            launchPath: `/eventsmaker/${doc.id}/play`, 
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

  // Whenever a different event card is opened, reset our sync button feedback state
  useEffect(() => {
    if (selectedEvent) {
      // Check if this specific event has its coordinate boundary preset locally
      localforage.getItem(`boundary_${selectedEvent.id}`).then((exists) => {
        setSyncStatus(exists ? 'done' : 'idle');
      });
    }
  }, [selectedEvent]);

  const isNear = (target: {lat: number, lng: number}, radius: number) => {
    if (!userPos) return false;
    const dist = getDistance(userPos.lat, userPos.lng, target.lat, target.lng);
    return dist <= radius;
  };

  // Automated asset caching executor handler
  const downloadAssetsForOffline = async (eventId: string) => {
    setSyncStatus('syncing');
    try {
      // 1. Fetch boundary from Firestore while online and save to IndexedDB
      const snap = await getDoc(doc(db, "events", eventId, "boundary", "data"));
      if (snap.exists()) {
        const data = snap.data();
        if (data.boundaryCoords) {
          const boundary = data.boundaryCoords.map((p: any) => [p.lng, p.lat]);
          await localforage.setItem(`boundary_${eventId}`, boundary);
        }
      }

      // 2. Open the browser's persistent Cache Storage layer for structural files
      const cache = await caches.open('offline-map-assets');
      await cache.addAll([
        '/map-style.json',
        '/Mascot.png' // Pre-fetch player icons safely
      ]);

      // 3. Define the targeted tile vector array coordinates for the arena
      const tilesToCache = [
        '/tiles/14/1234/5678.pbf',
        '/tiles/14/1234/5679.pbf',
      ];
      await cache.addAll(tilesToCache);

      setSyncStatus('done');
    } catch (err) {
      console.error('Offline map storage registration dropped:', err);
      setSyncStatus('error');
    }
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
          <span>{userPos ? `GPS Signal Active` : "Acquiring GPS Signal..."}</span>
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

      {/* MODAL WINDOW OVERLAY */}
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

            {/* INTEGRATION BLOCK: Offline Sync Utility Module placed contextually */}
            <div className="border-t border-gray-100 pt-5 mt-2 mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Offline Access</h4>
              
              {syncStatus === 'idle' && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 max-w-[200px]">Download layout bounds for zero signal zones.</p>
                  <button 
                    onClick={() => downloadAssetsForOffline(selectedEvent.id)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors"
                  >
                    Download Content
                  </button>
                </div>
              )}
              
              {syncStatus === 'syncing' && (
                <div className="flex items-center gap-2 mt-2 text-xs text-yellow-600 font-medium">
                  <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing core elements...</span>
                </div>
              )}
              
              {syncStatus === 'done' && (
                <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2">
                  <span className="text-xs text-green-700 font-medium">✓ Assets synchronized safely on device.</span>
                </div>
              )}
              
              {syncStatus === 'error' && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-red-500 font-medium">⚠️ Setup package dropped.</span>
                  <button 
                    onClick={() => downloadAssetsForOffline(selectedEvent.id)}
                    className="text-xs font-bold text-blue-600 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Launch gameplay entry execution handler links */}
            <button
              onClick={() => isNear(selectedEvent.coords, selectedEvent.radius) && router.push(selectedEvent.launchPath)}
              disabled={!isNear(selectedEvent.coords, selectedEvent.radius)}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 
                ${isNear(selectedEvent.coords, selectedEvent.radius) 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/10' 
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
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