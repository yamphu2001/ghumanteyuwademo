
//sumit "use client";
// import React, { useRef, useState, useEffect } from 'react';
// import styles from './Map.module.css';
// import { useMapInit } from '@/features/forevent/frontend/play/logic';
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { rtdb } from "@/lib/firebase";
// import { ref, onValue } from "firebase/database";
// import { motion } from "framer-motion";
// import { Trophy } from "lucide-react";
// import { useRouter } from "next/navigation";

// import Compass from '@/features/forevent/frontend/play/Compass/Compass';
// import PlayerMarker from '@/features/forevent/frontend/play/PlayerMarker/PlayerMarker';
// import LocationMarkers from '@/features/forevent/frontend/play/Markers/LocationMarkers/LocationMarkers';
// import SpecialLocationMarkers from '@/features/forevent/frontend/play/Markers/SpecialMarkers/SpecialMarkers';
// import MuseumMarkers from '../Markers/QRcodeMarkers/QRcodeMarkers';
// import GridPlot from '@/features/forevent/frontend/play/GridPlot/GridPlot';
// import ProgressBar from '@/features/forevent/frontend/play/ProgressBar/ProgressBar';
// import StallMarker from '../Markers/StallMarkers/stall';
// import PrizeSystem from '@/app/eventsmaker/[eventId]/prizes/PrizeSystem';
// import RoulettePage from '@/app/eventsmaker/[eventId]/roulette/page';
// import ServiceMarkers from '@/features/forevent/frontend/play/Markers/ServiceMarkers/ServiceMarker';

// interface MapContainerProps {
//   eventId: string;
// }

// function sumPoints(categoryData: Record<string, any> | null | undefined): number {
//   if (!categoryData || typeof categoryData !== "object") return 0;
//   return Object.values(categoryData).reduce(
//     (acc, marker: any) => acc + (Number(marker?.pointsEarned) || 0),
//     0,
//   );
// }

// function timeToSeconds(timeStr: string | null | undefined): number {
//   if (!timeStr) return 999999;
//   const minutes = timeStr.match(/(\d+)m/);
//   const seconds = timeStr.match(/(\d+)s/);
//   const m = minutes ? parseInt(minutes[1], 10) : 0;
//   const s = seconds ? parseInt(seconds[1], 10) : 0;
//   return m * 60 + s;
// }

// export default function MapContainer({ eventId }: MapContainerProps) {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const { map, isLoaded } = useMapInit(mapContainer, eventId);
//   const [showRoulette, setShowRoulette] = useState(false);
//   const [playerRank, setPlayerRank] = useState<number | null>(null);
//   const [uid, setUid] = useState<string | null>(null);
//   const router = useRouter();

//   // 2. Fetch the UID when the component mounts
//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUid(user.uid);
//       }
//     });
//     return () => unsubscribeAuth();
//   }, []);

//   // 3. Compute the live rank for the current user from eventsProgress data
//   useEffect(() => {
//     if (!eventId || !uid) return;

//     const eventRef = ref(rtdb, `eventsProgress/${eventId}`);
//     const unsubscribe = onValue(eventRef, (snapshot) => {
//       const allData = snapshot.val() || {};
//       const entries = Object.entries(allData).map(([userId, data]: [string, any]) => {
//         const locationPoints = sumPoints(data?.locationMarkers);
//         const qrPoints = sumPoints(data?.qrcodemarkers);
//         const specialPoints = sumPoints(data?.specialMarkers);
//         const quizPoints = Number(data?.quizResult?.totalScore) || 0;
//         const finishTime = data?.scannedTimes?.timeTaken || null;
//         return {
//           uid: userId,
//           totalPoints: locationPoints + qrPoints + specialPoints + quizPoints,
//           timeSeconds: timeToSeconds(finishTime),
//         };
//       });

//       entries.sort((a, b) => {
//         if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
//         return a.timeSeconds - b.timeSeconds;
//       });

