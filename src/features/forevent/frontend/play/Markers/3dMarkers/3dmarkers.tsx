
'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import FullScreenPopup from './popup'; // Import the new file

export default function Marker3DPlotter({ map, eventId }: { map: maplibregl.Map, eventId: string }) {
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedStall, setSelectedStall] = useState<any>(null); // State for popup
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'events', eventId, '3dmarker'), (snap) => {
      setMarkers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [eventId]);

  useEffect(() => {
    if (!map || !markers.length) return;

    const sourceId = 'stalls-3d-source';
    const layerId = 'stalls-3d-layer';
    const labelMarkers: maplibregl.Marker[] = [];

    const draw = () => {
      const features = markers.flatMap(col => (col.calculatedPolygons || []).map((poly: any, index: number) => {
        const ring = poly.path.map((p: any) => [p.lng, p.lat]);
        if (ring.length > 0) ring.push(ring[0]);

        // Find the specific item metadata for this polygon
        const item = col.items?.find((it: any) => it.id === poly.stallId) || col.items?.[index] || {};

        // Add Label Marker
        const center = ring[0]; 
        const el = document.createElement('div');
        el.innerHTML = `<div style="background:#111;color:white;padding:2px 6px;border-radius:4px;font-size:10px">${item.name || col.name}</div>`;
        const m = new maplibregl.Marker({ element: el }).setLngLat(center as [number, number]).addTo(map);
        labelMarkers.push(m);

        return {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: { 
            height: Number(col.height) || 5, 
            color: col.baseColor || '#cc9845',
            // Store data for the click event
            name: item.name || col.name,
            description: item.description || col.description || "",
          }
        };
      }));

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: features as any });
      } else {
        map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: features as any } });
        map.addLayer({
          id: layerId,
          type: 'fill-extrusion',
          source: sourceId,
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9
          }
        });

        // --- NEW INTERACTION LOGIC ---
        map.on('click', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
            setSelectedStall({
              name: props.name,
              description: props.description,
              color: props.color
            });
          }
        });

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }
    };

    if (map.isStyleLoaded()) draw(); else map.once('idle', draw);

    return () => {
      labelMarkers.forEach(m => m.remove());
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, markers]);

  return (
    <FullScreenPopup 
      isOpen={!!selectedStall} 
      onClose={() => setSelectedStall(null)} 
      data={selectedStall} 
    />
  );
}