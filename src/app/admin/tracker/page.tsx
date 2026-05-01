
// "use client";

// import { useEffect, useState, useRef } from "react";
// import { db, rtdb } from "@/lib/firebase";
// import { ref, onValue } from "firebase/database";
// import { collection, getDocs, query, where } from "firebase/firestore";

// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";

// export default function TrackerPage() {
//   const [status, setStatus] = useState("Initializing...");
//   const [players, setPlayers] = useState<any[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [totalMarkerCount, setTotalMarkerCount] = useState(0);

//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<maplibregl.Map | null>(null);
//   const markers = useRef<{ [key: string]: maplibregl.Marker }>({});

//   // 1. INITIALIZE MAP
//   useEffect(() => {
//     if (map.current || !mapContainer.current) return;

//     map.current = new maplibregl.Map({
//       container: mapContainer.current,
//       style: "https://tiles.openfreemap.org/styles/bright",
//       center: [85.324, 27.7172],
//       zoom: 12,
//     });

//     map.current.addControl(new maplibregl.NavigationControl(), "top-right");

//     return () => {
//       map.current?.remove();
//       map.current = null;
//     };
//   }, []);

//   // 2. FETCH TOTAL QR MARKERS from /events/test/qrMarkers
//   useEffect(() => {
//     const fetchTotalMarkers = async () => {
//       try {
//         const snap = await getDocs(collection(db, "events/test/qrMarkers"));
//         setTotalMarkerCount(snap.size);
//       } catch (e) {
//         console.error("[tracker] Error fetching qrMarkers:", e);
//       }
//     };
//     fetchTotalMarkers();
//   }, []);

//   // 3. PLAYER SYNC FROM playerLocations (written by coords.ts every 5s)
//   useEffect(() => {
//     const playerLocationsRef = ref(rtdb, "playerLocations");
//     setStatus("Radar Active: Viewing Players");

//     const unsubRtdb = onValue(playerLocationsRef, (snapshot) => {
//       const data = snapshot.val() || {};

//       // Each key = username; value = { username, latitude, longitude, datetime, updatedAt }
//       const playersList = Object.entries(data).map(([username, val]: any) => ({
//         id: username,
//         username,
//         lat: val.latitude,
//         lng: val.longitude,
//         datetime: val.datetime,
//         updatedAt: val.updatedAt,
//       }));

//       setPlayers(playersList);

//       playersList.forEach(async (player) => {
//         if (!map.current) return;
//         if (player.lat == null || player.lng == null) return;

//         // ── Fetch userProgress from /participants where username == player.username ──
//         let completedCount = 0;
//         try {
//           const q = query(
//             collection(db, "participants"),
//             where("username", "==", player.username)
//           );
//           const snap = await getDocs(q);
//           if (!snap.empty) {
//             const participantData = snap.docs[0].data();
//             const userProgress: any[] = participantData.userProgress || [];
//             completedCount = userProgress.length;
//           }
//         } catch (e) {
//           console.error("[tracker] Firestore progress fetch failed:", e);
//         }

//         const popupHTML = getPopupHTML(
//           player.username,
//           completedCount,
//           totalMarkerCount,
//           player.updatedAt
//         );

//         if (markers.current[player.id]) {
//           // Update position + popup
//           markers.current[player.id].setLngLat([player.lng, player.lat]);
//           markers.current[player.id].getPopup()?.setHTML(popupHTML);
//         } else {
//           // Create marker element
//           const el = document.createElement("div");
//           el.innerHTML = `
//             <div style="
//               width:16px;height:16px;
//               background:#ef4444;
//               border:2px solid white;
//               border-radius:50%;
//               box-shadow:0 0 8px rgba(0,0,0,0.6);
//               cursor:pointer;
//             "></div>`;

//           const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML);

//           markers.current[player.id] = new maplibregl.Marker({ element: el })
//             .setLngLat([player.lng, player.lat])
//             .setPopup(popup)
//             .addTo(map.current);
//         }
//       });

//       // Remove stale markers
//       Object.keys(markers.current).forEach((id) => {
//         if (!data[id]) {
//           markers.current[id].remove();
//           delete markers.current[id];
//         }
//       });
//     });

//     return () => unsubRtdb();
//   }, [totalMarkerCount]);

