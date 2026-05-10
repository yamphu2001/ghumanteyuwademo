// "use client";
// import React, { useEffect, useRef, useCallback, useState } from 'react';
// import styles from './PlayerMarker.module.css';
// import { startPlayerTracking, stopPlayerTracking } from './logic';
// import { LngLat } from '@/features/frontend/play/PlayerMarker/type';
// import { setSharedPlayerCoords } from '@/features/frontend/play/GridPlot/Today/GridDebug';

// interface PlayerMarkerProps {
//   map: React.MutableRefObject<any>;
//   imagePath: string;
// }

// const GYRO_ALPHA = 0.05;
// const GYRO_DEADZONE = 3.0;

// export default function PlayerMarker({ map, imagePath }: PlayerMarkerProps) {
//   const coordsRef = useRef<LngLat | null>(null);
//   const markerRef = useRef<HTMLDivElement>(null);
//   const dotRef = useRef<HTMLDivElement>(null);
//   const isWASDModeRef = useRef(false);
//   const wasdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const gyroEnabledRef = useRef(false);
//   const gyroFilteredRef = useRef(0);
//   const gyroAppliedRef = useRef(0);
//   const gyroSeededRef = useRef(false);
//   const gyroPendingRef = useRef<number | null>(null);
//   const gyroRafRef = useRef<number | null>(null);

//   const [gyroOn, setGyroOn] = useState(false);

//   // ── Project GPS → pixel on the markerOverlay ──────────────────────────────
//   const syncMarkerToGPS = useCallback(() => {
//     const el = markerRef.current;
//     const m = map.current;
//     if (!el || !m || !coordsRef.current) return;
    
//     // Convert geographic [lng, lat] to pixel coordinates relative to the map container
//     const pt = m.project(coordsRef.current);
//     el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
//     el.style.visibility = 'visible';
//   }, [map]);

//   // ── GPS Tracking ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     const m = map.current;
//     if (!m) return;

//     // 1. Initial Position: Force global sync immediately on load
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const coords: LngLat = [pos.coords.longitude, pos.coords.latitude];
//         coordsRef.current = coords;
        
//         // Sync to global window object for GridDebug to find
//         setSharedPlayerCoords(coords[0], coords[1]);
//         window.sharedPlayerLng = coords[0];
//         window.sharedPlayerLat = coords[1];
        
//         syncMarkerToGPS();
//         m.easeTo({ center: coords, duration: 600, easing: (t: number) => t * (2 - t) });
//       },
//       (err) => console.warn('[PlayerMarker] Initial GPS:', err.code, err.message),
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
//     );

//     // 2. Continuous watch
//     const watchId = startPlayerTracking(
//       (newCoords) => {
//         if (isWASDModeRef.current) return;
//         coordsRef.current = newCoords;
        
//         // Update Shared Coords for GridPlotting and window state
//         setSharedPlayerCoords(newCoords[0], newCoords[1]);
//         window.sharedPlayerLng = newCoords[0];
//         window.sharedPlayerLat = newCoords[1];
        
//         syncMarkerToGPS();

//         // Smoothly follow the player with the camera only if not in WASD mode
//         m.easeTo({ 
//           center: newCoords, 
//           duration: 800, 
//           easing: (t: number) => t * (2 - t) 
//         });
//       },
//       (err) => console.warn('[PlayerMarker] Watch GPS:', err.code, err.message)
//     );

//     // Listen to map events to keep marker "pinned" to the ground while sliding/zooming
//     m.on('move', syncMarkerToGPS);
//     m.on('zoom', syncMarkerToGPS);
//     m.on('rotate', syncMarkerToGPS);

//     const ro = new ResizeObserver(syncMarkerToGPS);
//     ro.observe(m.getContainer());

//     return () => {
//       stopPlayerTracking(watchId);
//       m.off('move', syncMarkerToGPS);
//       m.off('zoom', syncMarkerToGPS);
//       m.off('rotate', syncMarkerToGPS);
//       ro.disconnect();
//     };
//   }, [map, syncMarkerToGPS]);

//   // ── WASD Movement Listener ────────────────────────────────────────────────
//   useEffect(() => {
//     const onMove = (e: Event) => {
//       const { lng, lat } = (e as CustomEvent).detail as { lng: number; lat: number };
//       isWASDModeRef.current = true;
      
//       if (wasdTimeoutRef.current) clearTimeout(wasdTimeoutRef.current);
      
//       const newCoords: LngLat = [lng, lat];
//       coordsRef.current = newCoords;

//       // Ensure window object stays in sync with custom movement
//       window.sharedPlayerLng = lng;
//       window.sharedPlayerLat = lat;
//       setSharedPlayerCoords(lng, lat); 

//       syncMarkerToGPS();

//       // Follow player during WASD movement
//       map.current?.easeTo({ center: newCoords, duration: 100, easing: (t: number) => t });
//     };

//     const onKeyUp = (e: KeyboardEvent) => {
//       const key = e.key.toLowerCase();
//       if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
//         wasdTimeoutRef.current = setTimeout(() => { isWASDModeRef.current = false; }, 1000);
//       }
//     };

