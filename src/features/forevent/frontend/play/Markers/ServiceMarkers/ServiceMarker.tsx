
// 'use client';

// import React, { useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// import { db } from "@/lib/firebase";
// import { doc, onSnapshot } from "firebase/firestore";

// // --- INTERFACES ---
// interface BoundaryPoint { lng: number; lat: number; }

// interface ServiceConfig {
//   id: string;
//   name: string;
//   text: string;
//   color: string;
//   boundary: BoundaryPoint[];
//   status: "active" | "inactive";
//   markerImage?: string;
//   popupImage?: string;
//   height?: number;
// }

// // --- POPUP BUILDER HELPER ---
// function buildPopupNode(config: ServiceConfig): HTMLElement {
//   const popupNode = document.createElement('div');
//   popupNode.style.minWidth = "220px";
//   popupNode.style.fontFamily = "Inter, system-ui, sans-serif";
//   popupNode.innerHTML = `
//     <div style="background: #ffffff; color: #000000; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 42px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.08);">
//       ${config.popupImage
//       ? `<img src="${config.popupImage}" style="width:100%; height:180px; object-fit:cover; display:block;" onerror="this.style.display='none'" />`
//       : `<div style="width:100%; height: 10px; background: ${config.color || '#dc2626'};"></div>`
//     }
//       <div style="padding: 20px; display:flex; flex-direction:column; gap: 14px;">
//         <div style="display:flex; align-items:center; gap: 10px;">
//           <span style="display:inline-block;width:10px;height:10px;background:${config.color || '#dc2626'};border-radius:999px;"></span>
//           <strong style="font-size: 18px; color: #000000; line-height:1.2;">${config.name}</strong>
//         </div>
//         ${config.text ? `<p style="margin:0; color:#000000; font-size:14px; line-height:1.6;">${config.text}</p>` : ''}
//       </div>
//     </div>
//   `;
//   return popupNode;
// }

// // --- SINGLE 3D BOUNDARY COMPONENT ---
// function SingleBoundary({ map, config }: { map: maplibregl.Map; config: ServiceConfig }) {
//   const markerRef = useRef<maplibregl.Marker | null>(null);
//   const popupRef = useRef<HTMLElement | null>(null);

//   useEffect(() => {
//     if (!map || !config.boundary || config.boundary.length === 0) return;

//     const sourceId = `source-${config.id}`;
//     const layerId = `layer-${config.id}`;

//     const removeCurrentPopup = () => {
//       if (popupRef.current) {
//         try { if (document.body.contains(popupRef.current)) document.body.removeChild(popupRef.current); } catch (e) { }
//         popupRef.current = null;
//       }
//     };

//     const openFloatingPopupAt = (_lngLat: { lng: number; lat: number }) => {
//       removeCurrentPopup();
//       const bodyPopup = document.createElement('div');
//       bodyPopup.className = 'floating-map-popup';
//       bodyPopup.style.position = 'fixed';
//       bodyPopup.style.inset = '0';
//       bodyPopup.style.display = 'flex';
//       bodyPopup.style.justifyContent = 'center';
//       bodyPopup.style.alignItems = 'center';
//       bodyPopup.style.padding = '24px';
//       bodyPopup.style.pointerEvents = 'auto';
//       bodyPopup.style.background = 'rgba(0, 0, 0, 0.65)';
//       bodyPopup.style.zIndex = '10060';

//       const content = buildPopupNode(config);
//       content.style.margin = '0';
//       content.style.position = 'relative';
//       content.style.width = 'min(92vw, 520px)';
//       content.style.maxWidth = '520px';
//       content.style.boxSizing = 'border-box';

//       const closeBtn = document.createElement('button');
//       closeBtn.textContent = '✕';
//       closeBtn.style.position = 'absolute';
//       closeBtn.style.top = '14px';
//       closeBtn.style.right = '14px';
//       closeBtn.style.background = 'rgba(255,255,255,0.95)';
//       closeBtn.style.border = '1px solid rgba(148,163,184,0.4)';
//       closeBtn.style.borderRadius = '999px';
//       closeBtn.style.padding = '8px 10px';
//       closeBtn.style.cursor = 'pointer';
//       closeBtn.style.fontSize = '14px';
//       closeBtn.style.lineHeight = '1';
//       closeBtn.style.zIndex = '10061';

//       content.appendChild(closeBtn);
//       bodyPopup.appendChild(content);
//       document.body.appendChild(bodyPopup);

