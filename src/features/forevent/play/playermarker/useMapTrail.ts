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

  const ensureTrailSource = (targetMap: maplibregl.Map) => {
    if (targetMap.getSource("player-trail")) return;

    if (!targetMap.hasImage("square-sdf")) {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 16, 16);
        const imageData = ctx.getImageData(0, 0, 16, 16);
        targetMap.addImage("square-sdf", imageData, { sdf: true });
      }
    }

    targetMap.addSource("player-trail", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    if (!targetMap.getLayer("player-trail-circle")) {
      targetMap.addLayer({
        id: "player-trail-circle",
        type: "circle",
        source: "player-trail",
        layout: { visibility: shape === "circle" ? "visible" : "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 1.5,
            15, 4.5,
            19, 9.0
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
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 0,
            14, 1
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
    }

    if (!targetMap.getLayer("player-trail-square")) {
      targetMap.addLayer({
        id: "player-trail-square",
        type: "symbol",
        source: "player-trail",
        layout: {
          "icon-image": "square-sdf",
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 0.2,
            15, 0.55,
            19, 1.0
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
  };

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

    ensureTrailSource(map);

    const savedTrail = localStorage.getItem(storageKey);
    if (savedTrail) {
      try {
        const parsedTrail = JSON.parse(savedTrail) as TrailPoint[];
        trailCoordsRef.current = parsedTrail;

        const source = map.getSource("player-trail") as maplibregl.GeoJSONSource | undefined;
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

    ensureTrailSource(map);
    const source = map.getSource("player-trail") as maplibregl.GeoJSONSource | undefined;
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

