"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Landmark } from "./data36";
import styles from "./360markers.module.css"; // Import the module

interface MarkerProps {
  map: maplibregl.Map | null;
  landmarks: Landmark[];
  onMarkerClick: (landmark: Landmark) => void;
}

export default function Markers360({ map, landmarks, onMarkerClick }: MarkerProps) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || !landmarks) return;

    // Remove old markers instantly
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    landmarks.forEach((loc) => {
      const el = document.createElement("div");
      el.className = styles.marker; // Apply module class
      
      const bgImage = loc.images?.[0] || "";
      if (bgImage) el.style.backgroundImage = `url(${bgImage})`;

      el.onclick = (e) => {
        e.stopPropagation();
        onMarkerClick(loc);
      };

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(loc.coords)
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => markersRef.current.forEach((m) => m.remove());
  }, [map, landmarks, onMarkerClick]);

  return null;
}