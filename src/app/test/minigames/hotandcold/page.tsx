'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

export default function HotAndColdGame() {
  // 1. Player Position (in percentages)
  const [pos, setPos] = useState({ x: 10, y: 10 });
  
  // 2. Hidden Landmark (The "Target")
  const [target] = useState({ x: 75, y: 65 }); // e.g., A hidden shrine at 75%, 65%
  
  const [distance, setDistance] = useState(100);
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'winning' | 'found'>('playing');

  // 3. Movement Logic (WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      const speed = 2; // Movement increment
      setPos(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (e.key.toLowerCase() === 'w') newY = Math.max(0, prev.y - speed);
        if (e.key.toLowerCase() === 's') newY = Math.min(100, prev.y + speed);
        if (e.key.toLowerCase() === 'a') newX = Math.max(0, prev.x - speed);
        if (e.key.toLowerCase() === 'd') newX = Math.min(100, prev.x + speed);

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // 4. Distance and Win Logic
  useEffect(() => {
    const d = Math.sqrt(Math.pow(pos.x - target.x, 2) + Math.pow(pos.y - target.y, 2));
    setDistance(d);

    // If "Near" (Within 8 units)
    if (d < 8) {
      if (timer === 0) setTimer(5); // Start 5s countdown
    } else {
      setTimer(0); // Reset if they move away
    }
  }, [pos, target]);

  // 5. The 5-Second Proximity Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setGameState('found');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, gameState]);

  // Helper for Temperature Vibe
  const getVibe = () => {
    if (distance < 15) return { text: 'SCORCHING!', color: 'text-red-600', bg: 'bg-red-100' };
    if (distance < 30) return { text: 'WARM...', color: 'text-orange-500', bg: 'bg-orange-100' };
    if (distance < 50) return { text: 'CHILLY', color: 'text-blue-400', bg: 'bg-blue-50' };
    return { text: 'FREEZING', color: 'text-slate-300', bg: 'bg-slate-100' };
  };

  const vibe = getVibe();

  return (
    <div className="max-w-xl mx-auto p-6 font-sans select-none">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">HIDDEN HERITAGE</h2>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest italic">Use WASD to find the shrine</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black transition-colors ${vibe.bg} ${vibe.color}`}>
          {vibe.text}
        </div>
      </div>

      {/* THE MAP AREA */}
      <div className="relative aspect-square bg-slate-200 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden cursor-crosshair">
        {/* Placeholder for Map Background */}
        <div className="absolute inset-0 opacity-40 grayscale pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]"></div>

        {/* TARGET (Hidden until found) */}
        {gameState === 'found' && (
          <div 
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl animate-bounce"
          >
            ⛩️
          </div>
        )}

        {/* THE PLAYER (YUWA) */}
        <div 
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          className="absolute w-12 transition-all duration-150 ease-out -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <Image src={MascotImage} alt="Yuwa" className="w-full h-auto drop-shadow-md" />
          
          {/* Proximity Timer UI */}
          {timer > 0 && gameState === 'playing' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">
              STAY HERE: {timer}s
            </div>
          )}
        </div>
      </div>

      {/* GAME OVER STATE */}
      {gameState === 'found' && (
        <div className="mt-8 p-6 bg-green-600 text-white rounded-3xl text-center animate-in fade-in zoom-in duration-500 shadow-xl">
          <p className="text-3xl font-black mb-2">SHRINE DISCOVERED!</p>
          <p className="text-sm opacity-90 mb-6">You successfully tracked the heritage vibe in the area.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-green-700 rounded-full font-bold hover:bg-slate-100 transition"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-2 opacity-20 text-[10px] font-black uppercase tracking-widest">
        <span>Ghumante Yuwa</span>
        <span>•</span>
        <span>Sandbox v2.0</span>
      </div>
    </div>
  );
}