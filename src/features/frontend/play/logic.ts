// "use client";
// import { useState, useEffect } from 'react';
// import maplibregl from 'maplibre-gl';
// import { useMapPreferenceStore } from '@/store/Map_preference';

// export const MAP_STYLES = {
//   liberty:                'https://tiles.openfreemap.org/styles/liberty',
//   bright:                 'https://tiles.openfreemap.org/styles/bright',
//   dark:                   'https://tiles.openfreemap.org/styles/dark',
//   positron:               'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
//   'positron-nolabels':    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
//   'dark-matter':          'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
//   'dark-matter-nolabels': 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
//   voyager:                'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
//   'voyager-nolabels':     'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
// } as const;

// export type MapStyleKey = keyof typeof MAP_STYLES;

// const KATHMANDU_BOUNDS: maplibregl.LngLatBoundsLike = [
//   [84.8740, 27.2672],
//   [85.7740, 28.1672],
// ];

// // Building source layer name differs between style providers
// function getBuildingSource(theme: string): { source: string; sourceLayer: string } | null {
//   if (['liberty', 'bright', 'dark'].includes(theme)) {
//     return { source: 'openmaptiles', sourceLayer: 'building' };
//   }
//   if (['voyager', 'voyager-nolabels', 'positron', 'positron-nolabels', 'dark-matter', 'dark-matter-nolabels'].includes(theme)) {
//     return { source: 'carto', sourceLayer: 'building' };
//   }
//   return null;
// }

// function add3DLayer(map: maplibregl.Map, theme: string) {
//   if (map.getLayer('3d-buildings')) return;
//   const src = getBuildingSource(theme);
//   if (!src) return;

//   map.addLayer({
//     id: '3d-buildings',
//     source: src.source,
//     'source-layer': src.sourceLayer,
//     type: 'fill-extrusion',
//     paint: {
//       'fill-extrusion-color': '#aaa',
//       // FIX: Ensure there is ALWAYS a number at the end of the coalesce chain
//       'fill-extrusion-height': [
//         'coalesce', 
//         ['get', 'height'], 
//         ['get', 'render_height'], 
//         15 // Default height if both are null
//       ],
//       'fill-extrusion-base': [
//         'coalesce', 
//         ['get', 'min_height'], 
//         ['get', 'render_min_height'], 
//         0 // Default base if both are null
//       ],
//       'fill-extrusion-opacity': 0.7,
//     },
//   });
// }

// function remove3DLayer(map: maplibregl.Map) {
//   if (map.getLayer('3d-buildings')) map.removeLayer('3d-buildings');
// }

// export const useMapInit = (mapContainer: React.RefObject<HTMLDivElement | null>) => {
//   const [map, setMap] = useState<maplibregl.Map | null>(null);
//   const [isLoaded, setIsLoaded] = useState(false);

//   const { theme, zoom, pitch, is3D } = useMapPreferenceStore();

//   // Re-init the map only when theme changes (expensive)
//   useEffect(() => {
//     if (!mapContainer.current) return;

//     const styleUrl = MAP_STYLES[theme as MapStyleKey] ?? MAP_STYLES.liberty;

//     const mapInstance = new maplibregl.Map({
//       container: mapContainer.current,
//       style: styleUrl,
//       center: [85.3240, 27.7172],
//       zoom,
//       pitch: is3D ? pitch : 0,
//       maxBounds: KATHMANDU_BOUNDS,
//       minZoom: 10,
//     });

//     mapInstance.on('load', () => {
//       if (is3D) add3DLayer(mapInstance, theme);
//       setMap(mapInstance);
//       setIsLoaded(true);
//     });

//     return () => {
//       mapInstance.remove();
//       setMap(null);
//       setIsLoaded(false);
//     };
//   }, [mapContainer, theme]); // theme change = full reinit

//   // Live pitch update when is3D toggles — no reinit needed
//   useEffect(() => {
//     if (!map || !isLoaded) return;
//     map.easeTo({ pitch: is3D ? pitch : 0, duration: 400 });
//     if (is3D) {
//       add3DLayer(map, theme);
//     } else {
//       remove3DLayer(map);
//     }
//   }, [is3D]); // intentionally only [is3D]

//   return { map, isLoaded };
// };


"use client";
import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapPreferenceStore } from '@/store/Map_preference';

export const MAP_STYLES = {
  liberty:                'https://tiles.openfreemap.org/styles/liberty',
  bright:                 'https://tiles.openfreemap.org/styles/bright',
  dark:                   'https://tiles.openfreemap.org/styles/dark',
  positron:               'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  'positron-nolabels':    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  'dark-matter':          'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  'dark-matter-nolabels': 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  voyager:                'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  'voyager-nolabels':     'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

const KATHMANDU_BOUNDS: maplibregl.LngLatBoundsLike = [
  [84.8740, 27.2672],
  [85.7740, 28.1672],
];

function getBuildingSource(theme: string): { source: string; sourceLayer: string } | null {
  if (['liberty', 'bright', 'dark'].includes(theme)) {
    return { source: 'openmaptiles', sourceLayer: 'building' };
  }
  if (['voyager', 'voyager-nolabels', 'positron', 'positron-nolabels', 'dark-matter', 'dark-matter-nolabels'].includes(theme)) {
    return { source: 'carto', sourceLayer: 'building' };
  }
  return null;
}

function add3DLayer(map: maplibregl.Map, theme: string) {
  if (map.getLayer('3d-buildings')) return;
  const src = getBuildingSource(theme);
  if (!src) return;

  map.addLayer({
    id: '3d-buildings',
    source: src.source,
    'source-layer': src.sourceLayer,
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': '#aaa',
      'fill-extrusion-height': ['coalesce', ['get', 'height'], ['get', 'render_height'], 15],
      'fill-extrusion-base':   ['coalesce', ['get', 'min_height'], ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.7,
    },
  });
}

function remove3DLayer(map: maplibregl.Map) {
  if (map.getLayer('3d-buildings')) map.removeLayer('3d-buildings');
}

export const useMapInit = (mapContainer: React.RefObject<HTMLDivElement | null>) => {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ✅ FIX: stable ref — always points to the current map instance
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { theme, zoom, pitch, is3D } = useMapPreferenceStore();

  useEffect(() => {
    if (!mapContainer.current) return;

    const styleUrl = MAP_STYLES[theme as MapStyleKey] ?? MAP_STYLES.liberty;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [85.3240, 27.7172],
      zoom,
      pitch: is3D ? pitch : 0,
      maxBounds: KATHMANDU_BOUNDS,
      minZoom: 10,
    });

    mapInstance.on('load', () => {
      if (is3D) add3DLayer(mapInstance, theme);
      // ✅ FIX: set ref immediately — before React state re-render cycle
      mapRef.current = mapInstance;
      setMap(mapInstance);
      setIsLoaded(true);
    });

    return () => {
      mapInstance.remove();
      // ✅ FIX: clear ref on unmount to prevent stale reference
      mapRef.current = null;
      setMap(null);
      setIsLoaded(false);
    };
  }, [mapContainer, theme]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.easeTo({ pitch: is3D ? pitch : 0, duration: 400 });
    if (is3D) {
      add3DLayer(map, theme);
    } else {
      remove3DLayer(map);
    }
  }, [is3D]);

  // ✅ FIX: return mapRef alongside map state
  return { map, mapRef, isLoaded };
};