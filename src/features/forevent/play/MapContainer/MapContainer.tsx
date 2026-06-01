// "use client";

// import React, { useRef, useState, useEffect } from "react";
// import "maplibre-gl/dist/maplibre-gl.css";
// import styles from "./Map.module.css";

// import { useMapInit } from "@/features/forevent/play/logic";
// import OneHandedMenu from "@/features/forevent/play/OneHandedMenu/OneHandedMenu";
// import QRCodeScanner from '@/features/forevent/play/qrscanner/components/qrcodescanner';
// import FinishGame from '@/features/forevent/play/qrscanner/components/finishgame';
// import Compass from "@/features/forevent/play/Compass/Compass";

// import PlayerMarker from "../playermarker/playermarker";
// import QRcodeMarkers from "../Markers/QRcodeMarkers/QRcodeMarkers";
// import GhumanteStall from "../Markers/GhumanteYuwaStall/ghumantestall";
// import ServiceMarkers from "../Markers/3DServiceMarkers/3DServiceMarker";
// import ProgressBar from "../ProgressBar/progressbar";
// import RoulettePage from '@/app/eventsmaker/[eventId]/roulette/page';

// interface MapContainerProps {
//   eventId: string;
// }

// export default function MapContainer({ eventId }: MapContainerProps) {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const [showScanner, setShowScanner] = useState<boolean>(false);
//   const [showFinishScanner, setShowFinishScanner] = useState<boolean>(false);
//   const [showRoulette, setShowRoulette] = useState<boolean>(false);
//   const [finishInitialValue, setFinishInitialValue] = useState<string | null>(null);

//   const currentUser = { uid: "UZ31CJRUfFOsJJbb0XbqfLNe4qq2" };

//   // offlineUnavailable = true when player is offline and has no downloaded map data
//   const { map, isLoaded, offlineUnavailable } = useMapInit(mapContainer, eventId);

//   useEffect(() => {
//     const openScanner = () => setShowScanner(true);
//     const closeScanner = () => setShowScanner(false);

//     const openFinish = (e: Event) => {
//       const value = (e as CustomEvent).detail?.value ?? null;
//       setFinishInitialValue(value);
//       setShowScanner(false);
//       setShowFinishScanner(true);
//     };
//     const closeFinish = () => {
//       setShowFinishScanner(false);
//       setFinishInitialValue(null);
//     };

//     const openRouletteModal = () => setShowRoulette(true);
//     const closeRouletteModal = () => setShowRoulette(false);

//     window.addEventListener("open-scanner", openScanner);
//     window.addEventListener("close-scanner", closeScanner);
//     window.addEventListener("open-finish-scanner", openFinish);
//     window.addEventListener("close-finish-scanner", closeFinish);
//     window.addEventListener("open-roulette", openRouletteModal);
//     window.addEventListener("close-roulette", closeRouletteModal);

//     return () => {
//       window.removeEventListener("open-scanner", openScanner);
//       window.removeEventListener("close-scanner", closeScanner);
//       window.removeEventListener("open-finish-scanner", openFinish);
//       window.removeEventListener("close-finish-scanner", closeFinish);
//       window.removeEventListener("open-roulette", openRouletteModal);
//       window.removeEventListener("close-roulette", closeRouletteModal);
//     };
//   }, []);

//   // Guard: player went offline without downloading map data first
//   if (offlineUnavailable) {
//     return (
//       <div className={styles.mapWrapper} style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "16px",
//         background: "#0B0E14",
//         color: "#fff",
//         padding: "32px",
//         textAlign: "center",
//       }}>
//         <span style={{ fontSize: "48px" }}>📡</span>
//         <h2 style={{ fontSize: "20px", fontWeight: "700" }}>No offline map downloaded</h2>
//         <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", maxWidth: "280px", lineHeight: "1.6" }}>
//           You&apos;re offline and haven&apos;t downloaded this event&apos;s map yet.
//           Connect to the internet and use the Download button on the event card first.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.mapWrapper}>
//       <div ref={mapContainer} className={styles.mapCanvas} />

