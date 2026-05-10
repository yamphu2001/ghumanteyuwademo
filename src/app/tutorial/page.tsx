import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutorial · How to Play",
  description: "A quick 3-step guide to mastering the Map Explorer.",
};

export default function TutorialLanding() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="max-w-md w-full">
        {/* Title with Red Highlight */}
        <h1 className="text-4xl font-bold tracking-tighter mb-4">
          HOW TO <span className="bg-red-600 text-white px-2 italic">PLAY</span>
        </h1>

        <p className="text-gray-600 mb-10 leading-relaxed">
          Follow these three simple steps to start exploring and unlocking rewards on the map.
        </p>

        {/* 3 Step UI */}
        <div className="space-y-8 mb-12">
          <div className="flex gap-4">
            <span className="font-mono font-bold text-red-600">01</span>
            <div>
              <h3 className="font-bold uppercase text-sm tracking-widest">Find Markers</h3>
              <p className="text-sm text-gray-500">Open the map and locate markers near your physical position.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-mono font-bold text-red-600">02</span>
            <div>
              <h3 className="font-bold uppercase text-sm tracking-widest">Reach Destination</h3>
              <p className="text-sm text-gray-500">Walk toward the marker until you are within a 5-metre range.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-mono font-bold text-red-600">03</span>
            <div>
              <h3 className="font-bold uppercase text-sm tracking-widest">Interact & Win</h3>
              <p className="text-sm text-gray-500">Hold position, scan QR, or play games to earn exclusive XP.</p>
            </div>
          </div>
        </div>

        {/* Redirect Button */}
        <Link 
          href="/tutorial/locationmarker" 
          className="group flex items-center justify-between w-full border-2 border-black p-4 font-bold hover:bg-black hover:text-white transition-all"
        >
          START TUTORIAL
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Decorative Minimal Footer */}
      <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.3em] text-gray-300">
        Field Guide — v1.0 — 2026
      </div>
    </div>
  );
}