
// 'use client';

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import maplibregl from 'maplibre-gl';
// import { db, rtdb } from "@/lib/firebase";
// import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
// import { ref, get, update } from "firebase/database";
// import { useProgress } from './hooks/useProgress';

// // ─────────────────────────────────────────────
// // Types & Helpers ....
// // ─────────────────────────────────────────────
// interface Prize {
//   id: string;
//   name: string;
//   description: string;
//   image: string;
//   lat: number;
//   lng: number;
//   claimTime: number;
//   claimRadius: number;
// }

// interface PrizeSession {
//   phase: 'waiting' | 'spawned' | 'claimed' | 'expired';
//   waitingStartedAt?: string;
//   waitingDuration?: number;
//   spawnedAt?: string;
//   spawnDuration?: number;
//   prizeId?: string;
//   name?: string;
//   image?: string;
//   lat?: number;
//   lng?: number;
//   claimedAt?: string;
//   type?: string;
// }

// type UIPhase = 'idle' | 'waiting' | 'spawned' | 'claimed';

// const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//   const R = 6371e3; 
//   const φ1 = (lat1 * Math.PI) / 180;
//   const φ2 = (lat2 * Math.PI) / 180;
//   const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//   const Δλ = ((lon2 - lon1) * Math.PI) / 180;
//   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//             Math.cos(φ1) * Math.cos(φ2) *
//             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; 
// };

// export default function PrizeSystem({
//   map,
//   eventId,
// }: {
//   map: React.RefObject<maplibregl.Map | null>;
//   eventId: string;
// }) {
//   const { completedCount, userId } = useProgress(eventId);
//   const [phase, setPhase] = useState<UIPhase>('idle');
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activePrize, setActivePrize] = useState<Prize | null>(null);
//   const [showPopup, setShowPopup] = useState(false);
//   const [isClaiming, setIsClaiming] = useState(false);
//   const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);
//   const [prizes, setPrizes] = useState<Prize[]>([]);
  
//   // Admin-controlled settings
//   const [adminWaitTime, setAdminWaitTime] = useState<number | null>(null);
//   const [adminTaskRequired, setAdminTaskRequired] = useState<number | null>(null);
  
//   const [sessionLoaded, setSessionLoaded] = useState(false);
//   const [prizesLoaded, setPrizesLoaded] = useState(false);
//   const [restoredSession, setRestoredSession] = useState<PrizeSession | null>(null);

//   const playerPosRef = useRef<{ lat: number; lng: number } | null>(null);
//   const claimedIds = useRef<Set<string>>(new Set());
//   const sessionAlreadyExists = useRef(false);

//   const sessionDbPath = userId && eventId ? `eventsProgress/${eventId}/${userId}/prizeSession` : null;

//   const saveSession = useCallback(async (data: Partial<PrizeSession>) => {
//     if (!sessionDbPath) return;
//     await update(ref(rtdb, sessionDbPath), data);
//   }, [sessionDbPath]);

//   const saveUserInfoPrize = useCallback(async (status: 'claimed' | 'not_claimed') => {
//     if (!userId || !eventId) return;
//     await update(ref(rtdb, `eventsProgress/${eventId}/${userId}/userInfo`), { prize: status });
//   }, [userId, eventId]);

//   const updateProjection = useCallback(() => {
//     if (!map.current || !activePrize || phase !== 'spawned') return;
//     requestAnimationFrame(() => {
//       if (map.current && activePrize) {
//         try {
//           const pt = map.current.project([activePrize.lng, activePrize.lat]);
//           setScreenPos({ x: pt.x, y: pt.y });
//         } catch (_) {}
//       }
//     });
//   }, [map, activePrize, phase]);

//   useEffect(() => {
//     const inst = map.current;
//     if (!inst) return;
//     const events = ['move', 'zoom', 'rotate', 'pitch', 'resize', 'moveend', 'render'];
//     events.forEach(ev => inst.on(ev, updateProjection));
//     return () => events.forEach(ev => inst.off(ev, updateProjection));
//   }, [updateProjection, map]);

//   useEffect(() => {
//     if (!eventId) return;
    
