'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './lobby.module.css';

// 1. Move the logic into a sub-component
function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = (searchParams.get('username') || 'EXPLORER').toUpperCase();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/dashboard?username=${username}`);
    }, 5000);
    return () => clearTimeout(timer);
  }, [router, username]);

  return (
    <div className={styles.contentWrapper}>
      <header className="text-center mb-8">
        <h1 className="text-6xl font-[1000] leading-none tracking-tighter uppercase italic">
          HELLO, <br /> {username}!
        </h1>
        <p className="text-gray-500 font-bold text-lg mt-4">
          We’re setting up your adventure.
        </p>
      </header>

      <div className="w-full max-w-sm p-10 bg-white rounded-[50px] shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-50 rounded-3xl mb-10 flex items-center justify-center">
           <div className="w-10 h-10 border-[6px] border-[#f05542] border-t-transparent rounded-full animate-spin" />
        </div>

        <h2 className="text-2xl font-[1000] uppercase tracking-tight mb-4 text-center">
          JOINING A GROUP
        </h2>
        
        <p className="text-gray-400 text-center font-black text-sm leading-tight uppercase px-4">
          We'll redirect you after a group is formed. <br /> Thank you!
        </p>

        <div className="mt-12 w-full bg-gray-100 h-4 rounded-full overflow-hidden">
          <div className="bg-[#f05542] h-full animate-progress-fill shadow-[0_0_15px_rgba(240,85,66,0.3)]" />
        </div>
      </div>

      <footer className="mt-auto py-10 opacity-30 font-black tracking-[0.2em] text-[10px] uppercase">
        GHUMANTE YUWA V0.1 BETA
      </footer>
    </div>
  );
}

// 2. The main page exports the Suspense boundary
export default function LobbyPage() {
  return (
    <main className={styles.viewport}>
      <Suspense fallback={<div className="flex items-center justify-center h-screen font-black uppercase opacity-50">Loading Session...</div>}>
        <LobbyContent />
      </Suspense>

      <style jsx>{`
        @keyframes progress-fill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-fill {
          animation: progress-fill 5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
      `}</style>
    </main>
  );
}