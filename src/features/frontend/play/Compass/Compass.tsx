"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import styles from "./Compass.module.css";

interface CompassProps {
  map: maplibregl.Map | null;
}

// Lower = smoother but slower to follow (Try 0.05 - 0.1)
// Higher = more responsive but more jittery (Try 0.15 - 0.2)
const ALPHA = 0.1; 

function lerpAngle(current: number, target: number, alpha: number): number {
  let delta = ((target - current + 540) % 360) - 180;
  return (current + delta * alpha + 360) % 360;
}

export default function Compass({ map }: CompassProps) {
  const [bearing, setBearing] = useState(0);
  const [gyroOn, setGyroOn] = useState(false);

  // Refs for logic to avoid re-renders during high-frequency sensor updates
  const gyroOnRef = useRef(false);
  const smoothedHeading = useRef<number | null>(null);
  const gyroPendingRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // 1. Sync needle visual with map bearing
  useEffect(() => {
    if (!map) return;
    const sync = () => setBearing(map.getBearing());
    map.on("rotate", sync);
    sync();
    return () => { map.off("rotate", sync); };
  }, [map]);

  // 2. The Animation Loop (Applies rotation to map)
  const applyBearing = useCallback(() => {
    if (gyroPendingRef.current !== null && map) {
      map.setBearing(gyroPendingRef.current);
    }
    rafRef.current = null; // Reset RAF flag
  }, [map]);

  // 3. Sensor Listener
  useEffect(() => {
    if (!map) return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (!gyroOnRef.current) return;

      // Handle iOS (webkitCompassHeading) vs Android (alpha)
      const raw = (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : (360 - (e.alpha ?? 0) + 360) % 360;

      if (raw === null) return;

      // Smoothing logic
      if (smoothedHeading.current === null) {
        smoothedHeading.current = raw;
      } else {
        smoothedHeading.current = lerpAngle(smoothedHeading.current, raw, ALPHA);
      }

      // Queue the map update for the next screen paint
      gyroPendingRef.current = smoothedHeading.current;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(applyBearing);
      }
    };

    // Use absolute orientation if available for better accuracy
    window.addEventListener("deviceorientationabsolute", onOrientation, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      window.removeEventListener("deviceorientation", onOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, applyBearing]);

  // 4. Toggle Logic with Permission Check
  const toggleGyro = async () => {
    const DevOrient = DeviceOrientationEvent as any;

    // Handle iOS Permission Request
    if (typeof DevOrient.requestPermission === "function") {
      try {
        const result = await DevOrient.requestPermission();
        if (result !== "granted") return;
      } catch (err) {
        console.error("Gyro permission denied:", err);
        return;
      }
    }

    const nextState = !gyroOn;
    gyroOnRef.current = nextState;
    setGyroOn(nextState);

    if (!nextState) {
      // Reset map to North when turning gyro off
      smoothedHeading.current = null;
      gyroPendingRef.current = null;
      map?.easeTo({ bearing: 0, duration: 800 });
    }
  };

  return (
    <div className={styles.compassWrapper}>
      <button
        className={`${styles.compassBtn} ${gyroOn ? styles.gyroActive : ""}`}
        onClick={toggleGyro}
        title={gyroOn ? "Disable gyro" : "Enable gyro"}
      >
        <img
          src="/play/compass/center_compass.png"
          alt="Compass Needle"
          className={styles.needle}
          style={{ transform: `rotate(${-bearing}deg)` }}
        />
      </button>
      {gyroOn && <span className={styles.gyroLabel}>GYRO ACTIVE</span>}
    </div>
  );
}
