
"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapTrail } from "./useMapTrail";
import { usePlayerMovement } from "./usePlayerMovement";

interface PlayerMarkerProps {
  map: maplibregl.Map | null;
  eventId: string;
  iconUrl?: string;
}

export default function PlayerMarker({ map, eventId, iconUrl = "/Mascot.png" }: PlayerMarkerProps) {
  const [shape, setShape] = useState<"circle" | "square">("circle");
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // 1. Initialize Trail Management Hook
  const { addTrailPoint } = useMapTrail(map, eventId, shape);

  // Helper function to safely create or move the marker element
  const updateMarkerPosition = (latitude: number, longitude: number) => {
    if (!map) return;

    // If the marker doesn't exist on the map yet, build and attach it now
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
      // Otherwise, smoothly slide it to the new coordinate updates
      markerRef.current.setLngLat([longitude, latitude]);
    }
  };

  // 2. FIX: Check local cache instantly on load/refresh so it spawns with zero delay
  useEffect(() => {
    if (!map || !eventId) return;

    const savedTrail = localStorage.getItem(`player_trail_${eventId}`);
    if (savedTrail) {
      try {
        const parsed = JSON.parse(savedTrail);
        if (parsed && parsed.length > 0) {
          const lastPoint = parsed[parsed.length - 1];
          const [lng, lat] = lastPoint.coordinates;
          updateMarkerPosition(lat, lng);
        }
      } catch (error) {
        console.error("Failed to restore initial marker positioning:", error);
      }
    }
  }, [map, eventId]);

  // 3. Initialize Movement Engine Hook
  usePlayerMovement({
    map,
    eventId,
    onPositionUpdate: (latitude, longitude) => {
      // Fires when GPS acquires satellite coordinates or WASD moves
      updateMarkerPosition(latitude, longitude);
      addTrailPoint(latitude, longitude);
    },
  });

  // 4. Handle clean unmounting house-cleaning routines
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
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