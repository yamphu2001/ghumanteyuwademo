"use client";
import React, { useEffect } from 'react';
import { useGridStore } from './GridStore';
import { useMapPreferenceStore } from '@/store/Map_preference';

export default function GridPlot({ map }: { map: React.MutableRefObject<any> }) {
  const geoData = useGridStore((state) => state.geoData);
  const mode = useGridStore((state) => state.mode);
  const { is3D, theme } = useMapPreferenceStore();

  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    const setup = () => {
      if (currentMap.getSource('grid-source')) return;
      currentMap.addSource('grid-source', { type: 'geojson', data: geoData[mode] });
      currentMap.addLayer({
        id: 'grid-layer',
        type: 'fill-extrusion',
        source: 'grid-source',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': is3D ? 20 : 0,
          'fill-extrusion-opacity': 0.8
        }
      });
    };

    if (currentMap.isStyleLoaded()) setup();
    else currentMap.once('idle', setup);
  }, [map.current, theme]);

  useEffect(() => {
    const src = map.current?.getSource('grid-source') as any;
    if (src) src.setData(geoData[mode]);
  }, [geoData, mode]);

  return null;  // ← GridDebug removed from here
}