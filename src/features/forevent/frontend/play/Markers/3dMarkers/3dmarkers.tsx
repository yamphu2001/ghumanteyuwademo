

// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import maplibregl from 'maplibre-gl';
// import { db } from '@/lib/firebase';
// import { collection, onSnapshot } from 'firebase/firestore';
// import FullScreenPopup from './popup'; 

// export default function Marker3DPlotter({ map, eventId }: { map: maplibregl.Map, eventId: string }) {
//   const [markers, setMarkers] = useState<any[]>([]);
//   const [selectedStall, setSelectedStall] = useState<any>(null); 
//   const isMountedRef = useRef(true);

//   useEffect(() => {
//     isMountedRef.current = true;
//     const unsub = onSnapshot(collection(db, 'events', eventId, '3dmarker'), (snap) => {
//       setMarkers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
//     });
//     return () => {
//       unsub();
//       isMountedRef.current = false;
//     };
//   }, [eventId]);

//   useEffect(() => {
//     if (!map || !markers.length) return;

//     const sourceId = 'stalls-3d-source';
//     const layerId = 'stalls-3d-layer';
//     const labelLayerId = 'stalls-3d-labels';

//     const handleClick = (e: any) => {
//       if (e.features && e.features.length > 0) {
//         const props = e.features[0].properties;
//         setSelectedStall({
//           name: props.name,
//           description: props.description,
//           color: props.color
//         });
//       }
//     };

//     const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
//     const handleMouseLeave = () => { map.getCanvas().style.cursor = ''; };

//     const draw = () => {
//       if (!isMountedRef.current) return;

//       const features = markers.flatMap(col => (col.calculatedPolygons || []).map((poly: any, index: number) => {
//         const ring = poly.path.map((p: any) => [p.lng, p.lat]);
        
//         if (ring.length < 3) return null; 
//         ring.push(ring[0]); 

//         const item = col.items?.find((it: any) => it.id === poly.stallId) || col.items?.[index] || {};
        
//         // FIX: Ensure the color always has a '#' prefix and falls back correctly
//         const rawColor = col.baseColor || col.color || '#cc9845';
//         const finalColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;

//         return {
//           type: 'Feature',
//           geometry: { type: 'Polygon', coordinates: [ring] },
//           properties: { 
//             height: Number(col.height) || 5, 
//             color: finalColor,
//             name: item.name || col.name,
//             description: item.description || col.description || "",
//           }
//         };
//       })).filter(Boolean);

//       const geojsonData: any = { type: 'FeatureCollection', features };

//       if (map.getSource(sourceId)) {
//         (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
//       } else {
//         map.addSource(sourceId, { type: 'geojson', data: geojsonData });

//         map.addLayer({
//           id: layerId,
//           type: 'fill-extrusion',
//           source: sourceId,
//           paint: {
//             // This 'get' binds the property we defined in the features above
//             'fill-extrusion-color': ['get', 'color'],
//             'fill-extrusion-height': ['get', 'height'],
//             'fill-extrusion-base': 0,
//             'fill-extrusion-opacity': 0.9
//           }
//         });

//         map.addLayer({
//           id: labelLayerId,
//           type: 'symbol',
//           source: sourceId,
//           layout: {
//             'text-field': ['get', 'name'],
//             'text-size': 12,
//             'text-variable-anchor': ['center'],
//             'text-justify': 'center',
//             'text-allow-overlap': false,
//             'text-padding': 2
//           },
//           paint: {
//             'text-color': '#ffffff',
//             'text-halo-color': '#111111',
//             'text-halo-width': 1.5
//           }
//         });

//         map.on('click', layerId, handleClick);
//         map.on('mouseenter', layerId, handleMouseEnter);
//         map.on('mouseleave', layerId, handleMouseLeave);
//       }
//     };

//     if (map.isStyleLoaded()) draw(); else map.once('idle', draw);

//     return () => {
//       map.off('click', layerId, handleClick);
//       map.off('mouseenter', layerId, handleMouseEnter);
//       map.off('mouseleave', layerId, handleMouseLeave);

//       if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
//       if (map.getLayer(layerId)) map.removeLayer(layerId);
//       if (map.getSource(sourceId)) map.removeSource(sourceId);
//     };
//   }, [map, markers]);

//   return (
//     <FullScreenPopup 
//       isOpen={!!selectedStall} 
//       onClose={() => setSelectedStall(null)} 
//       data={selectedStall} 
//     />
//   );
// }


'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import FullScreenPopup from './popup'; 

export default function Marker3DPlotter({ map, eventId }: { map: maplibregl.Map, eventId: string }) {
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedStall, setSelectedStall] = useState<any>(null); 
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const unsub = onSnapshot(collection(db, 'events', eventId, '3dmarker'), (snap) => {
      setMarkers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsub();
      isMountedRef.current = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!map || !markers.length) return;

    const sourceId = 'stalls-3d-source';
    const layerId = 'stalls-3d-layer';
    const labelLayerId = 'stalls-3d-labels';

    const handleClick = (e: any) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        setSelectedStall({
          name: props.name,
          description: props.description,
          color: props.color
        });
      }
    };

    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ''; };

    const draw = () => {
      if (!isMountedRef.current) return;

      const features = markers.flatMap(col => (col.calculatedPolygons || []).map((poly: any, index: number) => {
        const ring = poly.path.map((p: any) => [p.lng, p.lat]);
        
        if (ring.length < 3) return null; 
        ring.push(ring[0]); 

        // Match the specific stall from the 'items' array using stallId
        const item = col.items?.find((it: any) => it.id === poly.stallId) || col.items?.[index] || {};
        
        // LOGIC UPDATE: 
        // 1. Try item.color (e.g., "#4bb007")
        // 2. Try col.baseColor (e.g., "#ff0000")
        // 3. Default to gold
        const rawColor = item.color || col.baseColor || '#cc9845';
        const finalColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;

        return {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: { 
            height: Number(col.height) || 5, 
            color: finalColor,
            name: item.name || col.name,
            description: item.description || col.description || "",
          }
        };
      })).filter(Boolean);

      const geojsonData: any = { type: 'FeatureCollection', features };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geojsonData });

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

        map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-variable-anchor': ['center'],
            'text-justify': 'center',
            'text-allow-overlap': false,
            'text-padding': 2
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#111111',
            'text-halo-width': 1.5
          }
        });

        map.on('click', layerId, handleClick);
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);
      }
    };

    if (map.isStyleLoaded()) draw(); else map.once('idle', draw);

    return () => {
      map.off('click', layerId, handleClick);
      map.off('mouseenter', layerId, handleMouseEnter);
      map.off('mouseleave', layerId, handleMouseLeave);

      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
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