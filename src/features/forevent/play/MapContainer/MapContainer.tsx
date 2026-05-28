
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
//   const [showRoulette, setShowRoulette] = useState<boolean>(false); // FIX: Declared missing state
//   const [finishInitialValue, setFinishInitialValue] = useState<string | null>(null);

//   const currentUser = { uid: "UZ31CJRUfFOsJJbb0XbqfLNe4qq2" };

//   const { map, isLoaded } = useMapInit(mapContainer, eventId);

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

//     // Callback event listener allowing items on your map layers to explicitly open roulette
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

//   return (
//     <div className={styles.mapWrapper}>
//       <div ref={mapContainer} className={styles.mapCanvas} />

//       {isLoaded && map.current && (
//         <>
//           {/* Marker QR scanner */}
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

//           {/* Finish game scanner */}
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

//           {/* Inline Overlay Hook for Roulette */}
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
import RoulettePage from '@/app/eventsmaker/[eventId]/roulette/page';


interface MapContainerProps {
  eventId: string;
}

export default function MapContainer({ eventId }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showFinishScanner, setShowFinishScanner] = useState<boolean>(false);
  const [showRoulette, setShowRoulette] = useState<boolean>(false); 
  const [finishInitialValue, setFinishInitialValue] = useState<string | null>(null);

  const currentUser = { uid: "UZ31CJRUfFOsJJbb0XbqfLNe4qq2" };

  const { map, isLoaded } = useMapInit(mapContainer, eventId);

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

  return (
    <div className={styles.mapWrapper}>
      {/* Map canvas backdrop */}
      <div ref={mapContainer} className={styles.mapCanvas} />


      {isLoaded && map.current && (
        <>
          {/* Marker QR scanner */}
          {showScanner && currentUser?.uid && (
            <div className="fixed inset-0 z-50 bg-black w-full h-full execution-layer">
              <div className="relative w-full h-full">
                <QRCodeScanner
                  eventId={eventId}
                  userId={currentUser.uid}
                  onCloseScanner={() => setShowScanner(false)}
                />
              </div>
            </div>
          )}

          {/* Finish game scanner */}
          {showFinishScanner && currentUser?.uid && (
            <div className="fixed inset-0 z-50 bg-black w-full h-full execution-layer">
              <div className="relative w-full h-full">
                <FinishGame
                  uid={currentUser.uid}
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

          {/* Inline Overlay Hook for Roulette */}
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
          <QRcodeMarkers map={map.current} eventId={eventId} userId={currentUser.uid} />
          <GhumanteStall map={map.current} eventId={eventId} />
          <ServiceMarkers map={map.current} eventId={eventId} />
        </>
      )}
    </div>
  );
}