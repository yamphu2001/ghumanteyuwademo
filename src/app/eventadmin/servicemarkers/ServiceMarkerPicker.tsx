
// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// // @ts-ignore
// import MapboxDraw from "@mapbox/mapbox-gl-draw";
// import "maplibre-gl/dist/maplibre-gl.css";
// import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

// interface MapPickerProps {
//   mode: "draw_point" | "draw_polygon";
//   onLocationSelect: (data: any) => void;
//   boundary?: number[][][];
//   initialValue?: number[][][];
// }

// // --- GEOMETRY HELPERS ---
// const rotatePoint = (center: [number, number], point: [number, number], angleDegrees: number): [number, number] => {
//   if (angleDegrees === 0) return point;
//   const angleRad = (angleDegrees * Math.PI) / 180;
//   const [cx, cy] = center;
//   const [px, py] = point;
//   const x = cx + (px - cx) * Math.cos(angleRad) - (py - cy) * Math.sin(angleRad);
//   const y = cy + (px - cx) * Math.sin(angleRad) + (py - cy) * Math.cos(angleRad);
//   return [x, y];
// };

// const getPolygonCenter = (coordinates: number[][]): [number, number] => {
//   const pts = coordinates.slice(0, -1);
//   const lat = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
//   const lng = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
//   return [lng, lat];
// };

// const createCircle = (center: [number, number], radiusInMeters = 150) => {
//   const points = 64;
//   const coordinates = [];
//   const [lng, lat] = center;
//   const latOffset = radiusInMeters / 111132;
//   const lngOffset = radiusInMeters / (111132 * Math.cos((lat * Math.PI) / 180));
//   for (let i = 0; i < points; i++) {
//     const angle = (i / points) * Math.PI * 2;
//     coordinates.push([lng + lngOffset * Math.sin(angle), lat + latOffset * Math.cos(angle)]);
//   }
//   coordinates.push(coordinates[0]);
//   return [coordinates];
// };

// const createRectangle = (center: [number, number], widthInMeters = 300, heightInMeters = 150, rotation = 0) => {
//   const [lng, lat] = center;
//   const halfW = widthInMeters / 2;
//   const halfH = heightInMeters / 2;
//   const latOffset = halfH / 111132;
//   const lngOffset = halfW / (111132 * Math.cos((lat * Math.PI) / 180));
//   const corners: [number, number][] = [
//     [lng - lngOffset, lat - latOffset],
//     [lng + lngOffset, lat - latOffset],
//     [lng + lngOffset, lat + latOffset],
//     [lng - lngOffset, lat + latOffset],
//   ];
//   const rotated = corners.map((p) => rotatePoint(center, p, rotation));
//   rotated.push(rotated[0]);
//   return [rotated];
// };

// export default function MapPicker({ mode, onLocationSelect, boundary, initialValue }: MapPickerProps) {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<maplibregl.Map | null>(null);
//   const draw = useRef<any>(null);
//   const isInitializing = useRef(false);

//   const [activeMode, setActiveMode] = useState<string>(mode);
//   const activeModeRef = useRef<string>(mode);
//   const [selectedShape, setSelectedShape] = useState<any>(null);

//   // --- INTERNAL LOGIC HANDLERS ---
//   const updateParent = (feat?: any) => {
//     if (!draw.current) return;
//     const data = draw.current.getAll();
//     onLocationSelect(feat || (data.features.length > 0 ? data.features[data.features.length - 1] : { geometry: { coordinates: [] } }));
//   };

//   const handleDrawCreate = (e: any) => {
//     const feature = e.features[0];
//     if (!feature || !draw.current) return;
//     const shapeMode = activeModeRef.current;

//     if (["circle", "square", "rectangle"].includes(shapeMode)) {
//       const center = feature.geometry.coordinates as [number, number];
//       draw.current.delete(feature.id);
      
