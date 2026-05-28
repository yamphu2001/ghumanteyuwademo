
// 'use client hhahahahaa';

// import { useEffect, useRef, useState } from 'react';
// import maplibregl from 'maplibre-gl';
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// const calculateCenter = (boundary: [number, number][]): [number, number] => {
//   if (boundary.length === 0) return [85.3076, 27.7042];
//   const sum = boundary.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
//   return [sum[0] / boundary.length, sum[1] / boundary.length];
// };

// export const useMapInit = (
//   mapContainer: React.RefObject<HTMLDivElement | null>,
//   eventId: string
// ) => {
//   const mapRef = useRef<maplibregl.Map | null>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const isInitializing = useRef(false);

//   useEffect(() => {
//     if (!mapContainer.current || isInitializing.current || mapRef.current) return;
//     isInitializing.current = true;

//     const initMap = async () => {
//       let boundary: [number, number][] = [];

//       try {
//         // FIXED PATH: Now fetches from the separate 'boundary' subcollection -> 'data' document
//         const snap = await getDoc(doc(db, "events", eventId, "boundary", "data"));
//         if (snap.exists()) {
//           const data = snap.data();
//           if (data.boundaryCoords)
//             boundary = data.boundaryCoords.map((p: any) => [p.lng, p.lat]);
//         }
//       } catch (e) {
//         console.error("Firebase fetch error:", e);
//       }

//       // Guard: component may have unmounted during the async Firebase fetch
//       if (!mapContainer.current) {
//         isInitializing.current = false;
//         return;
//       }

//       const mapInstance = new maplibregl.Map({
//         container: mapContainer.current,
//         style: 'https://tiles.openfreemap.org/styles/bright',
//         center: calculateCenter(boundary),
//         zoom: 16,
//         minZoom: 14,
//         maxZoom: 20,
//         pitch: 60,
//       });

//       mapRef.current = mapInstance;

//       mapInstance.on('error', (err) => console.error('MapLibre error:', err.error?.message ?? err));

//       mapInstance.on('load', () => {
//         if (mapRef.current !== mapInstance) return;

//         const layers = mapInstance.getStyle().layers;
//         const poiKeywords = ['poi', 'shop', 'food', 'hospital', 'medical',
//                              'pharmacy', 'retail', 'commercial', 'amenity'];
//         layers?.forEach((layer) => {
//           const sourceLayer = (layer as any)['source-layer'] || '';
//           if (poiKeywords.some(kw =>
//             layer.id.toLowerCase().includes(kw) ||
//             sourceLayer.toLowerCase().includes(kw)
//           )) {
//             mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
//           }
//         });

//         if (boundary.length > 0) {
//           const closedBoundary = [...boundary];
//           const first = boundary[0], last = boundary[boundary.length - 1];
//           if (first[0] !== last[0] || first[1] !== last[1]) closedBoundary.push(first);

//           mapInstance.addSource('mask-src', {
//             type: 'geojson',
//             data: {
//               type: 'Feature',
//               properties: {},
//               geometry: {
//                 type: 'Polygon',
//                 coordinates: [
//                   [[-180,90],[-180,-90],[180,-90],[180,90],[-180,90]],
//                   closedBoundary,
//                 ],
//               },
//             },
//           });
//           mapInstance.addLayer({
//             id: 'boundary-mask-layer',
//             type: 'fill',
//             source: 'mask-src',
//             paint: { 'fill-color': '#0B0E14', 'fill-opacity': 0.8 },
//           });
//         }

//         setIsLoaded(true);
//         isInitializing.current = false;
//       });
//     };

//     initMap();

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
//       setIsLoaded(false);
//       isInitializing.current = false;
//     };
//   }, [eventId]);

//   return { map: mapRef, isLoaded };
// };



'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import localforage from 'localforage';

const calculateCenter = (boundary: [number, number][]): [number, number] => {
  if (boundary.length === 0) return [85.3076, 27.7042];
  const sum = boundary.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / boundary.length, sum[1] / boundary.length];
};

export const useMapInit = (
  mapContainer: React.RefObject<HTMLDivElement | null>,
  eventId: string
) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || isInitializing.current || mapRef.current) return;
    isInitializing.current = true;

    const initMap = async () => {
      let boundary: [number, number][] = [];
      const cacheKey = `boundary_${eventId}`;

      try {
        // Check if the user is online
        if (navigator.onLine) {
          // ONLINE PATH: Fetch from separate 'boundary' subcollection -> 'data' document
          const snap = await getDoc(doc(db, "events", eventId, "boundary", "data"));
          if (snap.exists()) {
            const data = snap.data();
            if (data.boundaryCoords) {
              boundary = data.boundaryCoords.map((p: any) => [p.lng, p.lat]);
              // Cache the boundary coords directly using localforage
              await localforage.setItem(cacheKey, boundary);
            }
          }
        } else {
          // OFFLINE PATH: Retrieve coordinates directly from local storage
          const cachedBoundary = await localforage.getItem<[number, number][]>(cacheKey);
          if (cachedBoundary) {
            boundary = cachedBoundary;
            console.log("Offline mode: Loaded boundary coordinates from browser database.");
          }
        }
      } catch (e) {
        console.error("Firebase/Database fetch error:", e);
        // Fallback buffer if network request failed silently
        const cachedBoundary = await localforage.getItem<[number, number][]>(cacheKey);
        if (cachedBoundary) boundary = cachedBoundary;
      }

      // Guard: component may have unmounted during the async data fetches
      if (!mapContainer.current) {
        isInitializing.current = false;
        return;
      }

      // Automatically swap map layout configuration based on current internet connection
      const mapStyleSource = navigator.onLine 
        ? 'https://tiles.openfreemap.org/styles/bright' 
        : '/map-style.json'; // Local asset sitting in your public/ folder

      const mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyleSource,
        center: calculateCenter(boundary),
        zoom: 16,
        minZoom: 14,
        maxZoom: 20,
        pitch: 60,
      });

      mapRef.current = mapInstance;

      mapInstance.on('error', (err) => console.error('MapLibre error:', err.error?.message ?? err));

      mapInstance.on('load', () => {
        if (mapRef.current !== mapInstance) return;

        const layers = mapInstance.getStyle().layers;
        const poiKeywords = ['poi', 'shop', 'food', 'hospital', 'medical',
                             'pharmacy', 'retail', 'commercial', 'amenity'];
        layers?.forEach((layer) => {
          const sourceLayer = (layer as any)['source-layer'] || '';
          if (poiKeywords.some(kw =>
            layer.id.toLowerCase().includes(kw) ||
            sourceLayer.toLowerCase().includes(kw)
          )) {
            mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });

        if (boundary.length > 0) {
          const closedBoundary = [...boundary];
          const first = boundary[0], last = boundary[boundary.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) closedBoundary.push(first);

          mapInstance.addSource('mask-src', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [[-180,90],[-180,-90],[180,-90],[180,90],[-180,90]],
                  closedBoundary,
                ],
              },
            },
          });
          mapInstance.addLayer({
            id: 'boundary-mask-layer',
            type: 'fill',
            source: 'mask-src',
            paint: { 'fill-color': '#0B0E14', 'fill-opacity': 0.8 },
          });
        }

        setIsLoaded(true);
        isInitializing.current = false;
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsLoaded(false);
      isInitializing.current = false;
    };
  }, [eventId]);

  return { map: mapRef, isLoaded };
};