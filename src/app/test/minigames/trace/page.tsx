'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

export default function PerspectiveMatch() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'searching' | 'aligned'>('searching');

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) { console.error(err); }
    }
    startCamera();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 font-sans text-center">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">DRISHTI-BHRAM</h2>
        <p className="text-sm text-slate-500 font-bold">Align the outline with the real landmark!</p>
      </div>

      <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        
        {/* THE GHOSTLY OUTLINE (The target the player must find in the real world) */}
        {/* This would be a SVG/PNG of a 3D scan silhouette */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${status === 'aligned' ? 'opacity-0 scale-150' : 'opacity-40'}`}>
          <div className="w-64 h-80 border-[10px] border-dashed border-white rounded-t-[5rem] flex items-center justify-center">
             <span className="text-white font-black text-xs">FIND THE STONE ARCH</span>
          </div>
        </div>

        {/* YUWA APPEARS ONLY ON SUCCESS */}
        {status === 'aligned' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/40 backdrop-blur-sm animate-in fade-in duration-500">
             <div className="w-32 mb-4">
                <Image src={MascotImage} alt="Yuwa" className="w-full h-auto animate-bounce" />
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-xl mx-6">
                <p className="font-black text-slate-800">PERFECT ALIGNMENT!</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">You found the 17th Century Gateway.</p>
             </div>
          </div>
        )}

        {/* MANUAL "ALIGN" BUTTON FOR DEMO */}
        {/* In the final app, this would be computer vision or a proximity sensor */}
        {status === 'searching' && (
          <div className="absolute bottom-8 left-0 right-0 px-10">
            <button 
              onClick={() => setStatus('aligned')}
              className="w-full py-4 bg-white/20 backdrop-blur-md border border-white/50 text-white rounded-2xl font-black text-xs tracking-[0.3em] hover:bg-white/40 transition-all"
            >
              LOCK PERSPECTIVE
            </button>
          </div>
        )}
      </div>

      {status === 'aligned' && (
        <button 
          onClick={() => setStatus('searching')}
          className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
        >
          FIND NEXT ARCHITECTURE
        </button>
      )}
    </div>
  );
}