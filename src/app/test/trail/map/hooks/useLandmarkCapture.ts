"use client";

import { useRef, useState, useEffect } from 'react';
import { Landmark } from '../locationmarker';
import { getDistance } from './usePlayerMovement';

const NEARBY_THRESHOLD = 5;   // metres
const HOLD_TIME_MS = 5000;   // 5 seconds

interface UseLandmarkCaptureProps {
    isLoaded: boolean;
    landmarkData: Landmark[];
    playerPosition: React.MutableRefObject<[number, number]>;
    landmarkMarkerEls: React.MutableRefObject<{ [key: string]: HTMLDivElement }>;
    onCapture: (id: string) => void;
}

export function useLandmarkCapture({
    isLoaded,
    landmarkData,
    playerPosition,
    landmarkMarkerEls,
    onCapture,
}: UseLandmarkCaptureProps) {
    const landmarkTimers = useRef<{ [key: string]: number }>({});
    const [capturedLandmarks, setCapturedLandmarks] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isLoaded) return;

        const interval = setInterval(() => {
            const [lng, lat] = playerPosition.current;
            const now = Date.now();

            landmarkData.forEach((loc) => {
                const el = landmarkMarkerEls.current[loc.id];
                if (!el) return;

                // Already captured — show green glow and skip
                if (capturedLandmarks.has(loc.id)) {
                    el.style.border = '4px solid #00ff9d';
                    el.style.boxShadow = '0 0 20px #00ff9d';
                    return;
                }

                const dist = getDistance(lat, lng, loc.coordinates[1], loc.coordinates[0]);

                if (dist < NEARBY_THRESHOLD) {
                    // Start timer if not already started
                    if (!landmarkTimers.current[loc.id]) {
                        landmarkTimers.current[loc.id] = now;
                        el.style.border = '4px solid #ffee00';
                        el.style.boxShadow = '0 0 15px #ffee00';
                    }

                    // Capture after hold time
                    if (now - landmarkTimers.current[loc.id] >= HOLD_TIME_MS) {
                        setCapturedLandmarks((prev) => new Set(prev).add(loc.id));
                        onCapture(loc.id);
                        delete landmarkTimers.current[loc.id];
                    }
                } else {
                    // Left the zone — reset timer and restore cyan glow
                    if (landmarkTimers.current[loc.id]) {
                        delete landmarkTimers.current[loc.id];
                        el.style.border = '3px solid #00f2ff';
                        el.style.boxShadow = '0 0 10px rgba(0, 242, 255, 0.5)';
                    }
                }
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isLoaded, landmarkData, capturedLandmarks, onCapture, playerPosition, landmarkMarkerEls]);

    return { capturedLandmarks };
}