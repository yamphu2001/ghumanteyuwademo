'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

export default function TreasureMapQuest() {
  // 1. Setup the "Treasure" location
  const [playerPos, setPlayerPos] = useState({ x: 20, y: 20 });
  const [treasureLocation] = useState({ x: 85, y: 15 }); // Fixed: Removed the asterisks
  const [isFound, setIsFound] = useState(false);

  // 2. Handle Movement
  useEffect(() => {
    const handleMove = (e: KeyboardEvent) => {
      if (isFound) return;
      const step = 3;
      setPlayerPos(prev => {
        let { x, y } = prev;
        if (e.key.toLowerCase() === 'w') y = Math.max(0, y - step);
        if (e.key.toLowerCase() === 's') y = Math.min(100, y + step);
        if (e.key.toLowerCase() === 'a') x = Math.max(0, x - step);
        if (e.key.toLowerCase() === 'd') x = Math.min(100, x + step);
        
        // Check if close to treasure
        const dist = Math.sqrt(Math.pow(x - treasureLocation.x, 2) + Math.pow(y - treasureLocation.y, 2));
        if (dist < 5) setIsFound(true);
        
        return { x, y };
      });
    };
    window.addEventListener('keydown', handleMove);
    return () => window.removeEventListener('keydown', handleMove);
  }, [isFound, treasureLocation]);

  return (
    <div className="max-w-md mx-auto p-6 font-mono text-slate-800">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-slate-800 inline-block pb-1">
          The Secret Key
        </h2>
        <p className="text-[10px] mt-2 font-bold text-slate-500 italic">"Follow the path, find the prize"</p>
      </div>

      {!isFound ? (
        <div className="space-y-6">
          <div className="relative aspect-square bg-[#f4e4bc] border-[6px] border-[#5d4037] rounded-lg shadow-[8px_8px_0px_0px_rgba(93,64,55,1)] overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5d4037 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="absolute top-[20%] left-[20%] text-xs font-black opacity-30 border-2 border-dashed border-slate-900 p-2 rotate-3">BASANTAPUR</div>
            <div className="absolute bottom-[20%] right-[30%] text-xs font-black opacity-30 border-2 border-dashed border-slate-900 p-2 -rotate-6">THE STALL</div>
            
            <div 
              style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
              className="absolute w-10 transition-all duration-150 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <Image src={MascotImage} alt="Yuwa" className="w-full h-auto drop-shadow-md" />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 p-2 text-[10px] border border-slate-900 leading-tight">
              <b>MISSION:</b> Navigate Yuwa through the heritage site to the location marked by the ancient ancestors.
            </div>
          </div>
          
          <div className="flex justify-center gap-4 text-xs font-black">
             <div className="flex items-center gap-2"> <span className="p-2 border border-slate-400 rounded">W</span> <span>UP</span> </div>
             <div className="flex items-center gap-2"> <span className="p-2 border border-slate-400 rounded">S</span> <span>DOWN</span> </div>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom duration-500">
          <div className="bg-[#fff9c4] border-4 border-dashed border-yellow-700 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10 text-6xl">🔑</div>
            <div className="relative z-10">
              <div className="text-6xl mb-4">🗝️</div>
              <h3 className="text-2xl font-black text-yellow-900 mb-2">ANCIENT KEY FOUND!</h3>
              <p className="text-xs text-yellow-800 font-bold mb-6">VALID FOR 1 PRIZE AT THE LA GARAU STALL</p>
              <div className="bg-white border-2 border-yellow-600 p-4 rounded-xl font-mono text-[10px] text-left space-y-2">
                <p><b>HOLDER:</b> Ghumante Yuwa Explorer</p>
                <p><b>TIMESTAMP:</b> {new Date().toLocaleTimeString()}</p>
                <p><b>STATUS:</b> AUTHENTICATED</p>
              </div>
              <div className="mt-8">
                 <Image src={MascotImage} alt="Yuwa" width={60} height={60} className="mx-auto" />
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] mt-6 font-bold text-slate-400 uppercase tracking-widest">Show this to the stall coordinator.</p>
        </div>
      )}
    </div>
  );
}