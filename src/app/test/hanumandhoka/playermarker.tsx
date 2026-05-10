"use client";

import React, { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Landmark } from "./locationmarker";

interface PlayerMarkerProps {
    landmarkData: Landmark[];
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function CombinedPlayerMap({ landmarkData }: PlayerMarkerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<maplibregl.Map | null>(null);
    const playerMarker = useRef<maplibregl.Marker | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const landmarkMarkerEls = useRef<{ [key: string]: HTMLDivElement }>({});

    const landmarkTimers = useRef<{ [key: string]: number }>({});
    const playerPosition = useRef<[number, number]>([85.3072, 27.7042]);
    const gpsPosition = useRef<[number, number]>([85.3072, 27.7042]);
    
    // Speed tracking refs
    const lastMoveTime = useRef<number>(Date.now());
    const lastPosition = useRef<[number, number]>(playerPosition.current);

    const isKeyboardMode = useRef(false);
    const capturedLandmarks = useRef<Set<string>>(new Set());

    const [isLoaded, setIsLoaded] = useState(false);
    const [capturedCount, setCapturedCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [heading, setHeading] = useState(0);

    const GRID_SIZE = 0.0002;
    const NEARBY_THRESHOLD = 20;
    const HOLD_TIME_MS = 5000;
    const KEYBOARD_RESET_DELAY = 10000;

    const capturedCells = useRef<GeoJSON.FeatureCollection>({
        type: 'FeatureCollection',
        features: []
    });
    const visitedCellIds = useRef(new Set<string>());
    const neonColors = ['#00f2ff', '#00ff9d', '#ff0055', '#ffee00', '#7a00ff'];

    // --- EFFECT: Speed Deceleration ---
    useEffect(() => {
        const stopper = setInterval(() => {
            const timeSinceLastMove = Date.now() - lastMoveTime.current;
            if (timeSinceLastMove > 600) {
                setCurrentSpeed(0);
            }
        }, 500);
        return () => clearInterval(stopper);
    }, []);

    // --- EFFECT: Proximity/Heartbeat Logic ---
    useEffect(() => {
        if (!isLoaded) return;

        const interval = setInterval(() => {
            const [lng, lat] = playerPosition.current;
            const now = Date.now();

            landmarkData.forEach((loc) => {
                const el = landmarkMarkerEls.current[loc.id];
                if (!el || capturedLandmarks.current.has(loc.id)) return;

                const dist = getDistance(lat, lng, loc.coordinates[1], loc.coordinates[0]);

                if (dist < NEARBY_THRESHOLD) {
                    if (!landmarkTimers.current[loc.id]) {
                        landmarkTimers.current[loc.id] = now;
                        el.style.border = '4px solid #ffee00';
                        el.style.boxShadow = '0 0 10px #ffee00';
                    }

                    if (now - landmarkTimers.current[loc.id] >= HOLD_TIME_MS) {
                        el.style.border = '4px solid #00ff9d';
                        el.style.boxShadow = '0 0 20px #00ff9d';
                        el.style.outline = '2px solid rgba(0,255,157,0.4)';
                        capturedLandmarks.current.add(loc.id);
                        delete landmarkTimers.current[loc.id];
                    }
                } else if (landmarkTimers.current[loc.id]) {
                    delete landmarkTimers.current[loc.id];
                    el.style.border = '3px solid #00f2ff';
                    el.style.boxShadow = 'none';
                }
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isLoaded, landmarkData]);

    const handleMovement = (lng: number, lat: number, followMap = true) => {
        const now = Date.now();
        const timeDeltaMs = now - lastMoveTime.current;

        if (playerMarker.current) {
            playerMarker.current.setLngLat([lng, lat]);
        }

        // Speed Calculation for Manual/GPS Movement
        if (timeDeltaMs > 0) {
            const distMeters = getDistance(lastPosition.current[1], lastPosition.current[0], lat, lng);
            const calculatedSpeed = (distMeters / timeDeltaMs) * 3600;

            if (!isNaN(calculatedSpeed) && calculatedSpeed > 0.1) {
                // If keyboard mode, we manually set speed. 
                // GPS speed is still handled by the watchPosition effect for better accuracy.
                if (isKeyboardMode.current) {
                    setCurrentSpeed(calculatedSpeed);
                }
            }
        }

        lastMoveTime.current = now;
        lastPosition.current = [lng, lat];

        // Grid Capture Logic
        const cellId = `${Math.floor(lng / GRID_SIZE)}_${Math.floor(lat / GRID_SIZE)}`;
        if (!visitedCellIds.current.has(cellId)) {
            visitedCellIds.current.add(cellId);
            const color = neonColors[Math.floor(Math.random() * neonColors.length)];
            const cellX = Math.floor(lng / GRID_SIZE);
            const cellY = Math.floor(lat / GRID_SIZE);
            const newFeat: GeoJSON.Feature = {
                type: 'Feature',
                properties: { color },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [cellX * GRID_SIZE, cellY * GRID_SIZE],
                        [(cellX + 1) * GRID_SIZE, cellY * GRID_SIZE],
                        [(cellX + 1) * GRID_SIZE, (cellY + 1) * GRID_SIZE],
                        [cellX * GRID_SIZE, (cellY + 1) * GRID_SIZE],
                        [cellX * GRID_SIZE, cellY * GRID_SIZE]
                    ]]
                }
            };
            capturedCells.current.features.push(newFeat);
            const src = mapInstance.current?.getSource('grid-source') as maplibregl.GeoJSONSource;
            if (src) src.setData(capturedCells.current);
            setCapturedCount(visitedCellIds.current.size);
        }

        if (followMap && mapInstance.current) {
            mapInstance.current.jumpTo({ center: [lng, lat] });
        }
    };

    const handleReset = () => {
        capturedCells.current = { type: 'FeatureCollection', features: [] };
        visitedCellIds.current.clear();
        landmarkTimers.current = {};
        const src = mapInstance.current?.getSource('grid-source') as maplibregl.GeoJSONSource;
        if (src) src.setData(capturedCells.current);
        setCapturedCount(0);
        capturedLandmarks.current.clear();
        Object.values(landmarkMarkerEls.current).forEach((el) => {
            el.style.border = '3px solid #00f2ff';
            el.style.boxShadow = 'none';
            el.style.outline = 'none';
        });
    };

    // Map Initialization
    useEffect(() => {
        if (!mapContainer.current) return;
        mapInstance.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: playerPosition.current,
            zoom: 17,
            pitch: 0,
            dragRotate: false,
        });

        const el = document.createElement('div');
        el.style.cssText = `width: 30px; height: 30px; background-color: #00f2ff; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px #00f2ff; pointer-events: none;`;
        playerMarker.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(playerPosition.current).addTo(mapInstance.current);

        mapInstance.current.on('load', () => {
            if (!mapInstance.current) return;
            mapInstance.current.addSource('grid-source', { type: 'geojson', data: capturedCells.current });
            mapInstance.current.addLayer({
                id: 'grid-layer',
                type: 'fill',
                source: 'grid-source',
                paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.4, 'fill-outline-color': 'rgba(255,255,255,0.2)' }
            });
            setIsLoaded(true);
        });
        return () => mapInstance.current?.remove();
    }, []);

