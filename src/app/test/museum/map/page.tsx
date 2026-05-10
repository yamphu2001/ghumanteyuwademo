"use client";

import { useState, useEffect } from "react";
import Map from "./MapComponents/mapimport/map";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';

import ModeSwitcher, { ViewMode } from "./UiButton/ModeSwitcher";
import { useDeviceStore } from "../zustand/zustand";

import Markers360 from "./MapComponents/markers/360markers/360";
import { landmarks as data360 } from "./MapComponents/markers/360markers/data36";
import PlayMarkers from "./MapComponents/markers/playmarkers/playmarkers"; 

import ThreeDModal from "./MapComponents/popups/3dmodal";
import PlayModal from "./MapComponents/popups/playmodal"; 

export default function GamePage() {
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("360"); 
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  
  const isMobile = useDeviceStore((s) => s.isMobile);
  const detectDevice = useDeviceStore((s) => s.detect);

  useEffect(() => {
    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, [detectDevice]);

  useEffect(() => {
    setSelectedLandmark(null);
  }, [viewMode]);

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      
      <Map onMapReady={setMapInstance} onUserInteraction={() => {}} />

      {mapInstance && (
        <>
          {/* Use 'as string' for comparisons to avoid type overlap errors */}
          {(viewMode as string) === "360" && (
            <Markers360 
              map={mapInstance} 
              landmarks={data360} 
              onMarkerClick={setSelectedLandmark} 
            />
          )}

          {(viewMode as string) === "Play" && (
            <PlayMarkers 
              map={mapInstance}
              activeMode={viewMode}
              onMarkerClick={setSelectedLandmark}
            />
          )}

          {/* This fixes the HISTORY error */}
          {(viewMode as string) === "HISTORY" && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white/20 uppercase tracking-[1em] text-[10px] md:text-xs">
                  History coming soon
                </span>
            </div>
          )}
        </>
      )}

      {selectedLandmark && (
        <>
          {(viewMode as string) === "360" && (
            <ThreeDModal 
              landmark={selectedLandmark} 
              activeMode={viewMode}
              isMobile={isMobile}
              onClose={() => setSelectedLandmark(null)} 
            />
          )}

          {(viewMode as string) === "Play" && (
            <PlayModal 
              landmark={selectedLandmark} 
              activeMode={viewMode} // <-- FIX: Passing the required prop
              isMobile={isMobile}
              onClose={() => setSelectedLandmark(null)} 
            />
          )}
        </>
      )}

      <div className={`absolute left-0 right-0 flex justify-center z-[60] pointer-events-none transition-all duration-700 ease-in-out
        ${isMobile ? "bottom-12" : "top-8"}`}> 
        <div className="pointer-events-auto">
          <ModeSwitcher currentMode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>
    </main>
  );
}