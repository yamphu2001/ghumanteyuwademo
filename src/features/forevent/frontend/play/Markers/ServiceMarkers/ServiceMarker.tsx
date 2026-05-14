
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
//       : `<div style="width:100%; height: 10px; background: #dc2626;"></div>`
//     }
//       <div style="padding: 20px; display:flex; flex-direction:column; gap: 14px;">
//         <div style="display:flex; align-items:center; gap: 10px;">
//           <span style="display:inline-block;width:10px;height:10px;background:#dc2626;border-radius:999px;"></span>
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
//   const popupRef = useRef<maplibregl.Popup | null>(null);

//   useEffect(() => {
//     if (!map || !config.boundary || config.boundary.length === 0) return;

//     const sourceId = `source-${config.id}`;
//     const layerId = `layer-${config.id}`;

//     const openFloatingPopupAt = (_lngLat: { lng: number; lat: number }) => {
//       if (popupRef.current) {
//         try { document.body.removeChild((popupRef as any).current); } catch (e) { }
//         (popupRef as any).current = null;
//       }

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

//       const removeBodyPopup = () => {
//         try { document.body.removeChild(bodyPopup); } catch (e) { }
//         (popupRef as any).current = null;
//       };

//       bodyPopup.addEventListener('click', (ev) => {
//         if (ev.target === bodyPopup) removeBodyPopup();
//       });

//       closeBtn.addEventListener('click', (ev) => { ev.stopPropagation(); removeBodyPopup(); });

//       (popupRef as any).current = bodyPopup;
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

//       map.on('click', layerId, (e) => {
//         let popupLngLat = e.lngLat;
//         try {
//           const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
//           if (features && features.length > 0) {
//             const geom: any = features[0].geometry;
//             if (geom && geom.type === 'Polygon' && Array.isArray(geom.coordinates[0])) {
//               const ring: number[][] = geom.coordinates[0];
//               const avg = ring.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
//               const len = ring.length || 1;
//               popupLngLat = { lng: avg[0] / len, lat: avg[1] / len } as any;
//             }
//           }
//         } catch (err) { console.warn('feature query failed', err); }
//         openFloatingPopupAt(popupLngLat);
//       });

//       map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
//       map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
//     }

//     const lngSum = baseCoords.reduce((acc, curr) => acc + curr[0], 0);
//     const latSum = baseCoords.reduce((acc, curr) => acc + curr[1], 0);
//     const center: [number, number] = [lngSum / baseCoords.length, latSum / baseCoords.length];

//     if (!markerRef.current) {
//       const el = document.createElement('div');
//       el.style.cursor = 'pointer';
//       el.style.zIndex = "1";
//       el.innerHTML = config.markerImage 
//         ? `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.outerHTML='<div style=\\'width:16px;height:16px;border-radius:50%;background:${config.color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);\\' />';" />`
//         : `<div style="width:16px; height:16px; border-radius:50%; background:${config.color}; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`;

//       el.addEventListener('click', (ev) => {
//         ev.stopPropagation();
//         try { (popupRef as any).current && document.body.removeChild((popupRef as any).current); } catch (e) { }
//         openFloatingPopupAt({ lng: center[0], lat: center[1] });
//       });

//       markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);
//     } else {
//       markerRef.current.setLngLat(center);
//     }

//     let topMarkerEl: HTMLDivElement | null = null;
//     let topUpdate: (() => void) | null = null;
//     if (config.height && config.height > 0) {
//       topMarkerEl = document.createElement('div');
//       topMarkerEl.style.position = 'absolute';
//       topMarkerEl.style.zIndex = '1';
//       topMarkerEl.style.cursor = 'pointer';
//       topMarkerEl.innerHTML = config.markerImage 
//         ? `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;"><div style="width:34px;height:28px;border-radius:8px;overflow:hidden;background:white;"><img src="${config.markerImage}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div><div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${config.color};margin-top:-3px;"></div></div>`
//         : `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;"><div style="width:18px;height:18px;border-radius:6px;background:${config.color};border:2px solid white;"></div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${config.color};margin-top:-4px;"></div></div>`;
      
//       document.body.appendChild(topMarkerEl);

//       topUpdate = () => {
//         if (!map) return;
//         try {
//           const p = map.project([center[0], center[1]]);
//           const mapRect = (map.getContainer() as HTMLElement).getBoundingClientRect();
//           const metersPerPixel = 156543.03392 * Math.cos(center[1] * Math.PI / 180) / Math.pow(2, map.getZoom());
//           const pxHeight = (config.height || 0) / metersPerPixel;
//           topMarkerEl!.style.left = Math.round(mapRect.left + p.x) + 'px';
//           topMarkerEl!.style.top = Math.round(mapRect.top + p.y - pxHeight) + 'px';
//           topMarkerEl!.style.transform = 'translate(-50%, -50%)';
//         } catch (e) {}
//       };

