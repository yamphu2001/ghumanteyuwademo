

// "use client";

// import { useEffect, useRef, useState } from 'react';
// import maplibregl from 'maplibre-gl';
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useMapPreferenceStore } from '@/store/Map_preference';

// const DEFAULT_BOUNDARY: [number, number][] = [[85.26, 27.77], [85.43, 27.76], [85.42, 27.64], [85.23, 27.65], [85.26, 27.77]];

// export const useMapInit = (mapContainer: React.RefObject<HTMLDivElement | null>, eventId: string) => {
//   const mapRef = useRef<maplibregl.Map | null>(null);
//   const isInitializing = useRef(false); // Lock to prevent double-init
//   const [isLoaded, setIsLoaded] = useState(false);
//   const { zoom, pitch, is3D } = useMapPreferenceStore();

//   useEffect(() => {
//     // Exit if no container, already initializing, or map already exists
//     if (!mapContainer.current || isInitializing.current || mapRef.current) return;

//     isInitializing.current = true;

//     const initMap = async () => {
//       let activeBoundary: [number, number][] = DEFAULT_BOUNDARY;
//       let center: [number, number] = [85.3076, 27.7042];

//       try {
//         const snap = await getDoc(doc(db, "events", eventId));
//         if (snap.exists()) {
//           const data = snap.data();
//           if (data.lng && data.lat) center = [data.lng, data.lat];
//           if (data.boundaryCoords) {
//             activeBoundary = data.boundaryCoords.map((obj: { lng: number; lat: number }) => [obj.lng, obj.lat]);
//           }
//         }
//       } catch (e) {
//         console.error("Firebase fetch error:", e);
//       }

//       const lats = activeBoundary.map(c => c[1]);
//       const lngs = activeBoundary.map(c => c[0]);
//       const bounds: [[number, number], [number, number]] = [
//         [Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005],
//         [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]
//       ];

//       // Create map instance
//       const mapInstance = new maplibregl.Map({
//         container: mapContainer.current!,
//         style: 'https://tiles.openfreemap.org/styles/liberty',
//         center: center,
//         zoom: zoom,
//         maxBounds: bounds,
//         pitch: is3D ? pitch : 60, // Default to a steep 60° for 3D visibility
//         bearing: -15, // Slight rotation for depth perception
//       } as any);

//       mapInstance.on('load', () => {
//         // --- ADD MASK SOURCE ---
//         mapInstance.addSource('boundary-mask', {
//           type: 'geojson',
//           data: {
//             type: 'Feature',
//             properties: {},
//             geometry: {
//               type: 'Polygon',
//               coordinates: [[[-180, 90], [-180, -90], [180, -90], [180, 90], [-180, 90]], activeBoundary],
//             },
//           },
//         });

//         mapInstance.addLayer({
//           id: 'boundary-mask-layer',
//           type: 'fill',
//           source: 'boundary-mask',
//           paint: { 'fill-color': '#0B0E14', 'fill-opacity': 0.85 },
//         });

//         // --- ADD OUTLINE ---
//         mapInstance.addSource('boundary-line', {
//           type: 'geojson',
//           data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: activeBoundary } },
//         });

//         mapInstance.addLayer({
//           id: 'boundary-outline',
//           type: 'line',
//           source: 'boundary-line',
//           paint: { 'line-color': '#fe4f4f', 'line-width': 2 },
//         });

//         mapRef.current = mapInstance;
//         setIsLoaded(true);
//         isInitializing.current = false;
//       });
//     };

//     initMap();

//     // CLEANUP: Vital to prevent WebGL context leakage
//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
//       isInitializing.current = false;
//     };
//   }, [eventId, zoom, pitch, is3D]); // Dependencies

//   return { map: mapRef, isLoaded };
// };




"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useMapPreferenceStore } from '@/store/Map_preference';

const DEFAULT_BOUNDARY: [number, number][] = [[85.26, 27.77], [85.43, 27.76], [85.42, 27.64], [85.23, 27.65], [85.26, 27.77]];

export const useMapInit = (mapContainer: React.RefObject<HTMLDivElement | null>, eventId: string) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isInitializing = useRef(false); // Lock to prevent double-init
  const [isLoaded, setIsLoaded] = useState(false);
  const { zoom, pitch, is3D } = useMapPreferenceStore();

  useEffect(() => {
    // Exit if no container, already initializing, or map already exists
    if (!mapContainer.current || isInitializing.current || mapRef.current) return;

    isInitializing.current = true;

    const initMap = async () => {
      let activeBoundary: [number, number][] = DEFAULT_BOUNDARY;
      let center: [number, number] = [85.3076, 27.7042];

      try {
        const snap = await getDoc(doc(db, "events", eventId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.lng && data.lat) center = [data.lng, data.lat];
          if (data.boundaryCoords) {
            activeBoundary = data.boundaryCoords.map((obj: { lng: number; lat: number }) => [obj.lng, obj.lat]);
          }
        }
      } catch (e) {
        console.error("Firebase fetch error:", e);
      }

      const lats = activeBoundary.map(c => c[1]);
      const lngs = activeBoundary.map(c => c[0]);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005],
        [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]
      ];

      // Create map instance
      const mapInstance = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: center,
        zoom: zoom,
        maxBounds: bounds,
        pitch: is3D ? pitch : 60, // Default to a steep 60° for 3D visibility
        bearing: -15, // Slight rotation for depth perception
      } as any);

      mapInstance.on('load', () => {
        // --- ADD MASK SOURCE ---
        mapInstance.addSource('boundary-mask', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[[-180, 90], [-180, -90], [180, -90], [180, 90], [-180, 90]], activeBoundary],
            },
          },
        });

        mapInstance.addLayer({
          id: 'boundary-mask-layer',
          type: 'fill',
          source: 'boundary-mask',
          paint: { 'fill-color': '#0B0E14', 'fill-opacity': 0.85 },
        });

        // --- ADD OUTLINE ---
        mapInstance.addSource('boundary-line', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: activeBoundary } },
        });

        mapInstance.addLayer({
          id: 'boundary-outline',
          type: 'line',
          source: 'boundary-line',
          paint: { 'line-color': '#fe4f4f', 'line-width': 2 },
        });

        mapRef.current = mapInstance;
        setIsLoaded(true);
        isInitializing.current = false;
      });
    };

    initMap();

    // CLEANUP: Vital to prevent WebGL context leakage
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isInitializing.current = false;
    };
  }, [eventId, zoom, pitch, is3D]); // Dependencies

  return { map: mapRef, isLoaded };
};