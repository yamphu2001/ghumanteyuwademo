'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import styles from './qrscanner.module.css';
import { scanFrameLogic } from './logic'; 

interface QRScannerProps {
  onScan?: (data: string) => void;
}

const QRScanner = ({ onScan }: QRScannerProps) => {
  const [isReady, setIsReady] = useState(false);
  
  // FIXED: Added (null) to all useRef calls to satisfy TS
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      
      const result = scanFrameLogic(videoRef.current, canvasRef.current);

      if (result) {
        alert(`QR Code Found: ${result}`);
        if (onScan) onScan(result);
        return; 
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          requestRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    }
    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`${styles.container} ${isReady ? styles.active : styles.inactive}`}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} />
      
      {/* Invisible canvas for logic processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className={styles.uiBox}>
        <div className={styles.scanSquare} />
        <div className={`${styles.hand} ${styles.leftHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
          <Image src="/images/QRScanner/Left.png" alt="Left" fill className={styles.handImageBottomRight} priority />
        </div>
        <div className={`${styles.hand} ${styles.rightHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
          <Image src="/images/QRScanner/Right.png" alt="Right" fill className={styles.handImageTopLeft} priority />
        </div>
      </div>
    </div>
  );
};

export default QRScanner;