//       let coords, props: any = { isCustom: true, shapeType: shapeMode, center, rotation: 0 };
//       if (shapeMode === "circle") { coords = createCircle(center, 150); props.radius = 150; } 
//       else if (shapeMode === "square") { coords = createRectangle(center, 200, 200, 0); props.width = 200; props.height = 200; } 
//       else { coords = createRectangle(center, 300, 150, 0); props.width = 300; props.height = 150; }

//       const rawIds = draw.current.add({
//         id: String(`shape_${Date.now()}`),
//         type: "Feature",
//         properties: props,
//         geometry: { type: "Polygon", coordinates: coords },
//       });

//       const cleanId = Array.isArray(rawIds) ? rawIds[0] : rawIds;
//       setTimeout(() => {
//         if (draw.current) {
//           draw.current.changeMode("simple_select", { featureIds: [cleanId] });
//           setActiveMode("draw_polygon");
//         }
//       }, 0);
//     }
//     updateParent();
//   };

//   const handleDrawUpdate = (e: any) => {
//     const feat = e.features[0];
//     if (feat && feat.properties.isCustom) {
//       const newCenter = getPolygonCenter(feat.geometry.coordinates[0]);
//       draw.current.setFeatureProperty(feat.id, "center", newCenter);
//       setSelectedShape((prev: any) => (prev && prev.id === feat.id ? { ...prev, center: newCenter } : prev));
//     }
//     updateParent(feat);
//   };

//   const updateShape = (updates: any) => {
//     if (!selectedShape || !draw.current) return;
//     try {
//       const feat = draw.current.get(selectedShape.id);
//       if (!feat) return;

//       const newProps = { ...selectedShape, ...updates };
//       let newCoords;

//       if (newProps.shapeType === "circle") {
//         newCoords = createCircle(newProps.center, newProps.radius);
//       } else {
//         newCoords = createRectangle(newProps.center, newProps.width, newProps.height, newProps.rotation);
//       }

//       draw.current.add({
//         ...feat,
//         id: String(selectedShape.id),
//         properties: newProps,
//         geometry: { ...feat.geometry, coordinates: newCoords },
//       });

//       setSelectedShape(newProps);
//       onLocationSelect(draw.current.get(selectedShape.id));
//     } catch (e) {
//       console.warn("Draw engine busy...");
//     }
//   };

//   // --- MAP INITIALIZATION ---
//   useEffect(() => {
//     if (!mapContainer.current || isInitializing.current || map.current) return;
//     isInitializing.current = true;

//     const mapInstance = new maplibregl.Map({
//       container: mapContainer.current,
//       style: "https://tiles.openfreemap.org/styles/liberty",
//       center: [85.324, 27.717],
//       zoom: 15,
//     });

//     draw.current = new MapboxDraw({
//       displayControlsDefault: false,
//       styles: [
//         { id: "gl-draw-polygon-fill-inactive", type: "fill", filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]], paint: { "fill-color": "#3b82f6", "fill-opacity": 0.1 } },
//         { id: "gl-draw-polygon-stroke-active", type: "line", filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]], paint: { "line-color": "#f59e0b", "line-width": 3 } },
//         { id: "gl-draw-point-active", type: "circle", filter: ["all", ["==", "$type", "Point"], ["==", "active", "true"]], paint: { "circle-radius": 8, "circle-color": "#f59e0b" } },
//       ],
//     });

//     mapInstance.addControl(draw.current);

//     mapInstance.on("load", () => {
//       map.current = mapInstance;
//       isInitializing.current = false;
//       if (boundary) updateBoundaryLayer(boundary);

//       if (initialValue && initialValue.length > 0) {
//         const featId = draw.current.add({
//           id: `edit_${Date.now()}`,
//           type: "Feature",
//           properties: { isCustom: true, shapeType: "rectangle", rotation: 0, width: 300, height: 150, center: getPolygonCenter(initialValue[0]) },
//           geometry: { type: "Polygon", coordinates: initialValue },
//         });
//         setTimeout(() => draw.current.changeMode("simple_select", { featureIds: [Array.isArray(featId) ? featId[0] : featId] }), 100);
//       }
//     });

