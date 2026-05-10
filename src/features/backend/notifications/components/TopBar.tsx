"use client";

import React from 'react';

interface NotificationButton {
  label: string;
  url: string;
}

interface TopBarProps {
  message: string;
  buttons?: NotificationButton[];
  onClose: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ message, buttons, onClose }) => {
  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glass-nav {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      <div className="fixed top-0 left-0 w-full z-[9999] px-4 pt-4 animate-slide-down">
        {/* Container with rounded bottom edges to feel like a floating module */}
        <div className="glass-nav border-b-4 border-black rounded-b-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden">
          
          {/* Top Red Accent Line */}
          <div className="h-1.5 w-full bg-[#DC2626]" />

          <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Branding & Message */}
            <div className="flex items-center gap-4">
              <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm italic shrink-0">
                GY
              </div>
              <p className="text-black font-extrabold uppercase tracking-tight text-sm md:text-base leading-tight">
                {message}
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {buttons?.map((btn, index) => (
                <a
                  key={index}
                  href={btn.url}
                  className="bg-black text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#DC2626] transition-all shadow-md active:translate-y-0.5"
                >
                  {btn.label}
                </a>
              ))}
              
              <button 
                onClick={onClose}
                className="ml-2 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-black transition-all font-bold text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopBar;