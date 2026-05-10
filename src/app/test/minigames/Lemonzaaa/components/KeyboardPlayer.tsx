"use client";
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { GEO_BOUNDARY } from './boundary';

interface KeyboardPlayerProps {
  map: maplibregl.Map | null;
  position: [number, number];
  onPositionChange: (newPosition: [number, number]) => void;
}

const isPointInPoly = (point: [number, number], vs: [number, number][]) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const polyCoords = (GEO_BOUNDARY.features[0].geometry as any).coordinates[0];
const MOVE_SPEED = 0.00005;

const KeyboardPlayer: React.FC<KeyboardPlayerProps> = ({ map, position, onPositionChange }) => {
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create the Player Container
    const el = document.createElement('div');
    el.className = 'player-container';
    
    // Inject the PNG image
    // Note: Make sure 'player.png' is in your /public folder
    el.innerHTML = `
      <div style="
        width: 50px; 
        height: 50px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.5));
      ">
        <img src="/mascot.png" style="
          width: 100%; 
          height: 100%; 
          object-fit: contain;
        " />
      </div>
    `;

    markerRef.current = new maplibregl.Marker({ 
      element: el,
      anchor: 'bottom' // Keeps the feet of the character on the coordinate
    })
      .setLngLat(position)
      .addTo(map);

    return () => { markerRef.current?.remove(); };
  }, [map]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!map) return;
      const key = e.key.toLowerCase();
      let [lng, lat] = position;

      if (key === 'w') lat += MOVE_SPEED;
      if (key === 's') lat -= MOVE_SPEED;
      if (key === 'a') lng -= MOVE_SPEED;
      if (key === 'd') lng += MOVE_SPEED;

      if (!['w', 'a', 's', 'd'].includes(key)) return;

      if (isPointInPoly([lng, lat], polyCoords)) {
        onPositionChange([lng, lat]);
      } else {
        console.warn("RESTRICTED // BOUNDARY REACHED");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [map, position, onPositionChange]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat(position);
    }
  }, [position]);

  return null;
};

export default KeyboardPlayer;