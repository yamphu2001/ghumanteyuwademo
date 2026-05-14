"use client";

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';

import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { StallCollection, ShapeType, SidePlacement } from '../store';

interface Props {
  collections: StallCollection[];
  inspectingId: string | null;
  isEditingPath: boolean;
  isEditingNodes: boolean;
  // Passed up so page.tsx can wire node-marker dragging
  onMapReady: (map: maplibregl.Map, draw: any) => void;
  onDrawCreate: (coords: [number, number][]) => void;
  onDrawUpdate: (coords: [number, number][]) => void;
}

export default function MapView({
  collections,
  inspectingId,
  isEditingPath,
  isEditingNodes,
  onMapReady,
  onDrawCreate,
  onDrawUpdate,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<any>(null);

  // Stable refs so handlers never go stale
  const isEditingPathRef = useRef(false);
  const inspectingIdRef = useRef<string | null>(null);
  const onDrawCreateRef = useRef(onDrawCreate);
  const onDrawUpdateRef = useRef(onDrawUpdate);

  useEffect(() => { isEditingPathRef.current = isEditingPath; }, [isEditingPath]);
  useEffect(() => { inspectingIdRef.current = inspectingId; }, [inspectingId]);
  useEffect(() => { onDrawCreateRef.current = onDrawCreate; }, [onDrawCreate]);
  useEffect(() => { onDrawUpdateRef.current = onDrawUpdate; }, [onDrawUpdate]);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [85.31158415535421, 27.70335368590655],
      zoom: 19,
      pitch: 50,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { line_string: true, trash: true },
      styles: [
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString']],
          paint: { 'line-color': '#facc15', 'line-width': 6 },
        },
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 8,
            'circle-color': '#000',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        },
      ],
    });
    map.addControl(draw as unknown as maplibregl.IControl, 'top-right');
    mapRef.current = map;
    drawRef.current = draw;

    map.on('load', () => onMapReady(map, draw));

    const handleCreate = (e: any) => {
      const feat = e.features[0];
      if (!feat) return;
      if (isEditingPathRef.current && inspectingIdRef.current) {
        onDrawUpdateRef.current(feat.geometry.coordinates);
        draw.deleteAll();
      } else {
        onDrawCreateRef.current(feat.geometry.coordinates);
        draw.deleteAll();
      }
    };

    const handleUpdate = (e: any) => {
      const feat = e.features[0];
      if (!feat) return;
      if (isEditingPathRef.current && inspectingIdRef.current) {
        onDrawUpdateRef.current(feat.geometry.coordinates);
        draw.deleteAll();
      }
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync 3D extrusion layer whenever collections change ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const features = collections.flatMap((col) => {
      if (col.id === inspectingId && isEditingPath) return [];
      if (col.coordinates.length < 2) return [];

      let line = turf.lineString(col.coordinates);
      if (col.isCurved && col.coordinates.length > 2) line = turf.bezierSpline(line);

      const totalLen = turf.length(line, { units: 'meters' });
      const step = col.width + col.gap;
      const shapeType: ShapeType = col.shapeType ?? 'rect';
      const side: SidePlacement = col.side ?? 'left';
      const offset: number = col.offset ?? 0;

      return col.items.map((item, i) => {
        const dist = i * step;
        if (dist + col.width > totalLen) return null;

        const p1 = turf.along(line, dist, { units: 'meters' });
        const p2 = turf.along(line, dist + 0.1, { units: 'meters' });
        const baseBearing = turf.bearing(p1, p2);
        const angle = ((baseBearing + (item.rotation || 0)) * Math.PI) / 180;
        const perp = angle + Math.PI / 2;

        const halfLen = col.length / 2;
        let sideOff = 0;
        if (side === 'left') sideOff = -halfLen - offset;
        else if (side === 'right') sideOff = halfLen + offset;
        else sideOff = -offset;

        const getPt = (a: number, p: number) => [
          p1.geometry.coordinates[0] + (a * Math.sin(angle) + p * Math.sin(perp)) / 111320,
          p1.geometry.coordinates[1] + (a * Math.cos(angle) + p * Math.cos(perp)) / 110540,
        ];

        let poly: any;

        if (shapeType === 'circle' || shapeType === 'hexagon') {
          const segments = shapeType === 'circle' ? 24 : 6;
          const r = Math.min(col.width, col.length) / 2;
          const cx =
            p1.geometry.coordinates[0] +
            ((col.width / 2) * Math.sin(angle) + sideOff * Math.sin(perp)) / 111320;
          const cy =
            p1.geometry.coordinates[1] +
            ((col.width / 2) * Math.cos(angle) + sideOff * Math.cos(perp)) / 110540;
          const pts: number[][] = [];
          for (let s = 0; s <= segments; s++) {
            const a = (s / segments) * 2 * Math.PI;
            pts.push([cx + (r * Math.cos(a)) / 111320, cy + (r * Math.sin(a)) / 110540]);
          }
          poly = turf.polygon([pts]);
        } else {
          poly = turf.polygon([[
            getPt(0, sideOff),
            getPt(col.width, sideOff),
            getPt(col.width, sideOff + col.length),
            getPt(0, sideOff + col.length),
            getPt(0, sideOff),
          ]]);
        }

        let color = col.baseColor;
        if (col.colorMode === 'random' || col.colorMode === 'individual') color = item.color;
        poly.properties = { color, height: col.height };
        return poly;
      }).filter(Boolean);
    });

    const source = map.getSource('stalls') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(turf.featureCollection(features as any));
    } else {
      map.addSource('stalls', {
        type: 'geojson',
        data: turf.featureCollection(features as any),
      });
      map.addLayer({
        id: 'stalls-3d',
        type: 'fill-extrusion',
        source: 'stalls',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 1,
        },
      });
    }
  }, [collections, inspectingId, isEditingPath]);

  return (
    <div className="flex-1 relative border-r-4 border-black max-md:border-r-0">
      <style jsx global>{`
        .mapboxgl-ctrl-group button { pointer-events: auto !important; cursor: pointer !important; }
        .mapboxgl-ctrl-top-right { z-index: 50 !important; pointer-events: auto !important; }
      `}</style>
      <div ref={mapContainer} className="h-full w-full" />
      {isEditingPath && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-black p-4 z-50 font-black animate-pulse text-[10px] uppercase">
          PATH_EDIT_MODE: DRAG NODES OR CLICK LINE TO SELECT
        </div>
      )}
      {isEditingNodes && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-black p-4 z-50 font-black animate-pulse text-[10px] uppercase">
          NODE_EDIT_MODE: DRAG YELLOW MARKERS ON MAP
        </div>
      )}
    </div>
  );
}