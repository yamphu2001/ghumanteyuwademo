
// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// import { collection, onSnapshot } from "firebase/firestore";
// import { getDatabase, ref, onValue } from "firebase/database";
// import { db } from "@/lib/firebase";
// import localforage from "localforage";
// import { MarkerPopup, QRcodeMarkerData } from "./popup";
// import { ApproachPopup } from "./approachPopup";

// interface QRcodeMarkersProps {
//   map: maplibregl.Map;
//   eventId: string;
//   userId?: string;
//   onMarkerClick?: (marker: QRcodeMarkerData) => void;
// }

// export default function QRcodeMarkers({ map, eventId, userId, onMarkerClick }: QRcodeMarkersProps) {
//   const [markers, setMarkers] = useState<QRcodeMarkerData[]>([]);
//   const [activeMarker, setActiveMarker] = useState<QRcodeMarkerData | null>(null);
//   const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());
  
//   // Keep track of maplibre marker instances and their specific elements
//   const markersRef = useRef<Record<string, { instance: maplibregl.Marker; element: HTMLDivElement; currentHandler?: () => void }>>({});

//   // 1. Snapshot Listener Setup (Firestore)
//   useEffect(() => {
//     if (!eventId) { setMarkers([]); return; }

//     const cacheKey = `qrcodemarkers_${eventId}`;
//     const loadCached = async () => {
//       if (navigator.onLine) return;
//       const cached = await localforage.getItem<QRcodeMarkerData[]>(cacheKey);
//       if (cached) setMarkers(cached);
//     };
//     loadCached();

//     const unsub = onSnapshot(
//       collection(db, "events", eventId, "qrcodemarkers"),
//       (snapshot) => {
//         const items: QRcodeMarkerData[] = snapshot.docs.map((doc) => {
//           const data = doc.data() as Record<string, unknown>;
//           return {
//             id: doc.id,
//             name: String(data.name ?? ""),
//             lat: Number(data.lat ?? 0),
//             lng: Number(data.lng ?? 0),
//             image: String(data.image ?? ""),
//             popupImage: String(data.popupImage ?? ""),
//             popupText: String(data.popupText ?? ""),
//             qrCodeId: String(data.qrCodeId ?? ""),
//             points: Number(data.points ?? 0),
//             scanned: Boolean(data.scanned ?? false),
//           };
//         });
//         setMarkers(items);
//         localforage.setItem(cacheKey, items).catch(() => {});
//       },
//       (error) => {
//         if (error?.code === "unavailable" || error?.message?.includes("Could not reach Cloud Firestore backend")) {
//           console.warn("[QRcodeMarkers] offline snapshot warning:", error);
//           return;
//         }
//         console.error("[QRcodeMarkers] snapshot error:", error);
//       }
//     );

//     return () => unsub();
//   }, [eventId]);

//   // 2. Realtime Database Progress Listener
//   useEffect(() => {
//     if (!eventId || !userId) {
//       setScannedIds(new Set());
//       return;
//     }

//     const rtdb = getDatabase();
//     const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
//     const unsubscribe = onValue(
//       scannedRef,
//       (snapshot) => {
//         const ids = new Set<string>();
//         if (snapshot.exists()) {
//           snapshot.forEach((child) => {
//             if (child.key) ids.add(child.key);
//           });
//         }
//         setScannedIds(ids);

//         // SYNC ACTIVE POPUP FIX: Update active popup data object context on live scan changes
//         setActiveMarker((prev) => {
//           if (!prev) return null;
//           const isNowScanned = ids.has(prev.id);
//           return { ...prev, scanned: isNowScanned };
//         });
//       },
//       (error) => {
//         console.error("[QRcodeMarkers] RTDB scan state error:", error);
//       }
//     );

//     return () => unsubscribe();
//   }, [eventId, userId]);

//   // 3. Wrap Click Handler
//   const handleMarkerClick = useCallback(
//     (marker: QRcodeMarkerData) => {
//       setActiveMarker(marker);
//       onMarkerClick?.(marker);
//     },
//     [onMarkerClick]
//   );

//   // 4. Smart High-Performance Marker Syncer
//   useEffect(() => {
//     if (!map) return;
//     const currentMarkers = markersRef.current;
//     const incomingIds = new Set(markers.map((m) => m.id));

//     // Remove deleted markers
//     Object.keys(currentMarkers).forEach((id) => {
//       if (!incomingIds.has(id)) {
//         currentMarkers[id].instance.remove();
//         delete currentMarkers[id];
//       }
//     });

//     // Update or Create markers safely
//     markers.forEach((marker) => {
//       const isScanned = userId ? scannedIds.has(marker.id) : Boolean(marker.scanned);
//       const markerWithScanState = { ...marker, scanned: isScanned };
//       const existing = currentMarkers[marker.id];

//       if (existing) {
//         // Sync position coordinate changes
//         existing.instance.setLngLat([marker.lng, marker.lat]);
        