    // Landmark Rendering
    useEffect(() => {
        if (!isLoaded || !mapInstance.current || !landmarkData) return;
        const markers: maplibregl.Marker[] = [];
        landmarkData.forEach((loc) => {
            const el = document.createElement('div');
            el.style.cssText = `width: 45px; height: 45px; border-radius: 50%; border: 3px solid #00f2ff; background-image: url(${loc.image}); background-size: cover; background-position: center; background-color: white; cursor: pointer; transition: border 0.3s ease, box-shadow 0.3s ease;`;
            if (capturedLandmarks.current.has(loc.id)) {
                el.style.border = '4px solid #00ff9d';
                el.style.boxShadow = '0 0 15px #00ff9d';
            }
            landmarkMarkerEls.current[loc.id] = el;
            const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(loc.coordinates).setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>${loc.name}</b>`)).addTo(mapInstance.current!);
            markers.push(marker);
        });
        return () => markers.forEach(m => m.remove());
    }, [isLoaded, landmarkData]);

    // Keyboard Movement
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!mapInstance.current) return;
            const offset = 0.00005;
            const key = e.key.toLowerCase();
            const movementKeys = ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
            if (!movementKeys.includes(key)) return;
            e.preventDefault();

            isKeyboardMode.current = true;
            let [newLng, newLat] = playerPosition.current;

            if (key === 'w' || key === 'arrowup') newLat += offset;
            if (key === 's' || key === 'arrowdown') newLat -= offset;
            if (key === 'a' || key === 'arrowleft') newLng -= offset;
            if (key === 'd' || key === 'arrowright') newLng += offset;

            playerPosition.current = [newLng, newLat];
            handleMovement(newLng, newLat, true);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                isKeyboardMode.current = false;
                playerPosition.current = gpsPosition.current;
                handleMovement(gpsPosition.current[0], gpsPosition.current[1], true);
            }, KEYBOARD_RESET_DELAY);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // GPS Tracking
    useEffect(() => {
        if (!isLoaded) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                gpsPosition.current = coords;
                if (!isKeyboardMode.current) {
                    playerPosition.current = coords;
                    handleMovement(coords[0], coords[1], true);
                }
                // Use native GPS speed if available, otherwise handled by handleMovement
                if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
                    setCurrentSpeed(pos.coords.speed * 3.6);
                }
                if (pos.coords.heading) setHeading(pos.coords.heading);
                setErrorMsg(null);
            },
            () => setErrorMsg("GPS Signal Lost"),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isLoaded]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            <div style={panelStyle}>
                <div style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: '10px', letterSpacing: '1px' }}>GHUMANTE NETWORK</div>
                <div style={{ fontSize: '28px', color: '#fff', fontWeight: '900' }}>{capturedCount}</div>
                <div style={{ fontSize: '9px', color: '#888' }}>BLOCKS CAPTURED</div>
            </div>
            {/* <button onClick={handleReset} style={resetButtonStyle}>↺ RESET</button> */}
            <div style={speedometerStyle}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00f2ff' }}>{currentSpeed.toFixed(1)}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>KM/H</div>
                <div style={{ marginTop: '5px', transform: `rotate(${heading}deg)`, color: '#00ff9d', fontSize: '18px' }}>▲</div>
            </div>
            <div style={hintStyle}>Hold near landmarks for 5s to capture</div>
            {errorMsg && <div style={errorStyle}>⚠️ {errorMsg}</div>}
        </div>
    );
}

// --- Styles ---
const panelStyle: React.CSSProperties = { position: 'absolute', top: '30px', left: '30px', padding: '20px', borderRadius: '15px', background: 'rgba(10, 10, 15, 0.85)', zIndex: 10, border: '1px solid rgba(0, 242, 255, 0.3)', backdropFilter: 'blur(10px)', textAlign: 'center' };
const resetButtonStyle: React.CSSProperties = { position: 'absolute', top: '145px', left: '30px', padding: '8px 18px', borderRadius: '10px', background: 'rgba(10, 10, 15, 0.85)', zIndex: 10, border: '1px solid rgba(255, 0, 85, 0.6)', backdropFilter: 'blur(10px)', color: '#ff0055', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' };
const speedometerStyle: React.CSSProperties = { position: 'absolute', bottom: '40px', right: '30px', padding: '15px', borderRadius: '15px', background: 'rgba(10, 10, 15, 0.85)', zIndex: 10, border: '1px solid rgba(0, 242, 255, 0.3)', backdropFilter: 'blur(10px)', textAlign: 'center' };
const hintStyle: React.CSSProperties = { position: 'absolute', top: '30px', right: '30px', color: 'rgba(255,255,255,0.7)', fontSize: '11px', zIndex: 10 };
const errorStyle: React.CSSProperties = { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: '#ff0055', color: 'white', padding: '8px 20px', borderRadius: '25px', zIndex: 20 };