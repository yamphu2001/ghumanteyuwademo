
"use client";
import React, { useRef, useState, useEffect } from 'react';
import styles from './Map.module.css';
import { useMapInit } from '@/features/forevent/frontend/play/logic';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

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

interface MapContainerProps {
  eventId: string;
}

export default function MapContainer({ eventId }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useMapInit(mapContainer, eventId);
  const [showRoulette, setShowRoulette] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | string | null>(null);
  const [uid, setUid] = useState<string | null>(null); // 1. Added state for uid

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

  // 3. Now the rank listener will work because uid is available
  useEffect(() => {
    if (!eventId || !uid) return;

    const rankRef = ref(rtdb, `eventsProgress/${eventId}/${uid}/userInfo/rank`);
    
    const unsubscribeRank = onValue(rankRef, (snapshot) => {
      const rankValue = snapshot.val();
      if (rankValue !== null) {
        setPlayerRank(rankValue);
      }
    });

    return () => unsubscribeRank();
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
        </div>
      )}

      {/* HUD elements — above both layers */}
      {isLoaded && <ProgressBar />}

      {playerRank && (
        <div className={styles.rankWidget}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.rankPanel}
          >
            <div className={styles.rankIcon}>
              <Trophy size={18} />
            </div>
            <div className={styles.rankText}>
              <p className={styles.rankLabel}>Your Rank</p>
              <p className={styles.rankValue}>#{playerRank}</p>
            </div>
          </motion.div>
        </div>
      )}

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