'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

const COLORS = [
  { name: 'RED',    hex: '#ef4444', rgb: [239, 68,  68]  },
  { name: 'BLUE',   hex: '#3b82f6', rgb: [59,  130, 246] },
  { name: 'YELLOW', hex: '#eab308', rgb: [234, 179, 8]   },
  { name: 'GREEN',  hex: '#22c55e', rgb: [34,  197, 94]  },
];

function pickRandom() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const THRESHOLD = 90;
const CROSSHAIR_RATIO = 0.10;

interface ColorHuntProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export default function ColorHunt({ onComplete, onClose }: ColorHuntProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [targetColor] = useState(pickRandom);
  const [status, setStatus] = useState<'hunting' | 'checking' | 'success' | 'fail'>('hunting');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error(err);
      }
    }
    startCamera();
    return () => stopCamera();
  }, [stopCamera]);

  const checkColor = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const sampleW = Math.floor(vw * CROSSHAIR_RATIO * 2);
    const sampleH = Math.floor(vh * CROSSHAIR_RATIO * 2);
    const srcX = Math.floor(vw / 2 - sampleW / 2);
    const srcY = Math.floor(vh / 2 - sampleH / 2);

    canvas.width = sampleW;
    canvas.height = sampleH;
    ctx.drawImage(video, srcX, srcY, sampleW, sampleH, 0, 0, sampleW, sampleH);

    // Stop camera immediately after frame is captured
    stopCamera();
    setStatus('checking');

    const pixelData = ctx.getImageData(0, 0, sampleW, sampleH).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < pixelData.length; i += 4) {
      r += pixelData[i]; g += pixelData[i + 1]; b += pixelData[i + 2];
    }
    const count = pixelData.length / 4;
    const avg = [r / count, g / count, b / count];

    const distance = Math.sqrt(
      Math.pow(avg[0] - targetColor.rgb[0], 2) +
      Math.pow(avg[1] - targetColor.rgb[1], 2) +
      Math.pow(avg[2] - targetColor.rgb[2], 2)
    );

    setTimeout(() => {
      setStatus(distance < THRESHOLD ? 'success' : 'fail');
    }, 900);
  };

  const handleComplete = () => {
    stopCamera();
    onComplete?.();
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  const restartCamera = () => {
    setStatus('hunting');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(console.error);
  };

  return (
    <div
      style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif" }}
      className="max-w-md mx-auto bg-white border-4 border-black"
    >
      {/* ── Header ── */}
      <div className="border-b-4 border-black px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-black tracking-[0.25em] uppercase">COLOR HUNT</span>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-black" style={{ background: targetColor.hex }} />
          {/* Close button — exits the minigame without completing */}
          {onClose && (
            <button
              onClick={handleClose}
              className="w-6 h-6 flex items-center justify-center border-2 border-black text-black font-black text-xs hover:bg-black hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Mission ── */}
      <div className="px-5 py-4 border-b-4 border-black">
        <p className="text-xs tracking-widest uppercase text-black/40 mb-1">Your mission</p>
        <p className="text-2xl font-black uppercase leading-none tracking-tight">
          Find something <span style={{ color: targetColor.hex }}>{targetColor.name}</span>
        </p>
      </div>

      {/* ── Camera ── */}
      <div className="relative aspect-square border-b-4 border-black overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />

        {/* Crosshair — 20% of viewport matches the 10%-each-side sample zone */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="relative border-[3px] border-white"
            style={{ width: '20%', height: '20%', boxShadow: '0 0 0 1px black' }}
          >
            <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 bg-white opacity-60" />
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white opacity-60" />
          </div>
        </div>

        {/* Corner brackets */}
        {(['top-3 left-3 border-t-[3px] border-l-[3px]',
           'top-3 right-3 border-t-[3px] border-r-[3px]',
           'bottom-3 left-3 border-b-[3px] border-l-[3px]',
           'bottom-3 right-3 border-b-[3px] border-r-[3px]'] as const
        ).map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 border-white ${cls}`} />
        ))}

        {/* Mascot */}
        <div className={`absolute bottom-3 right-3 w-16 transition-all duration-300 ${status === 'success' ? 'scale-110' : ''}`}>
          <Image src={MascotImage} alt="Yuwa" className="w-full h-auto drop-shadow-lg" />
        </div>

        {status === 'checking' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-[0.3em] uppercase animate-pulse">SCANNING...</span>
          </div>
        )}

        {status === 'success' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
            style={{ background: `${targetColor.hex}dd` }}
          >
            <p className="text-4xl font-black text-white tracking-tight uppercase mb-1">MATCH!</p>
            <p className="text-xs text-white/80 font-bold tracking-widest mb-6 uppercase">Ghumante Yuwa approves.</p>
            <button
              onClick={handleComplete}
              className="bg-white text-black font-black text-xs tracking-[0.2em] uppercase px-8 py-3 border-2 border-black active:translate-y-[1px] transition-transform"
            >
              BACK TO MAP →
            </button>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="px-5 py-5">
        {status === 'hunting' && (
          <button
            onClick={checkColor}
            className="w-full py-4 bg-black text-white font-black text-sm tracking-[0.25em] uppercase border-2 border-black active:bg-white active:text-black transition-colors"
          >
            I FOUND {targetColor.name} →
          </button>
        )}
        {status === 'fail' && (
          <div className="space-y-3">
            <div className="border-2 border-black p-3">
              <p className="text-xs font-black tracking-widest uppercase">YUWA SAYS: NOT QUITE.</p>
            </div>
            <button
              onClick={restartCamera}
              className="w-full py-3 border-2 border-black text-black font-black text-xs tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}