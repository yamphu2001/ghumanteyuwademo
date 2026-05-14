'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface BoundaryPoint {
  lat: number;
  lng: number;
}

interface ServiceData {
  id: string;
  name: string;
  color: string;
  height: number;
  boundary: BoundaryPoint[];
  markerImage: string;
  popupImage: string;
  text?: string;
}

interface Props {
  map: maplibregl.Map | null;
  services: ServiceData[];
}

export default function ServiceBoundaries({ map, services }: Props) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || !services.length) {
      markersRef.current.forEach(m => m.remove());
      return;
    }

    // Clean up previous markers before re-rendering
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    services.forEach((service) => {
      const sourceId = `source-${service.id}`;
      const layerId = `layer-${service.id}`;

      // 1. 3D Extrusion Logic
      const formattedCoords = service.boundary.map(p => [p.lng, p.lat]);

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [formattedCoords] },
            properties: {
              name: service.name,
              popupImage: service.popupImage,
              text: service.text || 'No description available.'
            }
          }
        });

        map.addLayer({
          id: layerId,
          type: 'fill-extrusion',
          source: sourceId,
          paint: {
            'fill-extrusion-color': service.color || '#0a0a0a',
            'fill-extrusion-height': service.height || 10,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
          }
        });

        // Click handler for the 3D shape
        map.on('click', layerId, (e) => {
          const props = e.features?.[0].properties;
          if (!props) return;

          const popupHTML = `
            <div class="fullscreen-inner">
              <div class="popup-card">
                 <button class="close-btn" onclick="this.closest('.maplibregl-popup').remove()">×</button>
                 <h2 class="popup-title">${props.name}</h2>
                 <div class="img-container">
                    <img src="${props.popupImage}" alt="${props.name}" />
                 </div>
                 <p class="popup-text">${props.text}</p>
              </div>
            </div>
          `;

          new maplibregl.Popup({
            offset: 25,
            className: 'fullscreen-popup',
            maxWidth: 'none'
          })
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map);
        });

        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
      }

      // 2. Marker Creation Logic
      // Check if image exists - fixes the empty bubble issue in image_47653d.png
      if (!service.markerImage || service.markerImage.trim() === "") {
        return; 
      }

      // Centroid Calculation
      const latSum = service.boundary.reduce((sum, p) => sum + p.lat, 0);
      const lngSum = service.boundary.reduce((sum, p) => sum + p.lng, 0);
      const centerLat = latSum / service.boundary.length;
      const centerLng = lngSum / service.boundary.length;

      // Container for the Teardrop
      const el = document.createElement('div');
      el.style.width = '52px';
      el.style.height = '52px';
      el.style.cursor = 'pointer';
      el.style.backgroundColor = 'white';
      el.style.borderRadius = '50% 50% 50% 0'; // Creates the teardrop point
      el.style.transform = 'rotate(-45deg)';    // Points the sharp tip down
      el.style.display = 'flex';
      el.style.justifyContent = 'center';
      el.style.alignItems = 'center';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      el.style.border = '1px solid rgba(0,0,0,0.1)';

      // Inner Image (Kept straight)
      const imgInner = document.createElement('div');
      imgInner.style.backgroundImage = `url(${service.markerImage})`;
      imgInner.style.width = '42px';
      imgInner.style.height = '42px';
      imgInner.style.backgroundSize = 'cover';
      imgInner.style.backgroundPosition = 'center';
      imgInner.style.borderRadius = '50%';
      // Counter-rotate the image so it is upright
      imgInner.style.transform = 'rotate(45deg)'; 

      el.appendChild(imgInner);

      const markerPopupHTML = `
        <div class="fullscreen-inner">
          <div class="popup-card">
             <button class="close-btn" onclick="this.closest('.maplibregl-popup').remove()">×</button>
             <h2 class="popup-title">${service.name}</h2>
             <div class="img-container">
                <img src="${service.popupImage}" alt="${service.name}" />
             </div>
             <p class="popup-text">${service.text || 'No description available.'}</p>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom' // Tip of teardrop touches the coordinate
      })
        .setLngLat([centerLng, centerLat])
        .setPopup(new maplibregl.Popup({
          offset: [0, -45],
          className: 'fullscreen-popup',
          maxWidth: 'none'
        }).setHTML(markerPopupHTML))
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Cleanup function: runs when services change or component unmounts
    // Cleanup function: runs when services change or component unmounts
    return () => {
      // FIX: Ensure map still exists before attempting to access its methods
      if (!map) return;

      services.forEach(service => {
        const layerId = `layer-${service.id}`;
        const sourceId = `source-${service.id}`;

        // Double check if the map instance is still valid and has the layer/source
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch (error) {
          console.warn("Error during map cleanup:", error);
        }
      });

      markersRef.current.forEach(m => m.remove());
    };
  }, [map, services]);

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      .fullscreen-popup.maplibregl-popup {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        transform: none !important;
        z-index: 9999 !important;
        margin: 0 !important;
      }
      .fullscreen-popup .maplibregl-popup-content {
        background: rgba(0, 0, 0, 0.85) !important;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
      }
      .fullscreen-popup .maplibregl-popup-tip { display: none !important; }
      .fullscreen-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; }
      .popup-card {
        background: white; width: 90%; max-width: 500px; border-radius: 20px; padding: 30px;
        position: relative; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .popup-title { margin: 0 0 20px 0; font-size: 24px; color: #1a1a1a; font-family: sans-serif; }
      .img-container img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; }
      .popup-text { font-size: 16px; color: #444; line-height: 1.5; margin: 0; font-family: sans-serif; }
      .close-btn {
        position: absolute; top: 15px; right: 15px; background: #f0f0f0; border: none; font-size: 24px;
        width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
    `}} />
  );
}