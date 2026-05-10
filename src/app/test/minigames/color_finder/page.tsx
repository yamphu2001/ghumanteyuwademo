'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorTarget {
  id: string;
  label: string;
  emoji: string;
  /** HSL ranges for detection */
  hMin: number; hMax: number;
  sMin: number; sMax: number;
  lMin: number; lMax: number;
  found: boolean;
  tailwind: string; // bg class for swatch
  hex: string;
}

type GameState = 'intro' | 'playing' | 'complete';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert RGB (0-255) → HSL (h:0-360, s:0-100, l:0-100) */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

/** Sample the center 40×40 px region of the canvas and check color match */
function sampleCenterRegion(
  video: HTMLVideoElement,
  tempCanvas: HTMLCanvasElement,
  target: ColorTarget
): boolean {
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  const size = 40;
  tempCanvas.width = size;
  tempCanvas.height = size;

  const sx = (video.videoWidth - size) / 2;
  const sy = (video.videoHeight - size) / 2;
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  let matchCount = 0;
  const totalPixels = size * size;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);

    // Handle red hue wrap-around
    const hMatch =
      target.hMin <= target.hMax
        ? h >= target.hMin && h <= target.hMax
        : h >= target.hMin || h <= target.hMax;

    if (
      hMatch &&
      s >= target.sMin && s <= target.sMax &&
      l >= target.lMin && l <= target.lMax
    ) matchCount++;
  }

  // Require ≥ 30% of sampled pixels to match
  return matchCount / totalPixels >= 0.30;
}

// ─── Color Targets ────────────────────────────────────────────────────────────