//     window.addEventListener('player-move', onMove);
//     window.addEventListener('keyup', onKeyUp);
//     return () => {
//       window.removeEventListener('player-move', onMove);
//       window.removeEventListener('keyup', onKeyUp);
//       if (wasdTimeoutRef.current) clearTimeout(wasdTimeoutRef.current);
//     };
//   }, [map, syncMarkerToGPS]);

//   // ── Gyro / Orientation Logic ──────────────────────────────────────────────
//   const applyBearing = useCallback(() => {
//     gyroRafRef.current = null;
//     if (!gyroEnabledRef.current || !map.current || gyroPendingRef.current === null) return;
//     map.current.setBearing(gyroPendingRef.current);
//   }, [map]);

//   const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
//     if (!gyroEnabledRef.current) return;

//     let raw: number | null = null;
//     if (typeof (e as any).webkitCompassHeading === 'number') {
//       raw = (e as any).webkitCompassHeading;
//     } else if (e.alpha !== null && e.alpha !== undefined) {
//       raw = (360 - e.alpha) % 360;
//     }
//     if (raw === null) return;
//     raw = ((raw % 360) + 360) % 360;

//     if (!gyroSeededRef.current) {
//       gyroFilteredRef.current = raw;
//       gyroAppliedRef.current = raw;
//       gyroSeededRef.current = true;
//       return;
//     }

//     let delta = raw - gyroFilteredRef.current;
//     if (delta > 180) delta -= 360;
//     if (delta < -180) delta += 360;
//     gyroFilteredRef.current = ((gyroFilteredRef.current + GYRO_ALPHA * delta) + 360) % 360;

//     let diff = gyroFilteredRef.current - gyroAppliedRef.current;
//     if (diff > 180) diff -= 360;
//     if (diff < -180) diff += 360;
//     if (Math.abs(diff) < GYRO_DEADZONE) return;

//     gyroAppliedRef.current = gyroFilteredRef.current;

//     if (dotRef.current && dotRef.current.style.display === 'none') {
//       dotRef.current.style.display = 'block';
//     }

//     gyroPendingRef.current = gyroAppliedRef.current;
//     if (!gyroRafRef.current) {
//       gyroRafRef.current = requestAnimationFrame(applyBearing);
//     }
//   }, [applyBearing]);

//   useEffect(() => {
//     window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
//     window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
//     return () => {
//       window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
//       window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
//       if (gyroRafRef.current) cancelAnimationFrame(gyroRafRef.current);
//     };
//   }, [handleOrientation]);

//   return (
//     <div
//       ref={markerRef}
//       className={styles.markerContainer}
//       style={{ visibility: 'hidden' }}
//     >
//       <div ref={dotRef} className={styles.facingDot} style={{ display: 'none' }} />
//       <img
//         src={imagePath}
//         className={styles.playerIcon}
//         alt="Player"
//         onError={(e) => {
//           const el = e.currentTarget;
//           el.style.display = 'none';
//           const parent = el.parentElement;
//           if (parent) {
//             parent.style.background = '#00f2ff';
//             parent.style.borderRadius = '50%';
//             parent.style.border = '3px solid white';
//             parent.style.boxShadow = '0 0 0 4px rgba(0,242,255,0.3)';
//             parent.style.visibility = 'visible';
//           }
//         }}
//         onClick={() =>
//           coordsRef.current && map.current?.flyTo({ center: coordsRef.current, zoom: 18 })
//         }
//       />
//     </div>
//   );
// }


"use client";
import React, { useEffect, useRef, useCallback, useState } from 'react';
import styles from './PlayerMarker.module.css';
import { startPlayerTracking, stopPlayerTracking } from './logic';
import { LngLat } from '@/features/frontend/play/PlayerMarker/type';
import { setSharedPlayerCoords } from '@/features/frontend/play/GridPlot/Today/GridDebug';

interface PlayerMarkerProps {
  map: React.MutableRefObject<any>;
  imagePath: string;
}

const GYRO_ALPHA = 0.05;
const GYRO_DEADZONE = 3.0;

