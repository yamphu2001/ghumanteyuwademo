"use client";
import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const COLORS: Record<string, string> = {
  'Alpha': '#FF5733', // Orange
  'Bravo': '#33FF57', // Green
  'Charlie': '#3357FF', // Blue
  'Delta': '#F333FF'  // Pink
};

export default function LiveMap({ groups }: { groups: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});

  useEffect(() => {
    if (!mapRef.current) return;
    mapInstance.current = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [85.324, 27.717], // Kathmandu
      zoom: 13,
    });
    return () => mapInstance.current?.remove();
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    groups.forEach(group => {
      // Logic for group.livePlayers location mapping
      if (group.livePlayers) {
        Object.entries(group.livePlayers).forEach(([username, pos]: [string, any]) => {
          const id = `${group.id}-${username}`;
          const color = COLORS[group.id] || '#ffffff';

          if (markers.current[id]) {
            markers.current[id].setLngLat([pos.lng, pos.lat]);
          } else {
            const el = document.createElement('div');
            el.className = 'w-4 h-4 rounded-full border-2 border-white shadow-xl';
            el.style.backgroundColor = color;
            
            markers.current[id] = new maplibregl.Marker({ element: el })
              .setLngLat([pos.lng, pos.lat])
              .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`<b>${username}</b><br/>${group.id}`))
              .addTo(mapInstance.current!);
          }
        });
      }
    });
  }, [groups]);

  return <div ref={mapRef} className="w-full h-full" />;
}