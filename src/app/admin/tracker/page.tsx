
// "use client";

// import { useEffect, useState, useRef } from "react";
// import { db, auth } from "@/lib/firebase"; 
// import { getDatabase, ref, set, onValue, onDisconnect } from "firebase/database"; 
// import { doc, getDoc } from "firebase/firestore";

// // IMPORTANT: Ensure you ran 'npm install maplibre-gl'
// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";

// export default function TrackerPage() {
//   const [status, setStatus] = useState("Initializing...");
//   const [players, setPlayers] = useState<any[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
  
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<maplibregl.Map | null>(null);
//   const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
//   const lastSavedPos = useRef<{ lat: number; lng: number } | null>(null);

//   useEffect(() => {
//     // 1. Initialize Map
//     if (!map.current && mapContainer.current) {
//       try {
//         map.current = new maplibregl.Map({
//           container: mapContainer.current,
//           // Reliable basic style
//           style: 'https://tiles.openfreemap.org/styles/bright', 
//           center: [85.3240, 27.7172], // Kathmandu
//           zoom: 12,
//         });

//         map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
        
//         map.current.on('load', () => {
//           console.log("MapLibre: Map loaded successfully");
//         });

//         map.current.on('error', (e) => {
//           console.error("MapLibre Error:", e);
//           setStatus("Map failed to load style.");
//         });
//       } catch (err) {
//         console.error("Initialization Error:", err);
//       }
//     }

//     const rtdb = getDatabase();
//     const playersRef = ref(rtdb, "players");

//     // 2. Multi-player Sync
//     const unsubRtdb = onValue(playersRef, (snapshot) => {
//       const data = snapshot.val() || {};
//       const playersList = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
//       setPlayers(playersList);

//       playersList.forEach((player) => {
//         if (markers.current[player.id]) {
//           markers.current[player.id].setLngLat([player.lng, player.lat]);
//         } else if (map.current) {
//           const el = document.createElement('div');
//           el.innerHTML = `
//             <div style="display: flex; flex-direction: column; align-items: center;">
//               <div style="background: black; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-bottom: 2px; white-space: nowrap; border: 1px solid white;">
//                 ${player.username}
//               </div>
//               <div style="width: 12px; height: 12px; background: #ff0000; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>
//             </div>
//           `;

//           markers.current[player.id] = new maplibregl.Marker({ element: el })
//             .setLngLat([player.lng, player.lat])
//             .addTo(map.current);
//         }
//       });

//       // Cleanup old markers
//       Object.keys(markers.current).forEach((id) => {
//         if (!data[id]) {
//           markers.current[id].remove();
//           delete markers.current[id];
//         }
//       });
//     });

//     // 3. User Geolocation
//     const startTracking = async (uid: string) => {
//       const userSnap = await getDoc(doc(db, "participants", uid));
//       const username = userSnap.exists() ? userSnap.data().username : "Player";
//       setStatus(`Active: ${username}`);

//       if ("geolocation" in navigator) {
//         const watchId = navigator.geolocation.watchPosition((pos) => {
//           const { latitude, longitude } = pos.coords;
          
//           if (!lastSavedPos.current || Math.abs(lastSavedPos.current.lat - latitude) > 0.0001) {
//             lastSavedPos.current = { lat: latitude, lng: longitude };
//             set(ref(rtdb, `players/${uid}`), {
//               username, lat: latitude, lng: longitude, lastUpdated: Date.now()
//             });
//             onDisconnect(ref(rtdb, `players/${uid}`)).remove();
//           }
//         }, () => setStatus("Enable Location"), { enableHighAccuracy: true });
        
//         return () => navigator.geolocation.clearWatch(watchId);
//       }
//     };

//     const unsubAuth = auth.onAuthStateChanged((user) => {
//       if (user) startTracking(user.uid);
//       else setStatus("Login required");
//     });

//     return () => {
//       unsubRtdb();
//       unsubAuth();
//       if (map.current) map.current.remove();
//     };
//   }, []);