//   // ── Popup HTML ─────────────────────────────────────────────────────────────
//   const getPopupHTML = (
//     username: string,
//     completed: number,
//     total: number,
//     updatedAt: string
//   ) => {
//     const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
//     return `
//       <div style="
//         color:#1f2937;
//         padding:8px 10px;
//         min-width:160px;
//         font-family:sans-serif;
//       ">
//         <b style="font-size:14px;display:block;margin-bottom:8px;">${username}</b>

//         <div style="font-size:11px;margin-bottom:6px;display:flex;justify-content:space-between;">
//           <span style="color:#6b7280;">Tasks complete</span>
//           <span style="font-weight:700;color:#2563eb;">${completed} / ${total}</span>
//         </div>

//         <!-- progress bar -->
//         <div style="
//           background:#e5e7eb;
//           border-radius:99px;
//           height:6px;
//           overflow:hidden;
//           margin-bottom:8px;
//         ">
//           <div style="
//             width:${pct}%;
//             height:100%;
//             background:#2563eb;
//             border-radius:99px;
//             transition:width 0.3s;
//           "></div>
//         </div>

//         <div style="font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;">
//           <span>Last seen</span>
//           <span>${updatedAt ?? "—"}</span>
//         </div>
//       </div>
//     `;
//   };

//   return (
//     <div className="flex h-screen w-full bg-black text-white overflow-hidden">
//       {/* SIDEBAR */}
//       <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 z-30 shadow-2xl">
//         <div className="p-6 border-b border-gray-800">
//           <h1 className="text-xl font-bold mb-1 tracking-tight">Player Radar</h1>
//           <p className="text-[10px] text-gray-500 mb-4 font-mono">
//             {players.length} online · {totalMarkerCount} total tasks
//           </p>
//           <input
//             type="text"
//             placeholder="Search players..."
//             className="w-full bg-gray-800 p-2 rounded-lg text-sm border border-gray-700 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="flex-1 overflow-y-auto custom-scrollbar">
//           {players
//             .filter((p) =>
//               p.username?.toLowerCase().includes(searchTerm.toLowerCase())
//             )
//             .map((player) => (
//               <button
//                 key={player.id}
//                 onClick={() =>
//                   map.current?.flyTo({
//                     center: [player.lng, player.lat],
//                     zoom: 16,
//                     duration: 2000,
//                   })
//                 }
//                 className="w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 flex flex-col transition-colors group"
//               >
//                 <span className="font-bold text-sm group-hover:text-blue-400 transition-colors">
//                   {player.username}
//                 </span>
//                 <span className="text-[10px] text-gray-500 font-mono mt-1">
//                   {player.lat?.toFixed(4)}, {player.lng?.toFixed(4)}
//                 </span>
//                 <span className="text-[9px] text-gray-600 font-mono mt-0.5">
//                   {player.updatedAt}
//                 </span>
//               </button>
//             ))}
//         </div>

//         <div className="p-4 bg-black text-[10px] text-blue-400 font-mono border-t border-gray-800 uppercase tracking-widest flex items-center gap-2">
//           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
//           {status}
//         </div>
//       </div>

