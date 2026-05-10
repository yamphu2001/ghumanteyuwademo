"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { landmarks, Landmark } from "./dataplay"; 
import { ViewMode } from "../../../UiButton/ModeSwitcher";
import styles from "./playermarkers.module.css"; // Ensure you create this CSS module

interface MarkerProps {
  map: maplibregl.Map | null;
  onMarkerClick: (landmark: Landmark) => void;
  activeMode: ViewMode;
}

export default function PlayMarkers({ map, onMarkerClick, activeMode }: MarkerProps) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    // If map or data is missing, don't proceed
    if (!map || !landmarks) return;

    // Clear existing markers immediately
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    landmarks.forEach((loc) => {
      const el = document.createElement("div");
      
      // Use the CSS module class for styling (pulse, etc)
      el.className = styles.playMarker; 
      
      const bgImage = loc.images?.[0] || "";
      if (bgImage) el.style.backgroundImage = `url(${bgImage})`;

      el.onclick = (e) => {
        e.stopPropagation();
        onMarkerClick(loc);
      };

      // Use loc.coords directly as it works in your 360 version
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(loc.coords as any) 
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => markersRef.current.forEach((m) => m.remove());
  }, [map, activeMode, onMarkerClick]);

  return null;
}