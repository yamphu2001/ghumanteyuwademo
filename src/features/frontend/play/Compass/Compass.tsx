"use client";

import { useEffect, useState } from "react";
import styles from "./Compass.module.css";

interface CompassProps {
  map: any; // Handles mapRef.current or raw map object
}

export default function Compass({ map }: CompassProps) {
  const [rotation, setRotation] = useState(0); // Map Rotation
  const [gyroOn, setGyroOn] = useState(false); // Hardware Toggle

  // --- Sync with Map Rotation ---
  useEffect(() => {
    const inst = map?.current ? map.current : map;
    if (!inst || typeof inst.on !== 'function') return;

    const handleRotate = () => setRotation(inst.getBearing());
    inst.on("rotate", handleRotate);
    inst.on("move", handleRotate);
    handleRotate();

    return () => {
      inst.off("rotate", handleRotate);
      inst.off("move", handleRotate);
    };
  }, [map]);

  // --- Hardware Gyro Logic ---
  useEffect(() => {
    if (!gyroOn) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS: webkitCompassHeading | Android: 360 - alpha
      const heading = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      
      const inst = map?.current ? map.current : map;
      if (inst && typeof inst.setBearing === 'function') {
        // Force the map to rotate as the user turns their body
        inst.setBearing(heading);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [gyroOn, map]);

  // --- Permission Handshake (Required for iOS) ---
  const handleClick = async () => {
    const DeviceOrientation = DeviceOrientationEvent as any;
    
    // Check if iOS 13+ requires permission
    if (typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientation.requestPermission();
        if (permission === 'granted') {
          setGyroOn((prev) => !prev);
        } else {
          console.error("Gyro permission denied by user.");
        }
      } catch (err) {
        console.error("Gyro Permission Error:", err);
      }
    } else {
      // Android / Desktop / Older iOS
      setGyroOn((prev) => !prev);
    }

    // Always reset map to North (0 deg) on click
    const inst = map?.current ? map.current : map;
    inst?.easeTo({ bearing: 0, duration: 500 });
  };

  return (
    <div className={styles.compassWrapper}>
      <button 
        className={`${styles.compassBtn} ${gyroOn ? styles.gyroActive : ""}`}
        onClick={handleClick}
        title={gyroOn ? "Disable Gyro" : "Enable Gyro Sync"}
      >
        <img 
          src="/play/compass/center_compass.png" 
          style={{ transform: `rotate(${-rotation}deg)` }} 
          alt="Compass Needle"
          className={styles.needle}
        />
      </button>
      {gyroOn && <span className={styles.gyroLabel}>GYRO ON</span>}
    </div>
  );
}