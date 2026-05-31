
// 'use client';

// import React, { useEffect, useState, useCallback } from "react";
// import { db } from "@/lib/firebase";
// import { collection, onSnapshot } from "firebase/firestore"; // UPDATED: Imported collection
// import ghumanteStallImg from "./ghumantestall.png";

// interface GhumanteStallConfig {
//   id: string;
//   lng: number;
//   lat: number;
//   eventarea: string;
//   status: "active" | "inactive";
// }

// // Single pin component (Kept exactly identical to handle rendering logic)
// function SingleGhumanteStall({ map, config }: { map: any; config: GhumanteStallConfig }) {
//   const [pos, setPos] = useState({ x: 0, y: 0 });
//   const [showCloud, setShowCloud] = useState(false);

//   const updatePosition = useCallback(() => {
//     const inst = map?.current || map;
//     if (!inst) return;
//     requestAnimationFrame(() => {
//       try {
//         const point = inst.project([config.lng, config.lat]);
//         if (point) setPos({ x: point.x, y: point.y });
//       } catch {}
//     });
//   }, [map, config.lng, config.lat]);

//   useEffect(() => {
//     const inst = map?.current || map;
//     if (!inst) return;
//     updatePosition();
//     const evs = ["move", "zoom", "resize", "moveend", "render"];
//     evs.forEach((e) => inst.on(e, updatePosition));
//     return () => evs.forEach((e) => inst.off(e, updatePosition));
//   }, [map, updatePosition]);

//   if (pos.x === 0 && pos.y === 0) return null;

//   const finalSrc = typeof ghumanteStallImg === "string" ? ghumanteStallImg : (ghumanteStallImg as any).src;

//   return (
//     <div
//       style={{
//         position: "absolute",
//         top: 0, left: 0,
//         transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -100%)`,
//         zIndex: 10,
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         pointerEvents: "none",
//         willChange: "transform",
//       }}
//     >
//       {showCloud && (
//         <div style={{
//           background: "white", padding: "5px 10px", borderRadius: "10px",
//           marginBottom: "5px", fontSize: "12px",
//           boxShadow: "0 2px 5px rgba(0,0,0,0.2)", pointerEvents: "auto",
//         }}>
//           {config.eventarea}
//         </div>
//       )}
//       <img
//         src={finalSrc}
//         alt="ghumante stall"
//         style={{ width: "40px", cursor: "pointer", pointerEvents: "auto" }}
//         onClick={(e) => { e.stopPropagation(); setShowCloud(!showCloud); }}
//       />
//     </div>
//   );
// }

// // Parent component: Now fetches subcollection documents and plots them
// export default function GhumanteStall({ map, eventId }: { map: any; eventId: string }) {
//   const [ghumanteStalls, setGhumanteStalls] = useState<GhumanteStallConfig[]>([]);

//   useEffect(() => {
//     if (!eventId) return;

//     // UPDATED: Points directly to your new nested subcollection
//     const subCollectionRef = collection(db, "events", eventId, "ghumantestall");

//     const unsub = onSnapshot(subCollectionRef, (snapshot) => {
//       const activeStalls: GhumanteStallConfig[] = [];

//       snapshot.forEach((docSnap) => {
//         const data = docSnap.data();
        
//         // Retains the visibility logic: only map stalls marked "active"
//         if (data.status === "active") {
//           activeStalls.push({
//             id: docSnap.id,
//             lng: data.lng ?? 0,
//             lat: data.lat ?? 0,
//             eventarea: data.eventarea ?? "",
//             status: data.status ?? "active",
//           });
//         }
//       });

//       setGhumanteStalls(activeStalls);
//     }, (error) => {
//       console.error("Error listening to ghumantestall subcollection: ", error);
//     });

//     return () => unsub();
//   }, [eventId]);

//   return (
//     <>
//       {ghumanteStalls.map((ghumanteStall) => (
//         <SingleGhumanteStall key={ghumanteStall.id} map={map} config={ghumanteStall} />
//       ))}
//     </>
//   );
// }



