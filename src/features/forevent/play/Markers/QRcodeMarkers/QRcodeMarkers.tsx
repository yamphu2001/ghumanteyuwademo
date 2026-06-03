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

//   const markersRef = useRef<Record<string, { instance: maplibregl.Marker; element: HTMLDivElement; currentHandler?: () => void }>>({});

//   // 1. Snapshot Listener Setup (Firestore)
//   useEffect(() => {
//     if (!eventId) { setMarkers([]); return; }
//     const cacheKey = `qrcodemarkers_${eventId}`;

//     localforage.getItem<QRcodeMarkerData[]>(cacheKey).then((cached) => {
//       if (cached && cached.length > 0) setMarkers(cached);
//     });

//     if (!navigator.onLine) return;

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
//             scanned: false, 
//           };
//         });
//         setMarkers(items);
//         localforage.setItem(cacheKey, items).catch(() => { });
//       }
//     );
//     return () => unsub();
//   }, [eventId]);

//   // 2. Realtime Database Progress Listener with local offline fallback
//   useEffect(() => {
//     if (!eventId || !userId) { setScannedIds(new Set()); return; }

//     const localScanRecordKey = `scanned_history_${eventId}_${userId}`;
//     const rtdb = getDatabase();
//     const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);

//     let currentRemoteIds = new Set<string>();

//     const applyScannedState = async (remoteIds: Set<string>) => {
//       currentRemoteIds = remoteIds;
//       const ids = new Set<string>(remoteIds);
//       try {
//         const localScannedItems = (await localforage.getItem<string[]>(localScanRecordKey)) ?? [];
//         localScannedItems.forEach((id) => ids.add(id));
//       } catch (err) {
//         console.warn('[QRcodeMarkers] Failed to load local scanned history:', err);
//       }

//       console.log("[QRcodeMarkers] Final scanned IDs:", Array.from(ids));
//       setScannedIds(ids);

//       setActiveMarker((prev) => {
//         if (!prev) return null;
//         // ✅ FIX: Check both id and qrCodeId here
//         const isScanned = ids.has(prev.id) || (prev.qrCodeId && ids.has(prev.qrCodeId));
//         return { ...prev, scanned: !!isScanned };
//       });
//     };

//     applyScannedState(new Set());

//     const unsubscribe = onValue(scannedRef, (snapshot) => {
//       const ids = new Set<string>();
//       if (snapshot.exists()) {
//         snapshot.forEach((child) => { if (child.key) ids.add(child.key); });
//       }
//       applyScannedState(ids);
//     });

//     const handleLocalScanUpdate = () => {
//       applyScannedState(currentRemoteIds);
//     };
//     window.addEventListener("qr-scanned-local", handleLocalScanUpdate);

//     return () => {
//       unsubscribe();
//       window.removeEventListener("qr-scanned-local", handleLocalScanUpdate);
//     };
//   }, [eventId, userId]);

//   // 3. Click Handler
//   const handleMarkerClick = useCallback((marker: QRcodeMarkerData) => {
//     // ✅ FIX: Check both id and qrCodeId when opening popup offline
//     const isActuallyScanned = scannedIds.has(marker.id) || (marker.qrCodeId && scannedIds.has(marker.qrCodeId));
//     const updatedMarker = { ...marker, scanned: !!isActuallyScanned };
//     setActiveMarker(updatedMarker);
//     onMarkerClick?.(updatedMarker);
//   }, [onMarkerClick, scannedIds]);

//   // 4. Smart High-Performance Marker Syncer
//   useEffect(() => {
//     if (!map) return;
//     const currentMarkers = markersRef.current;
//     const incomingIds = new Set(markers.map((m) => m.id));

//     Object.keys(currentMarkers).forEach((id) => {
//       if (!incomingIds.has(id)) {
//         currentMarkers[id].instance.remove();
//         delete currentMarkers[id];
//       }
//     });