//     mapInstance.on("draw.create", handleDrawCreate);
//     mapInstance.on("draw.update", handleDrawUpdate);
//     mapInstance.on("draw.delete", () => { setSelectedShape(null); updateParent(); });
//     mapInstance.on("draw.selectionchange", (e) => {
//       if (e.features.length > 0 && e.features[0].properties.isCustom) {
//         setSelectedShape({ id: e.features[0].id, ...e.features[0].properties });
//       } else {
//         setSelectedShape(null);
//       }
//     });

//     return () => {
//       if (map.current) {
//         map.current.remove();
//         map.current = null;
//       }
//       isInitializing.current = false;
//     };
//   }, []);

//   const updateBoundaryLayer = (coords: number[][][]) => {
//     const inst = map.current;
//     if (!inst) return;
//     const sourceId = "event-boundary";
//     const data: any = { type: "Feature", geometry: { type: "Polygon", coordinates: coords }, properties: {} };

//     if (inst.getSource(sourceId)) {
//       (inst.getSource(sourceId) as maplibregl.GeoJSONSource).setData(data);
//     } else {
//       inst.addSource(sourceId, { type: "geojson", data });
//       inst.addLayer({ id: "boundary-fill", type: "fill", source: sourceId, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 } });
//       inst.addLayer({ id: "boundary-outline", type: "line", source: sourceId, paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [2, 1] } });
//     }
//   };

//   useEffect(() => { if (boundary) updateBoundaryLayer(boundary); }, [boundary]);

//   const clearMap = () => {
//     if (draw.current) {
//       draw.current.deleteAll();
//       setSelectedShape(null);
//       onLocationSelect({ geometry: { coordinates: [] } });
//     }
//   };

//   return (
//     <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: "12px", overflow: "hidden" }}>
//       <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      
//       {/* TOOLBAR */}
//       <div style={toolbarStyle}>
//         {[{ m: "draw_point", i: "📍" }, { m: "draw_polygon", i: "📐" }, { m: "circle", i: "🔵" }, { m: "square", i: "🟦" }, { m: "rectangle", i: "▱" }].map((item) => (
//           <button 
//             key={item.m} 
//             onClick={() => { setActiveMode(item.m); activeModeRef.current = item.m; draw.current.changeMode(item.m.includes("draw") ? item.m : "draw_point"); }} 
//             style={{ ...btnStyle, background: activeMode === item.m ? "#e0f2fe" : "white" }}
//           >
//             {item.i}
//           </button>
//         ))}
//         <button onClick={clearMap} style={{ ...btnStyle, color: "#ef4444" }}>🧹</button>
//       </div>

//       {/* TRANSFORM PANEL */}
//       {selectedShape && (
//         <div style={controlPanelStyle}>
//           <div style={{ fontSize: "11px", fontWeight: "700", marginBottom: "12px", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "5px" }}>
//             TRANSFORM {selectedShape.shapeType?.toUpperCase()}
//           </div>
//           <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//             {selectedShape.shapeType === "circle" ? (
//               <label style={labelStyle}>Radius: {selectedShape.radius}m
//                 <input type="range" min="10" max="1500" value={selectedShape.radius} onInput={(e) => updateShape({ radius: Number(e.currentTarget.value) })} style={rangeStyle} />
//               </label>
//             ) : (
//               <>
//                 <label style={labelStyle}>Width: {selectedShape.width}m
//                   <input type="range" min="10" max="2000" value={selectedShape.width} onInput={(e) => updateShape({ width: Number(e.currentTarget.value) })} style={rangeStyle} />
//                 </label>
//                 <label style={labelStyle}>Height: {selectedShape.height}m
//                   <input type="range" min="10" max="2000" value={selectedShape.height} onInput={(e) => updateShape({ height: Number(e.currentTarget.value) })} style={rangeStyle} />
//                 </label>
//                 <label style={labelStyle}>Rotation: {selectedShape.rotation}°
//                   <input type="range" min="0" max="360" value={selectedShape.rotation} onInput={(e) => updateShape({ rotation: Number(e.currentTarget.value) })} style={rangeStyle} />
//                 </label>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // --- STYLES ---
// const toolbarStyle: React.CSSProperties = { position: "absolute", top: "12px", left: "12px", zIndex: 10, display: "flex", gap: "5px", background: "white", padding: "5px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" };
// const controlPanelStyle: React.CSSProperties = { position: "absolute", top: "12px", right: "12px", background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 20, width: "200px", border: "1px solid #e2e8f0" };
// const btnStyle: React.CSSProperties = { padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "16px", transition: "all 0.2s" };
// const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: "600", color: "#1e293b", display: "flex", flexDirection: "column", gap: "5px" };
// const rangeStyle: React.CSSProperties = { width: "100%", accentColor: "#3b82f6", cursor: "pointer" };