//     // FETCH: Admin sets taskCountForPrize in Firestore
//     getDoc(doc(db, 'events', eventId)).then(snap => {
//       if (snap.exists()) {
//         const data = snap.data();
//         setAdminWaitTime((data.prizeWaitTime || 1) * 60);
//         // ADMIN CONFIG: How many tasks must be completed
//         setAdminTaskRequired(data.taskCountForPrize || 1); 
//       }
//     });

//     const watchId = navigator.geolocation.watchPosition(
//       pos => { playerPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
//       null,
//       { enableHighAccuracy: true },
//     );

//     const unsub = onSnapshot(collection(db, 'events', eventId, 'mapPrizes'), snap => {
//       setPrizes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prize)));
//       setPrizesLoaded(true);
//     });

//     return () => { navigator.geolocation.clearWatch(watchId); unsub(); };
//   }, [eventId]);

//   useEffect(() => {
//     if (!userId || !eventId || !sessionDbPath) return;
//     get(ref(rtdb, sessionDbPath)).then(snap => {
//       if (snap.exists()) setRestoredSession(snap.val() as PrizeSession);
//       setSessionLoaded(true);
//     });
//   }, [userId, eventId, sessionDbPath]);

//   useEffect(() => {
//     if (!sessionLoaded || !prizesLoaded || !restoredSession) return;
//     const session = restoredSession;
//     const now = Date.now();
//     sessionAlreadyExists.current = true;
//     if (session.phase === 'claimed') { setPhase('claimed'); return; }
//     if (session.phase === 'expired') return;

//     if (session.phase === 'waiting' && session.waitingStartedAt && session.waitingDuration) {
//       const elapsed = (now - new Date(session.waitingStartedAt).getTime()) / 1000;
//       const remaining = session.waitingDuration - elapsed;
//       if (remaining > 0) { setPhase('waiting'); setTimeLeft(Math.floor(remaining)); } else { doSpawn(session.prizeId); }
//       return;
//     }
//     if (session.phase === 'spawned' && session.spawnedAt && session.spawnDuration && session.prizeId) {
//       const elapsed = (now - new Date(session.spawnedAt).getTime()) / 1000;
//       const remaining = session.spawnDuration - elapsed;
//       if (remaining > 0) {
//         const prize = prizes.find(p => p.id === session.prizeId);
//         if (prize) {
//           setActivePrize(prize); setPhase('spawned'); setTimeLeft(Math.floor(remaining));
//           map.current?.flyTo({ center: [prize.lng, prize.lat], zoom: 18, duration: 2000 });
//         } else { saveSession({ phase: 'expired' }); saveUserInfoPrize('not_claimed'); }
//       } else { saveSession({ phase: 'expired' }); saveUserInfoPrize('not_claimed'); }
//     }
//   }, [sessionLoaded, prizesLoaded, restoredSession]);

//   const doSpawn = useCallback(async (preferredPrizeId?: string) => {
//     let prize = preferredPrizeId ? prizes.find(p => p.id === preferredPrizeId) : undefined;
//     if (!prize) {
//       const available = prizes.filter(p => !claimedIds.current.has(p.id));
//       if (available.length > 0) prize = available[Math.floor(Math.random() * available.length)];
//     }
//     if (prize) {
//       const spawnedAt = new Date().toISOString();
//       await saveSession({ phase: 'spawned', spawnedAt, spawnDuration: prize.claimTime || 300, prizeId: prize.id });
//       setActivePrize(prize); setPhase('spawned'); setTimeLeft(prize.claimTime || 300);
//       map.current?.flyTo({ center: [prize.lng, prize.lat], zoom: 18, duration: 2000 });
//     } else {
//       await saveSession({ phase: 'expired' }); await saveUserInfoPrize('not_claimed'); setPhase('idle');
//     }
//   }, [prizes, saveSession, saveUserInfoPrize, map]);

//   // TRIGGER: Now uses adminTaskRequired instead of hardcoded 1
//   useEffect(() => {
//     if (!sessionLoaded || !prizesLoaded || sessionAlreadyExists.current) return;
    
