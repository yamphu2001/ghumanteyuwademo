"use client";

import { useEffect, useRef } from 'react';
import { LOCATIONS } from './markers';

export const LocationMarkers = ({ map }: { map: any }) => {
  const layersAddedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const setupLayers = () => {
      // Prevent duplicate sources/layers
      if (map.getSource('locations') || layersAddedRef.current) return;

      map.addSource('locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: LOCATIONS.map(loc => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: loc.coords },
            properties: { name: loc.name }
          }))
        }
      });

      // Red Circle Marker
      map.addLayer({
        id: 'location-circles',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-radius': 8,
          'circle-color': '#fe4f4f',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Text Labels
      map.addLayer({
        id: 'location-labels',
        type: 'symbol',
        source: 'locations',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 1,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#0B0E14',
          'text-halo-width': 2
        }
      });

      layersAddedRef.current = true;
    };

    // Trigger setup
    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.on('style.load', setupLayers);
    }

    return () => {
      if (map && map.getLayer('location-circles')) {
        map.removeLayer('location-circles');
        map.removeLayer('location-labels');
        map.removeSource('locations');
        layersAddedRef.current = false;
      }
    };
  }, [map]);

  return null;
};