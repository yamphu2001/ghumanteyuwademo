"use client";
import React, { useEffect, useRef, useCallback } from 'react';
import styles from './PlayerMarker.module.css';

// ── Split imports: GPS tracking from PlayerMarker logic, grid utils from GridPlot logic
import { startPlayerTracking, stopPlayerTracking } from './logic';
import { getCellId, generateCellPolygon } from '@/features/frontend/play/GridPlot/logic';

import { LngLat } from '@/features/frontend/play/PlayerMarker/type';
import { useGridStore } from '../GridPlot/GridStore';

interface PlayerMarkerProps {
  map: React.MutableRefObject<any>;
  imagePath: string;
}

export default function PlayerMarker({ map, imagePath }: PlayerMarkerProps) {
  const coordsRef = useRef<LngLat | null>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  
  // ── Grid store ─────────────────────────────────────────────────────────────
  const { addCell } = useGridStore() as any;

  // ── Sync marker to current coordsRef ──────────────────────────────────────
  const syncMarker = useCallback(() => {
    const el = markerRef.current;
    const m = map.current;
    if (!el || !m || !coordsRef.current) return;
    const pt = m.project(coordsRef.current);
    el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
    el.style.visibility = 'visible';
  }, [map]);

  // ── Paint one grid cell at current coords ─────────────────────────────────
  const paintCell = useCallback((lng: number, lat: number) => {
    const id = getCellId(lng, lat);
    addCell(id, {
      type: 'Feature',
      properties: { color: '#00f2ff', id },
      geometry: { type: 'Polygon', coordinates: generateCellPolygon(lng, lat) },
    });
  }, [addCell]);

  // ── GPS Tracking ──────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LngLat = [pos.coords.longitude, pos.coords.latitude];
        coordsRef.current = coords;
        syncMarker();
        m.easeTo({ center: coords, duration: 600, easing: (t: number) => t * (2 - t) });
        paintCell(coords[0], coords[1]);
      },
      (err) => console.warn('[PlayerMarker] Initial GPS error:', err.code, err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    // Continuous tracking
    const watchId = startPlayerTracking(
      (newCoords) => {
        coordsRef.current = newCoords;
        syncMarker();
        m.easeTo({ center: newCoords, duration: 800, easing: (t: number) => t * (2 - t) });
        paintCell(newCoords[0], newCoords[1]);
      },
      (err) => console.warn('[PlayerMarker] Watch GPS error:', err.code, err.message)
    );

    // Keep marker synced when map moves/zooms
    m.on('move', syncMarker);
    m.on('zoom', syncMarker);
    m.on('rotate', syncMarker);

    const container = m.getContainer();
    const ro = new ResizeObserver(syncMarker);
    if (container) ro.observe(container);

    return () => {
      stopPlayerTracking(watchId);
      m.off('move', syncMarker);
      m.off('zoom', syncMarker);
      m.off('rotate', syncMarker);
      ro.disconnect();
    };
  }, [map, syncMarker, paintCell]);

  return (
    <div
      ref={markerRef}
      className={styles.markerContainer}
      style={{ visibility: 'hidden', transform: 'translate3d(-9999px, -9999px, 0)' }}
    >
      <img
        src={imagePath}
        className={styles.playerIcon}
        alt="Player"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          const parent = el.parentElement;
          if (parent) {
            parent.style.background = '#00f2ff';
            parent.style.borderRadius = '50%';
            parent.style.border = '3px solid white';
            parent.style.boxShadow = '0 0 0 4px rgba(0,242,255,0.3)';
            parent.style.visibility = 'visible';
          }
        }}
        onClick={() =>
          coordsRef.current && map.current?.flyTo({ center: coordsRef.current, zoom: 18 })
        }
      />
    </div>
  );
}
