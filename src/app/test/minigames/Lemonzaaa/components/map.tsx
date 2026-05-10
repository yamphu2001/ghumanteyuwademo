"use client";
import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GEO_BOUNDARY } from './boundary';
import KeyboardPlayer from './KeyboardPlayer';
import LemonzaaMission from './LemonzaaMission';
import GameOverlay from './GameOverlay';
import DemoNotice from './DemoNotice';
import LocationMarkers from './LocationMarkers';


const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [playerPosition, setPlayerPosition] = useState<[number, number]>([85.3061, 27.7042]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return;

    const coords = (GEO_BOUNDARY.features[0].geometry as any).coordinates[0];
    const bounds = new LngLatBounds();
    coords.forEach((c: [number, number]) => bounds.extend(c));

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: playerPosition,
      zoom: 18,
      pitch: 45,
      maxBounds: bounds 
    });

    map.on('load', () => {
      // Inverted World Mask (Pure MapLibre logic)
      const worldMask = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]], 
            coords 
          ]
        }
      };

      map.addSource('mask', { type: 'geojson', data: worldMask as any });
      map.addLayer({
        id: 'mask-layer',
        type: 'fill',
        source: 'mask',
        paint: { 'fill-color': '#000000', 'fill-opacity': 1.0 }
      });
      
      setMapInstance(map);
    });

    return () => map.remove();
  }, []);

  const handlePositionChange = (newPos: [number, number]) => {
    setPlayerPosition(newPos);
    mapInstance?.setCenter(newPos); // Instant update for local development
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <GameOverlay />
      
      {/* NEW: Demo Disclaimer Ticker */}
      <DemoNotice /> 

      <div ref={mapContainer} className="h-full w-full absolute inset-0" />
      
      <LocationMarkers map={mapInstance} />
      <KeyboardPlayer 
        map={mapInstance} 
        position={playerPosition} 
        onPositionChange={handlePositionChange} 
      />
      <LemonzaaMission 
        map={mapInstance} 
        playerPosition={playerPosition} 
      />
    </div>
  );
};


export default MapPage;