//       map.on('move', topUpdate);
//       map.on('resize', topUpdate);
//       map.on('zoom', topUpdate);
//       topUpdate();

//       topMarkerEl.addEventListener('click', (ev) => {
//         ev.stopPropagation();
//         openFloatingPopupAt({ lng: center[0], lat: center[1] });
//       });
//     }

//   // --- FIX: Robust Cleanup for Navigation ---
//     return () => {
//       // 1. Cleanup Floating Popups (DOM based)
//       if (popupRef.current) { 
//         try { 
//           // Check if it's a DOM element or a MapLibre Popup
//           if (typeof (popupRef.current as any).remove === 'function') {
//             (popupRef.current as any).remove();
//           } else if (document.body.contains(popupRef.current as any)) {
//             document.body.removeChild(popupRef.current as any);
//           }
//         } catch(e) { console.warn("Popup cleanup failed", e); }
//         popupRef.current = null; 
//       }
      
//       // 2. Safety check: Ensure map exists AND internal style is still loaded
//       // Navigation often triggers map.remove() before this cleanup completes.
//       const isMapValid = map && 
//                          typeof map.getLayer === 'function' && 
//                          map.getStyle(); // CRITICAL: If style is gone, getLayer will throw

//       if (isMapValid) {
//         try {
//           if (map.getLayer(layerId)) map.removeLayer(layerId);
//           if (map.getSource(sourceId)) map.removeSource(sourceId);
//         } catch (e) {
//           console.warn("Map layer/source cleanup skipped: Map already disposed.");
//         }
        
//         if (topUpdate) {
//           try {
//             map.off('move', topUpdate);
//             map.off('resize', topUpdate);
//             map.off('zoom', topUpdate);
//           } catch (e) {}
//         }
//       }

//       // 3. Cleanup Markers and Top Overlays
//       if (markerRef.current) { 
//         try { markerRef.current.remove(); } catch(e) {}
//         markerRef.current = null; 
//       }
      
//       if (topMarkerEl && document.body.contains(topMarkerEl)) { 
//         try { document.body.removeChild(topMarkerEl); } catch (e) { } 
//       }
//     };
//   }, [map, config]);

//   return null;
// }

// // --- POINT MARKER COMPONENT ---
// function SinglePointMarker({ map, config }: { map: maplibregl.Map; config: ServiceConfig }) {
//   const markerRef = useRef<maplibregl.Marker | null>(null);
//   const popupRef = useRef<any>(null);

//   useEffect(() => {
//     if (!map || !config.boundary || config.boundary.length === 0) return;

//     const lngSum = config.boundary.reduce((acc, p) => acc + p.lng, 0);
//     const latSum = config.boundary.reduce((acc, p) => acc + p.lat, 0);
//     const center: [number, number] = [lngSum / config.boundary.length, latSum / config.boundary.length];

//     const el = document.createElement('div');
//     el.style.cursor = 'pointer';
//     el.innerHTML = config.markerImage 
//       ? `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.outerHTML='<div style=\\'width:16px;height:16px;border-radius:50%;background:${config.color};border:2px solid white;\\' />';" />`
//       : `<div style="width: 14px; height: 14px; border-radius: 50%; background: ${config.color}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`;

//     el.addEventListener('click', (ev) => {
//       ev.stopPropagation();
//       const bodyPopup = document.createElement('div');
//       bodyPopup.style.position = 'fixed';
//       bodyPopup.style.inset = '0';
//       bodyPopup.style.display = 'flex';
//       bodyPopup.style.justifyContent = 'center';
//       bodyPopup.style.alignItems = 'center';
//       bodyPopup.style.background = 'rgba(0, 0, 0, 0.65)';
//       bodyPopup.style.zIndex = '10060';

//       const content = buildPopupNode(config);
//       const closeBtn = document.createElement('button');
//       closeBtn.textContent = '✕';
//       closeBtn.style.position = 'absolute';
//       closeBtn.style.top = '14px';
//       closeBtn.style.right = '14px';

//       content.appendChild(closeBtn);
//       bodyPopup.appendChild(content);
//       document.body.appendChild(bodyPopup);
//       popupRef.current = bodyPopup;

//       const remove = () => { try { document.body.removeChild(bodyPopup); } catch(e) {} popupRef.current = null; };
//       closeBtn.onclick = remove;
//       bodyPopup.onclick = (e) => { if(e.target === bodyPopup) remove(); };
//     });

//     markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);