//       let currentRank = 1;
//       let myRank: number | null = null;
//       entries.forEach((entry, index) => {
//         if (
//           index > 0 &&
//           (entry.totalPoints < entries[index - 1].totalPoints || entry.timeSeconds > entries[index - 1].timeSeconds)
//         ) {
//           currentRank = index + 1;
//         }
//         if (entry.uid === uid) {
//           myRank = currentRank;
//         }
//       });

//       if (myRank !== null) {
//         setPlayerRank(myRank);
//       }
//     });

//     return () => unsubscribe();
//   }, [eventId, uid]);

//   return (
//     <div className={styles.mapWrapper}>

//       {/* MapLibre mounts here — React never touches the inside of this div */}
//       <div ref={mapContainer} className={styles.mapCanvas} />

      
//       {isLoaded && map.current && (
//         <div className={styles.overlayLayer}>
//           <GridPlot map={map} />
//           <Compass map={map} />
//           <StallMarker map={map} eventId={eventId} />
//           <PlayerMarker map={map} imagePath="/play/PlayerMarker/Mascot.png" />
//           <LocationMarkers map={map} eventId={eventId} />
//           <SpecialLocationMarkers map={map} eventId={eventId} />
//           <MuseumMarkers map={map} eventId={eventId} />
//           <PrizeSystem map={map} eventId={eventId} />
//           <ServiceMarkers map={map} eventId={eventId} />
//         </div>
//       )}

//       {/* HUD elements — above both layers */}
//       {isLoaded && <ProgressBar />}

//       {playerRank !== null && (
//         <div className={styles.rankWidget}>
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             className={styles.rankPanel}
//             onClick={() => router.push(`/eventsmaker/${eventId}/leaderboard`)}
//             style={{ cursor: 'pointer' }}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(event) => {
//               if (event.key === 'Enter' || event.key === ' ') {
//                 router.push(`/eventsmaker/${eventId}/leaderboard`);
//               }
//             }}
//           >
//             <div className={styles.rankIcon}>
//               <Trophy size={18} />
//             </div>
//             <div className={styles.rankText}>
//               <p className={styles.rankLabel}>Your Rank</p>
//               <p className={styles.rankValue}>#{playerRank}</p>
//             </div>
//           </motion.div>
//         </div>
//       )}

//       {showRoulette && (
//         <div className="fixed inset-0 z-[9999] bg-indigo-600">
//           <RoulettePage
//             {...({ eventId, onClose: () => setShowRoulette(false) } as any)}
//           />
//         </div>
//       )}
//     </div>
//   );
// }


"use client";
import React, { useRef, useState, useEffect } from 'react';
import styles from './Map.module.css';
import { useMapInit } from '@/features/forevent/frontend/play/logic';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

import Compass from '@/features/forevent/frontend/play/Compass/Compass';
import PlayerMarker from '@/features/forevent/frontend/play/PlayerMarker/PlayerMarker';
import LocationMarkers from '@/features/forevent/frontend/play/Markers/LocationMarkers/LocationMarkers';
import SpecialLocationMarkers from '@/features/forevent/frontend/play/Markers/SpecialMarkers/SpecialMarkers';
import MuseumMarkers from '../Markers/QRcodeMarkers/QRcodeMarkers';
import GridPlot from '@/features/forevent/frontend/play/GridPlot/GridPlot';
import ProgressBar from '@/features/forevent/frontend/play/ProgressBar/ProgressBar';
import StallMarker from '../Markers/StallMarkers/stall';
import PrizeSystem from '@/app/eventsmaker/[eventId]/prizes/PrizeSystem';
import RoulettePage from '@/app/eventsmaker/[eventId]/roulette/page';
import ServiceMarkers from '@/features/forevent/frontend/play/Markers/ServiceMarkers/ServiceMarker';
import Marker3DPlotter from '@/features/forevent/frontend/play/Markers/3dMarkers/3dmarkers';

interface MapContainerProps {
  eventId: string;
}

function sumPoints(categoryData: Record<string, any> | null | undefined): number {
  if (!categoryData || typeof categoryData !== "object") return 0;
  return Object.values(categoryData).reduce(
    (acc, marker: any) => acc + (Number(marker?.pointsEarned) || 0),
    0,
  );
}

