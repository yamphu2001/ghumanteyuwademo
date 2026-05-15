
'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useMapInit = (mapContainer: React.RefObject<HTMLDivElement | null>, eventId: string) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || isInitializing.current || mapRef.current) return;
    isInitializing.current = true;

    const initMap = async () => {
      let center: [number, number] = [85.3076, 27.7042];
      let boundary: [number, number][] = [];

      try {
        const snap = await getDoc(doc(db, "events", eventId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.lng && data.lat) center = [data.lng, data.lat];
          if (data.boundaryCoords) boundary = data.boundaryCoords.map((p: any) => [p.lng, p.lat]);
        }
      } catch (e) {
        console.error("Firebase fetch error:", e);
      }

      const mapInstance = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: center,
        zoom: 16,
        minZoom: 14, 
        maxZoom: 20,
        pitch: 60,
      
      });

      mapInstance.on('load', () => {
        const layers = mapInstance.getStyle().layers;
        const poiKeywords = ['poi', 'shop', 'food', 'hospital', 'medical', 'pharmacy', 'retail', 'commercial', 'amenity'];

        if (layers) {
          layers.forEach((layer) => {
            const l = layer as any;
            const sourceLayer = l['source-layer'] || '';

            const isPoiLayer = poiKeywords.some(keyword => 
              layer.id.toLowerCase().includes(keyword) || 
              sourceLayer.toLowerCase().includes(keyword)
            );

            if (isPoiLayer) {
              mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          });
        }

        if (boundary.length > 0) {
            mapInstance.addSource('mask-src', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[-180, 90], [-180, -90], [180, -90], [180, 90], [-180, 90]], boundary]
                    }
                } as any
            });
            mapInstance.addLayer({
                id: 'boundary-mask-layer',
                type: 'fill',
                source: 'mask-src',
                paint: { 'fill-color': '#0B0E14', 'fill-opacity': 0.8 }
            });
        }

        mapRef.current = mapInstance;
        setIsLoaded(true);
        isInitializing.current = false;
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isInitializing.current = false;
    };
  }, [eventId]); 

  return { map: mapRef, isLoaded };
};