//       {/* MAP */}
//       <div className="flex-1 relative h-full">
//         <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useState, useRef } from "react";
import { db, rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { collection, getDocs, query, where } from "firebase/firestore";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Player is considered offline if no update for 30 seconds.
// coords.ts writes every 5 s, so 30 s = 6 missed writes.
const OFFLINE_THRESHOLD_MS = 30_000;

export default function TrackerPage() {
  const [status, setStatus]           = useState("Initializing...");
  const [players, setPlayers]         = useState<any[]>([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [totalMarkerCount, setTotalMarkerCount] = useState(0);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map          = useRef<maplibregl.Map | null>(null);
  const markers      = useRef<{ [key: string]: maplibregl.Marker }>({});

  // 1. INITIALIZE MAP
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [85.324, 27.7172],
      zoom: 12,
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // 2. TOTAL QR MARKERS — /events/test/qrMarkers
  useEffect(() => {
    getDocs(collection(db, "events/test/qrMarkers"))
      .then((snap) => setTotalMarkerCount(snap.size))
      .catch((e) => console.error("[tracker] qrMarkers fetch failed:", e));
  }, []);

  // 3. PLAYER SYNC — listens to RTDB playerLocations
  useEffect(() => {
    const playerLocationsRef = ref(rtdb, "playerLocations");
    setStatus("Radar Active: Viewing Players");

    const unsubRtdb = onValue(playerLocationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const now  = Date.now();

      // ── Split into online / offline by updatedAtEpoch ──────────────────────
      const allPlayers = Object.entries(data).map(([username, val]: any) => ({
        id:              username,
        username,
        lat:             val.latitude,
        lng:             val.longitude,
        updatedAt:       val.updatedAt,       // human-readable string
        updatedAtEpoch:  val.updatedAtEpoch ?? 0,
        isOnline:        now - (val.updatedAtEpoch ?? 0) <= OFFLINE_THRESHOLD_MS,
      }));

      const onlinePlayers  = allPlayers.filter((p) => p.isOnline);
      const offlineIds     = allPlayers.filter((p) => !p.isOnline).map((p) => p.id);

      setPlayers(onlinePlayers);

      // ── Remove map markers for offline players ─────────────────────────────
      offlineIds.forEach((id) => {
        if (markers.current[id]) {
          markers.current[id].remove();
          delete markers.current[id];
        }
      });

      // ── Add / update markers for online players ────────────────────────────
      onlinePlayers.forEach(async (player) => {
        if (!map.current) return;
        if (player.lat == null || player.lng == null) return;

        let completedCount = 0;
        try {
          const q    = query(collection(db, "participants"), where("username", "==", player.username));
          const snap = await getDocs(q);
          if (!snap.empty) {
            completedCount = (snap.docs[0].data().userProgress ?? []).length;
          }
        } catch (e) {
          console.error("[tracker] progress fetch failed:", e);
        }

        const popupHTML = getPopupHTML(player.username, completedCount, totalMarkerCount, player.updatedAt);

        if (markers.current[player.id]) {
          markers.current[player.id].setLngLat([player.lng, player.lat]);
          markers.current[player.id].getPopup()?.setHTML(popupHTML);
        } else {
          const el = document.createElement("div");
          el.innerHTML = `<div style="
            width:16px;height:16px;
            background:#ef4444;border:2px solid white;
            border-radius:50%;
            box-shadow:0 0 8px rgba(0,0,0,0.6);
            cursor:pointer;
          "></div>`;

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML);

          markers.current[player.id] = new maplibregl.Marker({ element: el })
            .setLngLat([player.lng, player.lat])
            .setPopup(popup)
            .addTo(map.current);
        }
      });

      // Remove markers for players no longer in RTDB at all
      Object.keys(markers.current).forEach((id) => {
        if (!data[id]) {
          markers.current[id].remove();
          delete markers.current[id];
        }
      });
    });

    return () => unsubRtdb();
  }, [totalMarkerCount]);

  const getPopupHTML = (
    username:  string,
    completed: number,
    total:     number,
    updatedAt: string
  ) => {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return `
      <div style="color:#1f2937;padding:8px 10px;min-width:160px;font-family:sans-serif;">
        <b style="font-size:14px;display:block;margin-bottom:8px;">${username}</b>
        <div style="font-size:11px;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span style="color:#6b7280;">Tasks complete</span>
          <span style="font-weight:700;color:#2563eb;">${completed} / ${total}</span>
        </div>
        <div style="background:#e5e7eb;border-radius:99px;height:6px;overflow:hidden;margin-bottom:8px;">
          <div style="width:${pct}%;height:100%;background:#2563eb;border-radius:99px;"></div>
        </div>
        <div style="font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;">
          <span>Last seen</span>
          <span>${updatedAt ?? "—"}</span>
        </div>
      </div>`;
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 z-30 shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold mb-1 tracking-tight">Player Radar</h1>
          <p className="text-[10px] text-gray-500 mb-4 font-mono">
            {players.length} online · {totalMarkerCount} total tasks
          </p>
          <input
            type="text"
            placeholder="Search players..."
            className="w-full bg-gray-800 p-2 rounded-lg text-sm border border-gray-700 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {players
            .filter((p) => p.username?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((player) => (
              <button
                key={player.id}
                onClick={() =>
                  map.current?.flyTo({ center: [player.lng, player.lat], zoom: 16, duration: 2000 })
                }
                className="w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 flex flex-col transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {/* green online dot */}
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <span className="font-bold text-sm group-hover:text-blue-400 transition-colors">
                    {player.username}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono mt-1 ml-4">
                  {player.lat?.toFixed(4)}, {player.lng?.toFixed(4)}
                </span>
                <span className="text-[9px] text-gray-600 font-mono mt-0.5 ml-4">
                  {player.updatedAt}
                </span>
              </button>
            ))}
        </div>

        <div className="p-4 bg-black text-[10px] text-blue-400 font-mono border-t border-gray-800 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          {status}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative h-full">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}