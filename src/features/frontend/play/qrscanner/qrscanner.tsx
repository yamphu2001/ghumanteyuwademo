'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './qrscanner.module.css';
import jsqr from 'jsqr';
import { handleQrAction } from './logic';
import { auth } from '@/lib/firebase';
import { UnlockedModal } from '../Markers/QRcodeMarkers/UnlockedModal';
import { QRcodeMarkerData } from '../Markers/QRcodeMarkers/Logic';

interface QRScannerProps {
  eventId?: string;
  onClose: () => void;
}

const QRScanner = ({ eventId, onClose }: QRScannerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedMarker, setUnlockedMarker] = useState<QRcodeMarkerData | null>(null);

  const activeEventId = eventId || "ghumante";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stopCamera = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const tick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsqr(imageData.data, imageData.width, imageData.height);

        if (code && !isProcessing) {
          const user = auth.currentUser;

          if (user && activeEventId) {
            setIsProcessing(true);
            console.log("🎯 QR Found:", code.data);

            const result = await handleQrAction(code.data, user.uid, activeEventId);

            if (result.shouldClose) {
              stopCamera();
              if (result.marker) {
                // Show modal instead of closing immediately
                setUnlockedMarker(result.marker);
              } else {
                // Finish scan — just close
                onClose();
              }
              return;
            } else {
              setTimeout(() => setIsProcessing(false), 3000);
            }
          } else {
            if (!user) console.warn("Waiting for Firebase Auth...");
          }
        }
      }
    }

    requestRef.current = requestAnimationFrame(tick);
  }, [activeEventId, isProcessing, stopCamera, onClose]);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (!isMounted) {
          s.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.setAttribute("playsinline", "true");

          try {
            await videoRef.current.play();
            requestRef.current = requestAnimationFrame(tick);
          } catch (playErr) {
            if ((playErr as Error).name !== 'AbortError') console.error(playErr);
          }
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [tick, stopCamera]);

  // Show modal over the scanner when a marker is unlocked
  if (unlockedMarker) {
    return (
      <UnlockedModal
        marker={unlockedMarker}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className={styles.container}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className={styles.uiOverlay}>
        <div className={styles.scanBox}>
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <span className="text-red-500 font-bold animate-pulse">VERIFYING...</span>
            </div>
          )}

          <div className={`${styles.hand} ${styles.leftHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
            <Image src="/images/QRScanner/Left.png" alt="" fill priority unoptimized className={styles.handImage} />
          </div>
          <div className={`${styles.hand} ${styles.rightHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
            <Image src="/images/QRScanner/Right.png" alt="" fill priority unoptimized className={styles.handImage} />
          </div>
        </div>
      </div>

      <button onClick={handleClose} className={styles.closeBtn}>✕</button>
    </div>
  );
};

export default QRScanner;