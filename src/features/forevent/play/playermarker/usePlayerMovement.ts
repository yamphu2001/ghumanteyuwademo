import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncPlayerLocationToDB } from "./locationService";

interface MovementHookProps {
  map: maplibregl.Map | null;
  eventId: string;
  onPositionUpdate: (latitude: number, longitude: number) => void;
}

export function usePlayerMovement({ map, eventId, onPositionUpdate }: MovementHookProps) {
  const currentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isMockingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map || !eventId) return;

    const processCoordsUpdate = (latitude: number, longitude: number) => {
      onPositionUpdate(latitude, longitude);

      const uid = auth.currentUser?.uid;
      if (uid) {
        syncPlayerLocationToDB({ eventId, uid, latitude, longitude });
      }
    };

    const runLocationCheck = () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      if (isMockingRef.current && currentCoordsRef.current) {
        processCoordsUpdate(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
      } else {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            currentCoordsRef.current = { latitude, longitude };
            processCoordsUpdate(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 4500, maximumAge: 0 }
        );
      }
    };

    // Keyboard controls handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCoordsRef.current) return;
      const step = 0.000004;
      let moved = false;

      switch (e.key.toLowerCase()) {
        case "w": currentCoordsRef.current.latitude += step; moved = true; break;
        case "s": currentCoordsRef.current.latitude -= step; moved = true; break;
        case "a": currentCoordsRef.current.longitude -= step; moved = true; break;
        case "d": currentCoordsRef.current.longitude += step; moved = true; break;
      }

      if (moved) {
        isMockingRef.current = true;
        processCoordsUpdate(currentCoordsRef.current.latitude, currentCoordsRef.current.longitude);
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
  }, [map, eventId, onPositionUpdate]);
}