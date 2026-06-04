

// "use client";

// import { useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";
// import { useMapTrail } from "./useMapTrail";
// import { usePlayerMovement } from "./usePlayerMovement";
// import { useOfflineQueue } from "@/features/forevent/play/useOfflineQueue";

// interface PlayerMarkerProps {
//   map: maplibregl.Map | null;
//   eventId: string;
//   iconUrl?: string;
// }

// function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// const PAN_THRESHOLD_METERS = 8;

// // ── FIX: Preload icon into a blob URL so it works fully offline ──
// async function loadIconSrc(url: string): Promise<string> {
//   try {
//     const res = await fetch(url, { cache: "force-cache" });
//     if (!res.ok) throw new Error("fetch failed");
//     const blob = await res.blob();
//     return URL.createObjectURL(blob);
//   } catch {
//     try {
//       if (typeof caches !== "undefined") {
//         const cachedResponse = await caches.match(url);
//         if (cachedResponse && cachedResponse.ok) {
//           const blob = await cachedResponse.blob();
//           return URL.createObjectURL(blob);
//         }
//       }
//     } catch {
//       // ignore cache lookup failures
//     }
//     // If fetch fails (offline, no cache), return the original URL as fallback
//     return url;
//   }
// }

// export default function PlayerMarker({ map, eventId, iconUrl = "/Mascot.png" }: PlayerMarkerProps) {
//   const [shape, setShape] = useState<"circle" | "square">("circle");
//   const markerRef = useRef<maplibregl.Marker | null>(null);
//   // ── FIX: Store resolved blob/src so marker always has an in-memory image ──
//   const resolvedIconRef = useRef<string | null>(null);
//   const markerImageRef = useRef<HTMLImageElement | null>(null);

//   const lastPannedRef = useRef<{ lat: number; lng: number } | null>(null);
//   const lastMarkerPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
//   const userPanningRef = useRef(false);
//   const panResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // FIX: Secondary jitter filter at marker level (2.5m threshold)
//   // This catches any remaining noise even with movement hook averaging
//   const MIN_MARKER_UPDATE_DISTANCE = 2.5;

//   const { enqueue } = useOfflineQueue(eventId);
//   const { addTrailPoint } = useMapTrail(map, eventId, shape);

//   // ── FIX: Preload the icon as soon as the component mounts ──
//   useEffect(() => {
//     loadIconSrc(iconUrl).then((src) => {
//       resolvedIconRef.current = src;
//       if (markerImageRef.current) {
//         markerImageRef.current.src = src;
//       }
//     });
//   }, [iconUrl]);

//   useEffect(() => {
//     if (!map) return;

//     const onDragStart = () => {
//       userPanningRef.current = true;
//       if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
//     };

//     const onDragEnd = () => {
//       if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
//       panResumeTimerRef.current = setTimeout(() => {
//         userPanningRef.current = false;
//       }, 60000);
//     };

//     map.on("dragstart", onDragStart);
//     map.on("dragend",   onDragEnd);

//     return () => {
//       map.off("dragstart", onDragStart);
//       map.off("dragend",   onDragEnd);
//       if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
//     };
//   }, [map]);

//   const updateMarkerPosition = (latitude: number, longitude: number) => {
//     if (!map) return;

//     // FIX: Filter out jitter at marker level (secondary check after movement hook averaging)
//     if (lastMarkerPositionRef.current) {
//       const moved = distanceMeters(
//         lastMarkerPositionRef.current.latitude,
//         lastMarkerPositionRef.current.longitude,
//         latitude,
//         longitude
//       );
//       if (moved < MIN_MARKER_UPDATE_DISTANCE) {
//         return; // Ignore tiny jumps at marker level too
//       }
//     }

//     lastMarkerPositionRef.current = { latitude, longitude };

//     if (!markerRef.current) {
//       const el = document.createElement("div");
//       Object.assign(el.style, {
//         width: "0px",
//         height: "0px",
//         position: "relative",
//       });

//       const pinWrapper = document.createElement("div");
//       Object.assign(pinWrapper.style, {
//         width: "40px",
//         height: "40px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         position: "absolute",
//         left: "0px",
//         top: "0px",
//         transform: "translate(-50%, -100%)",
//         pointerEvents: "none",
//       });

//       const img = document.createElement("img");
//       img.alt = "Player";
//       Object.assign(img.style, { width: "100%", height: "100%", objectFit: "contain" });

//       img.onerror = () => {
//         // If even the blob/fallback fails, show a solid blue circle
//         img.style.display = "none";
//         const fallback = document.createElement("div");
//         Object.assign(fallback.style, {
//           width: "100%",
//           height: "100%",
//           backgroundColor: "#2563EB",
//           borderRadius: "50%",
//         });
//         pinWrapper.appendChild(fallback);
//       };

//       // Keep reference so offline asset can be updated once loaded
//       markerImageRef.current = img;

