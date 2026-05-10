"use client";
import React, { useEffect, useRef, useCallback, useState } from 'react';
import styles from './PlayerMarker.module.css';

// ── Split imports: GPS tracking from PlayerMarker logic, grid utils from GridPlot logic
import { startPlayerTracking, stopPlayerTracking } from './logic';
import { getCellId, generateCellPolygon } from '@/features/forevent/frontend/play/GridPlot/logic';

import { LngLat } from '@/features/frontend/play/PlayerMarker/type';
import { useGridStore } from '../GridPlot/GridStore';
interface PlayerMarkerProps {
  map: React.MutableRefObject<any>;
  imagePath: string;
}

const GYRO_ALPHA    = 0.05;
const GYRO_DEADZONE = 3.0;
const STEP_SIZE     = 0.00015;
const MOVE_INTERVAL = 120;

export default function PlayerMarker({ map, imagePath }: PlayerMarkerProps) {
  const coordsRef    = useRef<LngLat | null>(null);
  const markerRef    = useRef<HTMLDivElement>(null);
  const dotRef       = useRef<HTMLDivElement>(null);
  const isWASDMode   = useRef(false);
  const wasdTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keysHeld     = useRef<Set<string>>(new Set());
  const rafRef       = useRef<number | null>(null);
  const lastTime     = useRef<number>(0);

  const gyroEnabledRef  = useRef(false);
  const gyroFilteredRef = useRef(0);
  const gyroAppliedRef  = useRef(0);
  const gyroSeededRef   = useRef(false);
  const gyroPendingRef  = useRef<number | null>(null);
  const gyroRafRef      = useRef<number | null>(null);

  const [gyroOn, setGyroOn] = useState(false);

  // ── Grid store ─────────────────────────────────────────────────────────────
  const { addCell } = useGridStore() as any;

  // ── Sync marker to current coordsRef ──────────────────────────────────────
  const syncMarker = useCallback(() => {
    const el = markerRef.current;
    const m  = map.current;
    if (!el || !m || !coordsRef.current) return;
    const pt = m.project(coordsRef.current);
    el.style.transform  = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
    el.style.visibility = 'visible';
  }, [map]);

  // ── Paint one grid cell at current coords ─────────────────────────────────
  const paintCell = useCallback((lng: number, lat: number) => {
    const id = getCellId(lng, lat);
    addCell(id, {
      type      : 'Feature',
      properties: { color: '#00f2ff', id },
      geometry  : { type: 'Polygon', coordinates: generateCellPolygon(lng, lat) },
    });
  }, [addCell]);

  // ── WASD step ─────────────────────────────────────────────────────────────
  const step = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const m = map.current;
    if (!m) return;

    // Use current player coords, fall back to map center on first press
    const base = coordsRef.current;
    const center = m.getCenter();
    let lng = base ? base[0] : center.lng;
    let lat = base ? base[1] : center.lat;

    if (dir === 'up')    lat += STEP_SIZE;
    if (dir === 'down')  lat -= STEP_SIZE;
    if (dir === 'left')  lng -= STEP_SIZE;
    if (dir === 'right') lng += STEP_SIZE;

    // Update the single source of truth
    coordsRef.current = [lng, lat];
    isWASDMode.current = true;
    if (wasdTimeout.current) clearTimeout(wasdTimeout.current);

    // Move map + marker
    m.easeTo({ center: [lng, lat], duration: MOVE_INTERVAL, easing: (t: number) => t });
    syncMarker();

    // Paint grid cell
    paintCell(lng, lat);
  }, [map, syncMarker, paintCell]);

  // ── RAF game loop for held keys ───────────────────────────────────────────
  const loop = useCallback((ts: number) => {
    if (keysHeld.current.size === 0) { rafRef.current = null; return; }

    if (ts - lastTime.current >= MOVE_INTERVAL) {
      lastTime.current = ts;
      if (keysHeld.current.has('w') || keysHeld.current.has('arrowup'))    step('up');
      if (keysHeld.current.has('s') || keysHeld.current.has('arrowdown'))  step('down');
      if (keysHeld.current.has('a') || keysHeld.current.has('arrowleft'))  step('left');
      if (keysHeld.current.has('d') || keysHeld.current.has('arrowright')) step('right');
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [step]);

  // ── Keyboard listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const KEYS = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!KEYS.includes(k)) return;
      e.preventDefault();

      if (!keysHeld.current.has(k)) {
        keysHeld.current.add(k);
        // Fire immediately on first press
        if (k === 'w' || k === 'arrowup')    step('up');
        if (k === 's' || k === 'arrowdown')  step('down');
        if (k === 'a' || k === 'arrowleft')  step('left');
        if (k === 'd' || k === 'arrowright') step('right');

        if (!rafRef.current) {
          lastTime.current = performance.now();
          rafRef.current   = requestAnimationFrame(loop);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysHeld.current.delete(k);

      if (KEYS.includes(k)) {
        // Resume GPS after 1 s of no WASD
        wasdTimeout.current = setTimeout(() => { isWASDMode.current = false; }, 1000);
      }

      if (keysHeld.current.size === 0 && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [step, loop]);

  // ── GPS Tracking ──────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LngLat = [pos.coords.longitude, pos.coords.latitude];
        coordsRef.current = coords;
        syncMarker();
        m.easeTo({ center: coords, duration: 600, easing: (t: number) => t * (2 - t) });
      },
      (err) => console.warn('[PlayerMarker] Initial GPS error:', err.code, err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    const watchId = startPlayerTracking(
      (newCoords) => {
        if (isWASDMode.current) return;   // ← WASD takes priority over GPS
        coordsRef.current = newCoords;
        syncMarker();
        m.easeTo({ center: newCoords, duration: 800, easing: (t: number) => t * (2 - t) });
      },
      (err) => console.warn('[PlayerMarker] Watch GPS error:', err.code, err.message)
    );

    m.on('move',   syncMarker);
    m.on('zoom',   syncMarker);
    m.on('rotate', syncMarker);

    const ro = new ResizeObserver(syncMarker);
    ro.observe(m.getContainer());

    return () => {
      stopPlayerTracking(watchId);
      m.off('move',   syncMarker);
      m.off('zoom',   syncMarker);
      m.off('rotate', syncMarker);
      ro.disconnect();
    };
  }, [map, syncMarker]);

  // ── Gyro ──────────────────────────────────────────────────────────────────
  const applyBearing = useCallback(() => {
    gyroRafRef.current = null;
    if (!gyroEnabledRef.current || !map.current || gyroPendingRef.current === null) return;
    map.current.setBearing(gyroPendingRef.current);
  }, [map]);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!gyroEnabledRef.current) return;
    let raw: number | null = null;
    if (typeof (e as any).webkitCompassHeading === 'number') {
      raw = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null) {
      raw = (360 - e.alpha) % 360;
    }
    if (raw === null) return;
    raw = ((raw % 360) + 360) % 360;

    if (!gyroSeededRef.current) {
      gyroFilteredRef.current = raw;
      gyroAppliedRef.current  = raw;
      gyroSeededRef.current   = true;
      return;
    }

    let delta = raw - gyroFilteredRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    gyroFilteredRef.current = ((gyroFilteredRef.current + GYRO_ALPHA * delta) + 360) % 360;

    let diff = gyroFilteredRef.current - gyroAppliedRef.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < GYRO_DEADZONE) return;

    gyroAppliedRef.current = gyroFilteredRef.current;
    if (dotRef.current) dotRef.current.style.display = 'block';
    gyroPendingRef.current = gyroAppliedRef.current;
    if (!gyroRafRef.current) gyroRafRef.current = requestAnimationFrame(applyBearing);
  }, [applyBearing]);

  useEffect(() => {
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation',         handleOrientation as EventListener, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation',         handleOrientation as EventListener, true);
      if (gyroRafRef.current) cancelAnimationFrame(gyroRafRef.current);
    };
  }, [handleOrientation]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={markerRef}
      className={styles.markerContainer}
      style={{ visibility: 'hidden', transform: 'translate3d(-9999px, -9999px, 0)' }}
    >
      <div ref={dotRef} className={styles.facingDot} style={{ display: 'none' }} />
      <img
        src={imagePath}
        className={styles.playerIcon}
        alt="Player"
        onError={(e) => {
          console.warn('[PlayerMarker] Image failed to load:', imagePath);
          const el = e.currentTarget;
          el.style.display = 'none';
          const parent = el.parentElement;
          if (parent) {
            parent.style.background    = '#00f2ff';
            parent.style.borderRadius  = '50%';
            parent.style.border        = '3px solid white';
            parent.style.boxShadow     = '0 0 0 4px rgba(0,242,255,0.3)';
            parent.style.visibility    = 'visible';
          }
        }}
        onClick={() =>
          coordsRef.current && map.current?.flyTo({ center: coordsRef.current, zoom: 18 })
        }
      />
    </div>
  );
}