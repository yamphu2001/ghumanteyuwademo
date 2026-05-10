"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // THE KEY: Use this to log in during the demo
  const ADMIN_PASSWORD = "yuwa"; 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Artificial delay to look like a real "Security Check"
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem('admin_auth', 'true'); // Simple session lock
        router.push('/admin/dashboard');
      } else {
        setError(true);
        setIsLoading(false);
        setPassword(''); // Clear field on failure
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-between py-12 px-6 font-sans text-black">
      
      {/* Branding - Clean & Sharp */}
      <div className="flex flex-col items-center select-none">
        <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
          GHUMANTE
        </h1>
        <div className="flex justify-between w-full px-2 mt-1">
          {['y', 'u', 'w', 'a'].map((char) => (
            <span key={char} className="text-red-600 font-bold uppercase text-2xl leading-none">
              {char}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">
          Admin Portal
        </h2>
        
        {/* Main Entry Card */}
        <div className="bg-white rounded-[50px] shadow-[0_40px_80px_rgba(0,0,0,0.06)] p-12 border border-gray-50/50">
          <form onSubmit={handleLogin} className="flex flex-col items-center">
            <p className="text-gray-400 text-center mb-10 font-medium text-lg leading-tight">
              Enter password to access <br/> the conductor dashboard.
            </p>

            <div className="w-full relative mb-6">
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-[#F5F5F5] border-2 rounded-3xl px-6 py-5 text-center text-xl tracking-[0.3em] outline-none transition-all ${
                  error ? 'border-red-500 animate-shake' : 'border-transparent focus:border-black'
                }`}
                autoFocus
              />
              {error && (
                <p className="absolute -bottom-6 left-0 right-0 text-center text-red-500 text-[10px] font-black uppercase tracking-widest">
                  Invalid Access Key
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading || !password}
              className={`w-full font-bold py-6 rounded-3xl text-sm tracking-widest transition-all uppercase flex items-center justify-center ${
                !password 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-zinc-800 shadow-xl active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : "Enter Dashboard"}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-50 text-center">
            <p className="text-[11px] text-gray-300 font-bold tracking-widest uppercase">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>

      {/* Beta Branding */}
      <div className="text-gray-300 font-bold tracking-[0.4em] text-[10px] uppercase opacity-60">
        GHUMANTE V0.1 BETA
      </div>

      {/* Custom Shake Animation for Error */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>

    </div>
  );
}