//         // Fix: Swap out event listeners so clicking ALWAYS pulls the latest data frame
//         if (existing.currentHandler) {
//           existing.element.removeEventListener("click", existing.currentHandler);
//         }
//         const newHandler = () => handleMarkerClick(markerWithScanState);
//         existing.element.addEventListener("click", newHandler);
//         existing.currentHandler = newHandler;
        
//         // Sync image updates
//         existing.element.style.backgroundImage = marker.image ? `url(${marker.image})` : "";
        
//         // Dynamic scanned styling updates (Resets back to normal style smoothly if isScanned changes to false)
//         existing.element.style.filter = isScanned ? "grayscale(100%)" : "none";
//         existing.element.style.backgroundColor = isScanned ? "#64748b" : "#0f172a";
//         return;
//       }

//       // Fresh Creation
//       const el = document.createElement("div");
//       el.style.width = "38px";
//       el.style.height = "38px";
//       el.style.borderRadius = "50%";
//       el.style.border = "2px solid white";
//       el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
//       el.style.backgroundSize = "cover";
//       el.style.backgroundPosition = "center";
//       el.style.cursor = "pointer";
//       el.style.backgroundImage = marker.image ? `url(${marker.image})` : "";
      
//       // Apply initial styling configuration
//       el.style.filter = isScanned ? "grayscale(100%)" : "none";
//       el.style.backgroundColor = isScanned ? "#64748b" : "#0f172a";

//       const mapMarker = new maplibregl.Marker({ element: el })
//         .setLngLat([marker.lng, marker.lat])
//         .addTo(map);

//       const clickHandler = () => handleMarkerClick(markerWithScanState);
//       el.addEventListener("click", clickHandler);

//       currentMarkers[marker.id] = {
//         instance: mapMarker,
//         element: el,
//         currentHandler: clickHandler
//       };
//     });

//   }, [map, markers, scannedIds, userId, handleMarkerClick]); // FIX: Added scannedIds and userId to the dependency array

//   // Global teardown hook
//   useEffect(() => {
//     return () => {
//       Object.values(markersRef.current).forEach((m) => m.instance.remove());
//       markersRef.current = {};
//     };
//   }, []);

//   if (!activeMarker) return null;

//   return activeMarker.scanned ? (
//     <MarkerPopup marker={activeMarker} onClose={() => setActiveMarker(null)} />
//   ) : (
//     <ApproachPopup marker={activeMarker} onClose={() => setActiveMarker(null)} />
//   );
// } 




"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { collection, onSnapshot } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import localforage from "localforage";
import { MarkerPopup, QRcodeMarkerData } from "./popup";
import { ApproachPopup } from "./approachPopup";

interface QRcodeMarkersProps {
  map: maplibregl.Map;
  eventId: string;
  userId?: string;
  onMarkerClick?: (marker: QRcodeMarkerData) => void;
}

