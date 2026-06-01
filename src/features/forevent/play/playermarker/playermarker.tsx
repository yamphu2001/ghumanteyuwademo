"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapTrail } from "./useMapTrail";
import { usePlayerMovement } from "./usePlayerMovement";
import { useOfflineQueue } from "@/features/forevent/play/useOfflineQueue";

interface PlayerMarkerProps {
  map: maplibregl.Map | null;
  eventId: string;
  iconUrl?: string;
}

// Haversine distance in metres — same formula used in useMapTrail
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Minimum real-world movement (metres) before the map re-centres on the player.
// GPS chips have ~2–5 m of natural jitter when stationary, so 8 m keeps the
// map completely still unless the player has genuinely walked somewhere.
const PAN_THRESHOLD_METERS = 8;

export default function PlayerMarker({ map, eventId, iconUrl = "/Mascot.png" }: PlayerMarkerProps) {
  const [shape, setShape] = useState<"circle" | "square">("circle");
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Last position the map was actually panned to — used for the distance gate
  const lastPannedRef = useRef<{ lat: number; lng: number } | null>(null);

  // True while the user is manually dragging/panning the map
  const userPanningRef = useRef(false);
  const panResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { enqueue } = useOfflineQueue(eventId);
  const { addTrailPoint } = useMapTrail(map, eventId, shape);

  // Detect manual map interaction — pause auto-follow while user is exploring
  useEffect(() => {
    if (!map) return;

    const onDragStart = () => {
      userPanningRef.current = true;
      if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
    };

    const onDragEnd = () => {
      // Resume auto-follow 5 s after the user lifts their finger
      if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
      panResumeTimerRef.current = setTimeout(() => {
        userPanningRef.current = false;
      }, 60000);
    };

    map.on("dragstart", onDragStart);
    map.on("dragend",   onDragEnd);   // dragend, hehe NOT moveend — moveend fires after our own panTo too

    return () => {
      map.off("dragstart", onDragStart);
      map.off("dragend",   onDragEnd);
      if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
    };
  }, [map]);

  const updateMarkerPosition = (latitude: number, longitude: number) => {
    if (!map) return;

    // Always update the marker icon position — this is purely visual, no map movement
    if (!markerRef.current) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      });
      const img = document.createElement("img");
      img.src = iconUrl;
      img.alt = "Player";
      Object.assign(img.style, { width: "100%", height: "100%", objectFit: "contain" });
      el.appendChild(img);

      markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }

    // Gate 1: skip pan if the user is manually exploring the map
    if (userPanningRef.current) return;

    // Gate 2: skip pan if the player hasn't moved more than PAN_THRESHOLD_METERS
    // from the last position we panned to. This eliminates GPS jitter panning
    // entirely — the map stays still when the player is stationary.
    if (lastPannedRef.current) {
      const moved = distanceMeters(
        lastPannedRef.current.lat, lastPannedRef.current.lng,
        latitude, longitude
      );
      if (moved < PAN_THRESHOLD_METERS) return;
    }

    lastPannedRef.current = { lat: latitude, lng: longitude };
    map.panTo([longitude, latitude], { duration: 300 });
  };

  // Restore last known position from cache on load
  useEffect(() => {
    if (!map || !eventId) return;

    // Try the fast dedicated key first
    try {
      const saved = localStorage.getItem(`last_position_${eventId}`);
      if (saved) {
        const { latitude, longitude } = JSON.parse(saved);
        if (typeof latitude === "number" && typeof longitude === "number") {
          updateMarkerPosition(latitude, longitude);
          return;
        }
      }
    } catch (_) { /* ignore */ }

    // Fallback: parse from trail array
    try {
      const savedTrail = localStorage.getItem(`player_trail_${eventId}`);
      if (savedTrail) {
        const parsed = JSON.parse(savedTrail);
        if (parsed?.length > 0) {
          const [lng, lat] = parsed[parsed.length - 1].coordinates;
          updateMarkerPosition(lat, lng);
        }
      }
    } catch (error) {
      console.error("Failed to restore initial marker position:", error);
    }
  }, [map, eventId]);

  // Movement hook — enqueue is passed so writes are queued when offline
  usePlayerMovement({
    map,
    eventId,
    enqueue,
    onPositionUpdate: (latitude, longitude) => {
      updateMarkerPosition(latitude, longitude);
      addTrailPoint(latitude, longitude);
    },
  });

  // Cleanup
  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  return (
    <div style={containerStyle}>
      <button onClick={() => setShape("circle")} style={buttonStyle(shape === "circle")}>
        Circle Trail
      </button>
      <button onClick={() => setShape("square")} style={buttonStyle(shape === "square")}>
        Square Trail
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "absolute",
  top: "16px",
  left: "16px",
  zIndex: 10,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  padding: "8px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  display: "flex",
  gap: "6px",
  fontFamily: "sans-serif",
};

const buttonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: "600",
  border: "1px solid #ccc",
  borderRadius: "4px",
  backgroundColor: isActive ? "#2563EB" : "#FFF",
  color: isActive ? "#FFF" : "#333",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

