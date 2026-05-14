'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface StallItem { id: string; name: string; description: string; color: string; }
interface CalculatedPolygon { stallId: string; path: { lat: number; lng: number }[]; }
interface MarkerData {
  id: string; name: string; height: number; baseColor: string;
  colorMode?: 'uniform' | 'individual';
  items: StallItem[];
  calculatedPolygons?: CalculatedPolygon[];
}

// Helpers
const toRing = (path: { lat: number; lng: number }[]) => {
  const ring: [number, number][] = path.map(p => [p.lng, p.lat]);
  if (ring.length < 2) return ring;
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push([ring[0][0], ring[0][1]]);
  }
  return ring;
};

const centroid = (path: { lat: number; lng: number }[]): [number, number] => {
  const n = path.length || 1;
  const sum = path.reduce((a, p) => [a[0] + p.lng, a[1] + p.lat], [0, 0]);
  return [sum[0] / n, sum[1] / n];
};

function renderStallPolygons(map: maplibregl.Map, markers: MarkerData[]): () => void {
  const sourceId = 'stalls-3d-source';
  const layerId = 'stalls-3d-layer';
  const labelMarkers: maplibregl.Marker[] = [];

  const openPopup = (props: any) => {
    document.querySelectorAll('.full-screen-popup-overlay').forEach(p => p.remove());
    const overlay = document.createElement('div');
    overlay.className = 'full-screen-popup-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: '9999', backdropFilter: 'blur(4px)'
    });
    overlay.innerHTML = `
      <div style="background:white; width:90%; max-width:450px; border-radius:16px; overflow:hidden; position:relative;">
        <div style="height:8px; background:${props.color};"></div>
        <div style="padding:24px; font-family:sans-serif;">
          <h4 style="margin:0; font-size:20px;">${props.name}</h4>
          <p style="color:#666;">${props.description || 'No description.'}</p>
          <button id="close-popup" style="width:100%; padding:10px; background:#111; color:#fff; border:none; border-radius:8px; cursor:pointer;">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-popup')?.addEventListener('click', () => overlay.remove());
  };

  const features = markers.flatMap(col => 
    (col.calculatedPolygons || []).map((poly, idx) => {
      const item = col.items?.find(it => it.id === poly.stallId) || { name: `Unit ${idx+1}`, color: col.baseColor, description: '' };
      const color = col.colorMode === 'uniform' ? col.baseColor : (item.color || col.baseColor);
      
      // Add Marker Label
      const el = document.createElement('div');
      el.className = 'map-label';
      el.textContent = item.name;
      Object.assign(el.style, { background: '#111', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' });
      const m = new maplibregl.Marker({ element: el }).setLngLat(centroid(poly.path)).addTo(map);
      el.onclick = () => openPopup({ ...item, color });
      labelMarkers.push(m);

      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [toRing(poly.path)] },
        properties: { height: Number(col.height) || 4, color }
      };
    })
  );

  if (map.getSource(sourceId)) {
    (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: features as any });
  } else {
    map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: features as any } });
    map.addLayer({
      id: layerId, type: 'fill-extrusion', source: sourceId,
      paint: { 'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.9 }
    });
  }

  return () => {
    labelMarkers.forEach(m => m.remove());
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  };
}

export default function Marker3DPlotter({ map, eventId }: { map: React.MutableRefObject<maplibregl.Map | null>, eventId: string }) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!eventId) return;
    return onSnapshot(collection(db, 'events', eventId, '3dmarker'), (snap) => {
      setMarkers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as MarkerData[]);
    });
  }, [eventId]);

  useEffect(() => {
    if (!map.current || !markers.length) return;
    const run = () => {
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = renderStallPolygons(map.current!, markers);
    };

    if (map.current.isStyleLoaded()) run(); 
    else map.current.once('styledata', run);

    return () => cleanupRef.current?.();
  }, [markers, map.current]);

  return null;
}