export default function QRcodeMarkers({ map, eventId, userId, onMarkerClick }: QRcodeMarkersProps) {
  const [markers, setMarkers] = useState<QRcodeMarkerData[]>([]);
  const [activeMarker, setActiveMarker] = useState<QRcodeMarkerData | null>(null);
  const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());
  
  // Keep track of maplibre marker instances and their specific elements
  const markersRef = useRef<Record<string, { instance: maplibregl.Marker; element: HTMLDivElement; currentHandler?: () => void }>>({});

  // 1. Snapshot Listener Setup (Firestore)
  useEffect(() => {
    if (!eventId) { setMarkers([]); return; }

    const cacheKey = `qrcodemarkers_${eventId}`;
    const loadCached = async () => {
      if (navigator.onLine) return;
      const cached = await localforage.getItem<QRcodeMarkerData[]>(cacheKey);
      if (cached) setMarkers(cached);
    };
    loadCached();

    const unsub = onSnapshot(
      collection(db, "events", eventId, "qrcodemarkers"),
      (snapshot) => {
        const items: QRcodeMarkerData[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            name: String(data.name ?? ""),
            lat: Number(data.lat ?? 0),
            lng: Number(data.lng ?? 0),
            image: String(data.image ?? ""),
            popupImage: String(data.popupImage ?? ""),
            popupText: String(data.popupText ?? ""),
            qrCodeId: String(data.qrCodeId ?? ""),
            points: Number(data.points ?? 0),
            scanned: Boolean(data.scanned ?? false),
          };
        });
        setMarkers(items);
        localforage.setItem(cacheKey, items).catch(() => {});
      },
      (error) => {
        if (error?.code === "unavailable" || error?.message?.includes("Could not reach Cloud Firestore backend")) {
          console.warn("[QRcodeMarkers] offline snapshot warning:", error);
          return;
        }
        console.error("[QRcodeMarkers] snapshot error:", error);
      }
    );

    return () => unsub();
  }, [eventId]);

  // 2. Realtime Database Progress Listener
  useEffect(() => {
    if (!eventId || !userId) {
      setScannedIds(new Set());
      return;
    }

    const rtdb = getDatabase();
    const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
    const unsubscribe = onValue(
      scannedRef,
      (snapshot) => {
        const ids = new Set<string>();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            if (child.key) ids.add(child.key);
          });
        }
        
        // Merge into existing local scan entries safely
        setScannedIds((prev) => {
          const nextSet = new Set([...Array.from(prev), ...Array.from(ids)]);
          return nextSet;
        });

        // SYNC ACTIVE POPUP FIX: Update active popup data object context on live scan changes
        setActiveMarker((prev) => {
          if (!prev) return null;
          const isNowScanned = ids.has(prev.id);
          return { ...prev, scanned: isNowScanned };
        });
      },
      (error) => {
        console.error("[QRcodeMarkers] RTDB scan state error:", error);
      }
    );

    return () => unsubscribe();
  }, [eventId, userId]);

  // 2b. Bridge Offline Scans: Poll localforage scan history baseline into state 
  useEffect(() => {
    if (!eventId || !userId) return;

    const localScanRecordKey = `scanned_history_${eventId}_${userId}`;
    
    const syncLocalHistory = async () => {
      try {
        const localHistory = await localforage.getItem<string[]>(localScanRecordKey);
        if (localHistory && localHistory.length > 0) {
          setScannedIds((prev) => {
            const nextSet = new Set(prev);
            let changed = false;
            for (const id of localHistory) {
              if (!nextSet.has(id)) {
                nextSet.add(id);
                changed = true;
              }
            }
            return changed ? nextSet : prev;
          });
        }
      } catch (err) {
        console.warn("[QRcodeMarkers] Local history sync failed:", err);
      }
    };

    syncLocalHistory();
    const interval = setInterval(syncLocalHistory, 1500); // Check local storage logs every 1.5s for offline scan synchronization
    window.addEventListener("focus", syncLocalHistory);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncLocalHistory);
    };
  }, [eventId, userId]);

  // 3. Wrap Click Handler
  const handleMarkerClick = useCallback(
    (marker: QRcodeMarkerData) => {
      setActiveMarker(marker);
      onMarkerClick?.(marker);
    },
    [onMarkerClick]
  );

  // 4. Smart High-Performance Marker Syncer
  useEffect(() => {
    if (!map) return;
    const currentMarkers = markersRef.current;
    const incomingIds = new Set(markers.map((m) => m.id));

    // Remove deleted markers
    Object.keys(currentMarkers).forEach((id) => {
      if (!incomingIds.has(id)) {
        currentMarkers[id].instance.remove();
        delete currentMarkers[id];
      }
    });

    // Dark grey overlay formula to blend over colored images securely bypassing Maplibre hardware filter limitations
    const greyOverlay = "linear-gradient(rgba(100, 116, 139, 0.75), rgba(100, 116, 139, 0.75))";

    // Update or Create markers safely
    markers.forEach((marker) => {
      const isScanned = userId ? scannedIds.has(marker.id) : Boolean(marker.scanned);
      const markerWithScanState = { ...marker, scanned: isScanned };
      const existing = currentMarkers[marker.id];

      if (existing) {
        // Sync position coordinate changes
        existing.instance.setLngLat([marker.lng, marker.lat]);
        
        // Fix: Swap out event listeners so clicking ALWAYS pulls the latest data frame
        if (existing.currentHandler) {
          existing.element.removeEventListener("click", existing.currentHandler);
        }
        const newHandler = () => handleMarkerClick(markerWithScanState);
        existing.element.addEventListener("click", newHandler);
        existing.currentHandler = newHandler;
        
        // Sync image updates (Combines a grey overlay with image if scanned to ensure grey state triggers instantly)
        existing.element.style.backgroundImage = marker.image 
          ? (isScanned ? `${greyOverlay}, url(${marker.image})` : `url(${marker.image})`)
          : "";
        
        // Dynamic scanned styling updates 
        existing.element.style.filter = isScanned ? "grayscale(100%) brightness(0.9)" : "none";
        existing.element.style.backgroundColor = isScanned ? "#475569" : "#0f172a";
        return;
      }

      // Fresh Creation
      const el = document.createElement("div");
      el.style.width = "38px";
      el.style.height = "38px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.cursor = "pointer";
      
      // Apply initial styling configuration
      el.style.backgroundImage = marker.image 
        ? (isScanned ? `${greyOverlay}, url(${marker.image})` : `url(${marker.image})`)
        : "";
      el.style.filter = isScanned ? "grayscale(100%) brightness(0.9)" : "none";
      el.style.backgroundColor = isScanned ? "#475569" : "#0f172a";

      const mapMarker = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);

      const clickHandler = () => handleMarkerClick(markerWithScanState);
      el.addEventListener("click", clickHandler);

      currentMarkers[marker.id] = {
        instance: mapMarker,
        element: el,
        currentHandler: clickHandler
      };
    });

  }, [map, markers, scannedIds, userId, handleMarkerClick]); 

  // Global teardown hook
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((m) => m.instance.remove());
      markersRef.current = {};
    };
  }, []);

  if (!activeMarker) return null;

  return activeMarker.scanned ? (
    <MarkerPopup marker={activeMarker} onClose={() => setActiveMarker(null)} />
  ) : (
    <ApproachPopup marker={activeMarker} onClose={() => setActiveMarker(null)} />
  );
}