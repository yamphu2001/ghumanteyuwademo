"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { maskGeoJSON, hardBounds } from "./boundary";

interface MapProps {
  onMapReady: (map: maplibregl.Map) => void;
  onUserInteraction: () => void;
}

export default function Map({ onMapReady, onUserInteraction }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    // Prevent re-initialization if map already exists or container isn't ready
    if (!mapContainer.current || mapRef.current) return;

    // Initialize the Map
    const map = new maplibregl.Map({
      container: mapContainer.current,
      // Using a clean style to make the "Island" effect stand out
      style: "https://tiles.openfreemap.org/styles/liberty",
      // Corrected order: [Longitude, Latitude]
      center: [85.30726278258544, 27.70404401939056], 
      zoom: 17.5,
      pitch: 45,
      bearing: 0,
      maxBounds: hardBounds, // Prevents panning outside the area
      minZoom: 16,           // Prevents zooming out to see the "world"
    });

    mapRef.current = map;

    map.on("load", () => {
      // 1. Add the Masking Source (The "Donut" hole)
      map.addSource("museum-mask", {
        type: "geojson",
        data: maskGeoJSON,
      });

      // 2. The Blackout Curtain: Hides everything outside the boundary
      map.addLayer({
        id: "curtain-layer",
        type: "fill",
        source: "museum-mask",
        paint: {
          "fill-color": "#000000",
          "fill-opacity": 1,
        },
      });

      // 3. Optional: Add a subtle glow/line to the edge of the island
      map.addLayer({
        id: "island-edge",
        type: "line",
        source: "museum-mask",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.5,
          "line-opacity": 0.3,
        },
      });

      // Signal to parent that map is ready
      onMapReady(map);
      
      // Force a resize to ensure it fills the container correctly
      setTimeout(() => map.resize(), 100);
    });

    // Handle user interaction
    map.on("dragstart", onUserInteraction);

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Keep dependencies empty to prevent the infinite refresh loop
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Optional: Vignette effect to fade edges into the dark site theme */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
}