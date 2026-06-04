

"use client";

import { useEffect, useState } from "react";
import styles from "./Compass.module.css";

interface CompassProps {
  map: any; // Handles mapRef.current or raw map object
}

export default function Compass({ map }: CompassProps) {
  const [rotation, setRotation] = useState(0); // Map Rotation

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

  // --- Reset Map to North on Click ---
  const handleClick = () => {
    const inst = map?.current ? map.current : map;
    inst?.easeTo({ bearing: 0, duration: 500 });
  };

  return (
    <div className={styles.compassWrapper}>
      <button 
        className={styles.compassBtn}
        onClick={handleClick}
        title="Reset to North"
      >
        <img 
          src="/play/compass/center_compass.png" 
          style={{ transform: `rotate(${-rotation}deg)` }} 
          alt="Compass Needle"
          className={styles.needle}
        />
      </button>
    </div>
  );
}