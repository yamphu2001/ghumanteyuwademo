"use client";

import React, { useEffect } from 'react';

interface SmallToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const SmallToast: React.FC<SmallToastProps> = ({ message, onClose, duration = 4000 }) => {
  
  // Auto-dismiss logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <>
      <style>{`
        @keyframes popUp {
          0% { transform: translateY(20px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-pop-up {
          animation: popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .map-glass {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      {/* Positioned above your bottom-left action buttons */}
      <div className="fixed bottom-28 left-6 z-[9000] animate-pop-up">
        <div className="map-glass border-2 border-black/5 rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 min-w-[200px] max-w-[300px]">
          
          {/* Signal Pulse Indicator */}
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </div>

          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">
              Ghumante Update
            </p>
            <p className="text-sm font-bold text-black leading-tight tracking-tight">
              {message}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-black text-lg font-bold pl-2"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
};

export default SmallToast;