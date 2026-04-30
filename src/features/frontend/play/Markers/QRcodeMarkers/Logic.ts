

"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";

export interface QRcodeMarkerData {
  id: string;
  name: string;
  nameNepali?: string;        // ← add
  lat: number;
  lng: number;
  type: string;
  image: string;
  popupImage?: string;
  description?: string;
  descriptionNepali?: string; // ← add
  qrCodeId: string;
  eventId?: string;
}
export interface MarkerPosition {
  x: number;
  y: number;
  id: string;
  name: string;
  image: string;
  popupImage?: string;
  description?: string;
  lat: number;
  lng: number;
  qrCodeId: string;
}

export type MarkerState = "default" | "nearby" | "unlocked";

export interface PopupState {
  type: "far" | "nearby" | "success";
  marker: QRcodeMarkerData; // Updated name
}

export interface QRScanRecord {
  markerId: string;
  markerName: string;
  username: string;
  userId: string | null;
  eventId: string; // Added to separate scan logs by event
  scannedAt: ReturnType<typeof serverTimestamp>;
}

export function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchMuseumMarkers(eventId: string): Promise<QRcodeMarkerData[]> {
  try {
    console.log(`[QRcodeMarkers] Fetching markers for event: "${eventId}"`);

    const snap = await getDocs(
      collection(db, "events", eventId, "qrcodemarkers")
    );

    return snap.docs.map((d) => {
      const raw = d.data();

      return {
        id: d.id,
        name: raw.name ?? "",
        lat: Number(raw.lat ?? 0),
        lng: Number(raw.lng ?? 0),
        type: raw.type ?? "museum",
        image: raw.image ?? "",
        popupImage: raw.popupImage ?? "",
        description: raw.description ?? "",
        qrCodeId: raw.qrCodeId ?? "",
        eventId: eventId,
      };
    });

  } catch (e: any) {
    console.error("[QRcodeMarkers] fetchMuseumMarkers error:", e);
    return [];
  }
}

/**
 * Records the scan log and includes eventId for better tracking.
 */
export async function recordQRScan(
  marker: QRcodeMarkerData,
  username: string,
  userId: string | null,
  eventId: string // Added eventId parameter
): Promise<void> {
  await addDoc(collection(db, "qrscanned"), {
    markerId:   marker.id,
    markerName: marker.name,
    username,
    userId,
    eventId,    // Now you can see which event this scan happened in
    scannedAt:  serverTimestamp(),
  } satisfies QRScanRecord);
}

export function watchPlayerPosition(
  onPosition: (pos: { lat: number; lng: number }) => void
): () => void {
  if (!navigator.geolocation) return () => {};
  const watchId = navigator.geolocation.watchPosition(
    (pos) => onPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    (err) => console.warn("GPS error:", err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
  );
  return () => navigator.geolocation.clearWatch(watchId);
}

export function resolveProximityStates(
  player: { lat: number; lng: number },
  markers: QRcodeMarkerData[],
  current: Record<string, MarkerState>
): Record<string, MarkerState> {
  let changed = false;
  const next = { ...current };
  for (const m of markers) {
    const prev = current[m.id] ?? "default";
    if (prev === "unlocked") continue;
    const dist = getDistanceMeters(player.lat, player.lng, m.lat, m.lng);
    const computed: MarkerState = dist <= 50 ? "nearby" : "default";
    if (computed !== prev) { next[m.id] = computed; changed = true; }
  }
  return changed ? next : current;
}

export function projectMarkers(
  mapInstance: { project: (lngLat: [number, number]) => { x: number; y: number } },
  markers: QRcodeMarkerData[]
): MarkerPosition[] {
  return markers.map((m) => {
    const pt = mapInstance.project([m.lng, m.lat]);
    return {
      id: m.id, name: m.name, image: m.image,
      popupImage: m.popupImage, description: m.description,
      lat: m.lat, lng: m.lng, qrCodeId: m.qrCodeId,
      x: pt.x, y: pt.y,
    };
  });
}