function timeToSeconds(timeStr: string | null | undefined): number {
  if (!timeStr) return 999999;
  const minutes = timeStr.match(/(\d+)m/);
  const seconds = timeStr.match(/(\d+)s/);
  const m = minutes ? parseInt(minutes[1], 10) : 0;
  const s = seconds ? parseInt(seconds[1], 10) : 0;
  return m * 60 + s;
}

export default function MapContainer({ eventId }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useMapInit(mapContainer, eventId);
  const [showRoulette, setShowRoulette] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Detect mobile device and handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Fetch the UID when the component mounts
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 3. Compute the live rank for the current user from eventsProgress data
  useEffect(() => {
    if (!eventId || !uid) return;

    const eventRef = ref(rtdb, `eventsProgress/${eventId}`);
    const unsubscribe = onValue(eventRef, (snapshot) => {
      const allData = snapshot.val() || {};
      const entries = Object.entries(allData).map(([userId, data]: [string, any]) => {
        const locationPoints = sumPoints(data?.locationMarkers);
        const qrPoints = sumPoints(data?.qrcodemarkers);
        const specialPoints = sumPoints(data?.specialMarkers);
        const quizPoints = Number(data?.quizResult?.totalScore) || 0;
        const finishTime = data?.scannedTimes?.timeTaken || null;
        return {
          uid: userId,
          totalPoints: locationPoints + qrPoints + specialPoints + quizPoints,
          timeSeconds: timeToSeconds(finishTime),
        };
      });

      entries.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.timeSeconds - b.timeSeconds;
      });

      let currentRank = 1;
      let myRank: number | null = null;
      entries.forEach((entry, index) => {
        if (
          index > 0 &&
          (entry.totalPoints < entries[index - 1].totalPoints || entry.timeSeconds > entries[index - 1].timeSeconds)
        ) {
          currentRank = index + 1;
        }
        if (entry.uid === uid) {
          myRank = currentRank;
        }
      });

      if (myRank !== null) {
        setPlayerRank(myRank);
      }
    });

    return () => unsubscribe();
  }, [eventId, uid]);

  return (
    <div className={styles.mapWrapper}>

      {/* MapLibre mounts here — React never touches the inside of this div */}
      <div ref={mapContainer} className={styles.mapCanvas} />

      
      {isLoaded && map.current && (
        <div className={styles.overlayLayer}>
          <GridPlot map={map} />
          <Compass map={map} />
          <StallMarker map={map} eventId={eventId} />
          <PlayerMarker map={map} imagePath="/play/PlayerMarker/Mascot.png" />
          <LocationMarkers map={map} eventId={eventId} />
          <SpecialLocationMarkers map={map} eventId={eventId} />
          <MuseumMarkers map={map} eventId={eventId} />
          <PrizeSystem map={map} eventId={eventId} />
          <ServiceMarkers map={map} eventId={eventId} />
          {isLoaded && map.current && (
        <Marker3DPlotter map={map.current} eventId={eventId} />
      )}
        </div>
      )}

      {/* HUD elements — above both layers */}
      {isLoaded && <ProgressBar />}

      {/* {playerRank !== null && (
        <div className={styles.rankWidget}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.rankPanel}
            onClick={() => router.push(`/eventsmaker/${eventId}/leaderboard`)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                router.push(`/eventsmaker/${eventId}/leaderboard`);
              }
            }}
          >
            <div className={styles.rankIcon}>
              <Trophy size={isMobile ? 14 : 18} />
            </div>
            <div className={styles.rankText}>
              <p className={styles.rankLabel}>Your Rank</p>
              <p className={styles.rankValue}>#{playerRank}</p>
            </div>
          </motion.div>
        </div>
      )} */}

      {showRoulette && (
        <div className="fixed inset-0 z-[9999] bg-indigo-600">
          <RoulettePage
            {...({ eventId, onClose: () => setShowRoulette(false) } as any)}
          />
        </div>
      )}
    </div>
  );
}