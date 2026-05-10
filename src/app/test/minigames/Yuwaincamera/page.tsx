'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './YuwaCamera.module.css';
import { processAndCapture, saveToPhoneGallery } from './cameralogic';

import Mascot1 from "./Excited.png";
import Mascot2 from "./Posing.png";
import Mascot3 from "./Running.png";
import Mascot4 from "./Stand.png";
import Mascot5 from "./Tired.png";

const STICKERS = [
  { id: '1', src: Mascot1 },
  { id: '2', src: Mascot2 },
  { id: '3', src: Mascot3 },
  { id: '4', src: Mascot4 },
  { id: '5', src: Mascot5 },
];

type AspectRatio = 'portrait' | 'landscape' | 'square';

export default function YuwaTravelCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeSticker, setActiveSticker] = useState(STICKERS[0]);
  const [pos, setPos] = useState({ x: 15, y: 80 });
  const [size, setSize] = useState(150);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');
  const [isDragging, setIsDragging] = useState(false);
  const [isFront, setIsFront] = useState(false); 
  const [flash, setFlash] = useState(false);
  
  // States to handle the captured image
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const startCamera = async () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: isFront ? 'user' : 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  useEffect(() => {
    if (!previewUrl) startCamera();
  }, [isFront, previewUrl]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setPos({
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
    });
  }, [isDragging]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlash(true);

    const stickerImg = document.getElementById('active-sticker') as HTMLImageElement;
    
    const blob = await processAndCapture(
      videoRef.current,
      canvasRef.current,
      stickerImg,
      { x: pos.x, y: pos.y, size, rotation, aspectRatio, isFront }
    );
    
    if (blob) {
      setCapturedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob)); // Safe string for <img> src
    }
    
    setTimeout(() => setFlash(false), 300);
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    if (capturedBlob) {
      await saveToPhoneGallery(capturedBlob);
    }
  };

  // --- RESULT VIEW ---
  if (previewUrl) {
    return (
      <div className={styles.camRoot}>
        <img src={previewUrl} className={styles.resultPreview} alt="Captured" />
        <div className={styles.resultActions}>
          <button onClick={handleSave} className={styles.saveBtn}>Save Memory</button>
          <button onClick={handleRetake} className={styles.retakeBtn}>Retake</button>
        </div>
      </div>
    );
  }

  // --- CAMERA VIEW ---
  return (
    <div className={styles.camRoot}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ghumante Yuwa</h1>
        <div className={styles.headerTools}>
          <button onClick={() => setIsFront(!isFront)} className={styles.iconBtn}>🔄</button>
          <div className={styles.ratioSelector}>
            {(['portrait', 'landscape', 'square'] as AspectRatio[]).map(r => (
              <button key={r} className={aspectRatio === r ? styles.ratioActive : ''} onClick={() => setAspectRatio(r)}>
                <div className={styles[`icon${r.charAt(0).toUpperCase() + r.slice(1)}`]} />
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <div 
        ref={containerRef}
        className={`${styles.viewfinderWrap} ${styles[aspectRatio]}`}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
      >
        <video ref={videoRef} autoPlay playsInline className={`${styles.video} ${isFront ? styles.mirrored : ''}`} />
        <div className={`${styles.flash} ${flash ? styles.flashActive : ''}`} />
        
        <div 
          className={styles.stickerOverlay} 
          style={{ 
            left: `${pos.x}%`, 
            top: `${pos.y}%`, 
            width: `${size}px`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)` 
          }}
        >
          <Image id="active-sticker" src={activeSticker.src} alt="sticker" draggable={false} style={{ width: '100%', height: 'auto' }} />
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.toolRow}>
          <div className={styles.tool}><label>Size</label>
            <input type="range" min="50" max="400" value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </div>
          <div className={styles.tool}><label>Rotate</label>
            <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
          </div>
        </div>
        <div className={styles.stickerRow}>
          {STICKERS.map(s => (
            <div key={s.id} className={`${styles.thumb} ${activeSticker.id === s.id ? styles.thumbActive : ''}`} onClick={() => setActiveSticker(s)}>
              <Image src={s.src} alt="thumb" width={50} height={50} />
            </div>
          ))}
        </div>
        <button className={styles.shutterBtn} onClick={handleCapture}>Take Photo</button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}