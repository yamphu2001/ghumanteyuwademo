
'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StallItem {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface CalculatedPolygon {
  stallId: string;
  path: { lat: number; lng: number }[];
}

interface MarkerData {
  id: string;
  name: string;
  height: number;
  baseColor: string;
  colorMode?: 'uniform' | 'individual';
  items: StallItem[];
  calculatedPolygons?: CalculatedPolygon[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRing(path: { lat: number; lng: number }[]): [number, number][] {
  const ring: [number, number][] = path.map(p => [p.lng, p.lat]);
  if (ring.length < 2) return ring;
  const [f, l] = [ring[0], ring[ring.length - 1]];
  if (f[0] !== l[0] || f[1] !== l[1]) ring.push([f[0], f[1]]);
  return ring;
}

// ─── Core plot function ───────────────────────────────────────────────────────

function plotLayers(map: maplibregl.Map, markers: MarkerData[]): () => void {
  const sourceId = 'stalls-3d-source';
  const layerId = 'stalls-3d-layer';
  const labelLayerId = 'stalls-label-layer';

  const openPopup = (props: any) => {
    document.querySelectorAll('.full-screen-popup-overlay').forEach(p => p.remove());

    const overlay = document.createElement('div');
    overlay.className = 'full-screen-popup-overlay';
    
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      backdropFilter: 'blur(4px)',
      padding: '20px',
      boxSizing: 'border-box'
    });

    overlay.innerHTML = `
      <div style="background:white; width:100%; max-width:500px; border-radius:16px; overflow:hidden; position:relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: modalIn 0.3s ease-out;">
        <div style="height:8px; background:${props.color};"></div>
        <button id="close-popup" style="position:absolute; top:15px; right:15px; background:#f3f4f6; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center;">&times;</button>
        <div style="padding:24px; font-family:system-ui, sans-serif;">
          <p style="font-size:12px; text-transform:uppercase; color:#6366f1; font-weight:700; margin:0 0 4px 0;">${props.groupName}</p>
          <h4 style="font-size:24px; font-weight:800; color:#111; margin:0 0 16px 0; line-height:1.2;">${props.name}</h4>
          <div style="height:1px; background:#eee; margin-bottom:16px;"></div>
          <p style="font-size:16px; color:#4b5563; margin:0; line-height:1.6;">
            ${props.description || 'No description available for this stall.'}
          </p>
          <button id="close-btn-bottom" style="margin-top:24px; width:100%; padding:12px; background:#111; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">
            Close Details
          </button>
        </div>
      </div>
      <style>
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
    overlay.querySelector('#close-popup')?.addEventListener('click', close);
    overlay.querySelector('#close-btn-bottom')?.addEventListener('click', close);
  };

  const features: any[] = [];

  markers.forEach((col) => {
    if (!col.calculatedPolygons?.length) return;

    col.calculatedPolygons.forEach((poly, index) => {
      const item: StallItem =
        col.items?.find(it => it.id === poly.stallId) ||
        col.items?.[index] || {
          id: poly.stallId,
          name: `Unit ${index + 1}`,
          description: '',
          color: col.baseColor ?? '#cc9845',
        };

      const fillColor =
        col.colorMode === 'uniform'
          ? (col.baseColor ?? '#cc9845')
          : (item.color || col.baseColor || '#cc9845');

      const ring = toRing(poly.path);

      // --- Logic for Label Placement ---
      const centerLng = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
      const centerLat = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;

      // 1. Polygon for the 3D extrusion
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: {
          id: poly.stallId,
          name: item.name,
          description: item.description,
          groupName: col.name,
          height: Number(col.height) || 4,
          color: fillColor,
        },
      });

      // 2. Point for the text label
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [centerLng, centerLat] },
        properties: {
          name: item.name,
        },
      });
    });
  });

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    // 1. 3D Shape Layer
    map.addLayer({
      id: layerId,
      type: 'fill-extrusion',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Polygon'] as any, 
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 1,
      },
    });

    // 2. Text Label Layer (With Zoom Logic)
    map.addLayer({
      id: labelLayerId,
      type: 'symbol',
      source: sourceId,
      minzoom: 17, // Only show labels when zoom is 17 or higher
      filter: ['==', ['geometry-type'], 'Point'] as any, 
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
    });

    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('click', layerId, (e) => {
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        openPopup(props);
      }
    });
  } else {
    (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features,
    });
  }

  return () => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    document.querySelectorAll('.full-screen-popup-overlay').forEach(p => p.remove());
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThreeDMarker({
  map,
  eventId,
}: {
  map: maplibregl.Map | null;
  eventId: string;
}) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const colRef = collection(db, 'events', eventId, '3dmarker');
    return onSnapshot(colRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MarkerData[];
      setMarkers(data);
    });
  }, [eventId]);

  useEffect(() => {
    cleanupRef.current?.();
    if (!map || !markers.length) return;

    const draw = () => {
      cleanupRef.current = plotLayers(map, markers);
    };

    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once('idle', draw);
    }

    return () => {
      map.off('idle', draw);
      cleanupRef.current?.();
    };
  }, [map, markers]);

  return null;
}