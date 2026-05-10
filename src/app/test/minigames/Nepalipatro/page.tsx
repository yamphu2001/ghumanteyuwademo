'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import SloganImage from './slogan.png'; 

export default function DateGuesser() {
  const [guess, setGuess] = useState(15);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'failed'>('idle');
  const [guessesLeft, setGuessesLeft] = useState(2);
  const correctGatey = 26; 

  const adjustDate = (amount: number) => {
    if (status === 'correct' || status === 'failed') return;
    setStatus('idle');
    setGuess(prev => {
      const next = prev + amount;
      if (next > 32) return 1;
      if (next < 1) return 32;
      return next;
    });
  };

  const handleAction = () => {
    if (status === 'correct') {
      window.open('https://nepalipatro.com.np', '_blank');
      return;
    }

    if (guess === correctGatey) {
      setStatus('correct');
    } else {
      const remaining = guessesLeft - 1;
      setGuessesLeft(remaining);
      
      if (remaining <= 0) {
        setStatus('failed');
      } else {
        setStatus('wrong');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-50 mt-10 p-4 font-sans">
      
      {/* 1. AD DATE MISSION CARD */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 mb-6 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 -mr-8 -mt-8 rotate-45"></div>
        
        <div className="flex justify-between items-center mb-1 px-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Today's Date (AD - Anno Domini) 
            </p>
            {/* DOT INDICATORS */}
            <div className="flex gap-1.5">
              {[...Array(2)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    status === 'correct' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
                    i < guessesLeft ? 'bg-black' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                  }`}
                />
              ))}
            </div>
        </div>
        <h2 className="text-white text-xl font-bold tracking-tight">
          Tuesday, March 10, 2026
        </h2>
      </div>

      {/* 2. Slogan Area */}
      <div className="flex flex-col items-center mb-8 px-2">
        <div className="relative w-full h-32 transition-transform active:scale-95 duration-200">
          <Image 
            src={SloganImage} 
            alt="आज कति गते?" 
            fill
            className="object-contain"
            priority
          />
        </div>

        <p className="text-[#D32F2F] font-black text-[10px] uppercase tracking-widest mt-2 mb-4 text-center">
            {status === 'failed' ? "Attempts Exhausted" : "What is the Nepali Date (BS) Today?"}
        </p>
      {/* REFINED SHORTCUT BUTTON - Now with more "Button" Energy */}
        <button 
          onClick={() => window.open('https://nepalipatro.com.np', '_blank')}
          className="group flex items-center gap-2 px-8 py-3 bg-white border-2 border-[#D32F2F] text-[#D32F2F] rounded-full transition-all active:scale-95 hover:bg-red-50 shadow-sm"
        >
          <span className="font-black text-[10px] tracking-widest uppercase">
            {status === 'failed' ? "Get Answer from Nepali Patro" : "Use Nepali Patro Shortcut"}
          </span>
        </button>
         </div>

      {/* 3. The Clean Selector */}
      <div className="px-4 pb-8 pt-4 text-center">
        <div className="flex items-center justify-center gap-4 mb-10">
          <button 
            onClick={() => adjustDate(-1)}
            disabled={status === 'failed' || status === 'correct'}
            className="w-16 h-16 bg-[#F1F3F5] rounded-2xl flex items-center justify-center text-3xl font-bold text-slate-400 active:scale-90 transition-all disabled:opacity-20"
          > − </button>

          <div className={`w-36 h-36 flex items-center justify-center rounded-[2rem] border-2 transition-all duration-300 ${
            status === 'correct' ? 'border-green-500 bg-green-50 text-green-600' : 
            status === 'failed' ? 'border-slate-200 bg-slate-50 text-slate-300' :
            status === 'wrong' ? 'border-red-500 bg-red-50 text-red-600 animate-shake' : 
            'border-[#1E293B] bg-white text-[#1E293B]'
          }`}>
            <span className="text-7xl font-bold tabular-nums">{guess}</span>
          </div>

          <button 
            onClick={() => adjustDate(1)}
            disabled={status === 'failed' || status === 'correct'}
            className="w-16 h-16 bg-[#F1F3F5] rounded-2xl flex items-center justify-center text-3xl font-bold text-slate-400 active:scale-90 transition-all disabled:opacity-20"
          > + </button>
        </div>

        {/* 4. Action Buttons */}
        <div className="space-y-4 px-2">
          {status !== 'failed' ? (
            <button 
              onClick={handleAction}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_6px_0_0_rgba(183,28,28,1)] active:shadow-none active:translate-y-[4px] ${
                status === 'correct' 
                  ? 'bg-green-600 shadow-[0_6px_0_0_rgba(21,128,61,1)] text-white' 
                  : 'bg-[#D32F2F] text-white'
              }`}
            >
              {status === 'correct' ? 'VISIT OFFICIAL SITE' : 'VERIFY DATE'}
            </button>
          ) : (
            <button 
              onClick={() => { setGuessesLeft(2); setStatus('idle'); }}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[4px]"
            >
              TRY AGAIN
            </button>
          )}

          {status === 'correct' && (
            <button 
              onClick={() => window.location.href = '/map'} 
              className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all hover:bg-slate-200"
            >
              RETURN TO MAP
            </button>
          )}
        </div>

        <p className="mt-8 text-[8px] font-bold text-slate-300 uppercase tracking-widest italic text-center">
          PART OF THE GHUMANTE YUWA EXPERIENCE
        </p>
      </div>
    </div>
  );
}