//       bodyPopup.addEventListener('click', (ev) => {
//         if (ev.target === bodyPopup) removeCurrentPopup();
//       });

//       closeBtn.addEventListener('click', (ev) => { 
//         ev.stopPropagation(); 
//         removeCurrentPopup(); 
//       });

//       popupRef.current = bodyPopup;
//     };

//     const baseCoords = config.boundary.map(p => [p.lng, p.lat]);
//     const coords = [...baseCoords];
//     if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
//       coords.push(coords[0]);
//     }

//     const geojson: GeoJSON.Feature = {
//       type: "Feature",
//       geometry: { type: "Polygon", coordinates: [coords] },
//       properties: { name: config.name, description: config.text }
//     };

//     const onLayerClick = (e: any) => {
//       let popupLngLat = e.lngLat;
//       try {
//         const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
//         if (features && features.length > 0) {
//           const geom: any = features[0].geometry;
//           if (geom && geom.type === 'Polygon' && Array.isArray(geom.coordinates[0])) {
//             const ring: number[][] = geom.coordinates[0];
//             const avg = ring.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
//             const len = ring.length || 1;
//             popupLngLat = { lng: avg[0] / len, lat: avg[1] / len } as any;
//           }
//         }
//       } catch (err) { }
//       openFloatingPopupAt(popupLngLat);
//     };

//     const onMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
//     const onMouseLeave = () => { map.getCanvas().style.cursor = ''; };

//     if (map.getSource(sourceId)) {
//       (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
//     } else {
//       map.addSource(sourceId, { type: 'geojson', data: geojson });
//       map.addLayer({
//         id: layerId,
//         type: 'fill-extrusion',
//         source: sourceId,
//         paint: {
//           'fill-extrusion-color': config.color || "#3b82f6",
//           'fill-extrusion-height': config.height || 15,
//           'fill-extrusion-base': 0,
//           'fill-extrusion-opacity': 0.7
//         }
//       });
//       map.on('click', layerId, onLayerClick);
//       map.on('mouseenter', layerId, onMouseEnter);
//       map.on('mouseleave', layerId, onMouseLeave);
//     }

//     const lngSum = baseCoords.reduce((acc, curr) => acc + curr[0], 0);
//     const latSum = baseCoords.reduce((acc, curr) => acc + curr[1], 0);
//     const centerCount = baseCoords.length || 1;
//     const center: [number, number] = [lngSum / centerCount, latSum / centerCount];

//     // --- LOGIC: ONLY CREATE HTML MARKERS IF IMAGE EXISTS ---
//     const hasImage = config.markerImage && config.markerImage.trim() !== "" && config.markerImage !== "null";
    
//     let topMarkerEl: HTMLDivElement | null = null;
//     let topUpdate: (() => void) | null = null;

//     if (hasImage) {
//       // Bottom Image Marker
//       const el = document.createElement('div');
//       el.style.cursor = 'pointer';
//       el.style.zIndex = "1";
//       el.innerHTML = `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.style.display='none';" />`;
//       el.addEventListener('click', (ev) => {
//         ev.stopPropagation();
//         openFloatingPopupAt({ lng: center[0], lat: center[1] });
//       });
//       markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);

//       // Top Floating Image Marker (Bubble)
//       if (config.height && config.height > 0) {
//         topMarkerEl = document.createElement('div');
//         topMarkerEl.style.position = 'absolute';
//         topMarkerEl.style.zIndex = '1';
//         topMarkerEl.style.cursor = 'pointer';
//         topMarkerEl.innerHTML = `
//           <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
//             <div style="width:34px;height:28px;border-radius:8px;overflow:hidden;background:white;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
//               <img src="${config.markerImage}" style="width:100%;height:100%;object-fit:cover;display:block;" />
//             </div>
//             <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${config.color};margin-top:-3px;"></div>
//           </div>`;
//         document.body.appendChild(topMarkerEl);

