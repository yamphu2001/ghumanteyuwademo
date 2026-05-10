// "use client";
// import React, { useEffect, useState, useCallback } from 'react';
// import { useGridStore } from './GridStore';
// import { getCellId, generateCellPolygon } from './logic';
// import styles from './gridplot.module.css';

// declare global {
//   interface Window {
//     sharedPlayerLng?: number;
//     sharedPlayerLat?: number;
//   }
// }
// export default function GridDebug({ map }: { map: React.MutableRefObject<any> }) {
//   const { addCell, clearGrid, simSpeed } = useGridStore() as any;
//   const STEP_SIZE = 0.00015; // Distance to move per keypress

//   // Inside GridDebug.tsx
// const moveAndCapture = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
//   const currentMap = map.current;
//   if (!currentMap) return;

//   // Use the global window variables we set in PlayerMarker/Logic
//   let newLng = window.sharedPlayerLng || currentMap.getCenter().lng;
//   let newLat = window.sharedPlayerLat || currentMap.getCenter().lat;

//   if (direction === 'up') newLat += STEP_SIZE;
//   if (direction === 'down') newLat -= STEP_SIZE;
//   if (direction === 'left') newLng -= STEP_SIZE;
//   if (direction === 'right') newLng += STEP_SIZE;

//   // 1. Tell the PlayerMarker to move its icon
//   // This triggers the 'onMove' listener in your PlayerMarker.tsx
//   window.dispatchEvent(new CustomEvent('player-move', { 
//     detail: { lng: newLng, lat: newLat } 
//   }));

//   // 2. Capture the cell (Plotting)
//   const id = getCellId(newLng, newLat);
//   addCell(id, {
//     type: 'Feature',
//     properties: { color: '#00f2ff', id },
//     geometry: { 
//       type: 'Polygon', 
//       coordinates: generateCellPolygon(newLng, newLat) 
//     }
//   });
// }, [map, addCell]);

//   // Keyboard Listener
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       const key = e.key.toLowerCase();
//       if (['w', 'arrowup'].includes(key)) moveAndCapture('up');
//       if (['s', 'arrowdown'].includes(key)) moveAndCapture('down');
//       if (['a', 'arrowleft'].includes(key)) moveAndCapture('left');
//       if (['d', 'arrowright'].includes(key)) moveAndCapture('right');
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [moveAndCapture]);

//   return null;
// }


"use client";
import React, { useEffect, useCallback } from 'react';
import { useGridStore } from './GridStore';
import { getCellId, generateCellPolygon } from './logic';

// Add type safety for the window variables
declare global {
  interface Window {
    sharedPlayerLng?: number;
    sharedPlayerLat?: number;
  }
}

export const setSharedPlayerCoords = (lng: number, lat: number) => {
  window.sharedPlayerLng = lng;
  window.sharedPlayerLat = lat;
};

export default function GridDebug({ map }: { map: React.MutableRefObject<any> }) {
  const { addCell } = useGridStore() as any;
  const STEP_SIZE = 0.00015; 

  const moveAndCapture = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const currentMap = map.current;
    if (!currentMap) return;

    // 1. Get the starting point ONLY from the player's last position
    // If it's not set yet, fallback to map center only once to initialize
    let newLng = window.sharedPlayerLng ?? currentMap.getCenter().lng;
    let newLat = window.sharedPlayerLat ?? currentMap.getCenter().lat;

    if (direction === 'up') newLat += STEP_SIZE;
    if (direction === 'down') newLat -= STEP_SIZE;
    if (direction === 'left') newLng -= STEP_SIZE;
    if (direction === 'right') newLng += STEP_SIZE;

    // 2. Update Global Variables immediately so next keypress is accurate
    window.sharedPlayerLng = newLng;
    window.sharedPlayerLat = newLat;

    // 3. Tell PlayerMarker to move its icon
    window.dispatchEvent(new CustomEvent('player-move', { 
      detail: { lng: newLng, lat: newLat } 
    }));

    // 4. Capture the grid cell
    const id = getCellId(newLng, newLat);
    addCell(id, {
      type: 'Feature',
      properties: { color: '#00f2ff', id },
      geometry: { 
        type: 'Polygon', 
        coordinates: generateCellPolygon(newLng, newLat) 
      }
    });
  }, [map, addCell]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) moveAndCapture('up');
      if (['s', 'arrowdown'].includes(key)) moveAndCapture('down');
      if (['a', 'arrowleft'].includes(key)) moveAndCapture('left');
      if (['d', 'arrowright'].includes(key)) moveAndCapture('right');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveAndCapture]);

  return null;
}