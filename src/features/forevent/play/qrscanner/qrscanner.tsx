
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './qrscanner.module.css';
import { scanFrameLogic } from './logic';

interface QRScannerProps {
  onScanSuccess?: (result: string) => void;
  onClose?: () => void;
}

const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0); 

  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const tick: FrameRequestCallback = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Confirm hardware layers are passing active pixel streams
    if (video && canvas && video.readyState >= 4) {
      const now = Date.now();
      
      if (now - lastScanTimeRef.current > 250) {
        lastScanTimeRef.current = now;
        
        // FIX: Explicitly assign frame dimensions to matching aspect ratios.
        // This ensures the canvas processes the full camera feed layout without compression or clipping.
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const result = scanFrameLogic(video, canvas);
        if (result) {
          console.log("[QRScanner] Decoded QR Text content successfully:", result);
          if (onScanSuccessRef.current) {
            onScanSuccessRef.current(result);
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // FIX: Optimized with high-definition video parameters and auto-focus lens targeting
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        requestRef.current = requestAnimationFrame(tick);
        setIsReady(true);
      }
    })
    .catch((err) => console.error("Camera access failed:", err));

    return () => stopCamera();
  }, [tick, stopCamera]);

  return (
    <div className={`${styles.container} ${isReady ? styles.active : styles.inactive}`}>
      <video ref={videoRef} autoPlay playsInline muted className={`${styles.cameraVideo} absolute inset-0`} />
      
      {/* Safe hidden offscreen layout tracking area */}
      <canvas ref={canvasRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} />

      <div className={styles.uiOverlay}>
        <div className={styles.uiBox}>
          <div className={styles.scanSquare}>
            <div className={styles.scanCorners}>
              <div className={`${styles.corner} ${styles.topL}`} />
              <div className={`${styles.corner} ${styles.topR}`} />
              <div className={`${styles.corner} ${styles.botL}`} />
              <div className={`${styles.corner} ${styles.botR}`} />
            </div>
            <div className={styles.laserLine} />
          </div>
          <div className={`${styles.hand} ${styles.leftHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
            <Image src="/images/QRScanner/Left.png" alt="Left hand" fill className={styles.handImageBottomRight} priority />
          </div>
          <div className={`${styles.hand} ${styles.rightHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
            <Image src="/images/QRScanner/Right.png" alt="Right hand" fill className={styles.handImageTopLeft} priority />
          </div>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close QR scanner"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QRScanner;