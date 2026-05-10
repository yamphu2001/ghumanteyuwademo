"use client";
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface Location {
  name: string;
  coords: [number, number];
}

const INTEREST_POINTS: Location[] = [
  { name: "Gaddi Baithak", coords: [85.30667912969801, 27.704001160558626] },
  { name: "Kumari Ghar", coords: [85.3065, 27.7038] },
  { name: "Shiva Parvati Temple", coords: [85.30647918084237,27.70441750448278] },
  { name: "Kal Bhairav", coords: [85.30712950968383,  27.7047745907574] },
  { name: "Maru Ganesh", coords: [85.3058, 27.7037] }
];

const LocationMarkers: React.FC<{ map: maplibregl.Map | null }> = ({ map }) => {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    INTEREST_POINTS.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'location-label';
      el.innerHTML = `
        <div style="
          background: black;
          color: white;
          padding: 2px 8px;
          border: 2px solid white;
          font-family: monospace;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 4px 4px 0px rgba(255, 0, 0, 1);
        ">
          ${loc.name}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(loc.coords)
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [map]);

  return null;
};

export default LocationMarkers;