import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

interface TrailPoint {
  coordinates: [number, number];
  color: string;
}

export function useMapTrail(
  map: maplibregl.Map | null, 
  eventId: string, 
  shape: "circle" | "square"
) {
  const trailCoordsRef = useRef<TrailPoint[]>([]);
  const storageKey = `player_trail_${eventId}`;

  // Toggle Visibility Layer on shape state changes
  useEffect(() => {
    if (!map) return;
    if (map.getLayer("player-trail-circle")) {
      map.setLayoutProperty("player-trail-circle", "visibility", shape === "circle" ? "visible" : "none");
    }
    if (map.getLayer("player-trail-square")) {
      map.setLayoutProperty("player-trail-square", "visibility", shape === "square" ? "visible" : "none");
    }
  }, [shape, map]);

  useEffect(() => {
    if (!map || !eventId) return;

    if (!map.hasImage("square-sdf")) {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 16, 16);
        const imageData = ctx.getImageData(0, 0, 16, 16);
        map.addImage("square-sdf", imageData, { sdf: true });
      }
    }

    if (!map.getSource("player-trail")) {
      map.addSource("player-trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // 1. Circle Layer with dynamic zoom scaling
      map.addLayer({
        id: "player-trail-circle",
        type: "circle",
        source: "player-trail",
        layout: { visibility: shape === "circle" ? "visible" : "none" },
        paint: {
          // FIX: Smoothly scale circle size down when zooming out, up when zooming in
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 1.5,  // At zoom 10 (far out), dots are tiny 1.5px
            15, 4.5,  // At zoom 15 (mid range), dots are 4.5px
            19, 9.0   // At zoom 19 (close up), dots are a crisp 9px
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0.5,
            16, 2
          ],
          "circle-stroke-color": "#FFFFFF",
          // FIX: Completely fade out trail layers if zoomed out past level 12
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0,    // Invisible at zoom 12 or lower
            14, 1     // Fully solid at zoom 14 or higher
          ],
          "circle-stroke-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0,
            14, 1
          ]
        },
      });

      // 2. Square Layer with dynamic zoom scaling
      map.addLayer({
        id: "player-trail-square",
        type: "symbol",
        source: "player-trail",
        layout: {
          "icon-image": "square-sdf",
          // FIX: Smoothly scale icon sizes across zoom ranges
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 0.2,   // Tiny icons when zoomed out
            15, 0.55,  // Medium sizing
            19, 1.0    // Large scaling when close up
          ],
          "icon-allow-overlap": true,
          "visibility": shape === "square" ? "visible" : "none",
        },
        paint: {
          "icon-color": ["get", "color"],
          "icon-halo-color": "#FFFFFF",
          "icon-halo-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0.5,
            16, 2
          ],
          // FIX: Gracefully fade icon elements out to prevent city-view clustering clutter
          "icon-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0,
            14, 1
          ]
        },
      });
    }

    const savedTrail = localStorage.getItem(storageKey);
    if (savedTrail) {
      try {
        const parsedTrail = JSON.parse(savedTrail) as TrailPoint[];
        trailCoordsRef.current = parsedTrail;

        const source = map.getSource("player-trail") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: parsedTrail.map((pt) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: pt.coordinates },
              properties: { color: pt.color },
            })),
          });
        }
      } catch (error) {
        console.error("Failed to parse historical map trail data:", error);
      }
    }
  }, [map, eventId]);

  const addTrailPoint = (latitude: number, longitude: number) => {
    if (!map || !eventId) return;

    const points = trailCoordsRef.current;
    const lastPoint = points[points.length - 1];

    if (lastPoint) {
      const [lastLng, lastLat] = lastPoint.coordinates;
      const distanceMoved = getDistanceInMeters(lastLat, lastLng, latitude, longitude);

      // 8m threshold — GPS chips have natural jitter of 2–5m even when stationary.
      // 3m was too small and let jitter noise through, causing phantom trail dots
      // and map pans while the player wasn't actually moving.
      if (distanceMoved < 8) {
        return;
      }
    }

    // panTo lives here only for trail points (real movement ≥ 8m).
    // The marker itself is updated every GPS tick in PlayerMarker.updateMarkerPosition,
    // so the icon always tracks the player smoothly without waiting for a trail dot.
    map.panTo([longitude, latitude], { duration: 300 });

    points.push({
      coordinates: [longitude, latitude],
      color: getRandomColor(),
    });

    localStorage.setItem(storageKey, JSON.stringify(points));

    const source = map.getSource("player-trail") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: points.map((pt) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: pt.coordinates },
          properties: { color: pt.color },
        })),
      });
    }
  };

  return { addTrailPoint };
}



