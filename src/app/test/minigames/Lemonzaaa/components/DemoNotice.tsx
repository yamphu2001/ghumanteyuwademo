"use client";
import React from 'react';

const DemoNotice: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full z-[150] pointer-events-none">
      {/* The Top Bar */}
      <div className="bg-red-600 border-b-4 border-black py-1 overflow-hidden">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-white font-black italic uppercase text-[10px] mx-4 tracking-widest">
              CAUTION: EARLY ACCESS DEMO // NOT INDICATIVE OF FINAL PRODUCT // LA GARAU PVT. LTD. // BUILD 0.1.4 
            </span>
          ))}
        </div>
      </div>

      {/* The Corner Badge */}
      <div className="absolute top-10 left-6 pointer-events-auto">
        <div className="bg-black border-2 border-white px-3 py-1 shadow-[4px_4px_0px_0px_rgba(255,0,0,1)] transform -rotate-2">
          <p className="text-white font-mono text-[9px] leading-tight uppercase">
            Status: <span className="text-red-500 animate-pulse">Pre-Alpha</span><br/>
            Dev: Nepal_ Kathmandu
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default DemoNotice;