"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
// @ts-ignore
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

interface MapPickerProps {
  mode: "draw_point" | "draw_polygon";
  onLocationSelect: (data: any) => void;
  boundary?: number[][][];
  initialValue?: number[][][];
}

// --- GEOMETRY HELPERS ---
const rotatePoint = (center: [number, number], point: [number, number], angleDegrees: number): [number, number] => {
  if (angleDegrees === 0) return point;
  const angleRad = (angleDegrees * Math.PI) / 180;
  const [cx, cy] = center;
  const [px, py] = point;
  const x = cx + (px - cx) * Math.cos(angleRad) - (py - cy) * Math.sin(angleRad);
  const y = cy + (px - cx) * Math.sin(angleRad) + (py - cy) * Math.cos(angleRad);
  return [x, y];
};

const getPolygonCenter = (coordinates: number[][]): [number, number] => {
  const pts = coordinates.slice(0, -1);
  const lat = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  const lng = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  return [lng, lat];
};

const createCircle = (center: [number, number], radiusInMeters = 150) => {
  const points = 64;
  const coordinates = [];
  const [lng, lat] = center;
  const latOffset = radiusInMeters / 111132;
  const lngOffset = radiusInMeters / (111132 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    coordinates.push([lng + lngOffset * Math.sin(angle), lat + latOffset * Math.cos(angle)]);
  }
  coordinates.push(coordinates[0]);
  return [coordinates];
};

const createRectangle = (center: [number, number], widthInMeters = 300, heightInMeters = 150, rotation = 0) => {
  const [lng, lat] = center;
  const halfW = widthInMeters / 2;
  const halfH = heightInMeters / 2;
  const latOffset = halfH / 111132;
  const lngOffset = halfW / (111132 * Math.cos((lat * Math.PI) / 180));
  const corners: [number, number][] = [
    [lng - lngOffset, lat - latOffset],
    [lng + lngOffset, lat - latOffset],
    [lng + lngOffset, lat + latOffset],
    [lng - lngOffset, lat + latOffset],
  ];
  const rotated = corners.map((p) => rotatePoint(center, p, rotation));
  rotated.push(rotated[0]);
  return [rotated];
};