//       {/* Offline indicator — shown as a subtle badge during offline play */}
//       {typeof window !== "undefined" && !navigator.onLine && (
//         <div style={{
//           position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
//           zIndex: 20, padding: "6px 14px", borderRadius: "999px",
//           background: "rgba(234,179,8,0.9)", color: "#422006",
//           fontSize: "11px", fontWeight: "600", backdropFilter: "blur(4px)",
//         }}>
//           ⚡ Offline — syncs when reconnected
//         </div>
//       )}

//       {isLoaded && map.current && (
//         <>
//           {showScanner && currentUser?.uid && (
//             <div className="fixed inset-0 z-50 bg-black w-full h-full execution-layer">
//               <div className="relative w-full h-full">
//                 <QRCodeScanner
//                   eventId={eventId}
//                   userId={currentUser.uid}
//                   onCloseScanner={() => setShowScanner(false)}
//                 />
//               </div>
//             </div>
//           )}

//           {showFinishScanner && currentUser?.uid && (
//             <div className="fixed inset-0 z-50 bg-black w-full h-full execution-layer">
//               <div className="relative w-full h-full">
//                 <FinishGame
//                   uid={currentUser.uid}
//                   eventId={eventId}
//                   initialValue={finishInitialValue}
//                   onClose={() => {
//                     setShowFinishScanner(false);
//                     setFinishInitialValue(null);
//                   }}
//                 />
//               </div>
//             </div>
//           )}

//           {showRoulette && (
//             <div className="fixed inset-0 z-[9999] bg-white">
//               <RoulettePage
//                 eventId={eventId}
//                 onClose={() => setShowRoulette(false)}
//               />
//             </div>
//           )}

//           <PlayerMarker map={map.current} eventId={eventId} iconUrl="/Mascot.png" />
//           {isLoaded && <ProgressBar />}
//           <Compass map={map.current} />
//           <OneHandedMenu eventId={eventId as string} />
//           <QRcodeMarkers map={map.current} eventId={eventId} userId={currentUser.uid} />
//           <GhumanteStall map={map.current} eventId={eventId} />
//           <ServiceMarkers map={map.current} eventId={eventId} />
//         </>
//       )}
//     </div>
//   );
// }



"use client";

import React, { useRef, useState, useEffect } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./Map.module.css";

import { useMapInit } from "@/features/forevent/play/logic";
import OneHandedMenu from "@/features/forevent/play/OneHandedMenu/OneHandedMenu";
import QRCodeScanner from '@/features/forevent/play/qrscanner/components/qrcodescanner';
import FinishGame from '@/features/forevent/play/qrscanner/components/finishgame';
import Compass from "@/features/forevent/play/Compass/Compass";

import PlayerMarker from "../playermarker/playermarker";
import QRcodeMarkers from "../Markers/QRcodeMarkers/QRcodeMarkers";
import GhumanteStall from "../Markers/GhumanteYuwaStall/ghumantestall";
import ServiceMarkers from "../Markers/3DServiceMarkers/3DServiceMarker";
import ProgressBar from "../ProgressBar/progressbar";
import RoulettePage from '@/app/eventsmaker/[eventId]/roulette/RoulettePage';

interface MapContainerProps {
  eventId: string;
  userId: string; // 🟢 ADDED: Accept the live authenticated user ID
}

