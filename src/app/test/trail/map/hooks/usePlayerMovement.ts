"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

const KEYBOARD_RESET_DELAY = 30000;
const SPEED_ZERO_DELAY = 600;
const MOVE_OFFSET = 0.00005;

interface UsePlayerMovementProps {
    mapInstance: React.MutableRefObject<maplibregl.Map | null>;
    playerMarker: React.MutableRefObject<maplibregl.Marker | null>;
    isLoaded: boolean;
    onMove: (lng: number, lat: number) => void;
}

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const INITIAL_POSITION: [number, number] = [85.3072, 27.7042];

export function usePlayerMovement({ playerMarker, isLoaded, onMove }: UsePlayerMovementProps) {
    const playerPosition = useRef<[number, number]>(INITIAL_POSITION);
    const gpsPosition = useRef<[number, number]>(INITIAL_POSITION);
    const lastMoveTime = useRef<number>(Date.now());
    const lastPosition = useRef<[number, number]>(INITIAL_POSITION);
    const isKeyboardMode = useRef(false);
    const keyboardResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onMoveRef = useRef(onMove);

    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Keep onMove ref current so move() never has a stale closure
    useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

    // Rotate marker with heading
    useEffect(() => {
        const el = playerMarker.current?.getElement();
        if (el) el.style.transform = `rotate(${heading}deg)`;
    }, [heading, playerMarker]);

    // Auto-zero speed when stationary
    useEffect(() => {
        const id = setInterval(() => {
            if (Date.now() - lastMoveTime.current > SPEED_ZERO_DELAY) setCurrentSpeed(0);
        }, 500);
        return () => clearInterval(id);
    }, []);

    const move = useCallback((lng: number, lat: number) => {
        playerMarker.current?.setLngLat([lng, lat]);

        const now = Date.now();
        const elapsed = (now - lastMoveTime.current) / 1000;
        const dist = getDistance(lastPosition.current[1], lastPosition.current[0], lat, lng);

        if (isKeyboardMode.current && elapsed > 0) {
            setCurrentSpeed((dist / elapsed) * 3.6);
        }

        lastMoveTime.current = now;
        lastPosition.current = [lng, lat];
        playerPosition.current = [lng, lat];

        onMoveRef.current(lng, lat);
    }, [playerMarker]); // playerMarker ref is stable

    useEffect(() => {
        if (!isLoaded) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            let [lng, lat] = playerPosition.current;
            let newHeading: number | null = null;

            if      (['w', 'arrowup'].includes(key))    { lat += MOVE_OFFSET; newHeading = 0;   }
            else if (['s', 'arrowdown'].includes(key))  { lat -= MOVE_OFFSET; newHeading = 180; }
            else if (['a', 'arrowleft'].includes(key))  { lng -= MOVE_OFFSET; newHeading = 270; }
            else if (['d', 'arrowright'].includes(key)) { lng += MOVE_OFFSET; newHeading = 90;  }
            else return;

            e.preventDefault();
            isKeyboardMode.current = true;
            if (newHeading !== null) setHeading(newHeading);
            move(lng, lat);

            if (keyboardResetTimer.current) clearTimeout(keyboardResetTimer.current);
            keyboardResetTimer.current = setTimeout(() => {
                isKeyboardMode.current = false;
                move(gpsPosition.current[0], gpsPosition.current[1]);
            }, KEYBOARD_RESET_DELAY);
        };

        window.addEventListener('keydown', handleKeyDown);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                gpsPosition.current = coords;

                if (!isKeyboardMode.current) {
                    move(coords[0], coords[1]);
                    if (pos.coords.heading != null) setHeading(pos.coords.heading);
                }

                if (pos.coords.speed != null) setCurrentSpeed(pos.coords.speed * 3.6);
            },
            () => setErrorMsg('GPS Lost'),
            { enableHighAccuracy: true }
        );

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            navigator.geolocation.clearWatch(watchId);
            if (keyboardResetTimer.current) clearTimeout(keyboardResetTimer.current);
        };
    }, [isLoaded, move]);

    return { playerPosition, currentSpeed, heading, errorMsg };
}