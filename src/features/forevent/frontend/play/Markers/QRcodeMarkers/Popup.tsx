
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Popup.module.css";
// Ensure this type import matches your updated Logic.ts naming if changed
import type { PopupState } from "./Logic"; 

export interface QRcodeMarkersPopupProps {
  popup: PopupState | null;
  onClose: () => void;
  onOpenScanner?: () => void; // Optional if not used
}

const AUTO_CLOSE_SECONDS = 60;

// Renamed from MuseumMarkersPopup to QRcodeMarkersPopup
export default function QRcodeMarkersPopup({ popup, onClose }: QRcodeMarkersPopupProps) {
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCloseRef.current();
  }, []);

  const handleOverlayClick = useCallback(() => { onCloseRef.current(); }, []);
  const handleSheetClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (popup?.type !== "success") { setCountdown(AUTO_CLOSE_SECONDS); return; }
    
    setCountdown(AUTO_CLOSE_SECONDS);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { 
          clearInterval(intervalRef.current!); 
          setTimeout(() => onCloseRef.current(), 0); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [popup?.type]);

  if (!mounted || !popup) return null;

  // UI for when the user is far away or just nearby but hasn't scanned
  if (popup.type === "far" || popup.type === "nearby") {
    return createPortal(
      <div className={styles.sheetOverlay} onClick={handleOverlayClick}>
        <div className={styles.sheet} onClick={handleSheetClick}>
          <div className={styles.handle} />
          <button className={styles.sheetClose} onClick={handleClose} type="button" aria-label="Close">✕</button>
          <div className={styles.sheetBody}>
            <div className={styles.nearbyIconWrap}><span className={styles.nearbyIcon}>🔍</span></div>
            <h2 className={styles.sheetTitle}>Scan QR Code</h2>
            <p className={styles.sheetText}>
              Go to <strong>{popup.marker.name}</strong> and find the QR code displayed at this location. Then scan it to unlock this marker.
            </p>
            <button className={styles.primaryBtn} onClick={handleClose} type="button">Got it</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // UI for when the QR code is successfully scanned
  // Inside your QRcodeMarkersPopup component, under the "success" block:

if (popup.type === "success") {
    const displayImage = popup.marker.popupImage || popup.marker.image;
    const progress = ((AUTO_CLOSE_SECONDS - countdown) / AUTO_CLOSE_SECONDS) * 100;

    return createPortal(
      <div className={styles.sheetOverlay} onClick={handleOverlayClick}>
        <div className={`${styles.sheet} ${styles.sheetSuccess}`} onClick={handleSheetClick}>
          <div className={styles.handle} />
          
          {/* 1. RENDER THE IMAGE */}
          {displayImage && (
            <div className={styles.imageContainer}>
              <img src={displayImage} alt={popup.marker.name} className={styles.popupImage} />
            </div>
          )}

          <div className={styles.sheetBody}>
            <div className={styles.successHeader}>
              <span className={styles.successBadge}>✓ Code Verified!</span>
              {popup.marker.points ? (
  <span className={styles.pointsBadge}>+{popup.marker.points} Points</span>
) : null}
            </div>

            <h2 className={styles.sheetTitle}>{popup.marker.name}</h2>
            
            {/* 2. RENDER THE DESCRIPTION (popupText) */}
            {popup.marker.popupText && (
              <p className={styles.sheetText}>{popup.marker.popupText}</p>
            )}

            {/* 3. RENDER THE COUNTDOWN/PROGRESS BAR */}
            <div className={styles.timerContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <p className={styles.timerText}>Closing in {countdown}s</p>
            </div>

            <button className={styles.primaryBtn} onClick={handleClose} type="button">
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}