//     // Only proceed if admin values are loaded and completed count is high enough
//     if (
//         adminTaskRequired === null || 
//         completedCount < adminTaskRequired || 
//         adminWaitTime === null || 
//         prizes.length === 0
//     ) return;

//     if (phase !== 'idle') return;

//     sessionAlreadyExists.current = true;
//     const waitingStartedAt = new Date().toISOString();
//     saveSession({ phase: 'waiting', waitingStartedAt, waitingDuration: adminWaitTime }).then(() => {
//       setPhase('waiting'); setTimeLeft(adminWaitTime);
//     });
//   }, [completedCount, adminWaitTime, adminTaskRequired, phase, sessionLoaded, prizesLoaded, saveSession, prizes.length]);

//   useEffect(() => {
//     if (phase !== 'waiting' && phase !== 'spawned') return;
//     const interval = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           if (phase === 'waiting') { doSpawn(); } 
//           else { saveSession({ phase: 'expired' }); saveUserInfoPrize('not_claimed'); setPhase('idle'); setActivePrize(null); }
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [phase, doSpawn, saveSession, saveUserInfoPrize]);

//   const claimPrize = async (e?: React.MouseEvent) => {
//     if (e) { e.preventDefault(); e.stopPropagation(); }
//     if (!activePrize || !userId || isClaiming) return;
    
//     setIsClaiming(true);
//     try {
//       await saveSession({
//         phase: 'claimed',
//         name: activePrize.name,
//         image: activePrize.image,
//         claimedAt: new Date().toISOString(),
//         lat: activePrize.lat,
//         lng: activePrize.lng,
//         type: 'map_prize',
//       });
//       await saveUserInfoPrize('claimed');
      
//       claimedIds.current.add(activePrize.id);
//       setPhase('claimed');
//       setShowPopup(false);
//       setActivePrize(null);
//       alert('🎁 Congratulations! Prize claimed.');
//     } catch (err) { 
//       console.error(err);
//       alert('Claim failed. Please check your connection.'); 
//     } finally { 
//       setIsClaiming(false); 
//     }
//   };

//   return (
//     <>
//       {/* MARKER */}
//       {phase === 'spawned' && activePrize && screenPos && (
//         <div
//           style={{
//             position: 'absolute', left: 0, top: 0,
//             transform: `translate3d(${screenPos.x}px, ${screenPos.y}px, 0)`,
//             zIndex: 100,
//             pointerEvents: showPopup ? 'none' : 'auto',
//           }}
//         >
//           <div
//             onClick={e => {
//               e.stopPropagation();
//               if (!playerPosRef.current) return alert("Waiting for GPS...");
//               const dist = getDistance(playerPosRef.current.lat, playerPosRef.current.lng, activePrize.lat, activePrize.lng);
//               const radius = activePrize.claimRadius || 10;
//               if (dist <= radius) { setShowPopup(true); } 
//               else { alert(`Too far! Get within ${radius}m. (Current: ${Math.round(dist)}m)`); }
//             }}
//             style={{
//               width: '64px', height: '64px', background: 'white', border: '4px solid #fbbf24',
//               borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
//               boxShadow: '0 0 25px rgba(251, 191, 36, 0.8)', cursor: 'pointer',
//               transform: 'translate(-50%, -100%)',
//             }}
//           >
//             <img src={activePrize.image} style={{ width: '75%', height: '75%', objectFit: 'contain' }} alt="Prize" />
//             <div className="absolute inset-[-8px] border-2 border-yellow-400 rounded-full animate-ping opacity-30" />
//           </div>
//         </div>
//       )}

//       {/* TIMER */}
//       {(phase === 'waiting' || phase === 'spawned') && (
//         <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] pointer-events-none">
//           <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full border border-yellow-500/50 flex items-center gap-3">
//             <span className="text-xl">{phase === 'waiting' ? '⏳' : '🎁'}</span>
//             <span className="font-mono text-xl font-black text-yellow-400">
//               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
//             </span>
//           </div>
//         </div>
//       )}

