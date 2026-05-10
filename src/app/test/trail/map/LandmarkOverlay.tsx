"use client";
import React, { useState } from 'react';
import { X, Maximize2 } from 'lucide-react'; // Install lucide-react or replace with SVG
import { Landmark } from "./locationmarker";

interface OverlayProps {
  landmark: Landmark | null;
  onClose: () => void;
  isCaptured: boolean; // New prop
}

export default function LandmarkOverlay({ landmark, onClose, isCaptured }: OverlayProps) {
  const [showOnlyImage, setShowOnlyImage] = useState(false);
  if (!landmark) return null;

  // Mode: Fullscreen Image Only (Triggers when clicking left-side image)
  if (showOnlyImage) {
    return (
      <div className="fixed inset-0 z-10000 bg-black flex items-center justify-center p-4">
        <button
          onClick={() => setShowOnlyImage(false)}
          className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors"
        >
          <X size={32} />
        </button>
        <img
          src={landmark.image}
          alt={landmark.name}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />
      </div>
    );
  }

  // Mode: Split Screen (Image Left, Info Right)
  return (
    <div className="fixed inset-0 z-9999 bg-white flex flex-col md:flex-row animate-in slide-in-from-bottom duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 bg-black/5 text-black hover:bg-black/10 rounded-full transition-all"
      >
        <X size={28} />
      </button>

      {/* Left Side: Image */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-neutral-200">
        <img src={landmark.image} className={`w-full h-full object-cover ${!isCaptured ? 'grayscale blur-sm' : ''}`} />
        {!isCaptured && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold">
            LOCKED: ARRIVE AT LOCATION
          </div>
        )}
      </div>

      

      {/* Right Side: Content */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center px-10 md:px-24 py-12 bg-white">
        <h2 className="text-5xl font-black text-neutral-900 mb-4">{landmark.name}</h2>
        
        {isCaptured ? (
          <>
            <div className="w-20 h-2 bg-green-500 mb-8 rounded-full" />
            <p className="text-xl text-neutral-600 leading-relaxed mb-8 animate-in fade-in duration-700">
              {landmark.description}
            </p>
          </>
        ) : (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6">
            <p className="text-amber-700 font-bold uppercase tracking-widest text-sm mb-2">Data Encrypted</p>
            <p className="text-neutral-600">
              You must stay within 5 meters for 5 seconds to decrypt this landmark's history.
            </p>
          </div>
        )}

        <button onClick={onClose} className="mt-8 px-10 py-4 bg-black text-white font-bold rounded-xl">
          BACK TO MAP
        </button>
      </div>
    </div>
  );
}