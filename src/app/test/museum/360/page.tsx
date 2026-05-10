"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';


// 1. Manually list your images here (files must be in /public/panoramas/)
const PANORAMA_IMAGES = [
  "/panoramas/scene1.jpg",
  
];

export default function ThreeSixtyViewer() {
  const viewerRef = useRef<any>(null);
  const [currentImg, setCurrentImg] = useState<string>(PANORAMA_IMAGES[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  // WASD Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewerRef.current) return;
      const speed = 3;
      const v = viewerRef.current;
      switch(e.key.toLowerCase()) {
        case 'w': v.setPitch(v.getPitch() + speed); break;
        case 's': v.setPitch(v.getPitch() - speed); break;
        case 'a': v.setYaw(v.getYaw() - speed); break;
        case 'd': v.setYaw(v.getYaw() + speed); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initPannellum = () => {
    if ((window as any).pannellum) {
      viewerRef.current = (window as any).pannellum.viewer('panorama-container', {
        type: "equirectangular",
        panorama: currentImg,
        autoLoad: true,
        showControls: false,
        orientationOnByDefault: false,
        friction: 0.1, // Better performance for mobile
      });
      setIsLoaded(true);
    }
  };

  const switchImage = (imgUrl: string) => {
    setCurrentImg(imgUrl);
    if (viewerRef.current) {
      viewerRef.current.setPanorama(imgUrl);
    }
  };

  const toggleGyro = () => {
    if (!viewerRef.current) return;
    // iOS 13+ Permission Request
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((state: string) => {
          if (state === 'granted') viewerRef.current.startOrientation();
        })
        .catch(console.error);
    } else {
      viewerRef.current.startOrientation();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Load Pannellum via Next.js Script Strategy */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
      <Script 
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" 
        onLoad={initPannellum}
        strategy="afterInteractive"
      />

      <div id="panorama-container" className="w-full h-full" />

      {/* Control Overlay */}
      <div className="absolute top-6 right-6 flex flex-col gap-3">
        <button 
          onClick={toggleGyro}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/30 transition-all active:scale-95 shadow-xl"
        >
          Toggle Gyro 📳
        </button>
      </div>

      {/* Dynamic Thumbnails */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 max-w-[90vw] overflow-x-auto scrollbar-hide shadow-2xl">
        {PANORAMA_IMAGES.map((img) => (
          <button
            key={img}
            onClick={() => switchImage(img)}
            className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all duration-300 ${
              currentImg === img ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img} alt="Preview" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop Hint */}
      <div className="absolute top-6 left-6 hidden md:block text-white/50 text-xs bg-black/20 p-2 rounded">
        Use WASD to Look Around
      </div>
    
    
    </div>
  );
}