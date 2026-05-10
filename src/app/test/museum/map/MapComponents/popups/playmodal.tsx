"use client";

import { useState } from "react";
import { Landmark } from "../markers/playmarkers/dataplay";
import { X, ChevronLeft, ChevronRight, Info } from "lucide-react"; // Install lucide-react if not present

interface ModalProps {
  landmark: Landmark;
  isMobile: boolean;
  activeMode: string;
  onClose: () => void;
}

// Placeholder images for testing
const DUMMY_IMAGES = ["/images/Carosel/1.png", "/images/Carosel/2.png", "/images/Carosel/3.png"];

export default function PlayModal({ landmark, isMobile, onClose }: ModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % DUMMY_IMAGES.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + DUMMY_IMAGES.length) % DUMMY_IMAGES.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      
      {/* CLOSE BUTTON */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="text-white w-6 h-6" />
      </button>

      {/* --- DESKTOP LAYOUT --- */}
      {!isMobile ? (
        <div className="w-[90vw] h-[80vh] flex overflow-hidden rounded-2xl bg-[#111] border border-white/10 shadow-2xl">
          
          {/* Main Visual (Left) */}
          <div className="relative flex-grow bg-black flex items-center justify-center">
             <img 
                src={DUMMY_IMAGES[currentIndex]} 
                alt="Gallery" 
                className="w-full h-full object-contain select-none transition-opacity duration-500"
             />
             
             {/* Nav Arrows */}
             <button onClick={prevSlide} className="absolute left-4 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white">
                <ChevronLeft size={32} />
             </button>
             <button onClick={nextSlide} className="absolute right-4 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white">
                <ChevronRight size={32} />
             </button>
          </div>

          {/* Sidebar (Right) */}
          <div className="w-[350px] p-8 flex flex-col border-l border-white/5 bg-[#161616]">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Gallery Item</span>
            <h2 className="text-3xl font-bold text-white mb-4">{landmark.name}</h2>
            <p className="text-white/60 leading-relaxed flex-grow">
              {landmark.description || "No description provided for this collection."}
            </p>
            
            <div className="mt-8 pt-6 border-t border-white/5 text-white/30 text-xs">
              Photo {currentIndex + 1} of {DUMMY_IMAGES.length}
            </div>
          </div>
        </div>
      ) : (
        
        /* --- MOBILE LAYOUT --- */
        <div className="relative w-full h-full flex flex-col justify-center items-center">
          
          {/* Full Screen Image */}
          <div className="w-full h-3/4 flex items-center justify-center relative">
            <img 
              src={DUMMY_IMAGES[currentIndex]} 
              alt="Gallery Mobile" 
              className="w-full h-full object-cover"
            />
            
            {/* Overlay Navigation (Invisible areas for tapping left/right) */}
            <div onClick={prevSlide} className="absolute left-0 top-0 w-1/4 h-full z-10" />
            <div onClick={nextSlide} className="absolute right-0 top-0 w-1/4 h-full z-10" />
            
            {/* Manual Arrows (Visible for UX) */}
            <div className="absolute inset-x-4 flex justify-between pointer-events-none">
                <ChevronLeft className="text-white/50 w-8 h-8" />
                <ChevronRight className="text-white/50 w-8 h-8" />
            </div>
          </div>

          {/* Mobile Info Overlay */}
          <div className="p-6 w-full text-center">
            <h3 className="text-xl font-bold text-white mb-1">{landmark.name}</h3>
            <p className="text-white/40 text-sm">Tap sides to navigate • {currentIndex + 1}/{DUMMY_IMAGES.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}