'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import localforage from "localforage";
import { collection, onSnapshot } from "firebase/firestore";
import ghumanteStallImg from "./ghumantestall.png";

interface GhumanteStallConfig {
  id: string;
  lng: number;
  lat: number;
  eventarea: string;
  status: "active" | "inactive";
}

// Single pin component
function SingleGhumanteStall({ map, config }: { map: any; config: GhumanteStallConfig }) {
  const elementRef = useRef<HTMLDivElement>(null); // FIXED: Use ref instead of state to eliminate lag
  const [showCloud, setShowCloud] = useState(false);

  const updatePosition = useCallback(() => {
    const inst = map?.current || map;
    if (!inst || !elementRef.current) return;
    
    try {
      const point = inst.project([config.lng, config.lat]);
      if (point) {
        // FIXED: Mutate DOM styles directly inside the map callback for synchronous, ultra-smooth movement
        elementRef.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -100%)`;
      }
    } catch {}
  }, [map, config.lng, config.lat]);

  useEffect(() => {
    const inst = map?.current || map;
    if (!inst) return;
    
    // Initial position placement
    updatePosition();
    
    // Listen to high-frequency map positioning events
    const evs = ["move", "zoom", "resize", "moveend", "render"];
    evs.forEach((e) => inst.on(e, updatePosition));
    return () => evs.forEach((e) => inst.off(e, updatePosition));
  }, [map, updatePosition]);

  const finalSrc = typeof ghumanteStallImg === "string" ? ghumanteStallImg : (ghumanteStallImg as any).src;

  return (
    <div
      ref={elementRef}
      style={{
        position: "absolute",
        top: 0, left: 0,
        transform: `translate3d(0px, 0px, 0) translate(-50%, -100%)`,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        willChange: "transform", // Optimizes rendering performance on mobile/web browsers
      }}
    >
      {showCloud && (
        <div style={{
          background: "white", padding: "5px 10px", borderRadius: "10px",
          marginBottom: "5px", fontSize: "12px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)", pointerEvents: "auto",
        }}>
          {config.eventarea}
        </div>
      )}
      <img
        src={finalSrc}
        alt="ghumante stall"
        style={{ width: "40px", cursor: "pointer", pointerEvents: "auto" }}
        onClick={(e) => { e.stopPropagation(); setShowCloud(!showCloud); }}
      />
    </div>
  );
}

// Parent component: Fetches subcollection documents and plots them
export default function GhumanteStall({ map, eventId }: { map: any; eventId: string }) {
  const [ghumanteStalls, setGhumanteStalls] = useState<GhumanteStallConfig[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const cacheKey = `ghumantestall_${eventId}`;
    const loadCached = async () => {
      if (navigator.onLine) return;
      const cached = await localforage.getItem<GhumanteStallConfig[]>(cacheKey);
      if (cached) setGhumanteStalls(cached);
    };
    loadCached();

    const subCollectionRef = collection(db, "events", eventId, "ghumantestall");

    const unsub = onSnapshot(subCollectionRef, (snapshot) => {
      const activeStalls: GhumanteStallConfig[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        if (data.status === "active") {
          activeStalls.push({
            id: docSnap.id,
            lng: data.lng ?? 0,
            lat: data.lat ?? 0,
            eventarea: data.eventarea ?? "",
            status: data.status ?? "active",
          });
        }
      });

      setGhumanteStalls(activeStalls);
      localforage.setItem(cacheKey, activeStalls).catch(() => {});
    }, (error) => {
      if (error?.code === "unavailable" || error?.message?.includes("Could not reach Cloud Firestore backend")) {
        console.warn("GhumanteStall offline snapshot warning:", error);
        return;
      }
      console.error("Error listening to ghumantestall subcollection: ", error);
    });

    return () => unsub();
  }, [eventId]);

  return (
    <>
      {ghumanteStalls.map((ghumanteStall) => (
        <SingleGhumanteStall key={ghumanteStall.id} map={map} config={ghumanteStall} />
      ))}
    </>
  );
}