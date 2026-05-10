'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';
import { useQuestStore, type HeritageItem } from './logic';

const HERITAGE_ITEMS: HeritageItem[] = [
  { id: 1,  name: "Stone Spout",    nepali: "Hiti",        icon: "🚰" },
  { id: 2,  name: "Prayer Wheel",   nepali: "Manicakra",   icon: "☸️" },
  { id: 3,  name: "Guardian Lion",  nepali: "Chhepu",      icon: "🦁" },
  { id: 4,  name: "Oil Lamp",       nepali: "Pala",        icon: "🪔" },
  { id: 5,  name: "Bell",           nepali: "Ghanta",      icon: "🔔" },
  { id: 6,  name: "Wooden Window",  nepali: "Ankhi Jhyal", icon: "🖼️" },
  { id: 7,  name: "Pinnacle",       nepali: "Gajur",       icon: "🔱" },
  { id: 8,  name: "Stone Pillar",   nepali: "Dhvaja",      icon: "🗿" },
  { id: 9,  name: "Temple Steps",   nepali: "Sidhha",      icon: "🪜" },
  { id: 10, name: "Inscribed Stone",nepali: "Silalekh",    icon: "📜" },
];

// Convert base64 data-url → Blob for Web Share API / download
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function shareOrDownload(dataUrl: string, filename: string) {
  try {
    const blob = await dataUrlToBlob(dataUrl);
    const file = new File([blob], filename, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Ghumante Yuwa – Aaja Ko Khoj' });
      return;
    }
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return;
  }
  // Fallback: browser download
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

async function shareAllPhotos(quests: HeritageItem[], photos: Record<number, string>) {
  const files = await Promise.all(
    quests.map(async item => {
      const blob = await dataUrlToBlob(photos[item.id]);
      return new File([blob], `yuwa-${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });
    })
  );
  try {
    if (navigator.canShare && navigator.canShare({ files })) {
      await navigator.share({ files, title: 'Ghumante Yuwa – Quest Complete!' });
      return;
    }
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return;
  }
  // Fallback: download each with small delay
  files.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    setTimeout(() => { a.click(); URL.revokeObjectURL(url); }, i * 350);
  });
}

export default function DailyQuest() {
  const {
    quests, photos, activeItem, screen, hydrated,
    hydrate, setQuests, setScreen, setActive,
    savePhoto, deletePhoto, resetAll,
  } = useQuestStore();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const flashRef  = useRef<HTMLDivElement>(null);

  // Hydrate from IndexedDB on mount
  useEffect(() => { hydrate(); }, [hydrate]);

  // Assign quests only if none saved
  useEffect(() => {
    if (hydrated && quests.length === 0) {
      const shuffled = [...HERITAGE_ITEMS].sort(() => 0.5 - Math.random());
      setQuests(shuffled.slice(0, 3));
    }
  }, [hydrated, quests.length, setQuests]);

  const completedCount = Object.keys(photos).length;
  const allDone = quests.length > 0 && completedCount === quests.length;

  // Camera helpers
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 3840 }, height: { ideal: 2160 } },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const openCamera = (item: HeritageItem) => {
    setActive(item);
    setScreen('camera');
    startCamera();
  };

  const triggerFlash = () => {
    if (!flashRef.current) return;
    flashRef.current.style.opacity = '1';
    setTimeout(() => { if (flashRef.current) flashRef.current.style.opacity = '0'; }, 220);
  };

  const takePhoto = async () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || !activeItem) return;
    triggerFlash();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    await savePhoto(activeItem.id, dataUrl);   // persists to IndexedDB
    stopCamera();
    setScreen('review');
  };

  const retake = async () => {
    if (!activeItem) return;
    await deletePhoto(activeItem.id);
    setScreen('camera');
    startCamera();
  };

  const confirmPhoto = () => {
    setActive(null);
    setScreen('list');
  };

  const handleReset = async () => {
    stopCamera();
    const shuffled = [...HERITAGE_ITEMS].sort(() => 0.5 - Math.random());
    await resetAll(shuffled.slice(0, 3));
  };

  // Loading screen while IndexedDB hydrates
  if (!hydrated) {
    return (
      <>
        <style>{styles}</style>
        <div className="dq">
          <div className="dq-inner dq-loading">
            <div className="dq-loading-dot" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="dq">
        <div className="dq-inner">

          {/* ══ LIST ══ */}
          {screen === 'list' && (
            <>
              <div className="dq-hd">
                <div>
                  <div className="dq-hd-eyebrow">Ghumante Yuwa</div>
                  <div className="dq-hd-title">Aaja Ko Khoj</div>
                </div>
                <div className="dq-hd-mascot">
                  <Image src={MascotImage} alt="Yuwa" width={36} height={36} style={{ objectFit: 'contain' }} />
                </div>
              </div>

              <div className="dq-prog-wrap">
                <div className="dq-prog-label">{completedCount} of 3 found</div>
                <div className="dq-prog">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`dq-prog-seg${i < completedCount ? ' filled' : ''}`} />
                  ))}
                </div>
              </div>

              <div className="dq-section-label">Today's items</div>

              <div className="dq-list">
                {quests.map(item => {
                  const done = !!photos[item.id];
                  return (
                    <button
                      key={item.id}
                      className={`dq-card${done ? ' done' : ''}`}
                      onClick={() => !done && openCamera(item)}
                      disabled={done}
                    >
                      <div className="dq-card-main">
                        <div className="dq-card-icon">{item.icon}</div>
                        <div className="dq-card-info">
                          <div className="dq-card-name">{item.name}</div>
                          <div className="dq-card-sub">{item.nepali}</div>
                        </div>
                        <div className={`dq-card-action ${done ? 'done' : 'pending'}`}>
                          {done ? '✓' : '↗'}
                        </div>
                      </div>
                      {done && photos[item.id] && (
                        <div className="dq-card-thumb">
                          <img src={photos[item.id]} alt={item.name} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {allDone && (
                <div className="dq-finish-wrap">
                  <button className="dq-finish-btn" onClick={() => setScreen('done')}>
                    See Results →
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══ CAMERA ══ */}
          {screen === 'camera' && activeItem && (
            <>
              <div className="cam-header">
                <button className="cam-back-btn" onClick={() => { stopCamera(); setScreen('list'); }}>←</button>
                <div className="cam-header-info">
                  <div className="cam-header-label">Find this</div>
                  <div className="cam-header-name">{activeItem.name}</div>
                </div>
                <span className="cam-header-icon">{activeItem.icon}</span>
              </div>
              <div className="cam-vf">
                <video ref={videoRef} autoPlay playsInline muted className="cam-video" />
                <div ref={flashRef} className="cam-flash" />
                <div className="cam-guide"><div className="cam-guide-box" /></div>
              </div>
              <div className="cam-footer">
                <button className="cam-shoot" onClick={takePhoto} aria-label="Capture photo" />
                <div className="cam-shoot-hint">Tap to capture</div>
              </div>
            </>
          )}

          {/* ══ REVIEW ══ */}
          {screen === 'review' && activeItem && photos[activeItem.id] && (
            <>
              <div className="rv-photo">
                <img src={photos[activeItem.id]} alt="Captured" />
              </div>
              <div className="rv-info">
                <span className="rv-icon">{activeItem.icon}</span>
                <span className="rv-name">{activeItem.name}</span>
                <span className="rv-count">{completedCount}/3 done</span>
              </div>
              <div className="rv-btns">
                <button className="rv-btn" onClick={retake}>Retake</button>
                <button
                  className="rv-btn secondary"
                  onClick={() => shareOrDownload(
                    photos[activeItem.id],
                    `yuwa-${activeItem.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
                  )}
                >
                  Save 📥
                </button>
                <button className="rv-btn ok" onClick={confirmPhoto}>
                  {completedCount === 3 ? 'Finish ✓' : 'Next →'}
                </button>
              </div>
            </>
          )}

          {/* ══ DONE ══ */}
          {screen === 'done' && (
            <>
              <div className="done-header">
                <div className="done-title">All 3<br />found!</div>
                <div className="done-badge">Quest Complete</div>
              </div>

              <div className="done-grid">
                {quests.map(item => (
                  <div key={item.id} className="done-cell">
                    {photos[item.id] && (
                      <button
                        className="done-cell-img-btn"
                        onClick={() => shareOrDownload(
                          photos[item.id],
                          `yuwa-${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
                        )}
                        title={`Save ${item.name}`}
                      >
                        <img src={photos[item.id]} alt={item.name} />
                        <div className="done-cell-overlay">📥</div>
                      </button>
                    )}
                    <div className="done-cell-label">{item.name}</div>
                  </div>
                ))}
              </div>

              <div className="done-save-hint">Tap a photo to save it to your gallery</div>

              <div className="done-btns">
                <button
                  className="done-save-all-btn"
                  onClick={() => shareAllPhotos(quests, photos)}
                >
                  Save All 📥
                </button>
                <button className="done-new-btn" onClick={handleReset}>New Day</button>
              </div>
            </>
          )}

        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .dq { font-family: 'DM Sans', sans-serif; background: #fff; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; }
  .dq-inner { width: 100%; max-width: 480px; min-height: 100dvh; display: flex; flex-direction: column; background: #fff; }
  .dq-loading { align-items: center; justify-content: center; }
  .dq-loading-dot { width: 10px; height: 10px; border-radius: 50%; background: #ddd; animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

  .dq-hd { padding: 20px 20px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
  .dq-hd-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: #aaa; margin-bottom: 4px; }
  .dq-hd-title { font-family: 'DM Serif Display', serif; font-size: 24px; color: #111; line-height: 1.1; }
  .dq-hd-mascot { width: 40px; height: 40px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; overflow: hidden; }

  .dq-prog-wrap { padding: 16px 20px 0; }
  .dq-prog-label { font-size: 11px; color: #bbb; font-weight: 500; margin-bottom: 8px; }
  .dq-prog { display: flex; gap: 6px; margin-bottom: 20px; }
  .dq-prog-seg { flex: 1; height: 4px; border-radius: 99px; background: #f0f0f0; transition: background 0.3s ease; }
  .dq-prog-seg.filled { background: #111; }

  .dq-section-label { padding: 0 20px 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: #888; text-transform: uppercase; }
  .dq-list { padding: 0 20px; display: flex; flex-direction: column; gap: 10px; }

  .dq-card { background: #fff; border: 1.5px solid #ebebeb; border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; text-align: left; font-family: inherit; }
  .dq-card:not(:disabled):hover { border-color: #ccc; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .dq-card:disabled { cursor: default; }
  .dq-card.done { border-color: #111; background: #fafafa; }

  .dq-card-main { display: flex; align-items: center; padding: 14px 16px; gap: 14px; }
  .dq-card-icon { font-size: 28px; width: 44px; height: 44px; background: #f7f7f7; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dq-card.done .dq-card-icon { background: #111; }
  .dq-card-info { flex: 1; }
  .dq-card-name { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 2px; }
  .dq-card-sub { font-size: 12px; color: #aaa; }
  .dq-card-action { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .dq-card-action.pending { background: #f0f0f0; color: #666; }
  .dq-card-action.done { background: #111; color: #fff; }
  .dq-card-thumb { height: 80px; overflow: hidden; border-top: 1px solid #f0f0f0; }
  .dq-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .dq-finish-wrap { padding: 20px; margin-top: auto; }
  .dq-finish-btn { width: 100%; height: 52px; background: #111; color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .dq-finish-btn:active { background: #333; }

  .cam-header { padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f0f0f0; }
  .cam-back-btn { width: 36px; height: 36px; border-radius: 8px; background: #f5f5f5; border: none; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; font-family: inherit; }
  .cam-header-info { flex: 1; }
  .cam-header-label { font-size: 11px; color: #aaa; font-weight: 500; margin-bottom: 2px; }
  .cam-header-name { font-size: 15px; font-weight: 600; color: #111; }
  .cam-header-icon { font-size: 22px; }

  .cam-vf { position: relative; background: #000; aspect-ratio: 3/4; overflow: hidden; }
  .cam-video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cam-flash { position: absolute; inset: 0; background: #fff; pointer-events: none; opacity: 0; transition: opacity 0.05s; }
  .cam-guide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .cam-guide-box { width: 60%; aspect-ratio: 1; border: 2px solid rgba(255,255,255,0.4); border-radius: 12px; }
  .cam-footer { padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; border-top: 1px solid #f0f0f0; }
  .cam-shoot { width: 64px; height: 64px; border-radius: 50%; background: #111; border: 4px solid #e0e0e0; cursor: pointer; transition: transform 0.1s; }
  .cam-shoot:active { transform: scale(0.94); }
  .cam-shoot-hint { font-size: 11px; color: #bbb; font-weight: 500; }

  .rv-photo img { width: 100%; display: block; }
  .rv-info { padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f0f0f0; }
  .rv-icon { font-size: 24px; }
  .rv-name { font-size: 16px; font-weight: 600; color: #111; flex: 1; }
  .rv-count { font-size: 12px; color: #bbb; }
  .rv-btns { display: flex; gap: 8px; padding: 16px 20px; }
  .rv-btn { flex: 1; height: 50px; border: 1.5px solid #e0e0e0; border-radius: 12px; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; color: #333; transition: background 0.15s; }
  .rv-btn:active { background: #f5f5f5; }
  .rv-btn.secondary { border-color: #ddd; color: #555; }
  .rv-btn.ok { background: #111; color: #fff; border-color: #111; }
  .rv-btn.ok:active { background: #333; }

  .done-header { padding: 24px 20px 20px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-end; justify-content: space-between; }
  .done-title { font-family: 'DM Serif Display', serif; font-size: 36px; color: #111; line-height: 1.1; }
  .done-badge { background: #111; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 6px 12px; border-radius: 99px; text-transform: uppercase; }

  .done-grid { padding: 20px; display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  .done-cell { border-radius: 12px; overflow: hidden; border: 1.5px solid #ebebeb; }
  .done-cell-img-btn { position: relative; width: 100%; border: none; padding: 0; cursor: pointer; display: block; background: none; }
  .done-cell-img-btn img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
  .done-cell-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; font-size: 22px; opacity: 0; transition: opacity 0.2s, background 0.2s; }
  .done-cell-img-btn:hover .done-cell-overlay,
  .done-cell-img-btn:active .done-cell-overlay { opacity: 1; background: rgba(0,0,0,0.3); }
  .done-cell-label { padding: 8px; font-size: 10px; font-weight: 600; color: #666; text-align: center; background: #fafafa; border-top: 1px solid #f0f0f0; }

  .done-save-hint { padding: 0 20px 12px; font-size: 11px; color: #bbb; text-align: center; }
  .done-btns { padding: 0 20px 28px; display: flex; gap: 10px; }
  .done-save-all-btn { flex: 2; height: 52px; border: 1.5px solid #e0e0e0; border-radius: 12px; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; color: #111; transition: background 0.15s; }
  .done-save-all-btn:active { background: #f5f5f5; }
  .done-new-btn { flex: 1; height: 52px; background: #111; color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .done-new-btn:active { background: #333; }
`;