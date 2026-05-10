"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { boundaryCoords } from './boundary';
import { LocationMarkers } from './locationmarkers';

export const FloatingIslandMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeMap, setActiveMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    // Ensure the polygon is closed
    const coords = [...boundaryCoords];
    if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
      coords.push(coords[0]);
    }

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [85.3068, 27.7048],
      zoom: 17.5,
      pitch: 35,
      bearing: -15,
    });

    m.on('load', () => {
      // Logic to ensure the hole is Clockwise (Right-Hand Rule)
      const isClockwise = (pts: [number, number][]) => {
        let sum = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          sum += (pts[i + 1][0] - pts[i][0]) * (pts[i + 1][1] + pts[i][1]);
        }
        return sum > 0;
      };

      const holeCoords = isClockwise(coords) ? coords : [...coords].reverse();

      const worldMask = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[-180, 90], [-180, -90], [180, -90], [180, 90], [-180, 90]], // Outer Ring
            holeCoords, // Inner Hole (The Island)
          ],
        },
      };

      m.addSource('mask', { type: 'geojson', data: worldMask as any });

      // 1. Dark background
      m.addLayer({
        id: 'mask-layer',
        type: 'fill',
        source: 'mask',
        paint: { 'fill-color': '#0B0E14', 'fill-opacity': 1 }
      });

      // 2. 3D Walls
      m.addLayer({
        id: 'mask-walls',
        type: 'fill-extrusion',
        source: 'mask',
        paint: {
          'fill-extrusion-color': '#1a1d23',
          'fill-extrusion-height': 4,
          'fill-extrusion-base': 0
        }
      });

      // 3. Neon Red Outline
      m.addLayer({
        id: 'outline',
        type: 'line',
        source: 'mask',
        paint: { 'line-color': '#fe4f4f', 'line-width': 2 }
      });

      mapRef.current = m;
      setActiveMap(m);
    });

    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div 
        ref={mapContainer} 
        style={{ position: 'fixed', inset: 0, backgroundColor: '#0B0E14' }}
    >
        {/* activeMap must be the state updated by setMapInstance(m) */}
        {activeMap && <LocationMarkers map={activeMap} />}
    </div>
    );
};