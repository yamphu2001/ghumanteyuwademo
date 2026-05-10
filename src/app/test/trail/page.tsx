"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Landmark, landmarks } from "./map/locationmarker"; 
import LandmarkOverlay from "./map/LandmarkOverlay";

// Import dynamically to avoid SSR issues with MapLibre
const CombinedPlayerMap = dynamic(() => import("./map/mapcomponents"), { 
    ssr: false,
    loading: () => (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
            <div className="text-cyan-500 font-bold animate-pulse">LOADING NEURAL MAP...</div>
        </div>
    ) 
});

export default function MapPage() {
    const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
    const [capturedIds, setCapturedIds] = useState<Set<string>>(new Set());

    // This function will be called by the Map component when a capture finishes
    const handleCapture = (id: string) => {
        setCapturedIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    return (
        <main className="w-screen h-screen fixed inset-0 bg-black">
            {/* The Map Component */}
            <CombinedPlayerMap 
                landmarkData={landmarks} 
                onLandmarkClick={(loc) => setActiveLandmark(loc)}
                // We pass our state updater down to the map
                onCapture={handleCapture} 
            />

            {/* The Fullscreen Overlay */}
            <LandmarkOverlay 
                landmark={activeLandmark} 
                // Checks if the clicked landmark ID exists in our captured set
                isCaptured={activeLandmark ? capturedIds.has(activeLandmark.id) : false}
                onClose={() => setActiveLandmark(null)} 
            />
        </main>
    );
}