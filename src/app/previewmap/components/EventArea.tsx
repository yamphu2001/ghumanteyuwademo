'use client';

import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface BoundaryCoord {
  lat: number;
  lng: number;
}

interface Props {
  map: maplibregl.Map | null;
  boundaryCoords: BoundaryCoord[];
}

export default function EventArea({ map, boundaryCoords }: Props) {
  useEffect(() => {
    if (!map) return;

    if (!map.getSource('event-area')) {
      map.addSource('event-area', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // The "Mask" Layer - This darkens the outside
      map.addLayer({
        id: 'event-mask',
        type: 'fill',
        source: 'event-area',
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0.6 // Adjust darkness here (0.1 to 1.0)
        }
      });

      // The Outline Layer - To keep the blue border
      map.addLayer({
        id: 'event-outline',
        type: 'line',
        source: 'event-area',
        paint: {
          'line-color': '#2563eb',
          'line-width': 3
        }
      });
    }

    if (boundaryCoords && boundaryCoords.length > 0) {
      const innerCoords = boundaryCoords.map(coord => [coord.lng, coord.lat]);
      
      // Ensure the polygon is closed (last point must match first)
      if (innerCoords[0] !== innerCoords[innerCoords.length - 1]) {
        innerCoords.push(innerCoords[0]);
      }

      // WORLD MASK LOGIC:
      // Ring 1: Huge square covering the entire world map
      // Ring 2: Your event boundary (acts as a hole in the square)
      const worldOuter = [
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
        [-180, 90]
      ];

      const source = map.getSource('event-area') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            // Coordinates is an array of arrays: [OuterRing, Hole1, Hole2...]
            coordinates: [worldOuter, innerCoords] 
          },
          properties: {}
        });
      }
    }
  }, [map, boundaryCoords]);

  return null;
}