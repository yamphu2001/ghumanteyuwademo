
"use client";
import { useRef, useState, useEffect, useCallback } from 'react';
import { Landmark } from './Landmark';
import { usePlayerLocation, getDistance } from '@/store/Playerlocation';

const NEARBY_THRESHOLD_M = 5;
const TICK_MS = 500;

interface UseLandmarkCaptureProps {
  isLoaded: boolean;
  landmarks: Landmark[];
  markerEls: React.MutableRefObject<Record<string, HTMLDivElement>>;
  onCapture: (id: string) => void;
}

interface UseLandmarkCaptureReturn {
  capturedIds: Set<string>;
  nearbyIds: Set<string>;
  seedCaptured: (ids: string[]) => void;
  // Called by LocationMarkers when manual 5s hold completes
  triggerCapture: (id: string) => void;
}

export function useLandmarkCapture({
  isLoaded,
  landmarks,
  markerEls,
  onCapture,
}: UseLandmarkCaptureProps): UseLandmarkCaptureReturn {
  const position = usePlayerLocation((s) => s.position);

  const [capturedIds, setCapturedIds] = useState<Set<string>>(new Set());
  const [nearbyIds, setNearbyIds]     = useState<Set<string>>(new Set());

  const onCaptureRef = useRef(onCapture);
  useEffect(() => { onCaptureRef.current = onCapture; }, [onCapture]);

  const seedCaptured = useCallback((ids: string[]) => {
    setCapturedIds(new Set(ids));
  }, []);

  // Called by the marker's hold handler once 5 s is complete
  const triggerCapture = useCallback((id: string) => {
    setCapturedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    onCaptureRef.current(id);

    // Update glow on the DOM element
    const el = markerEls.current[id];
    if (el) {
      el.style.border    = '4px solid #00ff9d';
      el.style.boxShadow = '0 0 20px #00ff9d';
    }
  }, [markerEls]);

  
 
  useEffect(() => {
    if (!isLoaded || !position) return;

    const interval = setInterval(() => {
      const [lng, lat] = position;
      const current = new Set<string>();

      landmarks.forEach((landmark) => {
        const el = markerEls.current[landmark.id];
        if (!el) return;

        if (capturedIds.has(landmark.id)) {
          el.style.border    = '4px solid #00ff9d';
          el.style.boxShadow = '0 0 20px #00ff9d';
          return;
        }

        const [lngL, latL] = landmark.coordinates;
        const dist = getDistance(lat, lng, latL, lngL);

        if (dist < NEARBY_THRESHOLD_M) {
          current.add(landmark.id);
          el.style.border    = '4px solid #ffee00';
          el.style.boxShadow = '0 0 15px #ffee00';
        } else {
          // --- THE FIX ---
          // If the marker was nearby in the LAST tick, don't remove it yet.
          // This gives the player a "buffer" against GPS coordinates jumping.
          if (nearbyIds.has(landmark.id)) {
             current.add(landmark.id);
             return; 
          }

          el.style.border    = '3px solid #00f2ff';
          el.style.boxShadow = '0 0 10px rgba(0,242,255,0.5)';
        }
      });

      setNearbyIds(current);
    }, TICK_MS);

    return () => clearInterval(interval);
    // Add nearbyIds to dependencies so the interval can see the previous state
  }, [isLoaded, position, landmarks, markerEls, capturedIds, nearbyIds]);

  return { capturedIds, nearbyIds, seedCaptured, triggerCapture };
}

export type { UseLandmarkCaptureProps, UseLandmarkCaptureReturn };