'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface StallData {
  id: string;
  lat: number;
  lng: number;
  eventarea: string;
  status: string;
  name?: string;
  popupImage?: string;
  text?: string;
}

interface Props {
  map: maplibregl.Map | null;
  stalls: StallData[];
}

export default function StallMarkers({ map, stalls }: Props) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || !stalls || stalls.length === 0) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stalls.forEach((stall) => {
      if (!stall.lat || !stall.lng) return;

      // 1. Create a container for both the label and the image
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.pointerEvents = 'none'; // Allows map interaction through the container

      // 2. Create the Text Label (The Green Box in image_48c732.jpg)
      const label = document.createElement('div');
      label.innerText = stall.eventarea; // Shows "New Road Gate Stall"
      label.style.backgroundColor = 'white';
      label.style.color = 'black';
      label.style.padding = '2px 8px';
      label.style.borderRadius = '4px';
      label.style.fontSize = '11px';
      label.style.fontWeight = 'bold';
      label.style.marginBottom = '4px';
      label.style.boxShadow = '0px 2px 4px rgba(0,0,0,0.2)';
      label.style.whiteSpace = 'nowrap';
      label.style.border = '1px solid #ccc';

      // 3. Create the Stall Image
      const icon = document.createElement('div');
      icon.style.width = '40px';
      icon.style.height = '40px';
      icon.style.backgroundImage = 'url("/stall.png")'; 
      icon.style.backgroundSize = 'contain';
      icon.style.backgroundRepeat = 'no-repeat';
      icon.style.backgroundPosition = 'center';
      icon.style.cursor = 'pointer';
      icon.style.pointerEvents = 'auto'; // Re-enable clicks for the icon specifically

      // Remove the alert logic entirely as requested
      icon.onclick = (e) => {
        e.stopPropagation();
        console.log(`Clicked on: ${stall.eventarea}`);
      };

      // Append elements to container
      container.appendChild(label);
      container.appendChild(icon);

      try {
        const marker = new maplibregl.Marker({ 
          element: container,
          anchor: 'bottom' 
        })
          .setLngLat([Number(stall.lng), Number(stall.lat)])
          .addTo(map);

        markersRef.current.push(marker);
      } catch (err) {
        console.error("Error plotting stall marker:", err);
      }
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
    };
  }, [map, stalls]);

  return null; 
}