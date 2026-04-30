"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const LIBERTY_LIGHT = "https://tiles.openfreemap.org/styles/bright";
const CENTER: [number, number] = [85.324, 27.717];
const DEFAULT_ZOOM = 14;

export interface MapCanvasHandle {
  getMap: () => maplibregl.Map | null;
}

const MapCanvas = forwardRef<MapCanvasHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: LIBERTY_LIGHT,
      center: CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false, // Disables the default injection
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Hide the Logo, the Attribution Button, and the Attribution Container */}
      <style jsx global>{`
        .maplibregl-ctrl-logo,
        .maplibregl-ctrl-attrib,
        .maplibregl-ctrl-attrib-button {
          display: none !important;
        }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

MapCanvas.displayName = "MapCanvas";
export default MapCanvas;