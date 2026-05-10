"use client";
import dynamic from 'next/dynamic';

/**
 * 1. CRITICAL: We import the MAP component, NOT the marker component.
 * 2. ssr: false is mandatory because MapLibre needs the 'window' object.
 * 3. We use a default import because we changed MapPage to 'export default'.
 */
const MapPage = dynamic(() => import('./components/map'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="border-4 border-white p-6 bg-red-600 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <h1 className="text-white font-black italic uppercase animate-pulse text-2xl">
          INITIALIZING ENGINE...
        </h1>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="h-screen w-full bg-black overflow-hidden">
      {/* The dynamically loaded MapPage component */}
      <MapPage />
      
      {/* Brutalist Watermark - Layered over the dynamic component */}
      <div className="absolute bottom-6 right-6 z-50 pointer-events-none opacity-50">
        <p className="text-white font-black italic uppercase text-xs tracking-widest">
          La Garau // Ghumante Yuwa v1.0
        </p>
      </div>
    </main>
  );
}