export default function MapContainer({ eventId, userId }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showFinishScanner, setShowFinishScanner] = useState<boolean>(false);
  const [showRoulette, setShowRoulette] = useState<boolean>(false);
  const [finishInitialValue, setFinishInitialValue] = useState<string | null>(null);

  // 🟢 REMOVED: The hardcoded custom string variable is gone

  const { map, isLoaded, offlineUnavailable } = useMapInit(mapContainer, eventId);

  useEffect(() => {
    const openScanner = () => setShowScanner(true);
    const closeScanner = () => setShowScanner(false);

    const openFinish = (e: Event) => {
      const value = (e as CustomEvent).detail?.value ?? null;
      setFinishInitialValue(value);
      setShowScanner(false);
      setShowFinishScanner(true);
    };
    const closeFinish = () => {
      setShowFinishScanner(false);
      setFinishInitialValue(null);
    };

    const openRouletteModal = () => setShowRoulette(true);
    const closeRouletteModal = () => setShowRoulette(false);

    window.addEventListener("open-scanner", openScanner);
    window.addEventListener("close-scanner", closeScanner);
    window.addEventListener("open-finish-scanner", openFinish);
    window.addEventListener("close-finish-scanner", closeFinish);
    window.addEventListener("open-roulette", openRouletteModal);
    window.addEventListener("close-roulette", closeRouletteModal);

    return () => {
      window.removeEventListener("open-scanner", openScanner);
      window.removeEventListener("close-scanner", closeScanner);
      window.removeEventListener("open-finish-scanner", openFinish);
      window.removeEventListener("close-finish-scanner", closeFinish);
      window.removeEventListener("open-roulette", openRouletteModal);
      window.removeEventListener("close-roulette", closeRouletteModal);
    };
  }, []);

  if (offlineUnavailable) {
    return (
      <div className={styles.mapWrapper} style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // This does all the horizontal centering work!
        justifyContent: "center",
        gap: "16px",
        background: "#0B0E14",
        color: "#fff",
        padding: "32px",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "48px" }}>📡</span>
        <h2 style={{ fontSize: "20px", fontWeight: "700" }}>No offline map downloaded</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", maxWidth: "280px", lineHeight: "1.6" }}>
          You&apos;re offline and haven&apos;t downloaded this event&apos;s map yet.
          Connect to the internet and use the Download button on the event card first.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainer} className={styles.mapCanvas} />

      {typeof window !== "undefined" && !navigator.onLine && (
        <div style={{
          position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
          zIndex: 20, padding: "6px 14px", borderRadius: "999px",
          background: "rgba(234,179,8,0.9)", color: "#422006",
          fontSize: "11px", fontWeight: "600", backdropFilter: "blur(4px)",
        }}>
          ⚡ Offline — syncs when reconnected
        </div>
      )}

      {isLoaded && map.current && (
        <>
          {showScanner && userId && (
            <div className="fixed inset-0 z-50 bg-black w-full h-full execution-layer">
              <div className="relative w-full h-full">
                <QRCodeScanner
                  eventId={eventId}
                  userId={userId} // 🟢 UPDATED
                  onCloseScanner={() => setShowScanner(false)}
                />
              </div>
            </div>
          )}

          {showFinishScanner && userId && (
            <div className="fixed inset-0 z-50 bg-black w-full h-full execution-layer">
              <div className="relative w-full h-full">
                <FinishGame
                  uid={userId} // 🟢 UPDATED
                  eventId={eventId}
                  initialValue={finishInitialValue}
                  onClose={() => {
                    setShowFinishScanner(false);
                    setFinishInitialValue(null);
                  }}
                />
              </div>
            </div>
          )}

          {showRoulette && (
            <div className="fixed inset-0 z-[9999] bg-white">
              <RoulettePage
                eventId={eventId}
                onClose={() => setShowRoulette(false)}
              />
            </div>
          )}

          <PlayerMarker map={map.current} eventId={eventId} iconUrl="/Mascot.png" />
          {isLoaded && <ProgressBar />}
          <Compass map={map.current} />
          <OneHandedMenu eventId={eventId as string} />
          <QRcodeMarkers map={map.current} eventId={eventId} userId={userId} /> {/* 🟢 UPDATED */}
          <GhumanteStall map={map.current} eventId={eventId} />
          <ServiceMarkers map={map.current} eventId={eventId} />
        </>
      )}
    </div>
  );
}