const INITIAL_TARGETS: ColorTarget[] = [
  {
    id: 'red', label: 'Red', emoji: '🔴',
    hMin: 340, hMax: 20,   // wraps around 0°
    sMin: 45,  sMax: 100,
    lMin: 20,  lMax: 65,
    found: false,
    tailwind: 'bg-red-500',
    hex: '#ef4444',
  },
  {
    id: 'green', label: 'Green', emoji: '🟢',
    hMin: 90, hMax: 165,
    sMin: 35, sMax: 100,
    lMin: 18, lMax: 62,
    found: false,
    tailwind: 'bg-green-500',
    hex: '#22c55e',
  },
  {
    id: 'blue', label: 'Blue', emoji: '🔵',
    hMin: 195, hMax: 255,
    sMin: 40,  sMax: 100,
    lMin: 18,  lMax: 62,
    found: false,
    tailwind: 'bg-blue-500',
    hex: '#3b82f6',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColorHuntGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [gameState, setGameState] = useState<GameState>('intro');
  const [targets, setTargets] = useState<ColorTarget[]>(INITIAL_TARGETS);
  const [activeTarget, setActiveTarget] = useState<string>('red');
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const foundCount = targets.filter(t => t.found).length;

  // ── Camera ──────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ── Scanning loop ────────────────────────────────────────────────────────────

  const startScanning = useCallback(() => {
    if (scanRef.current) clearInterval(scanRef.current);
    scanRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = tempCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      setTargets(prev => {
        const currentTarget = prev.find(t => t.id === activeTarget && !t.found);
        if (!currentTarget) return prev;

        const matched = sampleCenterRegion(video, canvas, currentTarget);
        if (!matched) return prev;

        // Mark found
        const updated = prev.map(t => t.id === currentTarget.id ? { ...t, found: true } : t);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);

        // Advance to next unfound target
        const next = updated.find(t => !t.found);
        if (next) setActiveTarget(next.id);
        else {
          clearInterval(scanRef.current!);
          setTimeout(() => setGameState('complete'), 400);
        }
        return updated;
      });
    }, 800);
  }, [activeTarget]);

  // ── Game flow ────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    setGameState('playing');
    await startCamera();
  };

  const handleRestart = () => {
    stopCamera();
    if (scanRef.current) clearInterval(scanRef.current);
    setTargets(INITIAL_TARGETS);
    setActiveTarget('red');
    setGameState('intro');
    setCameraError(false);
  };

  useEffect(() => {
    if (gameState === 'playing') startScanning();
    return () => { if (scanRef.current) clearInterval(scanRef.current); };
  }, [gameState, activeTarget, startScanning]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const currentTarget = targets.find(t => t.id === activeTarget && !t.found);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center p-4">
      {/* Hidden canvas for pixel sampling */}
      <canvas ref={tempCanvasRef} className="hidden" />

      {/* ── INTRO ── */}
      {gameState === 'intro' && (
        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Title card */}
          <div className="rounded-3xl bg-gray-50 border border-gray-100 p-8 flex flex-col items-center gap-4 shadow-sm">
            <span className="text-5xl">🎨</span>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 text-center">
              Color Hunt
            </h1>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              A little game about looking closely at the world around you.
            </p>
          </div>

          {/* How to play */}
          <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 flex flex-col gap-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">How to play</p>
            <ol className="flex flex-col gap-3">
              {[
                { icon: '📍', text: 'Walk around your current location — indoors or outdoors.' },
                { icon: '🎯', text: 'Point your camera at something that matches the target color.' },
                { icon: '✅', text: 'Hold steady for a moment. The app will confirm the match.' },
                { icon: '🏁', text: 'Find all 3 colors to complete the hunt!' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{step.icon}</span>
                  <span className="text-sm text-gray-600 leading-relaxed">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Color targets preview */}
          <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Your targets</p>
            <div className="flex gap-3 justify-around">
              {INITIAL_TARGETS.map(t => (
                <div key={t.id} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-2xl shadow-sm"
                    style={{ backgroundColor: t.hex }}
                  />
                  <span className="text-xs font-medium text-gray-600">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white text-sm font-semibold tracking-wide shadow-sm active:scale-95 transition-transform"
          >
            Start Hunting →
          </button>
        </div>
      )}

      {/* ── PLAYING ── */}
      {gameState === 'playing' && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Progress chips */}
          <div className="flex gap-2 justify-center">
            {targets.map(t => (
              <div
                key={t.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  t.found
                    ? 'bg-gray-900 text-white'
                    : t.id === activeTarget
                    ? 'bg-gray-100 text-gray-900 ring-2 ring-gray-900'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.hex, opacity: t.found ? 1 : 0.5 }}
                />
                {t.label}
                {t.found && <span className="ml-0.5">✓</span>}
              </div>
            ))}
          </div>

          {/* Camera viewfinder */}
          <div className="relative rounded-3xl overflow-hidden bg-black shadow-lg aspect-[3/4]">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 p-6">
                <span className="text-4xl">📷</span>
                <p className="text-sm text-gray-500 text-center">Camera access is needed to play. Please allow camera permissions and try again.</p>
                <button onClick={handleRestart} className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold">
                  Go Back
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Success flash overlay */}
                {flash && (
                  <div
                    className="absolute inset-0 rounded-3xl animate-ping-once"
                    style={{ backgroundColor: currentTarget?.hex ?? '#fff', opacity: 0.35 }}
                  />
                )}

                {/* Crosshair aim */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-20 h-20">
                    {/* Corner brackets */}
                    {[
                      'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                      'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                      'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                      'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-5 h-5 ${cls}`}
                        style={{ borderColor: currentTarget?.hex ?? 'white' }}
                      />
                    ))}
                    {/* Center dot */}
                    <div
                      className="absolute inset-0 m-auto w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentTarget?.hex ?? 'white' }}
                    />
                  </div>
                </div>

                {/* Bottom instruction pill */}
                {currentTarget && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: currentTarget.hex }}
                      />
                      <span className="text-xs font-semibold text-gray-800">
                        Find something <span style={{ color: currentTarget.hex }}>{currentTarget.label}</span>
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tip */}
          <p className="text-center text-xs text-gray-400 px-4">
            Center the colored object in the frame and hold still
          </p>

          {/* Score */}
          <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <span className="text-sm text-gray-500">Found</span>
            <span className="text-sm font-semibold text-gray-900">{foundCount} / {targets.length}</span>
          </div>
        </div>
      )}

      {/* ── COMPLETE ── */}
      {gameState === 'complete' && (
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="rounded-3xl bg-gray-50 border border-gray-100 p-8 flex flex-col items-center gap-4 shadow-sm">
            <span className="text-5xl">🎉</span>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 text-center">
              Hunt Complete!
            </h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              You found all 3 colors. Nice eye — the world is more colorful than you think.
            </p>
          </div>

          {/* Found colors recap */}
          <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Colors found</p>
            <div className="flex flex-col gap-3">
              {targets.map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl shadow-sm" style={{ backgroundColor: t.hex }} />
                  <span className="text-sm font-medium text-gray-700">{t.label}</span>
                  <span className="ml-auto text-gray-400 text-sm">✓</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white text-sm font-semibold tracking-wide shadow-sm active:scale-95 transition-transform"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}