//   return (
//     <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      
//       {/* SIDEBAR */}
//       <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 z-30 shadow-2xl">
//         <div className="p-6 border-b border-gray-800">
//           <h1 className="text-xl font-bold mb-4">Player Radar</h1>
//           <input 
//             type="text"
//             placeholder="Search players..."
//             className="w-full bg-gray-800 p-2 rounded-lg text-sm border border-gray-700 focus:ring-1 focus:ring-blue-500 outline-none"
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {players.filter(p => p.username.toLowerCase().includes(searchTerm.toLowerCase())).map(player => (
//             <button 
//               key={player.id}
//               onClick={() => map.current?.flyTo({ center: [player.lng, player.lat], zoom: 15 })}
//               className="w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 flex flex-col transition-all"
//             >
//               <span className="font-bold text-sm">{player.username}</span>
//               <span className="text-[10px] text-gray-500 font-mono italic">
//                 {player.lat.toFixed(4)}, {player.lng.toFixed(4)}
//               </span>
//             </button>
//           ))}
//         </div>

//         <div className="p-4 bg-black text-[10px] text-blue-400 font-mono border-t border-gray-800 uppercase tracking-widest">
//           {status}
//         </div>
//       </div>

//       {/* MAP AREA */}
//       <div className="flex-1 relative h-full bg-gray-800">
//         <div 
//           ref={mapContainer} 
//           className="absolute inset-0 w-full h-full"
//           style={{ minHeight: '100vh' }} // Forces visibility
//         />
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase"; 
import { getDatabase, ref, set, onValue, onDisconnect } from "firebase/database"; 
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function TrackerPage() {
  const [status, setStatus] = useState("Initializing...");
  const [players, setPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalMarkerCount, setTotalMarkerCount] = useState(0);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
  const lastSavedPos = useRef<{ lat: number; lng: number } | null>(null);

  // 1. INITIALIZE MAP (Run only once)
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // Using a standard reliable OSM style
      style: 'https://tiles.openfreemap.org/styles/bright', 
      center: [85.3240, 27.7172], 
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // 2. FETCH TOTAL MARKERS
  useEffect(() => {
    const fetchTotalMarkers = async () => {
      try {
        const snap = await getDocs(collection(db, "events/ghumante/qrMarkers"));
        setTotalMarkerCount(snap.size);
      } catch (e) {
        console.error("Error fetching markers:", e);
      }
    };
    fetchTotalMarkers();
  }, []);

  // 3. PLAYER SYNC & MARKER LOGIC
  useEffect(() => {
    const rtdb = getDatabase();
    const playersRef = ref(rtdb, "players");

    const unsubRtdb = onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const playersList = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
      setPlayers(playersList);

      playersList.forEach(async (player) => {
        if (!map.current) return;

        // Fetch progress from Firestore
        const userDoc = await getDoc(doc(db, "participants", player.id));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const progress = userData.userProgress || [];
        const lastMarker = progress.length > 0 ? progress[progress.length - 1].markerName : "None";

        if (markers.current[player.id]) {
          markers.current[player.id].setLngLat([player.lng, player.lat]);
          // Update popup content dynamically if marker exists
          const p = markers.current[player.id].getPopup();
          if (p) p.setHTML(getPopupHTML(player.username, progress.length, lastMarker));
        } else {
          const el = document.createElement('div');
          el.className = "player-marker";
          el.innerHTML = `<div style="width: 16px; height: 16px; background: #ff0000; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.6); cursor: pointer;"></div>`;

          const popup = new maplibregl.Popup({ offset: 25 })
            .setHTML(getPopupHTML(player.username, progress.length, lastMarker));

          markers.current[player.id] = new maplibregl.Marker({ element: el })
            .setLngLat([player.lng, player.lat])
            .setPopup(popup)
            .addTo(map.current);
        }
      });

      // Cleanup old markers
      Object.keys(markers.current).forEach((id) => {
        if (!data[id]) {
          markers.current[id].remove();
          delete markers.current[id];
        }
      });
    });

    return () => unsubRtdb();
  }, [totalMarkerCount]); // Dependencies reduced to prevent map flicker

  // Helper for Popup HTML
  const getPopupHTML = (name: string, count: number, last: string) => `
    <div style="color: #333; padding: 4px; min-width: 120px;">
      <b style="font-size: 14px; color: black;">${name}</b>
      <div style="margin-top: 6px; font-size: 11px; line-height: 1.4;">
        <div style="display:flex; justify-content: space-between;">
           <span>Progress:</span>
           <span style="font-weight:bold; color: #2563eb;">${count} / ${totalMarkerCount}</span>
        </div>
        <div style="margin-top: 4px; border-top: 1px solid #eee; pt-2">
         
        </div>
      </div>
    </div>
  `;

  // 4. SELF TRACKING
  useEffect(() => {
    const startTracking = async (uid: string) => {
      const userSnap = await getDoc(doc(db, "participants", uid));
      const username = userSnap.exists() ? userSnap.data().username : "Player";
      setStatus(`Radar Active: ${username}`);

      if ("geolocation" in navigator) {
        const watchId = navigator.geolocation.watchPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          const rtdb = getDatabase();
          
          if (!lastSavedPos.current || Math.abs(lastSavedPos.current.lat - latitude) > 0.0001) {
            lastSavedPos.current = { lat: latitude, lng: longitude };
            set(ref(rtdb, `players/${uid}`), {
              username, lat: latitude, lng: longitude, lastUpdated: Date.now()
            });
            onDisconnect(ref(rtdb, `players/${uid}`)).remove();
          }
        }, (err) => setStatus("Location Denied"), { enableHighAccuracy: true });
        
        return () => navigator.geolocation.clearWatch(watchId);
      }
    };

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) startTracking(user.uid);
      else setStatus("Login required");
    });

    return () => unsubAuth();
  }, []);

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 z-30 shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold mb-4 tracking-tight">Player Radar</h1>
          <input 
            type="text"
            placeholder="Search players..."
            className="w-full bg-gray-800 p-2 rounded-lg text-sm border border-gray-700 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {players.filter(p => p.username?.toLowerCase().includes(searchTerm.toLowerCase())).map(player => (
            <button 
              key={player.id}
              onClick={() => map.current?.flyTo({ center: [player.lng, player.lat], zoom: 16, duration: 2000 })}
              className="w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 flex flex-col transition-colors group"
            >
              <span className="font-bold text-sm group-hover:text-blue-400 transition-colors">{player.username}</span>
              <span className="text-[10px] text-gray-500 font-mono mt-1">
                {player.lat.toFixed(4)}, {player.lng.toFixed(4)}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 bg-black text-[10px] text-blue-400 font-mono border-t border-gray-800 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          {status}
        </div>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative h-full">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}