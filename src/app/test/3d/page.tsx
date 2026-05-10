"use client";

import React, { useState } from 'react';

// Model IDs
const MODELS = {
  BUDDHA: "b2d7100fb53549409615c43dc02b13b0",
  BASANTAPUR: "609e4ccfa3ca4d94ae0f572315ddf4a5"
};

export default function FullPage3DViewer() {
  const [activeModel, setActiveModel] = useState(MODELS.BUDDHA);
  const [loading, setLoading] = useState(true);

  // Function to switch models and reset loading state
  const handleSwitch = (id: string) => {
    if (id !== activeModel) {
      setLoading(true);
      setActiveModel(id);
    }
  };

  return (
    /** * 'fixed inset-0' and 'touch-none' prevent the mobile browser 
     * from scrolling the page while you try to rotate the 3D model.
     */
    <main className="fixed inset-0 w-screen h-[100dvh] bg-black overflow-hidden touch-none">
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em]">Initialising Scene</p>
        </div>
      )}

      {/* Full Screen Iframe */}
      <iframe
        key={activeModel}
        title="3D Viewer"
        className="w-full h-full border-0 pointer-events-auto"
        src={`https://sketchfab.com/models/${activeModel}/embed?ui_theme=dark&autoplay=1&dnt=1&cardboard=0`}
        onLoad={() => setLoading(false)}
        allowFullScreen
        // Permissions for mobile orientation and full-screen interaction
        allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
      ></iframe>

      {/* Model Switcher UI */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-full shadow-2xl">
        <button
          onClick={() => handleSwitch(MODELS.BUDDHA)}
          className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
            activeModel === MODELS.BUDDHA 
            ? "bg-white text-black" 
            : "text-white/50 hover:text-white"
          }`}
        >
          Buddha
        </button>
        <button
          onClick={() => handleSwitch(MODELS.BASANTAPUR)}
          className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
            activeModel === MODELS.BASANTAPUR 
            ? "bg-white text-black" 
            : "text-white/50 hover:text-white"
          }`}
        >
          Basantapur
        </button>
      </div>

      {/* Logo/Corner Label */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <p className="text-white/20 text-[10px] font-light tracking-[0.4em] uppercase">
          3D Explorer
        </p>
      </div>
    </main>
  );
}