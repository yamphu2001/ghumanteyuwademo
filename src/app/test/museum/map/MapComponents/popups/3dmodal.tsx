"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Landmark } from "../../MapComponents/markers/landmarks";
import { ViewMode } from "../../UiButton/ModeSwitcher";

interface ModalProps {
  landmark: Landmark | null;
  activeMode: ViewMode;
  isMobile: boolean;
  onClose: () => void;
}

export default function PopupModal({ landmark, activeMode, isMobile, onClose }: ModalProps) {
  const viewerRef = useRef<any>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  const initPannellum = () => {
    const pnl = (window as any).pannellum;
    if (pnl && landmark) {
      if (viewerRef.current) viewerRef.current.destroy();
      viewerRef.current = pnl.viewer('panorama-viewer', {
        type: "equirectangular",
        panorama: landmark.images?.[0] || "",
        autoLoad: true,
        showControls: false,
        autoRotate: -2,
      });
    }
  };

  useEffect(() => {
    if (isLibraryLoaded && landmark) initPannellum();
  }, [landmark, isLibraryLoaded]);

  if (!landmark) return null;

  // --- MOBILE UI VERSION ---
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
        <Script 
          src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" 
          onLoad={() => setIsLibraryLoaded(true)}
        />

        {/* Full Screen Viewer */}
        <div className="relative w-full h-full bg-black">
          <div id="panorama-viewer" className="w-full h-full" />
          
          {/* Top Controls */}
          <div className="absolute top-6 right-6 z-[150] flex gap-3">
            <button 
              onClick={() => setShowMobileInfo(true)}
              className="bg-white/10 backdrop-blur-md text-white w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-xl font-serif"
            >
              i
            </button>
            <button 
              onClick={onClose}
              className="bg-white text-black w-12 h-12 rounded-full font-bold flex items-center justify-center shadow-xl"
            >
              ✕
            </button>
          </div>

          {/* Bottom Label Overlay */}
          <div className="absolute bottom-10 left-8 pointer-events-none z-[130]">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-lg">
                {landmark.name}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-white/70">360° Interactive Portal</p>
          </div>
        </div>

        {/* Mobile Info Sheet (Slide up) */}
        <div className={`fixed inset-0 z-[160] bg-black/95 backdrop-blur-2xl p-10 flex flex-col justify-center transition-transform duration-500 ease-in-out
          ${showMobileInfo ? "translate-y-0" : "translate-y-full"}`}>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-tight">{landmark.name}</h2>
          <div className="w-10 h-1 bg-red-600 mb-6" />
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            {landmark.description}
          </p>
          <button 
            onClick={() => setShowMobileInfo(false)}
            className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-sm"
          >
            Close Info
          </button>
        </div>
      </div>
    );
  }

  // --- DESKTOP UI VERSION ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
      <Script 
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" 
        onLoad={() => setIsLibraryLoaded(true)}
      />

      <div className="bg-[#111] text-white overflow-hidden rounded-3xl shadow-2xl relative flex w-[95vw] max-w-[1200px] h-[70vh] flex-row border border-white/5">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-5 right-5 z-[120] bg-white text-black w-10 h-10 rounded-full font-bold flex items-center justify-center hover:scale-110 transition-transform">
          ✕
        </button>

        {/* 360 Viewer Section (75%) */}
        <div className="w-3/4 h-full relative bg-black">
          <div id="panorama-viewer" className="w-full h-full" />
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Experience</span>
            <span className="text-sm font-bold text-white uppercase italic block">Interactive 360°</span>
          </div>
        </div>

        {/* Info Sidebar (25%) */}
        <div className="w-1/4 p-10 flex flex-col justify-between bg-[#0a0a0a] border-l border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
               <span className="text-[10px] uppercase font-black text-red-600 tracking-tighter">Live Tour</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none mb-4">{landmark.name}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{landmark.description}</p>
          </div>

          <button onClick={onClose} className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all uppercase text-xs tracking-widest">
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}