//       // ── FIX: Use blob URL if preloaded, otherwise fall back to original URL ──
//       // Removed crossOrigin="anonymous" — blob URLs don't need it and it breaks offline cache
//       img.src = resolvedIconRef.current ?? iconUrl;

//       pinWrapper.appendChild(img);
//       el.appendChild(pinWrapper);

//       markerRef.current = new maplibregl.Marker({ element: el })
//         .setLngLat([longitude, latitude])
//         .addTo(map);
//     } else {
//       markerRef.current.setLngLat([longitude, latitude]);
//     }

//     if (userPanningRef.current) return;

//     if (lastPannedRef.current) {
//       const moved = distanceMeters(
//         lastPannedRef.current.lat, lastPannedRef.current.lng,
//         latitude, longitude
//       );
//       if (moved < PAN_THRESHOLD_METERS) return;
//     }

//     lastPannedRef.current = { lat: latitude, lng: longitude };

//     if (map.loaded()) {
//       map.panTo([longitude, latitude], { duration: 300 });
//     } else {
//       map.setCenter([longitude, latitude]);
//     }
//   };

//   // Restore last known position from cache on load
//   useEffect(() => {
//     if (!map || !eventId) return;

//     const tryRestore = () => {
//       try {
//         const saved = localStorage.getItem(`last_position_${eventId}`);
//         if (saved) {
//           const { latitude, longitude } = JSON.parse(saved);
//           if (typeof latitude === "number" && typeof longitude === "number") {
//             updateMarkerPosition(latitude, longitude);
//             return;
//           }
//         }
//       } catch (_) { /* ignore */ }

//       try {
//         const savedTrail = localStorage.getItem(`player_trail_${eventId}`);
//         if (savedTrail) {
//           const parsed = JSON.parse(savedTrail);
//           if (parsed?.length > 0) {
//             const [lng, lat] = parsed[parsed.length - 1].coordinates;
//             updateMarkerPosition(lat, lng);
//           }
//         }
//       } catch (error) {
//         console.error("Failed to restore initial marker position:", error);
//       }
//     };

//     tryRestore();

//     map.once("styledata", tryRestore);
//     map.once("load", tryRestore);
//   }, [map, eventId]);

//   usePlayerMovement({
//     map,
//     eventId,
//     enqueue,
//     onPositionUpdate: (latitude, longitude) => {
//       updateMarkerPosition(latitude, longitude);
//       addTrailPoint(latitude, longitude);
//     },
//   });

//   useEffect(() => {
//     return () => {
//       // ── FIX: Revoke blob URL on unmount to avoid memory leaks ──
//       if (resolvedIconRef.current && resolvedIconRef.current.startsWith("blob:")) {
//         URL.revokeObjectURL(resolvedIconRef.current);
//       }
//       markerRef.current?.remove();
//       markerRef.current = null;
//     };
//   }, []);

//   // return (
//   //   <div style={containerStyle}>
//   //     <button onClick={() => setShape("circle")} style={buttonStyle(shape === "circle")}>
//   //       Circle Trail
//   //     </button>
//   //     <button onClick={() => setShape("square")} style={buttonStyle(shape === "square")}>
//   //       Square Trail
//   //     </button>
//   //   </div>
//   // );
// }

// const containerStyle: React.CSSProperties = {
//   position: "absolute",
//   top: "16px",
//   left: "16px",
//   zIndex: 10,
//   backgroundColor: "rgba(255, 255, 255, 0.95)",
//   padding: "8px",
//   borderRadius: "8px",
//   boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//   display: "flex",
//   gap: "6px",
//   fontFamily: "sans-serif",
// };

// const buttonStyle = (isActive: boolean): React.CSSProperties => ({
//   padding: "6px 12px",
//   fontSize: "13px",
//   fontWeight: "600",
//   border: "1px solid #ccc",
//   borderRadius: "4px",
//   backgroundColor: isActive ? "#2563EB" : "#FFF",
//   color: isActive ? "#FFF" : "#333",
//   cursor: "pointer",
//   transition: "all 0.2s ease",
// });




"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapTrail } from "./useMapTrail";
import { usePlayerMovement } from "./usePlayerMovement";
import { useOfflineQueue } from "@/features/forevent/play/useOfflineQueue";

interface PlayerMarkerProps {
  map: maplibregl.Map | null;
  eventId: string;
  iconUrl?: string;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PAN_THRESHOLD_METERS = 8;

// ── FIX: Preload icon into a blob URL so it works fully offline ──
async function loadIconSrc(url: string): Promise<string> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    try {
      if (typeof caches !== "undefined") {
        const cachedResponse = await caches.match(url);
        if (cachedResponse && cachedResponse.ok) {
          const blob = await cachedResponse.blob();
          return URL.createObjectURL(blob);
        }
      }
    } catch {
      // ignore cache lookup failures
    }
    return url;
  }
}

