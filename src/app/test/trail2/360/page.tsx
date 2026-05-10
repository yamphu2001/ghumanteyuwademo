"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const PANORAMA_IMAGES = [
  { 
    id: 'scene1', 
    url: "/panoramas/scene1.jpg", 
    label: "Durbar Square",
    brief: "Heart of ancient Kathmandu",
    detailed: "UNESCO World Heritage site with palaces from the Malla dynasty..."
  },
  { 
    id: 'scene2', 
    url: "/panoramas/scene2.jpg", 
    label: "Hidden Alley",
    brief: "Traditional Newa settlement",
    detailed: "These narrow alleys showcase medieval urban planning..."
  },
  { 
    id: 'scene3', 
    url: "/panoramas/scene3.jpg", 
    label: "Temple View",
    brief: "Ancient pagoda architecture",
    detailed: "Intricate wood carvings tell stories of Hindu mythology..."
  },
];

type Mode = 'visitor' | 'non-visitor';

export default function Enhanced360Viewer() {
  const viewerRef = useRef<any>(null);
  const [currentImg, setCurrentImg] = useState(PANORAMA_IMAGES[0].url);
  const [rotation, setRotation] = useState(0);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('non-visitor'); // Default to non-visitor
  const [showInfo, setShowInfo] = useState(false);
  const lastRotation = useRef(0);

  const currentScene = PANORAMA_IMAGES.find(img => img.url === currentImg);

  const initPannellum = () => {
    if ((window as any).pannellum) {
      setIsLoading(true);
      viewerRef.current = (window as any).pannellum.viewer('panorama-container', {
        type: "equirectangular",
        panorama: currentImg,
        autoLoad: true,
        showControls: false,
        friction: 0.15,
        hfov: 110,
        onLoad: () => setIsLoading(false),
      });

      const updateCompass = () => {
        if (viewerRef.current) {
          const yaw = viewerRef.current.getYaw();
          setRotation(yaw);
        }
        requestAnimationFrame(updateCompass);
      };
      requestAnimationFrame(updateCompass);
    }
  };

  const toggleGyro = async () => {
    if (!viewerRef.current) return;
    
    const enable = () => {
      viewerRef.current.startOrientation();
      setIsGyroActive(true);
    };

    const disable = () => {
      viewerRef.current.stopOrientation();
      setIsGyroActive(false);
    };

    if (isGyroActive) {
      disable();
    } else {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const state = await (DeviceOrientationEvent as any).requestPermission();
          if (state === 'granted') enable();
        } catch (error) {
          console.error('Gyro permission error:', error);
        }
      } else {
        enable();
      }
    }
  };

  const handleSceneChange = (imgUrl: string) => {
    setCurrentImg(imgUrl);
    if (viewerRef.current) {
      viewerRef.current.setPanorama(imgUrl);
    }
    setShowInfo(false); // Close info panel on scene change
  };

  // Get rotation style for compass
  const getRotationStyle = () => {
    const diff = Math.abs(rotation - lastRotation.current);
    lastRotation.current = rotation;
    return {
      transform: `rotate(${rotation}deg)`,
      transition: diff > 100 ? 'none' : 'transform 0.1s linear'
    };
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
      <Script 
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" 
        onLoad={initPannellum}
        strategy="afterInteractive"
      />

      {/* Panorama Container */}
      <div id="panorama-container" className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-white/20 border-t-[#EF4444] rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white text-sm font-medium">Loading panorama...</p>
          </div>
        </div>
      )}

      {/* Mode Toggle - Prominent but clean */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10 flex">
          <button
            onClick={() => setMode('non-visitor')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              mode === 'non-visitor' 
                ? 'bg-white text-black' 
                : 'text-white/70'
            }`}
          >
            EXPLORE
          </button>
          <button
            onClick={() => setMode('visitor')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'visitor' 
                ? 'bg-[#EF4444] text-white' 
                : 'text-white/70'
            }`}
          >
            VISITOR MODE
            {mode === 'visitor' && <span className="text-[10px]">🎮</span>}
          </button>
        </div>
      </div>

      {/* Main Gyro Button - Prominent for mobile */}
      <button
        onClick={toggleGyro}
        className={`absolute top-20 left-1/2 -translate-x-1/2 z-40 
                   px-6 py-3 rounded-full text-sm font-bold 
                   transition-all flex items-center gap-2
                   ${isGyroActive 
                     ? 'bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/30' 
                     : 'bg-black/40 backdrop-blur-xl text-white border border-white/20'
                   }`}
      >
        <span className="text-lg">{isGyroActive ? '🎯' : '📱'}</span>
        {isGyroActive ? 'GYRO ACTIVE' : 'ENABLE GYRO'}
      </button>

      {/* Compass - Simplified for mobile */}
      <div className="absolute top-4 right-4 z-40">
        <div className="bg-black/40 backdrop-blur-xl rounded-full p-3 border border-white/10">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 text-white/30 text-[10px] text-center pt-1">N</div>
            <div 
              className="w-1 h-6 bg-[#EF4444] rounded-full mx-auto shadow-lg"
              style={getRotationStyle()}
            />
          </div>
        </div>
      </div>

      {/* Scene Info Panel - Based on mode */}
      {currentScene && (
        <div className="absolute bottom-28 left-4 right-4 md:left-auto md:right-auto md:max-w-md mx-auto z-40">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{currentScene.label}</h2>
                <p className="text-white/70 text-sm mt-1">
                  {mode === 'visitor' ? currentScene.detailed : currentScene.brief}
                </p>
              </div>
              {mode === 'visitor' && (
                <button className="bg-[#EF4444] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 ml-2">
                  <span className="text-white text-xl">🎯</span>
                </button>
              )}
            </div>

            {/* Visitor Mode: Quick actions */}
            {mode === 'visitor' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <button className="flex-1 bg-white/10 rounded-xl py-2 text-white text-xs font-medium flex items-center justify-center gap-1">
                  <span>📜</span> History
                </button>
                <button className="flex-1 bg-white/10 rounded-xl py-2 text-white text-xs font-medium flex items-center justify-center gap-1">
                  <span>🎮</span> Mini-game
                </button>
                <button className="flex-1 bg-white/10 rounded-xl py-2 text-white text-xs font-medium flex items-center justify-center gap-1">
                  <span>📷</span> Scan QR
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scene Selector - Compact horizontal scroll */}
      <div className="absolute bottom-4 left-0 right-0 z-40 px-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {PANORAMA_IMAGES.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSceneChange(item.url)}
                className="flex-shrink-0"
              >
                <div className={`relative rounded-xl overflow-hidden transition-all ${
                  currentImg === item.url 
                    ? 'ring-2 ring-[#EF4444] scale-105' 
                    : 'opacity-60'
                }`}>
                  <img 
                    src={item.url} 
                    alt={item.label}
                    className="w-16 h-16 object-cover"
                  />
                  {currentImg === item.url && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#EF4444] h-1" />
                  )}
                </div>
                <p className="text-white text-[10px] font-medium mt-1 text-center truncate w-16">
                  {item.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Museum Branding */}
      <div className="absolute top-4 left-4 z-40">
        <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
          <span className="text-white text-xs font-medium">🏛️ GHUMANTE YUWA</span>
        </div>
      </div>
    </div>
  );
}