//       {/* POPUP */}
//       {showPopup && activePrize && (
//          <div 
//            className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm" 
//            style={{ zIndex: 99999, pointerEvents: 'auto' }}
//            onClick={() => setShowPopup(false)}
//          >
//             <div 
//               className="bg-slate-900 border-2 border-yellow-500 rounded-[40px] p-8 w-full max-w-sm text-center" 
//               style={{ pointerEvents: 'auto' }}
//               onClick={e => e.stopPropagation()}
//             >
//                <img src={activePrize.image} className="w-28 h-28 mx-auto mb-6 object-contain" alt="Prize" />
//                <h2 className="text-yellow-400 font-black text-3xl mb-2 uppercase italic">{activePrize.name}</h2>
//                <p className="text-gray-300 text-sm mb-4">{activePrize.description}</p>
//                <button 
//                  onClick={(e) => claimPrize(e)} 
//                  disabled={isClaiming} 
//                  className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl mt-6 active:scale-95 transition-transform"
//                  style={{ cursor: 'pointer', position: 'relative', zIndex: 100000 }}
//                >
//                  {isClaiming ? 'CONNECTING...' : 'CONFIRM CLAIM'}
//                </button>
//             </div>
//          </div>
//       )}
//     </>
//   );
// }


'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { db, rtdb } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { ref, get, update } from "firebase/database";
import { useProgress } from './hooks/useProgress';

// ─────────────────────────────────────────────
// Types & Helpers
// ─────────────────────────────────────────────
interface Prize {
  id: string;
  name: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  claimTime: number;
  claimRadius: number;
}

interface PrizeSession {
  phase: 'waiting' | 'spawned' | 'claimed' | 'expired';
  waitingStartedAt?: string;
  waitingDuration?: number;
  spawnedAt?: string;
  spawnDuration?: number;
  prizeId?: string;
  name?: string;
  image?: string;
  lat?: number;
  lng?: number;
  claimedAt?: string;
  type?: string;
}

