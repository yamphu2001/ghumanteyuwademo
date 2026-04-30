"use client";

import React, { useEffect, useState } from 'react';
import styles from './Speedometer.module.css';

export default function Speedometer() {
  const [speed, setSpeed] = useState<number>(0);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const rawSpeed = pos.coords.speed; // meters per second
        if (rawSpeed && rawSpeed > 0) {
          setSpeed(rawSpeed * 3.6); // Convert to km/h
        } else {
          setSpeed(0);
        }
      },
      (err) => console.warn("Speedometer Error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className={styles.speedWrapper}>
      <span className={styles.speedValue}>{Math.round(speed)}</span>
      <span className={styles.speedUnit}>km/h</span>
    </div>
  );
}