export default function PlayerMarker({ map, imagePath }: PlayerMarkerProps) {
  const coordsRef = useRef<LngLat | null>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const isWASDModeRef = useRef(false);
  const wasdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gyroEnabledRef = useRef(false);
  const gyroFilteredRef = useRef(0);
  const gyroAppliedRef = useRef(0);
  const gyroSeededRef = useRef(false);
  const gyroPendingRef = useRef<number | null>(null);
  const gyroRafRef = useRef<number | null>(null);

  const [gyroOn, setGyroOn] = useState(false);

  const syncMarkerToGPS = useCallback(() => {
    const el = markerRef.current;
    const m = map.current;
    if (!el || !m || !coordsRef.current) return;

    const pt = m.project(coordsRef.current);
    el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
    // ✅ FIX: only make visible after we have real coordinates
    el.style.visibility = 'visible';
  }, [map]);

  // ── GPS Tracking ───────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    // ✅ FIX: log HTTPS/geolocation diagnostics on production
    if (typeof window !== 'undefined') {
      if (!navigator.geolocation) {
        console.error('[PlayerMarker] Geolocation API not available');
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.error('[PlayerMarker] Geolocation blocked — page is not on HTTPS');
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LngLat = [pos.coords.longitude, pos.coords.latitude];
        coordsRef.current = coords;
        setSharedPlayerCoords(coords[0], coords[1]);
        window.sharedPlayerLng = coords[0];
        window.sharedPlayerLat = coords[1];
        syncMarkerToGPS();
        m.easeTo({ center: coords, duration: 600, easing: (t: number) => t * (2 - t) });
      },
      (err) => console.warn('[PlayerMarker] Initial GPS error:', err.code, err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    const watchId = startPlayerTracking(
      (newCoords) => {
        if (isWASDModeRef.current) return;
        coordsRef.current = newCoords;
        setSharedPlayerCoords(newCoords[0], newCoords[1]);
        window.sharedPlayerLng = newCoords[0];
        window.sharedPlayerLat = newCoords[1];
        syncMarkerToGPS();
        m.easeTo({
          center: newCoords,
          duration: 800,
          easing: (t: number) => t * (2 - t)
        });
      },
      (err) => console.warn('[PlayerMarker] Watch GPS error:', err.code, err.message)
    );

    m.on('move', syncMarkerToGPS);
    m.on('zoom', syncMarkerToGPS);
    m.on('rotate', syncMarkerToGPS);

    const ro = new ResizeObserver(syncMarkerToGPS);
    ro.observe(m.getContainer());

    return () => {
      stopPlayerTracking(watchId);
      m.off('move', syncMarkerToGPS);
      m.off('zoom', syncMarkerToGPS);
      m.off('rotate', syncMarkerToGPS);
      ro.disconnect();
    };
  }, [map, syncMarkerToGPS]);

  // ── WASD Movement ────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: Event) => {
      const { lng, lat } = (e as CustomEvent).detail as { lng: number; lat: number };
      isWASDModeRef.current = true;
      if (wasdTimeoutRef.current) clearTimeout(wasdTimeoutRef.current);
      const newCoords: LngLat = [lng, lat];
      coordsRef.current = newCoords;
      window.sharedPlayerLng = lng;
      window.sharedPlayerLat = lat;
      setSharedPlayerCoords(lng, lat);
      syncMarkerToGPS();
      map.current?.easeTo({ center: newCoords, duration: 100, easing: (t: number) => t });
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
        wasdTimeoutRef.current = setTimeout(() => { isWASDModeRef.current = false; }, 1000);
      }
    };

    window.addEventListener('player-move', onMove);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('player-move', onMove);
      window.removeEventListener('keyup', onKeyUp);
      if (wasdTimeoutRef.current) clearTimeout(wasdTimeoutRef.current);
    };
  }, [map, syncMarkerToGPS]);

  // ── Gyro Logic ───────────────────────────────────────────────────────────
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
    } else if (e.alpha !== null && e.alpha !== undefined) {
      raw = (360 - e.alpha) % 360;
    }
    if (raw === null) return;
    raw = ((raw % 360) + 360) % 360;

    if (!gyroSeededRef.current) {
      gyroFilteredRef.current = raw;
      gyroAppliedRef.current = raw;
      gyroSeededRef.current = true;
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
    if (dotRef.current && dotRef.current.style.display === 'none') {
      dotRef.current.style.display = 'block';
    }
    gyroPendingRef.current = gyroAppliedRef.current;
    if (!gyroRafRef.current) {
      gyroRafRef.current = requestAnimationFrame(applyBearing);
    }
  }, [applyBearing]);

  useEffect(() => {
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      if (gyroRafRef.current) cancelAnimationFrame(gyroRafRef.current);
    };
  }, [handleOrientation]);

  return (
    <div
      ref={markerRef}
      className={styles.markerContainer}
      // ✅ FIX: start off-screen instead of hidden
      // marker is invisible but positioned off-screen until GPS places it
      // this means onError fallback can still make it visible
      style={{ visibility: 'hidden', transform: 'translate3d(-9999px, -9999px, 0)' }}
    >
      <div ref={dotRef} className={styles.facingDot} style={{ display: 'none' }} />
      <img
        src={imagePath}
        className={styles.playerIcon}
        alt="Player"
        onError={(e) => {
          // ✅ FIX: log the failed path so you can see it in Netlify's browser console
          console.warn('[PlayerMarker] Image failed to load:', imagePath);
          const el = e.currentTarget;
          el.style.display = 'none';
          const parent = el.parentElement;
          if (parent) {
            parent.style.background = '#00f2ff';
            parent.style.borderRadius = '50%';
            parent.style.border = '3px solid white';
            parent.style.boxShadow = '0 0 0 4px rgba(0,242,255,0.3)';
            // ✅ FIX: force visible so the fallback circle always shows
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