type UIPhase = 'idle' | 'waiting' | 'spawned' | 'claimed';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function PrizeSystem({
  map,
  eventId,
}: {
  map: React.RefObject<maplibregl.Map | null>;
  eventId: string;
}) {
  const { completedCount, userId } = useProgress(eventId);
  const [phase, setPhase] = useState<UIPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [activePrize, setActivePrize] = useState<Prize | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  
  const [adminWaitTime, setAdminWaitTime] = useState<number | null>(null);
  const [adminTaskRequired, setAdminTaskRequired] = useState<number | null>(null);
  
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [prizesLoaded, setPrizesLoaded] = useState(false);
  const [restoredSession, setRestoredSession] = useState<PrizeSession | null>(null);

  const playerPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const claimedIds = useRef<Set<string>>(new Set());
  const sessionAlreadyExists = useRef(false);

  const sessionDbPath = userId && eventId ? `eventsProgress/${eventId}/${userId}/prizeSession` : null;

  const saveSession = useCallback(async (data: Partial<PrizeSession>) => {
    if (!sessionDbPath) return; // Guard against null path
    await update(ref(rtdb, sessionDbPath), data);
  }, [sessionDbPath]);

  const saveUserInfoPrize = useCallback(async (status: 'claimed' | 'not_claimed') => {
    if (!userId || !eventId) return; // Guard against missing IDs
    await update(ref(rtdb, `eventsProgress/${eventId}/${userId}/userInfo`), { prize: status });
  }, [userId, eventId]);

  const updateProjection = useCallback(() => {
    if (!map.current || !activePrize || phase !== 'spawned') return;
    requestAnimationFrame(() => {
      // Re-verify existence inside the frame to prevent "stale prize" errors
      if (map.current && activePrize) {
        try {
          const pt = map.current.project([activePrize.lng, activePrize.lat]);
          setScreenPos({ x: pt.x, y: pt.y });
        } catch (_) {}
      }
    });
  }, [map, activePrize, phase]);

  useEffect(() => {
    const inst = map.current;
    if (!inst) return;
    const events = ['move', 'zoom', 'rotate', 'pitch', 'resize', 'moveend', 'render'];
    events.forEach(ev => inst.on(ev, updateProjection));
    return () => events.forEach(ev => inst.off(ev, updateProjection));
  }, [updateProjection, map]);

  useEffect(() => {
    if (!eventId) return;
    
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setAdminWaitTime((data.prizeWaitTime || 1) * 60);
        setAdminTaskRequired(data.taskCountForPrize || 1); 
      }
    });

    const watchId = navigator.geolocation.watchPosition(
      pos => { playerPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      null,
      { enableHighAccuracy: true },
    );

    const unsub = onSnapshot(collection(db, 'events', eventId, 'mapPrizes'), snap => {
      setPrizes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prize)));
      setPrizesLoaded(true);
    });

    return () => { navigator.geolocation.clearWatch(watchId); unsub(); };
  }, [eventId]);

  useEffect(() => {
    if (!sessionDbPath) return;
    get(ref(rtdb, sessionDbPath)).then(snap => {
      if (snap.exists()) setRestoredSession(snap.val() as PrizeSession);
      setSessionLoaded(true);
    });
  }, [sessionDbPath]);

  const doSpawn = useCallback(async (preferredPrizeId?: string) => {
    // We use the functional setter or a fresh lookup to ensure we don't use stale 'prizes'
    let prize = preferredPrizeId ? prizes.find(p => p.id === preferredPrizeId) : undefined;
    if (!prize) {
      const available = prizes.filter(p => !claimedIds.current.has(p.id));
      if (available.length > 0) prize = available[Math.floor(Math.random() * available.length)];
    }

    if (prize) {
      const spawnedAt = new Date().toISOString();
      const duration = prize.claimTime || 300;
      await saveSession({ phase: 'spawned', spawnedAt, spawnDuration: duration, prizeId: prize.id });
      setActivePrize(prize); 
      setPhase('spawned'); 
      setTimeLeft(duration);
      map.current?.flyTo({ center: [prize.lng, prize.lat], zoom: 18, duration: 2000 });
    } else {
      await saveSession({ phase: 'expired' }); 
      await saveUserInfoPrize('not_claimed'); 
      setPhase('idle');
    }
  }, [prizes, saveSession, saveUserInfoPrize, map]);

  useEffect(() => {
    if (!sessionLoaded || !prizesLoaded || !restoredSession) return;
    const session = restoredSession;
    const now = Date.now();
    sessionAlreadyExists.current = true;

    if (session.phase === 'claimed') { setPhase('claimed'); return; }
    if (session.phase === 'expired') { setPhase('idle'); return; }

    if (session.phase === 'waiting' && session.waitingStartedAt && session.waitingDuration) {
      const elapsed = (now - new Date(session.waitingStartedAt).getTime()) / 1000;
      const remaining = session.waitingDuration - elapsed;
      if (remaining > 0) { setPhase('waiting'); setTimeLeft(Math.floor(remaining)); } 
      else { doSpawn(session.prizeId); }
      return;
    }

    if (session.phase === 'spawned' && session.spawnedAt && session.spawnDuration && session.prizeId) {
      const elapsed = (now - new Date(session.spawnedAt).getTime()) / 1000;
      const remaining = session.spawnDuration - elapsed;
      const prize = prizes.find(p => p.id === session.prizeId);
      
      if (remaining > 0 && prize) {
          setActivePrize(prize); 
          setPhase('spawned'); 
          setTimeLeft(Math.floor(remaining));
          map.current?.flyTo({ center: [prize.lng, prize.lat], zoom: 18, duration: 2000 });
      } else { 
          saveSession({ phase: 'expired' }); 
          saveUserInfoPrize('not_claimed'); 
          setPhase('idle');
      }
    }
  }, [sessionLoaded, prizesLoaded, restoredSession, doSpawn, map, prizes, saveSession, saveUserInfoPrize]);

  useEffect(() => {
    if (!sessionLoaded || !prizesLoaded || sessionAlreadyExists.current) return;
    
    if (
        adminTaskRequired === null || 
        completedCount < adminTaskRequired || 
        adminWaitTime === null || 
        prizes.length === 0 ||
        phase !== 'idle'
    ) return;

    sessionAlreadyExists.current = true;
    const waitingStartedAt = new Date().toISOString();
    saveSession({ phase: 'waiting', waitingStartedAt, waitingDuration: adminWaitTime }).then(() => {
      setPhase('waiting'); 
      setTimeLeft(adminWaitTime);
    });
  }, [completedCount, adminWaitTime, adminTaskRequired, phase, sessionLoaded, prizesLoaded, saveSession, prizes.length]);

  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'spawned') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (phase === 'waiting') { doSpawn(); } 
          else { 
            saveSession({ phase: 'expired' }); 
            saveUserInfoPrize('not_claimed'); 
            setPhase('idle'); 
            setActivePrize(null); 
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, doSpawn, saveSession, saveUserInfoPrize]);

  const claimPrize = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!activePrize || !userId || isClaiming) return;
    
    setIsClaiming(true);
    try {
      await saveSession({
        phase: 'claimed',
        name: activePrize.name,
        image: activePrize.image,
        claimedAt: new Date().toISOString(),
        lat: activePrize.lat,
        lng: activePrize.lng,
        type: 'map_prize',
      });
      await saveUserInfoPrize('claimed');
      
      claimedIds.current.add(activePrize.id);
      setPhase('claimed');
      setShowPopup(false);
      setActivePrize(null);
      alert('🎁 Congratulations! Prize claimed.');
    } catch (err) { 
      console.error(err);
      alert('Claim failed. Please check your connection.'); 
    } finally { 
      setIsClaiming(false); 
    }
  };

  return (
    <>
      {phase === 'spawned' && activePrize && screenPos && (
        <div
          style={{
            position: 'absolute', left: 0, top: 0,
            transform: `translate3d(${screenPos.x}px, ${screenPos.y}px, 0)`,
            zIndex: 100,
            pointerEvents: showPopup ? 'none' : 'auto',
          }}
        >
          <div
            onClick={e => {
              e.stopPropagation();
              if (!playerPosRef.current) return alert("Waiting for GPS...");
              const dist = getDistance(playerPosRef.current.lat, playerPosRef.current.lng, activePrize.lat, activePrize.lng);
              const radius = activePrize.claimRadius || 10;
              if (dist <= radius) { setShowPopup(true); } 
              else { alert(`Too far! Get within ${radius}m. (Current: ${Math.round(dist)}m)`); }
            }}
            style={{
              width: '64px', height: '64px', background: 'white', border: '4px solid #fbbf24',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 25px rgba(251, 191, 36, 0.8)', cursor: 'pointer',
              transform: 'translate(-50%, -100%)',
            }}
          >
            <img src={activePrize.image} style={{ width: '75%', height: '75%', objectFit: 'contain' }} alt="Prize" />
            <div className="absolute inset-[-8px] border-2 border-yellow-400 rounded-full animate-ping opacity-30" />
          </div>
        </div>
      )}

      {(phase === 'waiting' || phase === 'spawned') && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full border border-yellow-500/50 flex items-center gap-3">
            <span className="text-xl">{phase === 'waiting' ? '⏳' : '🎁'}</span>
            <span className="font-mono text-xl font-black text-yellow-400">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {showPopup && activePrize && (
         <div 
           className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm" 
           style={{ zIndex: 99999, pointerEvents: 'auto' }}
           onClick={() => setShowPopup(false)}
         >
            <div 
              className="bg-slate-900 border-2 border-yellow-500 rounded-[40px] p-8 w-full max-w-sm text-center" 
              style={{ pointerEvents: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
               <img src={activePrize.image} className="w-28 h-28 mx-auto mb-6 object-contain" alt="Prize" />
               <h2 className="text-yellow-400 font-black text-3xl mb-2 uppercase italic">{activePrize.name}</h2>
               <p className="text-gray-300 text-sm mb-4">{activePrize.description}</p>
               <button 
                 onClick={(e) => claimPrize(e)} 
                 disabled={isClaiming} 
                 className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl mt-6 active:scale-95 transition-transform"
                 style={{ cursor: 'pointer', position: 'relative', zIndex: 100000 }}
               >
                 {isClaiming ? 'CONNECTING...' : 'CONFIRM CLAIM'}
               </button>
            </div>
         </div>
      )}
    </>
  );
}