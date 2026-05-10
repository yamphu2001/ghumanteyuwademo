'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

const HUNT_ITEMS = [
  { name: "Bird",   icon: "🐦", hint: "Look up — rooftops, wires, trees" },
  { name: "Flower", icon: "🌸", hint: "Check offerings, gardens, or street stalls" },
  { name: "Cloud",  icon: "☁️", hint: "Point your camera at the sky" },
  { name: "Statue", icon: "🗿", hint: "Every temple has one hiding nearby" },
  { name: "Flag",   icon: "🚩", hint: "Prayer flags flutter everywhere here" },
  { name: "Fire",   icon: "🔥", hint: "Incense sticks, oil lamps, candles" },
];

interface DailyQuestProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export default function DailyQuest({ onComplete, onClose }: DailyQuestProps) {
  const [targetObject] = useState(() => HUNT_ITEMS[Math.floor(Math.random() * HUNT_ITEMS.length)]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'camera' | 'reviewing' | 'completed'>('intro');
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer while hunting
  useEffect(() => {
    if (phase === 'camera') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Always clean up camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setPhase('camera');
      setTimer(0);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch {
      alert("Camera permission needed — please allow access and try again.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    stopCamera(); // kill camera immediately

    const img = new window.Image();
    img.src = MascotImage.src;
    img.onload = () => {
      const mw = canvas.width * 0.15;
      const mh = (img.height / img.width) * mw;
      ctx.drawImage(img, canvas.width - mw - 20, canvas.height - mh - 20, mw, mh);
      setCapturedPhoto(canvas.toDataURL('image/png'));
      setPhase('reviewing');
    };
    img.onerror = () => {
      setCapturedPhoto(canvas.toDataURL('image/png'));
      setPhase('reviewing');
    };
  };

  const handleClose = () => { stopCamera(); onClose?.(); };
  const handleComplete = () => { stopCamera(); onComplete?.(); };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif" }}
      className="max-w-md mx-auto bg-white border-4 border-black">

      {/* ── Header ── */}
      <div className="border-b-4 border-black px-5 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-black/40">Mission</span>
          <p className="text-xs font-black tracking-[0.2em] uppercase leading-none">Scavenger Hunt</p>
        </div>
        <div className="flex items-center gap-3">
          {phase === 'camera' && (
            <span className="text-xs font-black tabular-nums border-2 border-black px-2 py-0.5">
              {formatTime(timer)}
            </span>
          )}
          {onClose && (
            <button onClick={handleClose}
              className="w-7 h-7 border-2 border-black flex items-center justify-center font-black text-xs hover:bg-black hover:text-white transition-colors">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── PHASE: INTRO ── */}
      {phase === 'intro' && (
        <>
          {/* Big target reveal */}
          <div className="border-b-4 border-black">
            <div className="px-5 pt-6 pb-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-1">Find this</p>
              <div className="flex items-center gap-4">
                <span className="text-6xl">{targetObject.icon}</span>
                <div>
                  <p className="text-4xl font-black uppercase leading-none">{targetObject.name}</p>
                  <p className="text-xs text-black/50 font-bold mt-1 tracking-wide">somewhere in the temple</p>
                </div>
              </div>
            </div>

            {/* Hint strip */}
            <div className="mx-5 mb-5 mt-3">
              <button
                onClick={() => setShowHint(h => !h)}
                className="w-full border-2 border-black py-2 text-xs font-black tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors"
              >
                {showHint ? 'HIDE HINT ↑' : 'NEED A HINT? →'}
              </button>
              {showHint && (
                <div className="border-2 border-t-0 border-black px-4 py-3 bg-black text-white">
                  <p className="text-xs font-black tracking-wide uppercase">{targetObject.hint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="px-5 py-4 border-b-4 border-black space-y-2">
            {['Find the item in real life', 'Open camera & frame it up', 'Take the photo as proof'].map((rule, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 border-2 border-black flex items-center justify-center text-xs font-black flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide">{rule}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-5">
            <button onClick={startCamera}
              className="w-full py-4 bg-black text-white font-black text-sm tracking-[0.25em] uppercase border-2 border-black active:bg-white active:text-black transition-colors">
              START HUNTING →
            </button>
          </div>
        </>
      )}

      {/* ── PHASE: CAMERA ── */}
      {phase === 'camera' && (
        <>
          {/* Target reminder bar */}
          <div className="border-b-4 border-black px-5 py-2 flex items-center gap-3 bg-black text-white">
            <span className="text-2xl">{targetObject.icon}</span>
            <div>
              <p className="text-[10px] tracking-widest uppercase opacity-60">Looking for</p>
              <p className="text-sm font-black uppercase leading-none">{targetObject.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] tracking-widest uppercase opacity-60">Hint</p>
              <p className="text-[10px] font-bold max-w-[120px] leading-tight opacity-80">{targetObject.hint}</p>
            </div>
          </div>

          {/* Camera viewport */}
          <div className="relative aspect-square border-b-4 border-black overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* Corner brackets */}
            {(['top-3 left-3 border-t-[3px] border-l-[3px]',
               'top-3 right-3 border-t-[3px] border-r-[3px]',
               'bottom-3 left-3 border-b-[3px] border-l-[3px]',
               'bottom-3 right-3 border-b-[3px] border-r-[3px]'] as const
            ).map((cls, i) => (
              <div key={i} className={`absolute w-6 h-6 border-white ${cls}`} />
            ))}

            {/* Centre reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/60 relative" style={{ width: '40%', height: '40%' }}>
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/40" />
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/40" />
              </div>
            </div>

            {/* Target icon watermark */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 flex items-center gap-2">
              <span className="text-lg">{targetObject.icon}</span>
              <span className="text-white font-black text-xs tracking-widest uppercase">{targetObject.name}</span>
            </div>

            {/* Mascot */}
            <div className="absolute bottom-3 right-3 w-14">
              <Image src={MascotImage} alt="Yuwa" className="w-full h-auto drop-shadow-lg" />
            </div>
          </div>

          <div className="px-5 py-5 space-y-3">
            <button onClick={takePhoto}
              className="w-full py-4 bg-black text-white font-black text-sm tracking-[0.25em] uppercase border-2 border-black active:bg-white active:text-black transition-colors">
              📸 CAPTURE {targetObject.name.toUpperCase()}
            </button>
            <button onClick={() => { stopCamera(); setPhase('intro'); }}
              className="w-full py-2 border-2 border-black text-black font-black text-xs tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors">
              ← BACK
            </button>
          </div>
        </>
      )}

      {/* ── PHASE: REVIEWING ── */}
      {phase === 'reviewing' && capturedPhoto && (
        <>
          <div className="border-b-4 border-black px-5 py-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-1">Proof captured</p>
            <p className="text-2xl font-black uppercase leading-none">
              {targetObject.icon} {targetObject.name} Found!
            </p>
            {timer > 0 && (
              <p className="text-xs text-black/40 font-bold mt-1 tracking-wide">
                Found in {formatTime(timer)}
              </p>
            )}
          </div>

          {/* Photo */}
          <div className="border-b-4 border-black">
            <img src={capturedPhoto} alt="Proof"
              className="w-full aspect-square object-cover" />
          </div>

          {/* Screenshot prompt */}
          <div className="border-b-4 border-black px-5 py-3 bg-black text-white flex items-center gap-3">
            <span className="text-xl">📸</span>
            <p className="text-xs font-black tracking-wide uppercase leading-tight">
              Screenshot this screen<br/>
              <span className="opacity-60 font-bold">Keep it as your proof of the hunt</span>
            </p>
          </div>

          <div className="px-5 py-5">
            <button onClick={handleComplete}
              className="w-full py-4 bg-black text-white font-black text-sm tracking-[0.25em] uppercase border-2 border-black active:bg-white active:text-black transition-colors">
              ✓ MISSION COMPLETE →
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}