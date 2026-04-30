"use client";
import React, { useEffect } from 'react';
import { useGridStore } from './GridStore';

export default function GridPlot({ map }: { map: React.MutableRefObject<any> }) {
  const geoData = useGridStore((state) => state.geoData);
  const mode = useGridStore((state) => state.mode);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    // FUNCTION: Create source/layer if they don't exist
    const ensureLayerExists = () => {
      if (!m.getStyle()) return false;

      if (!m.getSource('grid-source')) {
        m.addSource('grid-source', {
          type: 'geojson',
          data: geoData[mode] || { type: 'FeatureCollection', features: [] }
        });
      }

      if (!m.getLayer('grid-layer')) {
        m.addLayer({
          id: 'grid-layer',
          type: 'fill', // Using 'fill' for better reliability than extrusion at 1AM
          source: 'grid-source',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.5
          }
        });
      }
      return true;
    };

    // Attempt to update data
    const updateData = () => {
      if (ensureLayerExists()) {
        const source = m.getSource('grid-source');
        if (source) {
          source.setData(geoData[mode]);
        }
      }
    };

    if (m.isStyleLoaded()) {
      updateData();
    } else {
      m.once('idle', updateData);
    }
  }, [geoData, mode, map]);

  return null;
}