//         topUpdate = () => {
//           if (!map || !topMarkerEl) return;
//           try {
//             const p = map.project([center[0], center[1]]);
//             const mapRect = (map.getContainer() as HTMLElement).getBoundingClientRect();
//             const metersPerPixel = 156543.03392 * Math.cos(center[1] * Math.PI / 180) / Math.pow(2, map.getZoom());
//             const pxHeight = (config.height || 0) / metersPerPixel;
//             topMarkerEl.style.left = Math.round(mapRect.left + p.x) + 'px';
//             topMarkerEl.style.top = Math.round(mapRect.top + p.y - pxHeight) + 'px';
//             topMarkerEl.style.transform = 'translate(-50%, -50%)';
//           } catch (e) {}
//         };
//         map.on('move', topUpdate);
//         map.on('resize', topUpdate);
//         map.on('zoom', topUpdate);
//         topUpdate();

//         topMarkerEl.addEventListener('click', (ev) => {
//           ev.stopPropagation();
//           openFloatingPopupAt({ lng: center[0], lat: center[1] });
//         });
//       }
//     }

//     return () => {
//       removeCurrentPopup();
//       const isMapValid = map && typeof map.getLayer === 'function' && map.getStyle();
//       if (isMapValid) {
//         try {
//           map.off('click', layerId, onLayerClick);
//           map.off('mouseenter', layerId, onMouseEnter);
//           map.off('mouseleave', layerId, onMouseLeave);
//           if (map.getLayer(layerId)) map.removeLayer(layerId);
//           if (map.getSource(sourceId)) map.removeSource(sourceId);
//         } catch (e) { }
//         if (topUpdate) {
//           map.off('move', topUpdate);
//           map.off('resize', topUpdate);
//           map.off('zoom', topUpdate);
//         }
//       }
//       if (markerRef.current) { 
//         markerRef.current.remove(); 
//         markerRef.current = null; 
//       }
//       if (topMarkerEl && document.body.contains(topMarkerEl)) { 
//         document.body.removeChild(topMarkerEl); 
//       }
//     };
//   }, [map, config]);

//   return null;
// }

// // --- POINT MARKER COMPONENT ---
// function SinglePointMarker({ map, config }: { map: maplibregl.Map; config: ServiceConfig }) {
//   const markerRef = useRef<maplibregl.Marker | null>(null);
//   const popupRef = useRef<HTMLElement | null>(null);

//   useEffect(() => {
//     if (!map || !config.boundary || config.boundary.length === 0) return;
    
//     // Skip entirely if no image for point markers (they don't have 3D shapes)
//     const hasImage = config.markerImage && config.markerImage.trim() !== "" && config.markerImage !== "null";
//     if (!hasImage) return;

//     const lngSum = config.boundary.reduce((acc, p) => acc + p.lng, 0);
//     const latSum = config.boundary.reduce((acc, p) => acc + p.lat, 0);
//     const count = config.boundary.length || 1;
//     const center: [number, number] = [lngSum / count, latSum / count];

//     const removeCurrentPopup = () => {
//       if (popupRef.current) {
//         try { if (document.body.contains(popupRef.current)) document.body.removeChild(popupRef.current); } catch(e) {}
//         popupRef.current = null;
//       }
//     };

//     const el = document.createElement('div');
//     el.style.cursor = 'pointer';
//     el.innerHTML = `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.style.display='none';" />`;

//     el.addEventListener('click', (ev) => {
//       ev.stopPropagation();
//       removeCurrentPopup();
//       const bodyPopup = document.createElement('div');
//       bodyPopup.style.position = 'fixed';
//       bodyPopup.style.inset = '0';
//       bodyPopup.style.display = 'flex';
//       bodyPopup.style.justifyContent = 'center';
//       bodyPopup.style.alignItems = 'center';
//       bodyPopup.style.background = 'rgba(0, 0, 0, 0.65)';
//       bodyPopup.style.zIndex = '10060';
//       const content = buildPopupNode(config);
//       content.style.position = 'relative';
//       const closeBtn = document.createElement('button');
//       closeBtn.textContent = '✕';
//       closeBtn.style.position = 'absolute';
//       closeBtn.style.top = '14px';
//       closeBtn.style.right = '14px';
//       closeBtn.style.background = 'white';
//       closeBtn.style.borderRadius = '50%';
//       closeBtn.style.border = '1px solid #ccc';
//       closeBtn.style.padding = '5px 8px';
//       closeBtn.style.cursor = 'pointer';
//       content.appendChild(closeBtn);
//       bodyPopup.appendChild(content);
//       document.body.appendChild(bodyPopup);
//       popupRef.current = bodyPopup;
//       closeBtn.onclick = removeCurrentPopup;
//       bodyPopup.onclick = (e) => { if(e.target === bodyPopup) removeCurrentPopup(); };
//     });

