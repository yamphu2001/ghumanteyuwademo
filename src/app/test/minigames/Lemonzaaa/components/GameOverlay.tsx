"use client";
import React, { useState } from 'react';

const GameOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6">
      {/* Red Shadow Box */}
      <div className="bg-white border-[6px] border-black p-8 md:p-12 max-w-2xl w-full shadow-[20px_20px_0px_0px_rgba(220,38,38,1)]">
        
        <h1 className="text-5xl md:text-7xl font-black italic uppercase leading-none mb-8">
          System <br /> <span className="text-red-600">Requirement</span>
        </h1>

        <div className="space-y-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="bg-black text-white px-3 py-1 font-bold text-xl uppercase">01</div>
            <p className="text-xl md:text-2xl font-black uppercase italic">View on Laptop / Desktop</p>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-black text-white px-3 py-1 font-bold text-xl uppercase">02</div>
            <p className="text-xl md:text-2xl font-black uppercase italic">Use <span className="text-red-600 underline">WASD</span> to Navigate</p>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-black text-white px-3 py-1 font-bold text-xl uppercase">03</div>
            <p className="text-xl md:text-2xl font-black uppercase italic">Click objects to interact</p>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="w-full bg-black text-white py-6 text-3xl font-black italic uppercase hover:bg-red-600 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95"
        >
          Enter Demo
        </button>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">
          La Garau Pvt. Ltd. // Internal Build v1.0.4
        </p>
      </div>
    </div>
  );
};

export default GameOverlay;