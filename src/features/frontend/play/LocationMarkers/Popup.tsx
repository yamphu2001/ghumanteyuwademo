
"use client";
import React, { useEffect, useRef, useState } from 'react';
import styles from './Popup.module.css';
import { Landmark } from './Landmark';

const AUTO_SKIP_SEC = 60;

interface MarkerPopupProps {
  marker: Landmark;
  onClose: () => void;
}

export default function MarkerPopup({ marker, onClose }: MarkerPopupProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_SKIP_SEC);

  // ✅ FIX: keep onClose in a ref so the interval never goes stale
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    // Reset timer every time a new marker popup opens
    setSecondsLeft(AUTO_SKIP_SEC);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCloseRef.current(); // ✅ always calls the latest onClose
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [marker.id]); // ✅ re-runs when a different marker's popup opens

  const progress       = (secondsLeft / AUTO_SKIP_SEC) * 100;
  const radius         = 20;
  const circumference  = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className={styles.fullScreenOverlay}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>

        <button className={styles.skipBtn} onClick={onCloseRef.current} aria-label="Skip">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle
              cx="26" cy="26" r={radius}
              fill="rgba(0,0,0,0.55)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
            />
            <circle
              cx="26" cy="26" r={radius}
              fill="none"
              stroke="#ffee00"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <text x="26" y="23" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600">
              SKIP
            </text>
            <text x="26" y="34" textAnchor="middle" fill="#ffee00" fontSize="10" fontWeight="700">
              {secondsLeft}
            </text>
          </svg>
        </button>

        <div
          className={styles.heroImage}
          style={{ backgroundImage: `url(${marker.popupImage || marker.image})` }}
        >
          {!marker.popupImage && !marker.image && (
            <div className={styles.imagePlaceholder}>No Image Available</div>
          )}
        </div>

        <div className={styles.scrollContent}>
          <h2 className={styles.title}>{marker.name}</h2>
          <div className={styles.divider} />
          <p className={styles.description}>
            {marker.description ?? 'Sorry, no description available for this landmark.'}
          </p>
        </div>

      </div>
    </div>
  );
}