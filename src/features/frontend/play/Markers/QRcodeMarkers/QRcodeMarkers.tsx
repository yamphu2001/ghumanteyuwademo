"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { collection, onSnapshot, query, getDocs, limit, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { QRcodeMarkerData } from "./Logic";
import { onAuthStateChanged } from "firebase/auth";
import { LockedModal } from "./LockedModal";
import { UnlockedModal } from "./UnlockedModal";

export default function QRcodeMarkers({
  map,
  eventId,
}: {
  map: maplibregl.Map;
  eventId?: string;
}) {
  const [markers, setMarkers] = useState<QRcodeMarkerData[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(eventId || null);
  const [selectedMarker, setSelectedMarker] = useState<QRcodeMarkerData | null>(null);
  const [scannedMarkerIds, setScannedMarkerIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const markerInstances = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());

  // 0. Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // 1. Resolve Event ID
  useEffect(() => {
    if (eventId) {
      setActiveEventId(eventId);
    } else {
      const fetchDefault = async () => {
        const q = query(collection(db, "events"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) setActiveEventId(snap.docs[0].id);
      };
      fetchDefault();
    }
  }, [eventId]);

  // 2. Listen to participants/{userId} — userProgress is an array field on the doc
  useEffect(() => {
    if (!userId) return;

    const participantDoc = doc(db, "participants", userId);
    const unsubscribe = onSnapshot(participantDoc, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const progress: any[] = data?.userProgress ?? [];

      const ids = new Set<string>(
        progress
          .map((entry) => entry?.location?.markerId)
          .filter(Boolean)
      );

      console.log("✅ Scanned IDs:", [...ids]);
      setScannedMarkerIds(ids);
    });

    return () => unsubscribe();
  }, [userId]);

  // 3. Listen to qrMarkers subcollection
  useEffect(() => {
    if (!activeEventId || !map) return;

    const q = query(collection(db, "events", activeEventId, "qrMarkers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        console.log("📍 Marker ID:", docSnap.id, "name:", d.name);
        return {
          id: docSnap.id,
          name: d.name ?? "",
          nameNepali: d.nameNepali ?? "",
          lat: Number(d.lat ?? 0),
          lng: Number(d.lng ?? 0),
          image: d.imageUrl ?? d.image ?? "",
          popupImage: d.popupImage ?? "",
          description: d.description ?? "",
          descriptionNepali: d.descriptionNepali ?? "",
          qrCodeId: d.qrCodeId ?? "",
          unlockCode: d.unlockCode ?? "",
          type: d.type ?? "heritage",
        } as QRcodeMarkerData;
      });
      setMarkers(data);
    });

    return () => unsubscribe();
  }, [activeEventId, map]);

  // 4. Render markers on map
  useEffect(() => {
    if (!map || !markers.length) return;

    markerInstances.current.forEach(({ marker }) => marker.remove());
    markerInstances.current.clear();

    markers.forEach((data) => {
      if (!data.lng || !data.lat) return;

      const isScanned = scannedMarkerIds.has(data.id);

      const el = document.createElement("div");
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        opacity: ${isScanned ? "0.4" : "1"};
        filter: ${isScanned ? "grayscale(1)" : "none"};
        transition: opacity 0.3s ease, filter 0.3s ease;
      `;

      const avatar = document.createElement("div");
      avatar.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid ${isScanned ? "#999" : "white"};
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        background-size: cover;
        background-position: center;
        background-color: #facd05;
        flex-shrink: 0;
        transition: transform 0.15s ease;
      `;
      if (data.image) avatar.style.backgroundImage = `url(${data.image})`;
      
      el.appendChild(avatar);

      // Label logic has been removed from here

      if (!isScanned) {
        el.addEventListener("mouseenter", () => { avatar.style.transform = "scale(1.12)"; });
        el.addEventListener("mouseleave", () => { avatar.style.transform = "scale(1)"; });
      }

      el.onclick = () => setSelectedMarker(data);

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([data.lng, data.lat])
        .addTo(map);

      markerInstances.current.set(data.id, { marker, el });
    });

    return () => {
      markerInstances.current.forEach(({ marker }) => marker.remove());
      markerInstances.current.clear();
    };
  }, [map, markers, scannedMarkerIds]);

  const isSelectedScanned = selectedMarker
    ? scannedMarkerIds.has(selectedMarker.id)
    : false;

  // 5. Pick which modal to show
  if (!selectedMarker) return null;

  return isSelectedScanned ? (
    <UnlockedModal marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
  ) : (
    <LockedModal marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
  );
}