//     return () => {
//       if (popupRef.current) { try { document.body.removeChild(popupRef.current); } catch(e) {} }
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
  popupNode.style.minWidth = "220px";
  popupNode.style.fontFamily = "Inter, system-ui, sans-serif";
  popupNode.innerHTML = `
    <div style="background: #ffffff; color: #000000; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 42px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.08);">
      ${config.popupImage
      ? `<img src="${config.popupImage}" style="width:100%; height:180px; object-fit:cover; display:block;" onerror="this.style.display='none'" />`
      : `<div style="width:100%; height: 10px; background: #dc2626;"></div>`
    }
      <div style="padding: 20px; display:flex; flex-direction:column; gap: 14px;">
        <div style="display:flex; align-items:center; gap: 10px;">
          <span style="display:inline-block;width:10px;height:10px;background:#dc2626;border-radius:999px;"></span>
          <strong style="font-size: 18px; color: #000000; line-height:1.2;">${config.name}</strong>
        </div>
        ${config.text ? `<p style="margin:0; color:#000000; font-size:14px; line-height:1.6;">${config.text}</p>` : ''}
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
      bodyPopup.style.padding = '24px';
      bodyPopup.style.pointerEvents = 'auto';
      bodyPopup.style.background = 'rgba(0, 0, 0, 0.65)';
      bodyPopup.style.zIndex = '10060';

      const content = buildPopupNode(config);
      content.style.margin = '0';
      content.style.position = 'relative';
      content.style.width = 'min(92vw, 520px)';
      content.style.maxWidth = '520px';
      content.style.boxSizing = 'border-box';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '14px';
      closeBtn.style.right = '14px';
      closeBtn.style.background = 'rgba(255,255,255,0.95)';
      closeBtn.style.border = '1px solid rgba(148,163,184,0.4)';
      closeBtn.style.borderRadius = '999px';
      closeBtn.style.padding = '8px 10px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '14px';
      closeBtn.style.lineHeight = '1';
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

    // Helper functions for event listeners to allow proper removal
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
      } catch (err) { console.warn('feature query failed', err); }
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

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.style.zIndex = "1";
      el.innerHTML = config.markerImage 
        ? `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.style.display='none';" />`
        : `<div style="width:16px; height:16px; border-radius:50%; background:${config.color}; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openFloatingPopupAt({ lng: center[0], lat: center[1] });
      });

      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' as any }).setLngLat(center).addTo(map);
    } else {
      markerRef.current.setLngLat(center);
    }

    let topMarkerEl: HTMLDivElement | null = null;
    let topUpdate: (() => void) | null = null;
    
    if (config.height && config.height > 0) {
      topMarkerEl = document.createElement('div');
      topMarkerEl.style.position = 'absolute';
      topMarkerEl.style.zIndex = '1';
      topMarkerEl.style.cursor = 'pointer';
      topMarkerEl.innerHTML = config.markerImage 
        ? `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;"><div style="width:34px;height:28px;border-radius:8px;overflow:hidden;background:white;"><img src="${config.markerImage}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div><div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${config.color};margin-top:-3px;"></div></div>`
        : `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;"><div style="width:18px;height:18px;border-radius:6px;background:${config.color};border:2px solid white;"></div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${config.color};margin-top:-4px;"></div></div>`;
      
      document.body.appendChild(topMarkerEl);

      topUpdate = () => {
        if (!map || !topMarkerEl) return;
        try {
          const p = map.project([center[0], center[1]]);
          const mapRect = (map.getContainer() as HTMLElement).getBoundingClientRect();
          const metersPerPixel = 156543.03392 * Math.cos(center[1] * Math.PI / 180) / Math.pow(2, map.getZoom());
          const pxHeight = (config.height || 0) / metersPerPixel;
          topMarkerEl.style.left = Math.round(mapRect.left + p.x) + 'px';
          topMarkerEl.style.top = Math.round(mapRect.top + p.y - pxHeight) + 'px';
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
          try {
            map.off('move', topUpdate);
            map.off('resize', topUpdate);
            map.off('zoom', topUpdate);
          } catch (e) {}
        }
      }

      if (markerRef.current) { 
        try { markerRef.current.remove(); } catch(e) {}
        markerRef.current = null; 
      }
      
      if (topMarkerEl && document.body.contains(topMarkerEl)) { 
        try { document.body.removeChild(topMarkerEl); } catch (e) { } 
      }
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
    el.innerHTML = config.markerImage 
      ? `<img src="${config.markerImage}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" onerror="this.style.display='none';" />`
      : `<div style="width: 14px; height: 14px; border-radius: 50%; background: ${config.color}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`;

    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeCurrentPopup();

      const bodyPopup = document.createElement('div');
      bodyPopup.style.position = 'fixed';
      bodyPopup.style.inset = '0';
      bodyPopup.style.display = 'flex';
      bodyPopup.style.justifyContent = 'center';
      bodyPopup.style.alignItems = 'center';
      bodyPopup.style.background = 'rgba(0, 0, 0, 0.65)';
      bodyPopup.style.zIndex = '10060';

      const content = buildPopupNode(config);
      content.style.position = 'relative';
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '14px';
      closeBtn.style.right = '14px';
      closeBtn.style.background = 'white';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.border = '1px solid #ccc';
      closeBtn.style.padding = '5px 8px';
      closeBtn.style.cursor = 'pointer';

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