//     const greyOverlay = "linear-gradient(rgba(100, 116, 139, 0.75), rgba(100, 116, 139, 0.75))";

//     markers.forEach((marker) => {
//       // ✅ FIX: Match against either the Firestore document ID or literal QR string
//       const isScanned = scannedIds.has(marker.id) || (marker.qrCodeId && scannedIds.has(marker.qrCodeId)); 
//       const markerWithScanState = { ...marker, scanned: !!isScanned };
//       const existing = currentMarkers[marker.id];

//       if (existing) {
//         existing.instance.setLngLat([marker.lng, marker.lat]);

//         if (existing.currentHandler) {
//           existing.element.removeEventListener("click", existing.currentHandler);
//         }

//         const newHandler = () => handleMarkerClick(markerWithScanState);
//         existing.element.addEventListener("click", newHandler);
//         existing.currentHandler = newHandler;

//         // Visual Sync
//         existing.element.style.backgroundImage = marker.image
//           ? (isScanned ? `${greyOverlay}, url(${marker.image})` : `url(${marker.image})`)
//           : "";
//         existing.element.style.filter = isScanned ? "grayscale(100%) brightness(0.9)" : "none";
//         existing.element.style.backgroundColor = isScanned ? "#475569" : "#0f172a";
//         return;
//       }

//       // Fresh Creation
//       const el = document.createElement("div");
//       Object.assign(el.style, {
//         width: "38px", height: "38px", borderRadius: "50%",
//         border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
//         backgroundSize: "cover", backgroundPosition: "center",
//         cursor: "pointer",
//         backgroundImage: marker.image ? (isScanned ? `${greyOverlay}, url(${marker.image})` : `url(${marker.image})`) : "",
//         filter: isScanned ? "grayscale(100%) brightness(0.9)" : "none",
//         backgroundColor: isScanned ? "#475569" : "#0f172a"
//       });

//       const mapMarker = new maplibregl.Marker({ element: el }).setLngLat([marker.lng, marker.lat]).addTo(map);

//       const clickHandler = () => handleMarkerClick(markerWithScanState);
//       el.addEventListener("click", clickHandler);