export default function MapPicker({ mode, onLocationSelect, boundary, initialValue }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<any>(null);
  const isInitializing = useRef(false);

  const [activeMode, setActiveMode] = useState<string>(mode);
  const activeModeRef = useRef<string>(mode);
  const [selectedShape, setSelectedShape] = useState<any>(null);

  // --- INTERNAL LOGIC HANDLERS ---
  const updateParent = (feat?: any) => {
    if (!draw.current) return;
    const data = draw.current.getAll();
    onLocationSelect(feat || (data.features.length > 0 ? data.features[data.features.length - 1] : { geometry: { coordinates: [] } }));
  };

  const handleDrawCreate = (e: any) => {
    const feature = e.features[0];
    if (!feature || !draw.current) return;
    const shapeMode = activeModeRef.current;

    if (["circle", "square", "rectangle"].includes(shapeMode)) {
      const center = feature.geometry.coordinates as [number, number];
      draw.current.delete(feature.id);
      
      let coords, props: any = { isCustom: true, shapeType: shapeMode, center, rotation: 0 };
      if (shapeMode === "circle") { coords = createCircle(center, 150); props.radius = 150; } 
      else if (shapeMode === "square") { coords = createRectangle(center, 200, 200, 0); props.width = 200; props.height = 200; } 
      else { coords = createRectangle(center, 300, 150, 0); props.width = 300; props.height = 150; }

      const rawIds = draw.current.add({
        id: String(`shape_${Date.now()}`),
        type: "Feature",
        properties: props,
        geometry: { type: "Polygon", coordinates: coords },
      });

      const cleanId = Array.isArray(rawIds) ? rawIds[0] : rawIds;
      setTimeout(() => {
        if (draw.current) {
          draw.current.changeMode("simple_select", { featureIds: [cleanId] });
          setActiveMode("draw_polygon");
        }
      }, 0);
    }
    updateParent();
  };

  const handleDrawUpdate = (e: any) => {
    const feat = e.features[0];
    if (feat && feat.properties.isCustom) {
      const newCenter = getPolygonCenter(feat.geometry.coordinates[0]);
      draw.current.setFeatureProperty(feat.id, "center", newCenter);
      setSelectedShape((prev: any) => (prev && prev.id === feat.id ? { ...prev, center: newCenter } : prev));
    }
    updateParent(feat);
  };

  const updateShape = (updates: any) => {
    if (!selectedShape || !draw.current) return;
    try {
      const feat = draw.current.get(selectedShape.id);
      if (!feat) return;

      const newProps = { ...selectedShape, ...updates };
      let newCoords;

      if (newProps.shapeType === "circle") {
        newCoords = createCircle(newProps.center, newProps.radius);
      } else {
        newCoords = createRectangle(newProps.center, newProps.width, newProps.height, newProps.rotation);
      }

      draw.current.add({
        ...feat,
        id: String(selectedShape.id),
        properties: newProps,
        geometry: { ...feat.geometry, coordinates: newCoords },
      });

      setSelectedShape(newProps);
      onLocationSelect(draw.current.get(selectedShape.id));
    } catch (e) {
      console.warn("Draw engine busy...");
    }
  };

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    if (!mapContainer.current || isInitializing.current || map.current) return;
    isInitializing.current = true;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [85.324, 27.717],
      zoom: 15,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        { id: "gl-draw-polygon-fill-inactive", type: "fill", filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]], paint: { "fill-color": "#3b82f6", "fill-opacity": 0.1 } },
        { id: "gl-draw-polygon-stroke-active", type: "line", filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]], paint: { "line-color": "#f59e0b", "line-width": 3 } },
        { id: "gl-draw-point-active", type: "circle", filter: ["all", ["==", "$type", "Point"], ["==", "active", "true"]], paint: { "circle-radius": 8, "circle-color": "#f59e0b" } },
      ],
    });

    mapInstance.addControl(draw.current);

    mapInstance.on("load", () => {
      map.current = mapInstance;
      isInitializing.current = false;
      if (boundary) updateBoundaryLayer(boundary);

      if (initialValue && initialValue.length > 0) {
        const featId = draw.current.add({
          id: `edit_${Date.now()}`,
          type: "Feature",
          properties: { isCustom: true, shapeType: "rectangle", rotation: 0, width: 300, height: 150, center: getPolygonCenter(initialValue[0]) },
          geometry: { type: "Polygon", coordinates: initialValue },
        });
        setTimeout(() => draw.current.changeMode("simple_select", { featureIds: [Array.isArray(featId) ? featId[0] : featId] }), 100);
      }
    });

    mapInstance.on("draw.create", handleDrawCreate);
    mapInstance.on("draw.update", handleDrawUpdate);
    mapInstance.on("draw.delete", () => { setSelectedShape(null); updateParent(); });
    mapInstance.on("draw.selectionchange", (e) => {
      if (e.features.length > 0 && e.features[0].properties.isCustom) {
        setSelectedShape({ id: e.features[0].id, ...e.features[0].properties });
      } else {
        setSelectedShape(null);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      isInitializing.current = false;
    };
  }, []);

  const updateBoundaryLayer = (coords: number[][][]) => {
    const inst = map.current;
    if (!inst) return;
    const sourceId = "event-boundary";
    const data: any = { type: "Feature", geometry: { type: "Polygon", coordinates: coords }, properties: {} };

    if (inst.getSource(sourceId)) {
      (inst.getSource(sourceId) as maplibregl.GeoJSONSource).setData(data);
    } else {
      inst.addSource(sourceId, { type: "geojson", data });
      inst.addLayer({ id: "boundary-fill", type: "fill", source: sourceId, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 } });
      inst.addLayer({ id: "boundary-outline", type: "line", source: sourceId, paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [2, 1] } });
    }
  };

  useEffect(() => { if (boundary) updateBoundaryLayer(boundary); }, [boundary]);

  const clearMap = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setSelectedShape(null);
      onLocationSelect({ geometry: { coordinates: [] } });
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: "12px", overflow: "hidden" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      
      {/* TOOLBAR */}
      <div style={toolbarStyle}>
        {[{ m: "draw_point", i: "📍" }, { m: "draw_polygon", i: "📐" }, { m: "circle", i: "🔵" }, { m: "square", i: "🟦" }, { m: "rectangle", i: "▱" }].map((item) => (
          <button 
            key={item.m} 
            onClick={() => { setActiveMode(item.m); activeModeRef.current = item.m; draw.current.changeMode(item.m.includes("draw") ? item.m : "draw_point"); }} 
            style={{ ...btnStyle, background: activeMode === item.m ? "#e0f2fe" : "white" }}
          >
            {item.i}
          </button>
        ))}
        <button onClick={clearMap} style={{ ...btnStyle, color: "#ef4444" }}>🧹</button>
      </div>

      {/* TRANSFORM PANEL */}
      {selectedShape && (
        <div style={controlPanelStyle}>
          <div style={{ fontSize: "11px", fontWeight: "700", marginBottom: "12px", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "5px" }}>
            TRANSFORM {selectedShape.shapeType?.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selectedShape.shapeType === "circle" ? (
              <label style={labelStyle}>Radius: {selectedShape.radius}m
                <input type="range" min="10" max="1500" value={selectedShape.radius} onInput={(e) => updateShape({ radius: Number(e.currentTarget.value) })} style={rangeStyle} />
              </label>
            ) : (
              <>
                <label style={labelStyle}>Width: {selectedShape.width}m
                  <input type="range" min="10" max="2000" value={selectedShape.width} onInput={(e) => updateShape({ width: Number(e.currentTarget.value) })} style={rangeStyle} />
                </label>
                <label style={labelStyle}>Height: {selectedShape.height}m
                  <input type="range" min="10" max="2000" value={selectedShape.height} onInput={(e) => updateShape({ height: Number(e.currentTarget.value) })} style={rangeStyle} />
                </label>
                <label style={labelStyle}>Rotation: {selectedShape.rotation}°
                  <input type="range" min="0" max="360" value={selectedShape.rotation} onInput={(e) => updateShape({ rotation: Number(e.currentTarget.value) })} style={rangeStyle} />
                </label>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const toolbarStyle: React.CSSProperties = { position: "absolute", top: "12px", left: "12px", zIndex: 10, display: "flex", gap: "5px", background: "white", padding: "5px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" };
const controlPanelStyle: React.CSSProperties = { position: "absolute", top: "12px", right: "12px", background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 20, width: "200px", border: "1px solid #e2e8f0" };
const btnStyle: React.CSSProperties = { padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "16px", transition: "all 0.2s" };
const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: "600", color: "#1e293b", display: "flex", flexDirection: "column", gap: "5px" };
const rangeStyle: React.CSSProperties = { width: "100%", accentColor: "#3b82f6", cursor: "pointer" };