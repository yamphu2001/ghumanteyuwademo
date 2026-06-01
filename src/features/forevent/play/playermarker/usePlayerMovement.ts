
"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { type QueuedOperation } from "@/features/forevent/play/useOfflineQueue";

interface MovementHookProps {
  map: maplibregl.Map | null;
  eventId: string;
  onPositionUpdate: (latitude: number, longitude: number) => void;
  /** Pass enqueue from useOfflineQueue so location writes are queued when offline */
  enqueue: (op: QueuedOperation) => Promise<void>;
}

export function usePlayerMovement({ map, eventId, onPositionUpdate, enqueue }: MovementHookProps) {
  const currentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isMockingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map || !eventId) return;

    // Restore last known position from localStorage so keyboard mocking works
    try {
      const saved = localStorage.getItem(`player_trail_${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          if (last && Array.isArray(last.coordinates)) {
            const [lng, lat] = last.coordinates;
            currentCoordsRef.current = { latitude: lat, longitude: lng };
          }
        }
      }
    } catch (err) {
      // ignore parse errors
    }

    const syncLocation = (latitude: number, longitude: number) => {
      // Always update the marker and trail — this is purely local/visual
      onPositionUpdate(latitude, longitude);

      // Save last known position to localStorage for offline restore
      try {
        localStorage.setItem(
          `last_position_${eventId}`,
          JSON.stringify({ latitude, longitude })
        );
      } catch (_) { /* ignore */ }

      // Firebase write only needs a uid — skip silently if not authed yet
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      enqueue({
        type: 'rtdbSet',
        path: `eventsProgress/${eventId}/${uid}/location`,
        data: {
          latitude,
          longitude,
          updatedAt: new Date().toLocaleString(),
        },
      });
    };

    const runLocationCheck = () => {
      // Do NOT gate on auth here — GPS + marker display must work offline too.
      // The uid check lives inside syncLocation, only blocking the Firebase write.

      if (isMockingRef.current && currentCoordsRef.current) {
        syncLocation(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
      } else {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            currentCoordsRef.current = { latitude, longitude };
            syncLocation(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 4500, maximumAge: 0 }
        );
      }
    };

    // If no cached position exists for this event, fire an immediate GPS request
    // so the marker appears instantly on first load (new event, no trail yet).
    const hasCachedPosition = !!localStorage.getItem(`last_position_${eventId}`);
    if (!hasCachedPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          currentCoordsRef.current = { latitude, longitude };
          syncLocation(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCoordsRef.current) return;
      const step = 0.000004;
      let moved = false;

      switch (e.key.toLowerCase()) {
        case "w": currentCoordsRef.current.latitude  += step; moved = true; break;
        case "s": currentCoordsRef.current.latitude  -= step; moved = true; break;
        case "a": currentCoordsRef.current.longitude -= step; moved = true; break;
        case "d": currentCoordsRef.current.longitude += step; moved = true; break;
      }

      if (moved) {
        isMockingRef.current = true;
        syncLocation(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    runLocationCheck();
    intervalIdRef.current = setInterval(runLocationCheck, 1000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) runLocationCheck();
    });

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      unsubscribeAuth();
    };
  }, [map, eventId, onPositionUpdate, enqueue]);
}