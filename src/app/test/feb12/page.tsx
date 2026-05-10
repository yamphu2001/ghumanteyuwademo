"use client";

import React, { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Landmark, landmarks } from "./locationmarker";

/**
 * UTILITY: Calculate distance between two coordinates in meters
 */
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

interface PlayerMarkerProps {
    landmarkData: Landmark[];
}

/**
 * COMPONENT: The logic-heavy Map Component
 */
function CombinedPlayerMap({ landmarkData }: PlayerMarkerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<maplibregl.Map | null>(null);
    const playerMarker = useRef<maplibregl.Marker | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const landmarkMarkerEls = useRef<{ [key: string]: HTMLDivElement }>({});

    // Logic Refs
    const landmarkTimers = useRef<{ [key: string]: number }>({});
    const playerPosition = useRef<[number, number]>([85.3072, 27.7042]);
    const gpsPosition = useRef<[number, number]>([85.3072, 27.7042]);
    const lastMoveTime = useRef<number>(Date.now());
    const lastPosition = useRef<[number, number]>(playerPosition.current);
    const isKeyboardMode = useRef(false);
    const capturedLandmarks = useRef<Set<string>>(new Set());

    // State
    const [isLoaded, setIsLoaded] = useState(false);
    const [capturedCount, setCapturedCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);

    // Constants
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

    // 1. Speed Auto-Stopper
    useEffect(() => {
        const stopper = setInterval(() => {
            if (Date.now() - lastMoveTime.current > 600) setCurrentSpeed(0);
        }, 500);
        return () => clearInterval(stopper);
    }, []);

    // 2. Proximity & Automatic Capture Logic
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
                        el.style.boxShadow = '0 0 15px #ffee00';
                    }
                    if (now - landmarkTimers.current[loc.id] >= HOLD_TIME_MS) {
                        el.style.border = '4px solid #00ff9d';
                        el.style.boxShadow = '0 0 20px #00ff9d';
                        capturedLandmarks.current.add(loc.id);
                        delete landmarkTimers.current[loc.id];
                        // Auto-show the card when landmark turns green
                        setSelectedLandmark(loc);
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
        if (playerMarker.current) playerMarker.current.setLngLat([lng, lat]);

        const distMeters = getDistance(lastPosition.current[1], lastPosition.current[0], lat, lng);
        const timeDeltaMs = now - lastMoveTime.current;
        if (timeDeltaMs > 0 && isKeyboardMode.current) {
            setCurrentSpeed((distMeters / timeDeltaMs) * 3600);
        }

        lastMoveTime.current = now;
        lastPosition.current = [lng, lat];

        // Grid Logic
        const cellId = `${Math.floor(lng / GRID_SIZE)}_${Math.floor(lat / GRID_SIZE)}`;
        if (!visitedCellIds.current.has(cellId)) {
            visitedCellIds.current.add(cellId);
            const color = neonColors[Math.floor(Math.random() * neonColors.length)];
            const cellX = Math.floor(lng / GRID_SIZE);
            const cellY = Math.floor(lat / GRID_SIZE);
            capturedCells.current.features.push({
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
            });
            const src = mapInstance.current?.getSource('grid-source') as maplibregl.GeoJSONSource;
            if (src) src.setData(capturedCells.current);
            setCapturedCount(visitedCellIds.current.size);
        }
        if (followMap && mapInstance.current) mapInstance.current.jumpTo({ center: [lng, lat] });
    };

    // 3. Map Initialization
    useEffect(() => {
        if (!mapContainer.current) return;
        mapInstance.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: playerPosition.current,
            zoom: 17,
        });

        const el = document.createElement('div');
        el.style.cssText = `width: 30px; height: 30px; background-color: #00f2ff; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px #00f2ff; pointer-events: none;`;
        playerMarker.current = new maplibregl.Marker({ element: el }).setLngLat(playerPosition.current).addTo(mapInstance.current);

        mapInstance.current.on('load', () => {
            if (!mapInstance.current) return;
            mapInstance.current.addSource('grid-source', { type: 'geojson', data: capturedCells.current });
            mapInstance.current.addLayer({
                id: 'grid-layer', type: 'fill', source: 'grid-source',
                paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.4 }
            });
            setIsLoaded(true);
        });
        return () => mapInstance.current?.remove();
    }, []);

    // 4. Landmark Markers & Click Events
    useEffect(() => {
        if (!isLoaded || !mapInstance.current || !landmarkData) return;
        const markers: maplibregl.Marker[] = [];
        landmarkData.forEach((loc) => {
            const el = document.createElement('div');
            el.style.cssText = `width: 45px; height: 45px; border-radius: 50%; border: 3px solid #00f2ff; background-image: url(${loc.image}); background-size: cover; background-position: center; background-color: white; cursor: pointer; transition: all 0.3s ease;`;
            
            if (capturedLandmarks.current.has(loc.id)) {
                el.style.border = '4px solid #00ff9d';
                el.style.boxShadow = '0 0 15px #00ff9d';
            }

            // Click to show card
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelectedLandmark(loc);
            });

            landmarkMarkerEls.current[loc.id] = el;
            const marker = new maplibregl.Marker({ element: el }).setLngLat(loc.coordinates).addTo(mapInstance.current!);
            markers.push(marker);
        });
        return () => markers.forEach(m => m.remove());
    }, [isLoaded, landmarkData]);

    // 5. Keyboard and GPS (Simplified)
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
                handleMovement(gpsPosition.current[0], gpsPosition.current[1], true);
            }, KEYBOARD_RESET_DELAY);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
                if (pos.coords.speed !== null) setCurrentSpeed(pos.coords.speed * 3.6);
                if (pos.coords.heading) setHeading(pos.coords.heading);
            },
            () => setErrorMsg("GPS Signal Lost"),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isLoaded]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000', fontFamily: 'sans-serif' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            
            {/* UI: Stats */}
            <div style={panelStyle}>
                <div style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: '10px' }}>GHUMANTE NETWORK</div>
                <div style={{ fontSize: '28px', color: '#fff', fontWeight: '900' }}>{capturedCount}</div>
                <div style={{ fontSize: '9px', color: '#888' }}>BLOCKS CAPTURED</div>
            </div>

            {/* UI: Speed */}
            <div style={speedometerStyle}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00f2ff' }}>{currentSpeed.toFixed(1)}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>KM/H</div>
                <div style={{ marginTop: '5px', transform: `rotate(${heading}deg)`, color: '#00ff9d' }}>▲</div>
            </div>

            {/* UI: Landmark Card Overlay */}
            {selectedLandmark && (
                <div style={overlayStyle} onClick={() => setSelectedLandmark(null)}>
                    <div style={cardStyle} onClick={e => e.stopPropagation()}>
                        <button style={closeBtnStyle} onClick={() => setSelectedLandmark(null)}>✕</button>
                        <div style={{ 
                            width: '100%', height: '200px', 
                            backgroundImage: `url(${selectedLandmark.image})`, 
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            borderRadius: '12px', marginBottom: '15px',
                            border: `2px solid ${capturedLandmarks.current.has(selectedLandmark.id) ? '#00ff9d' : '#00f2ff'}`
                        }} />
                        <h2 style={{ color: '#00f2ff', margin: '0 0 8px 0', fontSize: '22px' }}>{selectedLandmark.name}</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                            {selectedLandmark.description || "Synchronizing data with the network..."}
                        </p>
                        {capturedLandmarks.current.has(selectedLandmark.id) && (
                            <div style={badgeStyle}>✓ AREA EXPLORED</div>
                        )}
                    </div>
                </div>
            )}

            <div style={hintStyle}>Hold near markers for 5s to capture</div>
            {errorMsg && <div style={errorStyle}>⚠️ {errorMsg}</div>}
        </div>
    );
}

