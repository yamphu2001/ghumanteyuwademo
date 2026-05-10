"use client";

import React, { useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Landmark } from "./locationmarker";

import { useMapSetup } from './hooks/useMapSetup';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useLandmarkCapture } from './hooks/useLandmarkCapture';
import Compass from '../Compass/Compass';
import { useEffect } from 'react';

interface PlayerMarkerProps {
    landmarkData: Landmark[];
    onLandmarkClick: (landmark: Landmark) => void;
    onCapture: (id: string) => void;
}

export default function CombinedPlayerMap({ landmarkData, onLandmarkClick, onCapture }: PlayerMarkerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const landmarkMarkerEls = useRef<{ [key: string]: HTMLDivElement }>({});

    const [capturedMarkerCount, setCapturedMarkerCount] = useState(0);
    const totalMarkers = landmarkData.length;

    const handleCapture = (id: string) => {
        onCapture(id);
        setCapturedMarkerCount((prev) => prev + 1);
    };

    // --- Map init, grid tracking, camera follow ---
    const { mapInstance, playerMarker, isLoaded, capturedCount, onPlayerMove, isFollowing, recenterOnPlayer } = useMapSetup(mapContainer);

    // --- Player movement (marker only, no jumpTo) ---
    const { playerPosition, currentSpeed, heading, errorMsg } = usePlayerMovement({
        mapInstance,
        playerMarker,
        isLoaded,
        onMove: (lng, lat) => onPlayerMove(lng, lat),
    });

    // --- Proximity capture ---
    useLandmarkCapture({
        isLoaded,
        landmarkData,
        playerPosition,
        landmarkMarkerEls,
        onCapture: handleCapture,
    });

    // --- Landmark Markers ---
    useEffect(() => {
        if (!isLoaded || !mapInstance.current || !landmarkData) return;
        const currentMarkers: maplibregl.Marker[] = [];

        landmarkData.forEach((loc) => {
            const el = document.createElement('div');
            el.style.cssText = `
                width: 48px; height: 48px; border-radius: 50%; 
                border: 3px solid #00f2ff; 
                background-image: url('${loc.image}'); 
                background-size: cover; background-position: center; 
                background-color: #333; box-shadow: 0 0 10px rgba(0, 242, 255, 0.5); 
                cursor: pointer; 
            `;
            el.onclick = (e) => {
                e.stopPropagation();
                onLandmarkClick(loc);
            };
            landmarkMarkerEls.current[loc.id] = el;
            const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat(loc.coordinates)
                .addTo(mapInstance.current!);
            currentMarkers.push(marker);
        });

        return () => currentMarkers.forEach((m) => m.remove());
    }, [isLoaded, landmarkData, onLandmarkClick, mapInstance]);

    const markerProgress = totalMarkers > 0 ? (capturedMarkerCount / totalMarkers) * 100 : 0;

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* ── Compass ── */}
            <Compass map={mapInstance} isLoaded={isLoaded} />

            {/* ── Stats Panel ── */}
            <div style={panelStyle}>
                <div style={panelHeaderStyle}>GHUMANTE NETWORK</div>

                <div style={statRowStyle}>
                    <span style={statLabelStyle}>BLOCKS VISITED</span>
                    <span style={statValueStyle}>{capturedCount}</span>
                </div>

                <div style={dividerStyle} />

                <div style={statRowStyle}>
                    <span style={statLabelStyle}>MARKERS</span>
                    <span style={{ fontSize: '18px', fontWeight: '900' }}>
                        <span style={{ color: '#00ff9d' }}>{capturedMarkerCount}</span>
                        <span style={{ color: '#444', fontSize: '13px' }}> / </span>
                        <span style={{ color: '#fff' }}>{totalMarkers}</span>
                    </span>
                </div>

                <div style={progressBgStyle}>
                    <div style={{ ...progressFillStyle, width: `${markerProgress}%` }} />
                </div>
            </div>

            {/* ── Re-center button (only when user has dragged away) ──
            {!isFollowing && (
                <button
                    onClick={() => recenterOnPlayer(playerPosition.current)}
                    style={recenterButtonStyle}
                >
                    ⊕ RE-CENTER
                </button>
            )} */}

            {/* ── Speedometer ── */}
            <div style={speedometerStyle}>
                <span style={compassArrowStyle(heading)}>▲</span>
                <div style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    color: currentSpeed > 0 ? '#00f2ff' : '#fff',
                    lineHeight: 1,
                }}>
                    {currentSpeed.toFixed(1)}
                </div>
                <div style={{ fontSize: '9px', color: '#fff', letterSpacing: '1px', marginTop: '2px' }}>KM/H</div>
            </div>

            {errorMsg && <div style={errorStyle}>⚠️ {errorMsg}</div>}
        </div>
    );
}

// ── Styles ──────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
    position: 'absolute', top: '20px', left: '20px',
    padding: '1px 15px',
    borderRadius: '16px',
    background: 'rgba(8, 8, 14, 0.92)',
    zIndex: 10,
    border: '1px solid rgba(0, 242, 255, 0.25)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    minWidth: '175px',
};

const panelHeaderStyle: React.CSSProperties = {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: '9px',
    letterSpacing: '2px',
    marginBottom: '12px',
    marginTop:'5px',
    textAlign: 'center',
};

const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '4px',
};

const statLabelStyle: React.CSSProperties = {
    fontSize: '9px',
    color: '#fff',
    letterSpacing: '1px',
    fontWeight: 'bold',
};

const statValueStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#fff',
    fontWeight: '900',
    lineHeight: 1,
};

const dividerStyle: React.CSSProperties = {
    height: '1px',
    background: 'rgba(0, 242, 255, 0.1)',
    margin: '2px 0',
};

const progressBgStyle: React.CSSProperties = {
    marginTop: '2px',
    marginBottom: '6px',
    height: '4px',
    borderRadius: '99px',
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
};

const progressFillStyle: React.CSSProperties = {
    height: '100%',
    borderRadius: '99px',
    background: 'linear-gradient(90deg, #00f2ff, #00ff9d)',
    transition: 'width 0.6s ease',
};

const recenterButtonStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '110px',
    right: '20px',
    zIndex: 20,
    padding: '10px 16px',
    borderRadius: '30px',
    background: 'rgba(8, 8, 14, 0.95)',
    border: '1px solid #00f2ff',
    color: '#00f2ff',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(0, 242, 255, 0.3)',
};

const speedometerStyle: React.CSSProperties = {
    position: 'absolute', bottom: '30px', right: '20px',
    padding: '14px 18px',
    borderRadius: '16px',
    background: 'rgba(8, 8, 14, 0.92)',
    zIndex: 10,
    border: '1px solid rgba(0, 242, 255, 0.25)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    textAlign: 'center',
    minWidth: '50px',
};

const compassArrowStyle = (heading: number): React.CSSProperties => ({
    fontSize: '14px',
    color: '#00ff9d',
    display: 'block',
    transform: `rotate(${heading}deg)`,
    transition: 'transform 0.3s ease',
    marginBottom: '6px',
});

const errorStyle: React.CSSProperties = {
    position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
    background: '#ff0055', color: 'white', padding: '10px 25px',
    borderRadius: '30px', zIndex: 20, fontWeight: 'bold',
};