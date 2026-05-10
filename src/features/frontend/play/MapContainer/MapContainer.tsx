
// "use client";
// import React, { useRef, useEffect, useCallback, useState } from 'react';
// import styles from './Map.module.css';
// import { useMapInit } from '@/features/frontend/play/logic';
// import { useLandmarkCapture } from '@/features/frontend/play/LocationMarkers/Uselandmarkcapture';
// import { usePlayerLocation } from '@/store/Playerlocation';
// import { useLandmarkStore } from '@/store/useLandmarkStore';
// import Compass from '@/features/frontend/play/Compass/Compass';
// import PlayerMarker from '@/features/frontend/play/PlayerMarker/PlayerMarker';
// import LocationMarkers from '@/features/frontend/play/LocationMarkers/LocationMarkers';
// import GridPlot from '@/features/frontend/play/GridPlot/Today/GridPlot';
// import LandmarkPanel from '../Landmarkpanel/Landmarkpanel';
// import type { LandmarkData } from '@/features/frontend/play/Landmarkpanel/Landmarkpanel';
// import type { Landmark } from '../LocationMarkers/Landmark';

// export default function MapContainer() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const { map, isLoaded } = useMapInit(mapContainer);

//   const mapRef = useRef<any>(null);
//   useEffect(() => {
//     if (map) mapRef.current = map;
//   }, [map]);

//   // ── Landmark data ────────────────────────────────────────────────────────
//   const landmarks          = useLandmarkStore((s) => s.landmarks);
//   const fetchLandmarks     = useLandmarkStore((s) => s.fetchLandmarks);
//   const isLandmarksLoading = useLandmarkStore((s) => s.isLoading);

//   useEffect(() => { fetchLandmarks(); }, [fetchLandmarks]);

//   const markerEls = useRef<Record<string, HTMLDivElement>>({});

//   // ── Panel state ──────────────────────────────────────────────────────────
//   const [activeLandmark, setActiveLandmark] = useState<LandmarkData | null>(null);
//   const [lastClickedId,  setLastClickedId]  = useState<string | null>(null);
//   const [lastClickTime,  setLastClickTime]  = useState<number>(0);

//   // ── GPS ──────────────────────────────────────────────────────────────────
//   const startWatching = usePlayerLocation((s) => s.startWatching);
//   const stopWatching  = usePlayerLocation((s) => s.stopWatching);
//   useEffect(() => {
//     startWatching();
//     return () => stopWatching();
//   }, [startWatching, stopWatching]);

//   const handleMarkerMount = useCallback((id: string, el: HTMLDivElement | null) => {
//     if (el) markerEls.current[id] = el;
//     else delete markerEls.current[id];
//   }, []);

//   // ── Capture hook ─────────────────────────────────────────────────────────
//   // ✅ FIX: activeId and captureProgress no longer exist — hook now only
//   //         returns capturedIds, nearbyIds, triggerCapture, seedCaptured
//   const { capturedIds, nearbyIds, triggerCapture } = useLandmarkCapture({
//     isLoaded,
//     landmarks,
//     markerEls,
//     onCapture: (id) => {
//       console.log('[Capture] landmark captured:', id);
//       // TODO: write to Firestore here
//     },
//   });

//   // ── Marker click — opens LandmarkPanel on double-click ───────────────────
//   const handleMarkerClick = useCallback((landmark: Landmark) => {
//     const now = Date.now();
//     if (landmark.id === lastClickedId && now - lastClickTime < 300) {
//       setActiveLandmark(landmark as unknown as LandmarkData);
//     }
//     setLastClickedId(landmark.id);
//     setLastClickTime(now);
//   }, [lastClickedId, lastClickTime]);

//   return (
//     <div className={styles.mapWrapper}>
//       <div ref={mapContainer} className={styles.mapCanvas} />

//       {isLoaded && map && (
//         <div className={styles.uiOverlay}>
//           <GridPlot map={mapRef} />
//           <Compass map={mapRef} />
//           <PlayerMarker map={mapRef} imagePath="/play/PlayerMarker/Mascot.png" />

