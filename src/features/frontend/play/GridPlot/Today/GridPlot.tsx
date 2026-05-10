

"use client";
import React, { useEffect, useRef } from 'react';
import { useGridStore } from './GridStore';
import { useMapPreferenceStore } from '@/store/Map_preference';
import GridDebug from './GridDebug';

export default function GridPlot({ map }: { map: React.MutableRefObject<any> }) {
  const geoData          = useGridStore((s) => s.geoData);
  const mode             = useGridStore((s) => s.mode);
  const isSyncing        = useGridStore((s) => s.isSyncing);
  const loadTodayCells   = useGridStore((s) => s.loadTodayCells);
  const loadHistoryCells = useGridStore((s) => s.loadHistoryCells);
  const loadGlobalCells  = useGridStore((s) => s.loadGlobalCells);
  const { is3D, theme }  = useMapPreferenceStore();

  const sourceReady  = useRef(false);
  const pendingPush  = useRef(false); // flag: data arrived before map was ready

  // ── Core push — always reads fresh state ─────────────────────────────────
  const pushToMap = () => {
    if (!sourceReady.current) {
      // Map not ready yet — mark as pending, will push once map is ready
      pendingPush.current = true;
      return;
    }
    const src = map.current?.getSource('grid-source') as any;
    if (!src) return;
    const { geoData: fresh, mode: currentMode } = useGridStore.getState();
    src.setData(fresh[currentMode]);
    pendingPush.current = false;
  };

  // ── Map source & layer setup ─────────────────────────────────────────────
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    const setup = () => {
      if (!currentMap.getSource('grid-source')) {
        currentMap.addSource('grid-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        currentMap.addLayer({
          id: 'grid-layer',
          type: 'fill-extrusion',
          source: 'grid-source',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': is3D ? 20 : 0,
            'fill-extrusion-opacity': 0.8,
          },
        });
      }
      sourceReady.current = true;

      // If data already arrived while map was setting up, push it now
      if (pendingPush.current) {
        pushToMap();
      }
    };

    if (currentMap.isStyleLoaded()) setup();
    else currentMap.once('idle', setup);
  }, [map.current, theme]);

  // ── Load data on mode change ─────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'today')   loadTodayCells();
    if (mode === 'history') loadHistoryCells();
    if (mode === 'global')  loadGlobalCells();
  }, [mode]);

  // ── Push when fetch finishes ─────────────────────────────────────────────
  useEffect(() => {
    if (!isSyncing) pushToMap();
  }, [isSyncing]);

  // ── Push when new cell plotted live ─────────────────────────────────────
  useEffect(() => {
    pushToMap();
  }, [geoData]);

  return <GridDebug map={map} />;
}