//     markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);

//     return () => {
//       removeCurrentPopup();
//       if (markerRef.current) markerRef.current.remove();
//     };
//   }, [map, config]);

//   return null;
// }

// // --- MAIN WRAPPER ---
// export default function ServiceMarkers({ map, eventId }: { map: any; eventId: string }) {
//   const [services, setServices] = useState<ServiceConfig[]>([]);

//   const mapInstance: maplibregl.Map | null = (() => {
//     if (!map) return null;
//     if (typeof (map as any).getLayer === 'function') return map as maplibregl.Map;
//     if (map.current && typeof map.current.getLayer === 'function') return map.current;
//     return null;
//   })();

//   useEffect(() => {
//     if (!eventId) return;
//     const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
//       if (!snap.exists()) return;
//       const data = snap.data();
//       if (Array.isArray(data.serviceBoundaries)) {
//         setServices(data.serviceBoundaries.filter((s: ServiceConfig) => s.status === "active"));
//       }
//     });
//     return () => unsub();
//   }, [eventId]);

//   if (!mapInstance) return null;

//   return (
//     <>
//       {services.map((service) =>
//         service.boundary && service.boundary.length >= 3
//           ? <SingleBoundary key={service.id} map={mapInstance} config={service} />
//           : <SinglePointMarker key={service.id} map={mapInstance} config={service} />
//       )}
//     </>
//   );
// }



'use client';

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// --- INTERFACES ---
interface BoundaryPoint { lng: number; lat: number; }

interface ServiceConfig {
  id: string;
  name: string;
  text: string;
  color: string;
  boundary: BoundaryPoint[];
  status: "active" | "inactive";
  markerImage?: string;
  popupImage?: string;
  height?: number;
}

// --- POPUP BUILDER HELPER ---
function buildPopupNode(config: ServiceConfig): HTMLElement {
  const popupNode = document.createElement('div');
  // Updated for mobile: Use max-width and flexible min-width
  popupNode.style.width = "100%";
  popupNode.style.maxWidth = "450px"; 
  popupNode.style.fontFamily = "Inter, system-ui, sans-serif";
  
  popupNode.innerHTML = `
    <div style="background: #ffffff; color: #000000; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(0,0,0,0.05); margin: 0 10px;">
      ${config.popupImage
      ? `<img src="${config.popupImage}" style="width:100%; height: auto; max-height: 35vh; object-fit:cover; display:block;" onerror="this.style.display='none'" />`
      : `<div style="width:100%; height: 8px; background: ${config.color || '#dc2626'};"></div>`
    }
      <div style="padding: 16px; display:flex; flex-direction:column; gap: 10px;">
        <div style="display:flex; align-items:center; gap: 8px;">
          <span style="display:inline-block;width:8px;height:8px;background:${config.color || '#dc2626'};border-radius:50%;"></span>
          <strong style="font-size: 16px; color: #000000; line-height:1.2;">${config.name}</strong>
        </div>
        ${config.text ? `<p style="margin:0; color:#444; font-size:13px; line-height:1.5; max-height: 120px; overflow-y: auto;">${config.text}</p>` : ''}
      </div>
    </div>
  `;
  return popupNode;
}