/**
 * PAGE EXPORT: This fixes the prop error
 */
export default function Page() {
    return (
        <main>
            <CombinedPlayerMap landmarkData={landmarks} />
        </main>
    );
}

// --- Styles ---
const panelStyle: React.CSSProperties = { position: 'absolute', top: '20px', left: '20px', padding: '15px', borderRadius: '12px', background: 'rgba(10, 10, 15, 0.9)', zIndex: 10, border: '1px solid #00f2ff55', backdropFilter: 'blur(8px)', textAlign: 'center' };
const speedometerStyle: React.CSSProperties = { position: 'absolute', bottom: '30px', right: '20px', padding: '15px', borderRadius: '12px', background: 'rgba(10, 10, 15, 0.9)', zIndex: 10, border: '1px solid #00f2ff55', backdropFilter: 'blur(8px)', textAlign: 'center' };
const hintStyle: React.CSSProperties = { position: 'absolute', top: '20px', right: '20px', color: '#ffffffaa', fontSize: '10px', zIndex: 10 };
const errorStyle: React.CSSProperties = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#ff0055', color: '#fff', padding: '10px 20px', borderRadius: '20px', zIndex: 20 };
const overlayStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const cardStyle: React.CSSProperties = { width: '85%', maxWidth: '400px', background: '#0a0a0f', border: '1px solid #00f2ff88', borderRadius: '24px', padding: '24px', position: 'relative', boxShadow: '0 0 30px rgba(0,242,255,0.2)' };
const closeBtnStyle: React.CSSProperties = { position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' };
const badgeStyle: React.CSSProperties = { marginTop: '15px', color: '#00ff9d', fontSize: '12px', fontWeight: 'bold', borderTop: '1px solid rgba(0,255,157,0.2)', paddingTop: '10px' };