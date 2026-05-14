
"use client";

import { useCallback, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

import { useStore, StallItem } from './store';
import LotsExplorer from './components/Lotsexplorer';
import MapView from './components/Mapview';
import PropertyConfig from './components/Propertyconfig';
// 1. Import the hook
import { useEventId } from '../Eventidcontext'; 

export default function LaGarauPlanner() {
  const { collections, addCollection, updateCollection, removeCollection } = useStore();
  
  // 2. Access the eventId from context
  const { eventId } = useEventId();

  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [isEditingNodes, setIsEditingNodes] = useState(false);
  const [mobileTab, setMobileTab] = useState<'lots' | 'map' | 'props'>('map');

  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<any>(null);
  const nodeMarkersRef = useRef<maplibregl.Marker[]>([]);

  const activeCol = collections.find((c) => c.id === inspectingId) ?? null;

  // ── Map ready callback ─────────────────────────────────────────────────────
  const handleMapReady = useCallback((map: maplibregl.Map, draw: any) => {
    mapRef.current = map;
    drawRef.current = draw;
  }, []);

  // ── Draw events ────────────────────────────────────────────────────────────
  const handleDrawCreate = useCallback(
    (coords: [number, number][]) => {
      // 3. Logic to assign eventId when a new lot is created
      addCollection({
        name: `New Lot ${collections.length + 1}`,
        eventId: eventId, 
        stalls: 5,
        width: 3,
        length: 5,
        height: 3.5,
        gap: 1,
        isCurved: false,
        colorMode: 'uniform',
        baseColor: '#1a1a1a',
        side: 'left',
        offset: 0,
        shapeType: 'rect',
        coordinates: coords,
      });
    },
    [addCollection, collections.length, eventId] 
  );

  const handleDrawUpdate = useCallback(
    (coords: [number, number][]) => {
      if (!inspectingId) return;
      updateCollection(inspectingId, { coordinates: coords });
      setIsEditingPath(false);
    },
    [inspectingId, updateCollection]
  );

  // ── Node marker helpers ────────────────────────────────────────────────────
  const clearNodeMarkers = () => {
    nodeMarkersRef.current.forEach((m) => m.remove());
    nodeMarkersRef.current = [];
  };

  const enterNodeEdit = useCallback(() => {
    if (!activeCol || !mapRef.current) return;
    clearNodeMarkers();
    activeCol.coordinates.forEach((coord, i) => {
      const el = document.createElement('div');
      el.style.cssText =
        'width:14px;height:14px;background:#facc15;border:2px solid #000;border-radius:50%;cursor:move;z-index:200';
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat(coord as [number, number])
        .addTo(mapRef.current!);
      marker.on('drag', () => {
        const ll = marker.getLngLat();
        const newCoords = activeCol.coordinates.map((c, idx) =>
          idx === i ? [ll.lng, ll.lat] as [number, number] : c
        ) as [number, number][];
        updateCollection(activeCol.id, { coordinates: newCoords });
      });
      nodeMarkersRef.current.push(marker);
    });
    setIsEditingNodes(true);
  }, [activeCol, updateCollection]);

  const exitNodeEdit = useCallback(() => {
    clearNodeMarkers();
    setIsEditingNodes(false);
  }, []);

  const handleUpdateNodeCoord = useCallback(
    (i: number, axis: 0 | 1, val: number) => {
      if (!activeCol) return;
      const newCoords = activeCol.coordinates.map((c, idx) =>
        idx === i ? (axis === 0 ? [val, c[1]] : [c[0], val]) as [number, number] : c
      ) as [number, number][];
      updateCollection(activeCol.id, { coordinates: newCoords });
      nodeMarkersRef.current[i]?.setLngLat(newCoords[i]);
    },
    [activeCol, updateCollection]
  );

  const handleAddNode = useCallback(() => {
    if (!activeCol) return;
    const last = activeCol.coordinates[activeCol.coordinates.length - 1];
    const newCoords = [
      ...activeCol.coordinates,
      [last[0] + 0.00005, last[1] + 0.00005] as [number, number],
    ] as [number, number][];
    updateCollection(activeCol.id, { coordinates: newCoords });
    exitNodeEdit();
    setTimeout(enterNodeEdit, 50);
  }, [activeCol, updateCollection, exitNodeEdit, enterNodeEdit]);

  const handleRemoveNode = useCallback(
    (i: number) => {
      if (!activeCol || activeCol.coordinates.length <= 2) return;
      const newCoords = activeCol.coordinates.filter((_, idx) => idx !== i) as [number, number][];
      updateCollection(activeCol.id, { coordinates: newCoords });
      exitNodeEdit();
      setTimeout(enterNodeEdit, 50);
    },
    [activeCol, updateCollection, exitNodeEdit, enterNodeEdit]
  );

  // ── Re-edit path via draw ──────────────────────────────────────────────────
  const handleStartReEdit = useCallback(() => {
    if (!activeCol || !drawRef.current) return;
    exitNodeEdit();
    setIsEditingPath(true);
    drawRef.current.deleteAll();
    drawRef.current.add({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: activeCol.coordinates },
    });
    const ids = drawRef.current.getAll().features.map((f: any) => f.id);
    if (ids.length > 0) {
      drawRef.current.changeMode('direct_select', { featureId: ids[0] });
    }
  }, [activeCol, exitNodeEdit]);

  // ── Item field update ──────────────────────────────────────────────────────
  const handleUpdateItem = useCallback(
    (collectionId: string, itemId: string, fields: Partial<StallItem>) => {
      const col = collections.find((c) => c.id === collectionId);
      if (!col) return;
      const newItems = col.items.map((it) =>
        it.id === itemId ? { ...it, ...fields } : it
      );
      updateCollection(collectionId, { items: newItems });
    },
    [collections, updateCollection]
  );

  // ── Select a lot ───────────────────────────────────────────────────────────
  const handleSelectLot = (id: string) => {
    setInspectingId(id);
    setIsEditingPath(false);
    exitNodeEdit();
    setMobileTab('props');
  };

  // ── Close inspector ────────────────────────────────────────────────────────
  const handleClose = () => {
    setInspectingId(null);
    setIsEditingPath(false);
    exitNodeEdit();
    setMobileTab('map');
  };

  // ── Delete collection ──────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!inspectingId) return;
    removeCollection(inspectingId);
    setInspectingId(null);
    exitNodeEdit();
    setMobileTab('map');
  };

  return (
    <div className="flex h-screen w-full bg-white font-mono text-[10px] uppercase antialiased overflow-hidden">

      <LotsExplorer
        collections={collections}
        inspectingId={inspectingId}
        mobileTab={mobileTab}
        onSelect={handleSelectLot}
      />

      <MapView
        collections={collections}
        inspectingId={inspectingId}
        isEditingPath={isEditingPath}
        isEditingNodes={isEditingNodes}
        onMapReady={handleMapReady}
        onDrawCreate={handleDrawCreate}
        onDrawUpdate={handleDrawUpdate}
      />

      {activeCol && (
        <PropertyConfig
          activeCol={activeCol}
          mobileTab={mobileTab}
          isEditingNodes={isEditingNodes}
          map={mapRef.current}
          onClose={handleClose}
          onUpdate={updateCollection}
          onUpdateItem={handleUpdateItem}
          onDelete={handleDelete}
          onStartReEdit={handleStartReEdit}
          onEnterNodeEdit={enterNodeEdit}
          onExitNodeEdit={exitNodeEdit}
          onUpdateNodeCoord={handleUpdateNodeCoord}
          onAddNode={handleAddNode}
          onRemoveNode={handleRemoveNode}
        />
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t-4 border-black flex z-50">
        {(['lots', 'map', 'props'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 font-black text-[9px] uppercase tracking-wider
              border-r-2 last:border-0 border-black
              ${mobileTab === tab ? 'bg-yellow-400' : 'bg-white'}`}
          >
            {tab === 'lots' ? '☰ LOTS' : tab === 'map' ? '⬛ MAP' : '⚙ PROPS'}
          </button>
        ))}
      </div>
    </div>
  );
}