// --- SINGLE 3D BOUNDARY COMPONENT ---
function SingleBoundary({ map, config }: { map: maplibregl.Map; config: ServiceConfig }) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!map || !config.boundary || config.boundary.length === 0) return;

    const sourceId = `source-${config.id}`;
    const layerId = `layer-${config.id}`;

    const removeCurrentPopup = () => {
      if (popupRef.current) {
        try { if (document.body.contains(popupRef.current)) document.body.removeChild(popupRef.current); } catch (e) { }
        popupRef.current = null;
      }
    };

    const openFloatingPopupAt = (_lngLat: { lng: number; lat: number }) => {
      removeCurrentPopup();
      const bodyPopup = document.createElement('div');
      bodyPopup.className = 'floating-map-popup';
      bodyPopup.style.position = 'fixed';
      bodyPopup.style.inset = '0';
      bodyPopup.style.display = 'flex';
      bodyPopup.style.justifyContent = 'center';
      bodyPopup.style.alignItems = 'center';
      bodyPopup.style.padding = '16px'; // Responsive padding
      bodyPopup.style.pointerEvents = 'auto';
      bodyPopup.style.background = 'rgba(0, 0, 0, 0.7)';
      bodyPopup.style.zIndex = '10060';

      const content = buildPopupNode(config);
      content.style.margin = '0';
      content.style.position = 'relative';
      content.style.width = '100%';
      content.style.maxWidth = '420px'; // Cap for tablets/desktop

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '-10px';
      closeBtn.style.right = '0px';
      closeBtn.style.background = '#fff';
      closeBtn.style.color = '#000';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '50%';
      // Larger touch target for mobile (44px is standard)
      closeBtn.style.width = '36px';
      closeBtn.style.height = '36px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '16px';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      closeBtn.style.zIndex = '10061';

      content.appendChild(closeBtn);
      bodyPopup.appendChild(content);
      document.body.appendChild(bodyPopup);

      bodyPopup.addEventListener('click', (ev) => {
        if (ev.target === bodyPopup) removeCurrentPopup();
      });

      closeBtn.addEventListener('click', (ev) => { 
        ev.stopPropagation(); 
        removeCurrentPopup(); 
      });

      popupRef.current = bodyPopup;
    };

    const baseCoords = config.boundary.map(p => [p.lng, p.lat]);
    const coords = [...baseCoords];
    if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
      coords.push(coords[0]);
    }

    const geojson: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coords] },
      properties: { name: config.name, description: config.text }
    };

    const onLayerClick = (e: any) => {
      let popupLngLat = e.lngLat;
      try {
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features && features.length > 0) {
          const geom: any = features[0].geometry;
          if (geom && geom.type === 'Polygon' && Array.isArray(geom.coordinates[0])) {
            const ring: number[][] = geom.coordinates[0];
            const avg = ring.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
            const len = ring.length || 1;
            popupLngLat = { lng: avg[0] / len, lat: avg[1] / len } as any;
          }
        }
      } catch (err) { }
      openFloatingPopupAt(popupLngLat);
    };

    const onMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const onMouseLeave = () => { map.getCanvas().style.cursor = ''; };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson });
      map.addLayer({
        id: layerId,
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': config.color || "#3b82f6",
          'fill-extrusion-height': config.height || 15,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7
        }
      });
      map.on('click', layerId, onLayerClick);
      map.on('mouseenter', layerId, onMouseEnter);
      map.on('mouseleave', layerId, onMouseLeave);
    }

    const lngSum = baseCoords.reduce((acc, curr) => acc + curr[0], 0);
    const latSum = baseCoords.reduce((acc, curr) => acc + curr[1], 0);
    const centerCount = baseCoords.length || 1;
    const center: [number, number] = [lngSum / centerCount, latSum / centerCount];

    const hasImage = config.markerImage && config.markerImage.trim() !== "" && config.markerImage !== "null";
    
    let topMarkerEl: HTMLDivElement | null = null;
    let topUpdate: (() => void) | null = null;

    if (hasImage) {
      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.style.zIndex = "1";
      el.innerHTML = `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.style.display='none';" />`;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openFloatingPopupAt({ lng: center[0], lat: center[1] });
      });
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);

      if (config.height && config.height > 0) {
        const container = map.getContainer();
        topMarkerEl = document.createElement('div');
        topMarkerEl.style.position = 'absolute';
        topMarkerEl.style.zIndex = '1';
        topMarkerEl.style.cursor = 'pointer';
        topMarkerEl.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
            <div style="width:34px;height:28px;border-radius:8px;overflow:hidden;background:white;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
              <img src="${config.markerImage}" style="width:100%;height:100%;object-fit:cover;display:block;" />
            </div>
            <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${config.color};margin-top:-3px;"></div>
          </div>`;
        
        container.appendChild(topMarkerEl);

        topUpdate = () => {
          if (!map || !topMarkerEl) return;
          try {
            const bounds = map.getBounds();
            const isVisible = bounds.contains([center[0], center[1]]);
            if (!isVisible) { topMarkerEl.style.display = 'none'; return; }

            const p = map.project([center[0], center[1]]);
            const metersPerPixel = 156543.03392 * Math.cos(center[1] * Math.PI / 180) / Math.pow(2, map.getZoom());
            const pxHeight = (config.height || 0) / metersPerPixel;
            
            topMarkerEl.style.display = 'block';
            topMarkerEl.style.left = Math.round(p.x) + 'px';
            topMarkerEl.style.top = Math.round(p.y - pxHeight) + 'px';
            topMarkerEl.style.transform = 'translate(-50%, -50%)';
          } catch (e) {}
        };
        map.on('move', topUpdate);
        map.on('resize', topUpdate);
        map.on('zoom', topUpdate);
        topUpdate();

        topMarkerEl.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openFloatingPopupAt({ lng: center[0], lat: center[1] });
        });
      }
    }

    return () => {
      removeCurrentPopup();
      const isMapValid = map && typeof map.getLayer === 'function' && map.getStyle();
      if (isMapValid) {
        try {
          map.off('click', layerId, onLayerClick);
          map.off('mouseenter', layerId, onMouseEnter);
          map.off('mouseleave', layerId, onMouseLeave);
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch (e) { }
        if (topUpdate) {
          map.off('move', topUpdate);
          map.off('resize', topUpdate);
          map.off('zoom', topUpdate);
        }
      }
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (topMarkerEl && topMarkerEl.parentNode) { topMarkerEl.parentNode.removeChild(topMarkerEl); }
    };
  }, [map, config]);

  return null;
}

// --- POINT MARKER COMPONENT ---
function SinglePointMarker({ map, config }: { map: maplibregl.Map; config: ServiceConfig }) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!map || !config.boundary || config.boundary.length === 0) return;
    
    const hasImage = config.markerImage && config.markerImage.trim() !== "" && config.markerImage !== "null";
    if (!hasImage) return;

    const lngSum = config.boundary.reduce((acc, p) => acc + p.lng, 0);
    const latSum = config.boundary.reduce((acc, p) => acc + p.lat, 0);
    const count = config.boundary.length || 1;
    const center: [number, number] = [lngSum / count, latSum / count];

    const removeCurrentPopup = () => {
      if (popupRef.current) {
        try { if (document.body.contains(popupRef.current)) document.body.removeChild(popupRef.current); } catch(e) {}
        popupRef.current = null;
      }
    };

    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    // Slightly larger icon for easier mobile tapping
    el.innerHTML = `<img src="${config.markerImage}" style="width:40px; height:40px; object-fit:contain; border-radius:8px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.style.display='none';" />`;

    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeCurrentPopup();
      const bodyPopup = document.createElement('div');
      bodyPopup.style.position = 'fixed';
      bodyPopup.style.inset = '0';
      bodyPopup.style.display = 'flex';
      bodyPopup.style.justifyContent = 'center';
      bodyPopup.style.alignItems = 'center';
      bodyPopup.style.padding = '16px';
      bodyPopup.style.background = 'rgba(0, 0, 0, 0.7)';
      bodyPopup.style.zIndex = '10060';
      
      const content = buildPopupNode(config);
      content.style.position = 'relative';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '-10px';
      closeBtn.style.right = '0px';
      closeBtn.style.background = 'white';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.border = 'none';
      closeBtn.style.width = '36px';
      closeBtn.style.height = '36px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      
      content.appendChild(closeBtn);
      bodyPopup.appendChild(content);
      document.body.appendChild(bodyPopup);
      popupRef.current = bodyPopup;
      closeBtn.onclick = removeCurrentPopup;
      bodyPopup.onclick = (e) => { if(e.target === bodyPopup) removeCurrentPopup(); };
    });

    markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);

    return () => {
      removeCurrentPopup();
      if (markerRef.current) markerRef.current.remove();
    };
  }, [map, config]);

  return null;
}

// --- MAIN WRAPPER ---
export default function ServiceMarkers({ map, eventId }: { map: any; eventId: string }) {
  const [services, setServices] = useState<ServiceConfig[]>([]);

  const mapInstance: maplibregl.Map | null = (() => {
    if (!map) return null;
    if (typeof (map as any).getLayer === 'function') return map as maplibregl.Map;
    if (map.current && typeof map.current.getLayer === 'function') return map.current;
    return null;
  })();

  useEffect(() => {
    if (!eventId) return;
    const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.serviceBoundaries)) {
        setServices(data.serviceBoundaries.filter((s: ServiceConfig) => s.status === "active"));
      }
    });
    return () => unsub();
  }, [eventId]);

  if (!mapInstance) return null;

  return (
    <>
      {services.map((service) =>
        service.boundary && service.boundary.length >= 3
          ? <SingleBoundary key={service.id} map={mapInstance} config={service} />
          : <SinglePointMarker key={service.id} map={mapInstance} config={service} />
      )}
    </>
  );
}