//           {!isLandmarksLoading && (
//             <LocationMarkers
//               map={mapRef}
//               landmarks={landmarks}
//               capturedIds={capturedIds}
//               nearbyIds={nearbyIds}
//               triggerCapture={triggerCapture}
//               onMarkerMount={handleMarkerMount}
//               onMarkerClick={handleMarkerClick}
//             />
//           )}
//         </div>
//       )}

      
//       <LandmarkPanel
//         landmark={activeLandmark}
//         isOpen={!!activeLandmark}
//         isCaptured={capturedIds.has(activeLandmark?.id ?? '')}
//         captureProgress={null}
//         onClose={() => setActiveLandmark(null)}
//       />
//     </div>
//   );
// }


"use client";
import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './Map.module.css';
import { useMapInit } from '@/features/frontend/play/logic';
import { useLandmarkCapture } from '@/features/frontend/play/LocationMarkers/Uselandmarkcapture';
import { usePlayerLocation } from '@/store/Playerlocation';
import { useLandmarkStore } from '@/store/useLandmarkStore';
import Compass from '@/features/frontend/play/Compass/Compass';
import PlayerMarker from '@/features/frontend/play/PlayerMarker/PlayerMarker';
import LocationMarkers from '@/features/frontend/play/LocationMarkers/LocationMarkers';
import GridPlot from '@/features/frontend/play/GridPlot/Today/GridPlot';
import LandmarkPanel from '../Landmarkpanel/Landmarkpanel';
import type { LandmarkData } from '@/features/frontend/play/Landmarkpanel/Landmarkpanel';
import type { Landmark } from '../LocationMarkers/Landmark';

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);

  // ✅ FIX: get stable mapRef directly from the hook — no local ref + useEffect needed
  const { map, mapRef, isLoaded } = useMapInit(mapContainer);

  // ── Landmark data ────────────────────────────────────────────────────────
  const landmarks          = useLandmarkStore((s) => s.landmarks);
  const fetchLandmarks     = useLandmarkStore((s) => s.fetchLandmarks);
  const isLandmarksLoading = useLandmarkStore((s) => s.isLoading);

  useEffect(() => { fetchLandmarks(); }, [fetchLandmarks]);

  const markerEls = useRef<Record<string, HTMLDivElement>>({});

  // ── Panel state ──────────────────────────────────────────────────────────
  const [activeLandmark, setActiveLandmark] = useState<LandmarkData | null>(null);
  const [lastClickedId,  setLastClickedId]  = useState<string | null>(null);
  const [lastClickTime,  setLastClickTime]  = useState<number>(0);

  // ── GPS ──────────────────────────────────────────────────────────────────
  const startWatching = usePlayerLocation((s) => s.startWatching);
  const stopWatching  = usePlayerLocation((s) => s.stopWatching);
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  const handleMarkerMount = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) markerEls.current[id] = el;
    else delete markerEls.current[id];
  }, []);

  // ── Capture hook ─────────────────────────────────────────────────────────
  const { capturedIds, nearbyIds, triggerCapture } = useLandmarkCapture({
    isLoaded,
    landmarks,
    markerEls,
    onCapture: (id) => {
      console.log('[Capture] landmark captured:', id);
    },
  });

  // ── Marker click ─────────────────────────────────────────────────────────
  const handleMarkerClick = useCallback((landmark: Landmark) => {
    const now = Date.now();
    if (landmark.id === lastClickedId && now - lastClickTime < 300) {
      setActiveLandmark(landmark as unknown as LandmarkData);
    }
    setLastClickedId(landmark.id);
    setLastClickTime(now);
  }, [lastClickedId, lastClickTime]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainer} className={styles.mapCanvas} />

      {isLoaded && map && (
        <div className={styles.uiOverlay}>
          {/* ✅ FIX: pass mapRef from hook directly — it's stable and always populated */}
          <GridPlot map={mapRef} />
          <Compass map={mapRef} />
          <PlayerMarker map={mapRef} imagePath="/play/PlayerMarker/Mascot.png" />

          {!isLandmarksLoading && (
            <LocationMarkers
              map={mapRef}
              landmarks={landmarks}
              capturedIds={capturedIds}
              nearbyIds={nearbyIds}
              triggerCapture={triggerCapture}
              onMarkerMount={handleMarkerMount}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
      )}

      <LandmarkPanel
        landmark={activeLandmark}
        isOpen={!!activeLandmark}
        isCaptured={capturedIds.has(activeLandmark?.id ?? '')}
        captureProgress={null}
        onClose={() => setActiveLandmark(null)}
      />
    </div>
  );
}