//       currentMarkers[marker.id] = { instance: mapMarker, element: el, currentHandler: clickHandler };
//     });
//   }, [map, markers, scannedIds, userId, handleMarkerClick]);

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

  const markersRef = useRef<Record<string, { instance: maplibregl.Marker; element: HTMLDivElement; currentHandler?: () => void }>>({});

  // 1. Snapshot Listener Setup (Firestore) — cache-first, works offline
  useEffect(() => {
    if (!eventId) { setMarkers([]); return; }
    const cacheKey = `qrcodemarkers_${eventId}`;

    // Always load from cache first regardless of online status
    localforage.getItem<QRcodeMarkerData[]>(cacheKey).then((cached) => {
      if (cached && cached.length > 0) setMarkers(cached);
    });

    // Only subscribe to live updates when online
    if (!navigator.onLine) return;

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
            scanned: false,
          };
        });
        setMarkers(items);
        localforage.setItem(cacheKey, items).catch(() => {});
      }
    );
    return () => unsub();
  }, [eventId]);

  // 2. Scanned IDs — RTDB online + localforage offline fallback
  useEffect(() => {
    if (!eventId || !userId) { setScannedIds(new Set()); return; }

    const localScanRecordKey = `scanned_history_${eventId}_${userId}`;
    const rtdb = getDatabase();
    const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);

    let currentRemoteIds = new Set<string>();

    const applyScannedState = async (remoteIds: Set<string>) => {
      currentRemoteIds = remoteIds;
      const ids = new Set<string>(remoteIds);
      try {
        const localScannedItems = (await localforage.getItem<string[]>(localScanRecordKey)) ?? [];
        localScannedItems.forEach((id) => ids.add(id));
      } catch (err) {
        console.warn('[QRcodeMarkers] Failed to load local scanned history:', err);
      }

      console.log("[QRcodeMarkers] Final scanned IDs:", Array.from(ids));
      setScannedIds(ids);

      setActiveMarker((prev) => {
        if (!prev) return null;
        const isScanned = ids.has(prev.id) || (prev.qrCodeId && ids.has(prev.qrCodeId));
        return { ...prev, scanned: !!isScanned };
      });
    };

    // Always apply local scan state first (works offline immediately)
    applyScannedState(new Set());

    // Only subscribe to RTDB when online
    if (!navigator.onLine) return;

    const unsubscribe = onValue(scannedRef, (snapshot) => {
      const ids = new Set<string>();
      if (snapshot.exists()) {
        snapshot.forEach((child) => { if (child.key) ids.add(child.key); });
      }
      applyScannedState(ids);
    });

    const handleLocalScanUpdate = () => {
      applyScannedState(currentRemoteIds);
    };
    window.addEventListener("qr-scanned-local", handleLocalScanUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("qr-scanned-local", handleLocalScanUpdate);
    };
  }, [eventId, userId]);

  // 3. Click Handler
  const handleMarkerClick = useCallback((marker: QRcodeMarkerData) => {
    const isActuallyScanned = scannedIds.has(marker.id) || (marker.qrCodeId && scannedIds.has(marker.qrCodeId));
    const updatedMarker = { ...marker, scanned: !!isActuallyScanned };
    setActiveMarker(updatedMarker);
    onMarkerClick?.(updatedMarker);
  }, [onMarkerClick, scannedIds]);

  // 4. Smart High-Performance Marker Syncer
  useEffect(() => {
    if (!map) return;
    const currentMarkers = markersRef.current;
    const incomingIds = new Set(markers.map((m) => m.id));

    Object.keys(currentMarkers).forEach((id) => {
      if (!incomingIds.has(id)) {
        currentMarkers[id].instance.remove();
        delete currentMarkers[id];
      }
    });

    const greyOverlay = "linear-gradient(rgba(100, 116, 139, 0.75), rgba(100, 116, 139, 0.75))";

    markers.forEach((marker) => {
      const isScanned = scannedIds.has(marker.id) || (marker.qrCodeId && scannedIds.has(marker.qrCodeId));
      const markerWithScanState = { ...marker, scanned: !!isScanned };
      const existing = currentMarkers[marker.id];

      if (existing) {
        existing.instance.setLngLat([marker.lng, marker.lat]);
        if (existing.currentHandler) existing.element.removeEventListener("click", existing.currentHandler);
        const newHandler = () => handleMarkerClick(markerWithScanState);
        existing.element.addEventListener("click", newHandler);
        existing.currentHandler = newHandler;
        existing.element.style.backgroundImage = marker.image ? (isScanned ? `${greyOverlay}, url(${marker.image})` : `url(${marker.image})`) : "";
        existing.element.style.filter = isScanned ? "grayscale(100%) brightness(0.9)" : "none";
        existing.element.style.backgroundColor = isScanned ? "#475569" : "#0f172a";
        return;
      }

      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "38px", height: "38px", borderRadius: "50%",
        border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        backgroundSize: "cover", backgroundPosition: "center",
        cursor: "pointer",
        backgroundImage: marker.image ? (isScanned ? `${greyOverlay}, url(${marker.image})` : `url(${marker.image})`) : "",
        filter: isScanned ? "grayscale(100%) brightness(0.9)" : "none",
        backgroundColor: isScanned ? "#475569" : "#0f172a",
      });

      const mapMarker = new maplibregl.Marker({ element: el }).setLngLat([marker.lng, marker.lat]).addTo(map);
      const clickHandler = () => handleMarkerClick(markerWithScanState);
      el.addEventListener("click", clickHandler);
      currentMarkers[marker.id] = { instance: mapMarker, element: el, currentHandler: clickHandler };
    });
  }, [map, markers, scannedIds, userId, handleMarkerClick]);

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