export default function PlayerMarker({ map, eventId, iconUrl = "/Mascot.png" }: PlayerMarkerProps) {
  const [shape, setShape] = useState<"circle" | "square">("circle");
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const resolvedIconRef = useRef<string | null>(null);
  const markerImageRef = useRef<HTMLImageElement | null>(null);

  const lastPannedRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastMarkerPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const userPanningRef = useRef(false);
  const panResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Secondary jitter filter at marker level (2.5m threshold)
  const MIN_MARKER_UPDATE_DISTANCE = 2.5;

  const { enqueue } = useOfflineQueue(eventId);
  const { addTrailPoint } = useMapTrail(map, eventId, shape);

  // Preload the icon as soon as the component mounts
  useEffect(() => {
    loadIconSrc(iconUrl).then((src) => {
      resolvedIconRef.current = src;
      if (markerImageRef.current) {
        markerImageRef.current.src = src;
      }
    });
  }, [iconUrl]);

  useEffect(() => {
    if (!map) return;

    const onDragStart = () => {
      userPanningRef.current = true;
      if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
    };

    const onDragEnd = () => {
      if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
      panResumeTimerRef.current = setTimeout(() => {
        userPanningRef.current = false;
      }, 60000);
    };

    map.on("dragstart", onDragStart);
    map.on("dragend",   onDragEnd);

    return () => {
      map.off("dragstart", onDragStart);
      map.off("dragend",   onDragEnd);
      if (panResumeTimerRef.current) clearTimeout(panResumeTimerRef.current);
    };
  }, [map]);

  const updateMarkerPosition = (latitude: number, longitude: number) => {
    if (!map) return;

    if (lastMarkerPositionRef.current) {
      const moved = distanceMeters(
        lastMarkerPositionRef.current.latitude,
        lastMarkerPositionRef.current.longitude,
        latitude,
        longitude
      );
      if (moved < MIN_MARKER_UPDATE_DISTANCE) {
        return; 
      }
    }

    lastMarkerPositionRef.current = { latitude, longitude };

    if (!markerRef.current) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "0px",
        height: "0px",
        position: "relative",
      });

      const pinWrapper = document.createElement("div");
      Object.assign(pinWrapper.style, {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        left: "0px",
        top: "0px",
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
      });

      const img = document.createElement("img");
      img.alt = "Player";
      Object.assign(img.style, { width: "100%", height: "100%", objectFit: "contain" });

      img.onerror = () => {
        img.style.display = "none";
        const fallback = document.createElement("div");
        Object.assign(fallback.style, {
          width: "100%",
          height: "100%",
          backgroundColor: "#2563EB",
          borderRadius: "50%",
        });
        pinWrapper.appendChild(fallback);
      };

      markerImageRef.current = img;
      img.src = resolvedIconRef.current ?? iconUrl;

      pinWrapper.appendChild(img);
      el.appendChild(pinWrapper);

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }

    if (userPanningRef.current) return;

    if (lastPannedRef.current) {
      const moved = distanceMeters(
        lastPannedRef.current.lat, lastPannedRef.current.lng,
        latitude, longitude
      );
      if (moved < PAN_THRESHOLD_METERS) return;
    }

    lastPannedRef.current = { lat: latitude, lng: longitude };

    if (map.loaded()) {
      map.panTo([longitude, latitude], { duration: 300 });
    } else {
      map.setCenter([longitude, latitude]);
    }
  };

  // Restore last known position from cache on load
  useEffect(() => {
    if (!map || !eventId) return;

    const tryRestore = () => {
      try {
        const saved = localStorage.getItem(`last_position_${eventId}`);
        if (saved) {
          const { latitude, longitude } = JSON.parse(saved);
          if (typeof latitude === "number" && typeof longitude === "number") {
            updateMarkerPosition(latitude, longitude);
            return;
          }
        }
      } catch (_) { /* ignore */ }

      try {
        const savedTrail = localStorage.getItem(`player_trail_${eventId}`);
        if (savedTrail) {
          const parsed = JSON.parse(savedTrail);
          if (parsed?.length > 0) {
            const [lng, lat] = parsed[parsed.length - 1].coordinates;
            updateMarkerPosition(lat, lng);
          }
        }
      } catch (error) {
        console.error("Failed to restore initial marker position:", error);
      }
    };

    tryRestore();

    map.once("styledata", tryRestore);
    map.once("load", tryRestore);
  }, [map, eventId]);

  usePlayerMovement({
    map,
    eventId,
    enqueue,
    onPositionUpdate: (latitude, longitude) => {
      updateMarkerPosition(latitude, longitude);
      addTrailPoint(latitude, longitude);
    },
  });

  useEffect(() => {
    return () => {
      if (resolvedIconRef.current && resolvedIconRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(resolvedIconRef.current);
      }
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  return null;
}