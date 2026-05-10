"use client";

import React, { useEffect } from 'react';

interface NotificationButton {
  label: string;
  url: string;
}

interface FullPagePopupProps {
  title: string;
  message: string;
  buttons?: NotificationButton[];
  onClose: () => void;
}

const FullPagePopup: React.FC<FullPagePopupProps> = ({ title, message, buttons, onClose }) => {
  // Lock scroll when active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <>
      <style>{`
        @keyframes modalEnter {
          0% { transform: scale(0.9) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-modal-enter {
          animation: modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .frosted-overlay {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 frosted-overlay">
        {/* Main Card */}
        <div className="bg-white w-full max-w-md rounded-[2.5rem] border-[6px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,0.15)] overflow-hidden animate-modal-enter">
          
          {/* Header Graphic */}
          <div className="bg-[#DC2626] p-8 pb-12 relative overflow-hidden">
            <div className="relative z-10">
              <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                System Alert
              </span>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mt-4 leading-none">
                {title}
              </h2>
            </div>
            {/* Aesthetic "GY" background watermark */}
            <div className="absolute -bottom-4 -right-4 text-white/10 text-9xl font-black italic select-none">
              GY
            </div>
          </div>

          {/* Content Body */}
          <div className="p-8 bg-white -mt-6 rounded-t-[2rem] relative z-20">
            <p className="text-gray-800 text-lg font-bold leading-tight mb-8">
              {message}
            </p>

            <div className="flex flex-col gap-3">
              {buttons?.map((btn, index) => (
                <a
                  key={index}
                  href={btn.url}
                  className="w-full bg-black text-white py-4 rounded-2xl text-center font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  {btn.label}
                </a>
              ))}
              
              <button 
                onClick={onClose}
                className="w-full py-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors mt-2"
              >
                Dismiss Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullPagePopup;