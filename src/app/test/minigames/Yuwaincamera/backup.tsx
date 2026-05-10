'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// ─── STICKER CONFIG ──────────────────────────────────────────────────────────
// Add your actual PNG imports here. These are placeholder paths.
// e.g. import Mascot1 from './stickers/yuwa-wave.png';
//      import Mascot2 from './stickers/yuwa-jump.png';
import Mascot1 from "./Excited.png";
import Mascot2 from "./Posing.png";
import Mascot3 from "./Running.png";
import Mascot4 from "./Stand.png";
import Mascot5 from "./Tired.png";

const STICKERS = [
  { id: 'wave',   src: Mascot1, label: 'Wave'   },
  { id: 'jump',   src: Mascot2, label: 'Jump'   },
  { id: 'peace',  src: Mascot3, label: 'Peace'  },
  { id: 'run',    src: Mascot4, label: 'Run'    },
  { id: 'sit',    src: Mascot5, label: 'Sit'    },
];
// ─── TYPES ───────────────────────────────────────────────────────────────────
type Sticker = typeof STICKERS[0];
type ScreenState = 'viewfinder' | 'booth';

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function YuwaTravelCamera() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const [stream,          setStream]          = useState<MediaStream | null>(null);
  const [capturedPhoto,   setCapturedPhoto]   = useState<string | null>(null);
  const [screen,          setScreen]          = useState<ScreenState>('viewfinder');
  const [facingMode,      setFacingMode]      = useState<'environment' | 'user'>('environment');

  const [activeSticker,   setActiveSticker]   = useState<Sticker>(STICKERS[0]);
  const [position,        setPosition]        = useState({ x: 50, y: 45 });
  const [size,            setSize]            = useState(160);
  const [isDragging,      setIsDragging]      = useState(false);
  const [flash,           setFlash]           = useState(false);

  // ── Camera start ────────────────────────────────────────────────────────
  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    async function startCamera() {
      stream?.getTracks().forEach(t => t.stop());
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width:  { ideal: 3840 },
            height: { ideal: 2160 },
          },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error('Camera error:', err);
      }
    }

    startCamera();
    return () => { mediaStream?.getTracks().forEach(t => t.stop()); };
  }, [facingMode]);

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const container = document.getElementById('cam-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setPosition({
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width)  * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top)  / rect.height) * 100)),
    });
  }, [isDragging]);

  // ── Capture ──────────────────────────────────────────────────────────────
  const takePicture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Flash feedback
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use the video's actual hardware resolution (no DPR downscale)
    const nativeW = video.videoWidth;
    const nativeH = video.videoHeight;
    canvas.width  = nativeW;
    canvas.height = nativeH;

    // 1. Draw camera frame (mirror if front camera)
    if (facingMode === 'user') {
      ctx.save();
      ctx.translate(nativeW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, nativeW, nativeH);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, nativeW, nativeH);
    }

    // 2. Draw sticker overlay at high resolution
    const mascotEl = document.getElementById('sticker-overlay') as HTMLImageElement;
    if (mascotEl) {
      const viewW = video.clientWidth;
      const viewH = video.clientHeight;

      // Map percentage position → native pixels
      const xPx = (position.x / 100) * nativeW;
      const yPx = (position.y / 100) * nativeH;

      // Scale the display size up to match native resolution
      const scaleFactor = nativeW / viewW;
      const drawW = size * scaleFactor;
      const drawH = (mascotEl.naturalHeight / mascotEl.naturalWidth) * drawW;

      ctx.drawImage(mascotEl, xPx - drawW / 2, yPx - drawH / 2, drawW, drawH);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95); // JPEG for smaller file at high res
    setCapturedPhoto(dataUrl);
    stream?.getTracks().forEach(t => t.stop());

    // Small delay then show booth
    setTimeout(() => setScreen('booth'), 400);
  }, [position, size, stream]);

  // ── Retake ───────────────────────────────────────────────────────────────
  const retake = () => {
    setCapturedPhoto(null);
    setScreen('viewfinder');
    window.location.reload(); // restarts camera stream
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Google Font injection ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0a0a0a; }

        .cam-root {
          font-family: 'DM Sans', sans-serif;
          background: #0d0d0d;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          color: #f5f5f5;
        }

        /* ── VIEWFINDER ─────────────────────────────────────── */
        .cam-shell {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cam-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
        }
        .cam-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .cam-badge {
          background: #1eff6e22;
          border: 1px solid #1eff6e55;
          color: #1eff6e;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .viewfinder-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3/4;
          border-radius: 28px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 30px 80px -10px #000a;
        }

        .cam-video {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }

        /* Corner guides */
        .viewfinder-wrap::before,
        .viewfinder-wrap::after {
          content: '';
          position: absolute;
          z-index: 5;
          width: 36px; height: 36px;
          border-color: #fff;
          border-style: solid;
          border-width: 0;
          pointer-events: none;
        }
        .viewfinder-wrap::before {
          top: 16px; left: 16px;
          border-top-width: 3px; border-left-width: 3px;
          border-top-left-radius: 8px;
        }
        .viewfinder-wrap::after {
          bottom: 16px; right: 16px;
          border-bottom-width: 3px; border-right-width: 3px;
          border-bottom-right-radius: 8px;
        }

        .sticker-overlay {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          filter: drop-shadow(0 6px 20px rgba(0,0,0,0.6));
          transition: transform 0.1s ease;
          z-index: 10;
        }

        .flash-overlay {
          position: absolute; inset: 0;
          background: white;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.05s ease;
        }
        .flash-overlay.active { opacity: 1; }

        .flip-btn {
          position: absolute;
          top: 14px; left: 14px;
          z-index: 10;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
        }
        .flip-btn:active { background: rgba(255,255,255,0.15); }
        .flip-btn.flipping { transform: rotate(180deg); }

        .mode-pill {
          position: absolute;
          top: 14px; right: 14px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 5px 11px;
          border-radius: 100px;
          z-index: 10;
        }

        /* ── STICKER STRIP ────────────────────────────────────── */
        .sticker-strip-wrap {
          background: #161616;
          border-radius: 20px;
          padding: 12px 14px;
          border: 1px solid #ffffff0d;
        }
        .strip-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 10px;
        }
        .strip-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .strip-row::-webkit-scrollbar { display: none; }

        .strip-item {
          flex-shrink: 0;
          width: 66px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .strip-thumb {
          width: 66px; height: 66px;
          border-radius: 16px;
          background: #222;
          border: 2px solid transparent;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.15s;
        }
        .strip-thumb img {
          width: 52px;
          height: auto;
          object-fit: contain;
        }
        .strip-item.active .strip-thumb {
          border-color: #1eff6e;
          transform: scale(1.06);
        }
        .strip-name {
          font-size: 10px;
          color: #666;
          font-weight: 500;
          transition: color 0.2s;
        }
        .strip-item.active .strip-name { color: #1eff6e; }

        /* ── CONTROLS ─────────────────────────────────────────── */
        .controls-row {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #161616;
          border-radius: 20px;
          padding: 14px 16px;
          border: 1px solid #ffffff0d;
        }
        .size-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #555;
          white-space: nowrap;
        }
        .size-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          background: #2a2a2a;
          border-radius: 100px;
          outline: none;
          cursor: pointer;
          accent-color: #1eff6e;
        }

        .shutter-btn {
          width: 100%;
          height: 64px;
          background: #1eff6e;
          color: #000;
          border: none;
          border-radius: 18px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.2s;
          box-shadow: 0 12px 32px -4px #1eff6e55;
        }
        .shutter-btn:active { transform: scale(0.97); box-shadow: none; }

        /* ── BOOTH SCREEN ─────────────────────────────────────── */
        .booth-shell {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          animation: boothIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes boothIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .booth-paper {
          background: #fff;
          border-radius: 4px 4px 0 0;
          padding: 16px 16px 8px;
          width: 100%;
          box-shadow: 0 -6px 40px #0008;
        }
        .booth-photo {
          width: 100%;
          border-radius: 2px;
          display: block;
        }
        .booth-caption {
          margin-top: 12px;
          text-align: center;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #111;
          letter-spacing: -0.3px;
        }
        .booth-date {
          text-align: center;
          font-size: 11px;
          color: #999;
          margin-top: 3px;
          margin-bottom: 4px;
        }

        .booth-footer {
          width: 100%;
          background: #111;
          border-radius: 0 0 28px 28px;
          padding: 18px 20px 28px;
          display: flex;
          gap: 10px;
        }
        .btn-retake {
          flex: 1;
          height: 52px;
          border-radius: 14px;
          border: 1.5px solid #2a2a2a;
          background: transparent;
          color: #888;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-retake:hover { border-color: #555; color: #ccc; }

        .btn-save {
          flex: 2;
          height: 52px;
          border-radius: 14px;
          border: none;
          background: #1eff6e;
          color: #000;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.12s;
          box-shadow: 0 8px 24px -4px #1eff6e44;
        }
        .btn-save:active { transform: scale(0.97); }

        .booth-banner {
          text-align: center;
          font-size: 11px;
          color: #444;
          margin-top: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
      `}</style>

      <div className="cam-root">

        {/* ══════════════════ VIEWFINDER SCREEN ══════════════════ */}
        {screen === 'viewfinder' && (
          <div className="cam-shell">

            {/* Header */}
            <div className="cam-header">
              <span className="cam-title">Snap with Yuwa</span>
              <span className="cam-badge">Live</span>
            </div>

            {/* Viewfinder */}
            <div
              id="cam-container"
              className="viewfinder-wrap"
              onMouseMove={handleMove}
              onTouchMove={handleMove}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <video ref={videoRef} autoPlay playsInline muted className="cam-video"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />

              {/* Flash */}
              <div className={`flash-overlay${flash ? ' active' : ''}`} />

              {/* Flip camera button */}
              <button className="flip-btn" onClick={flipCamera} title="Flip camera">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7H4M4 7l4-4M4 7l4 4M4 17h16M16 13l4 4-4 4"/>
                </svg>
              </button>

              {/* Sticker */}
              <Image
                id="sticker-overlay"
                src={activeSticker.src}
                alt={activeSticker.label}
                className="sticker-overlay"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${size}px`,
                }}
              />

              <div className="mode-pill">Drag to pose</div>
            </div>

            {/* Sticker Strip */}
            <div className="sticker-strip-wrap">
              <div className="strip-label">Choose your Yuwa</div>
              <div className="strip-row">
                {STICKERS.map((s) => (
                  <div
                    key={s.id}
                    className={`strip-item${activeSticker.id === s.id ? ' active' : ''}`}
                    onClick={() => setActiveSticker(s)}
                  >
                    <div className="strip-thumb">
                      <Image src={s.src} alt={s.label} width={52} height={52} style={{ objectFit: 'contain' }} />
                    </div>
                    <span className="strip-name">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Size slider */}
            <div className="controls-row">
              <span className="size-label">Size</span>
              <input
                type="range" min={80} max={400} value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>

            {/* Shutter */}
            <button className="shutter-btn" onClick={takePicture}>
              CAPTURE THE MOMENT
            </button>

          </div>
        )}

        {/* ══════════════════ BOOTH SCREEN ══════════════════ */}
        {screen === 'booth' && capturedPhoto && (
          <div className="booth-shell">

            {/* Polaroid-style paper */}
            <div className="booth-paper">
              <img src={capturedPhoto} className="booth-photo" alt="Your memory" />
              <div className="booth-caption">Memory unlocked ✦</div>
              <div className="booth-date">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Footer bar */}
            <div className="booth-footer">
              <button className="btn-retake" onClick={retake}>Retake</button>
              <a
                href={capturedPhoto}
                download="yuwa-memory.jpg"
                className="btn-save"
              >
                Save Photo
              </a>
            </div>

            <div className="booth-banner">Powered by Yuwa Travel ✦</div>

          </div>
        )}

      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}