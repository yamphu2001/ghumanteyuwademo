
// 'use client';

// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import Image from 'next/image';
// import styles from './qrscanner.module.css';
// import { scanFrameLogic } from './logic';
// import { db, auth } from '@/lib/firebase';
// import { handleRaceScan } from "./raceService";
// import { handleRouletteScan } from "./endgame";
// import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
// import { recordQRScan, type QRcodeMarkerData } from '@/features/forevent/frontend/play/Markers/QRcodeMarkers/Logic';

// interface QRScannerProps {
//   eventId: string;
//   onScanSuccess?: (marker: QRcodeMarkerData) => void;
// }

// type ScanStatus = 'scanning' | 'checking' | 'success' | 'error';

// const RACE_QR_PREFIX = "https://ghum@nteYuwa:/race";
// const END_QR_PREFIX = "ghumanteyuwa.com/eventsmaker/";

// // Shared normalization
// export function normalizeQrId(val: string): string {
//   return val.trim().replace(/\/+$/, '').toLowerCase();
// }

// const QRScanner = ({ onScanSuccess, eventId }: QRScannerProps) => {
//   const [scanStatus, setScanStatus] = useState<ScanStatus>('scanning');
//   const [message, setMessage] = useState<string | null>(null);
//   const [showEndPopup, setShowEndPopup] = useState(false);
//   const [endStats, setEndStats] = useState<any>(null);
//   const [isReady, setIsReady] = useState(false);

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const requestRef = useRef<number | null>(null);
//   const statusRef = useRef<ScanStatus>('scanning');
//   const lastReadRef = useRef('');
//   const currentUserRef = useRef<any>(null);

//   const stopCamera = useCallback(() => {
//     if (videoRef.current?.srcObject) {
//       const stream = videoRef.current.srcObject as MediaStream;
//       stream.getTracks().forEach(track => track.stop());
//       videoRef.current.srcObject = null;
//     }
//     if (requestRef.current) {
//       cancelAnimationFrame(requestRef.current);
//       requestRef.current = null;
//     }
//   }, []);

//   const setStatus = useCallback((s: ScanStatus) => {
//     statusRef.current = s;
//     setScanStatus(s);
//   }, []);

//   const handleScannedValue = useCallback(async (val: string, tickFn: FrameRequestCallback) => {
//     if (!eventId) return;
//     setStatus('checking');

//     // We keep the original value for exact DB matching
//     const originalVal = val.trim();
//     const cleanVal = normalizeQrId(val);

//     try {
//       if (!currentUserRef.current) {
//         const firebaseUser = auth.currentUser;
//         if (firebaseUser) {
//           const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
//           currentUserRef.current = {
//             uid: firebaseUser.uid,
//             username: snap.data()?.username?.trim() || firebaseUser.email || 'anonymous',
//           };
//         }
//       }
//       const user = currentUserRef.current;

//       // 1. CHECK END GAME (Matches URL patterns)
//       if (cleanVal.includes(END_QR_PREFIX.toLowerCase())) {
//         const res = await handleRouletteScan(user.uid, eventId, cleanVal);
//         if (res.success && res.showEndPopup) {
//           setMessage(res.message);
//           setStatus('success');
//           setEndStats(res.stats);
//           setShowEndPopup(true);
//           stopCamera();
//           return;
//         } else {
//           throw new Error(res.message);
//         }
//       }

//       // 2. CHECK RACE START
//       if (cleanVal.startsWith(normalizeQrId(RACE_QR_PREFIX))) {
//         const res = await handleRaceScan(user.uid, cleanVal);
//         if (res.success) {
//           setMessage(res.message);
//           setStatus('success');
//           setTimeout(() => { stopCamera(); window.dispatchEvent(new CustomEvent('close-scanner')); }, 1500);
//           return;
//         } else {
//           throw new Error(res.message);
//         }
//       }

//       // 3. CHECK STANDARD MARKERS (The Fix)
//       // Attempt 1: Exact match (case sensitive)
//       // Attempt 2: Normalized match (lowercase)
//       const markersRef = collection(db, 'events', eventId, 'qrcodemarkers');
//       const qExact = query(markersRef, where('qrCodeId', '==', originalVal));
//       const qNormal = query(markersRef, where('qrCodeId', '==', cleanVal));

//       let querySnap = await getDocs(qExact);
//       if (querySnap.empty) {
//         querySnap = await getDocs(qNormal);
//       }

//       if (!querySnap.empty) {
//         const marker = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as QRcodeMarkerData;
//         await recordQRScan(marker, user.username, user.uid, eventId);
//         setStatus('success');
//         stopCamera();
//         window.dispatchEvent(new CustomEvent('qr-scan-success', { detail: { markerId: marker.id, marker, collectionName: 'qrcodemarkers' } }));
//         if (onScanSuccess) onScanSuccess(marker);
//         window.dispatchEvent(new CustomEvent('close-scanner'));
//       } else {
//         setMessage("Unknown Marker");
//         setStatus('error');
//         setTimeout(() => {
//           setStatus('scanning');
//           lastReadRef.current = '';
//           requestRef.current = requestAnimationFrame(tickFn);
//         }, 2500);
//       }

//     } catch (err: any) {
//       setMessage(err.message || "Scan failed");
//       setStatus('error');
//       setTimeout(() => { setStatus('scanning'); lastReadRef.current = ''; requestRef.current = requestAnimationFrame(tickFn); }, 3000);
//     }
//   }, [eventId, onScanSuccess, setStatus, stopCamera]);

//   const tick: FrameRequestCallback = useCallback(() => {
//     if (statusRef.current !== 'scanning') return;
//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
//       const result = scanFrameLogic(video, canvas);
//       if (result && result !== lastReadRef.current) {
//         lastReadRef.current = result;
//         handleScannedValue(result, tick);
//         return;
//       }
//     }
//     requestRef.current = requestAnimationFrame(tick);
//   }, [handleScannedValue]);

//   useEffect(() => {
//     navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
//       .then(stream => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           requestRef.current = requestAnimationFrame(tick);
//           setIsReady(true);
//         }
//       }).catch(() => setStatus('error'));
//     return () => stopCamera();
//   }, [tick, stopCamera]);

//   return (
//     <div className={`${styles.container} ${isReady ? styles.active : styles.inactive}`}>
//       <video ref={videoRef} autoPlay playsInline muted className={`${styles.cameraVideo} absolute inset-0`} />
//       <canvas ref={canvasRef} className="hidden" />

//       <div className={styles.uiOverlay}>
//         <div className={styles.uiBox}>
//           <div className={styles.scanSquare}>
//             <div className={styles.scanCorners}>
//               <div className={`${styles.corner} ${styles.topL}`} />
//               <div className={`${styles.corner} ${styles.topR}`} />
//               <div className={`${styles.corner} ${styles.botL}`} />
//               <div className={`${styles.corner} ${styles.botR}`} />
//             </div>
//             <div className={styles.laserLine} />
//           </div>
//           <div className={`${styles.hand} ${styles.leftHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
//             <Image src="/images/QRScanner/Left.png" alt="Left hand" fill className={styles.handImageBottomRight} priority />
//           </div>
//           <div className={`${styles.hand} ${styles.rightHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
//             <Image src="/images/QRScanner/Right.png" alt="Right hand" fill className={styles.handImageTopLeft} priority />
//           </div>
//         </div>
//       </div>

//       {message && (
//         <div className={`absolute top-10 px-6 py-2 border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 ${scanStatus === 'error' ? 'bg-red-500 text-white' : 'bg-green-400'}`}>
//           {message}
//         </div>
//       )}

//       {showEndPopup && (
//         <div className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4">
//           <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm">
//             <h2 className="text-3xl font-black italic uppercase text-center mb-4">Final Stats</h2>

//             <div className="bg-gray-100 p-4 border-2 border-black space-y-2 font-bold mb-6">
//               <div className="flex justify-between">
//                 <span>TIME:</span>
//                 <span className="text-blue-600 uppercase">{endStats?.totalTime}</span>
//               </div>
//               <div>
//                 <div className="flex justify-between mb-1">
//                   <span>PROGRESS:</span>
//                   <span>{endStats?.completionRate}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2.5">
//                   <div
//                     className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
//                     style={{ width: `${Math.min(endStats?.completionRate || 0, 100)}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col gap-3">
//               <button
//                 onClick={() => window.location.href = `/eventsmaker/${eventId}/quiz`}
//                 disabled={!endStats?.canQuiz}
//                 className={`w-full py-4 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all ${endStats?.canQuiz ? 'bg-yellow-400' : 'bg-gray-200 text-gray-400'
//                   }`}
//               >
//                 {endStats?.canQuiz ? "Start Quiz" : "Quiz (Need 80% Progress)"}
//               </button>

//               <button
//                 onClick={() => window.location.href = `/eventsmaker/${eventId}/roulette`}
//                 className="w-full py-4 bg-green-400 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
//               >
//                 Spin Wheel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default QRScanner;


'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './qrscanner.module.css';
import { scanFrameLogic } from './logic';
import { db, auth } from '@/lib/firebase';
import { handleRaceScan } from "./raceService";
import { handleRouletteScan } from "./endgame";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { recordQRScan, type QRcodeMarkerData } from '@/features/forevent/frontend/play/Markers/QRcodeMarkers/Logic';

interface QRScannerProps {
  eventId: string;
  onScanSuccess?: (marker: QRcodeMarkerData) => void;
}

type ScanStatus = 'scanning' | 'checking' | 'success' | 'error';

const RACE_QR_PREFIX = "https://ghum@nteYuwa:/race";
const END_QR_PREFIX = "ghumanteyuwa.com/eventsmaker/";

// Shared normalization
export function normalizeQrId(val: string): string {
  return val.trim().replace(/\/+$/, '').toLowerCase();
}

const QRScanner = ({ onScanSuccess, eventId }: QRScannerProps) => {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('scanning');
  const [message, setMessage] = useState<string | null>(null);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [endStats, setEndStats] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const statusRef = useRef<ScanStatus>('scanning');
  const lastReadRef = useRef('');
  const currentUserRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const setStatus = useCallback((s: ScanStatus) => {
    statusRef.current = s;
    setScanStatus(s);
  }, []);

  const handleScannedValue = useCallback(async (val: string, tickFn: FrameRequestCallback) => {
    if (!eventId) return;
    setStatus('checking');

    // We keep the original value for exact DB matching
    const originalVal = val.trim();
    const cleanVal = normalizeQrId(val);

    try {
      if (!currentUserRef.current) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          currentUserRef.current = {
            uid: firebaseUser.uid,
            username: snap.data()?.username?.trim() || firebaseUser.email || 'anonymous',
          };
        }
      }
      const user = currentUserRef.current;

      // 1. CHECK END GAME (Matches URL patterns)
      if (cleanVal.includes(END_QR_PREFIX.toLowerCase())) {
        const res = await handleRouletteScan(user.uid, eventId, cleanVal);
        if (res.success && res.showEndPopup) {
          setMessage(res.message);
          setStatus('success');
          setEndStats(res.stats);
          setShowEndPopup(true);
          stopCamera();
          return;
        } else {
          throw new Error(res.message);
        }
      }

      // 2. CHECK RACE START
      if (cleanVal.startsWith(normalizeQrId(RACE_QR_PREFIX))) {
        const res = await handleRaceScan(user.uid, cleanVal);
        if (res.success) {
          setMessage(res.message);
          setStatus('success');
          setTimeout(() => { stopCamera(); window.dispatchEvent(new CustomEvent('close-scanner')); }, 1500);
          return;
        } else {
          throw new Error(res.message);
        }
      }

      // 3. CHECK STANDARD MARKERS (The Fix)
      // Attempt 1: Exact match (case sensitive)
      // Attempt 2: Normalized match (lowercase)
      const markersRef = collection(db, 'events', eventId, 'qrcodemarkers');
      const qExact = query(markersRef, where('qrCodeId', '==', originalVal));
      const qNormal = query(markersRef, where('qrCodeId', '==', cleanVal));

      let querySnap = await getDocs(qExact);
      if (querySnap.empty) {
        querySnap = await getDocs(qNormal);
      }

      if (!querySnap.empty) {
        const marker = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as QRcodeMarkerData;
        await recordQRScan(marker, user.username, user.uid, eventId);
        setStatus('success');
        stopCamera();
        window.dispatchEvent(new CustomEvent('qr-scan-success', { detail: { markerId: marker.id, marker, collectionName: 'qrcodemarkers' } }));
        if (onScanSuccess) onScanSuccess(marker);
        window.dispatchEvent(new CustomEvent('close-scanner'));
      } else {
        setMessage("Unknown Marker");
        setStatus('error');
        setTimeout(() => {
          setStatus('scanning');
          lastReadRef.current = '';
          requestRef.current = requestAnimationFrame(tickFn);
        }, 2500);
      }

    } catch (err: any) {
      setMessage(err.message || "Scan failed");
      setStatus('error');
      setTimeout(() => { setStatus('scanning'); lastReadRef.current = ''; requestRef.current = requestAnimationFrame(tickFn); }, 3000);
    }
  }, [eventId, onScanSuccess, setStatus, stopCamera]);

  const tick: FrameRequestCallback = useCallback(() => {
    if (statusRef.current !== 'scanning') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const result = scanFrameLogic(video, canvas);
      if (result && result !== lastReadRef.current) {
        lastReadRef.current = result;
        handleScannedValue(result, tick);
        return;
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [handleScannedValue]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          requestRef.current = requestAnimationFrame(tick);
          setIsReady(true);
        }
      }).catch(() => setStatus('error'));
    return () => stopCamera();
  }, [tick, stopCamera]);

  return (
    <div className={`${styles.container} ${isReady ? styles.active : styles.inactive}`}>
      <video ref={videoRef} autoPlay playsInline muted className={`${styles.cameraVideo} absolute inset-0`} />
      <canvas ref={canvasRef} className="hidden" />

      <div className={styles.uiOverlay}>
        <div className={styles.uiBox}>
          <div className={styles.scanSquare}>
            <div className={styles.scanCorners}>
              <div className={`${styles.corner} ${styles.topL}`} />
              <div className={`${styles.corner} ${styles.topR}`} />
              <div className={`${styles.corner} ${styles.botL}`} />
              <div className={`${styles.corner} ${styles.botR}`} />
            </div>
            <div className={styles.laserLine} />
          </div>
          <div className={`${styles.hand} ${styles.leftHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
            <Image src="/images/QRScanner/Left.png" alt="Left hand" fill className={styles.handImageBottomRight} priority />
          </div>
          <div className={`${styles.hand} ${styles.rightHand} ${isReady ? styles.handVisible : styles.handHidden}`}>
            <Image src="/images/QRScanner/Right.png" alt="Right hand" fill className={styles.handImageTopLeft} priority />
          </div>
        </div>
      </div>

      {message && (
        <div className={`absolute top-10 px-6 py-2 border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 ${scanStatus === 'error' ? 'bg-red-500 text-white' : 'bg-green-400'}`}>
          {message}
        </div>
      )}

      {showEndPopup && (
  <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
    <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_rgba(220,38,38,1)] w-full max-w-sm relative">
      
      {/* Red Corner Detail */}
      <div className="absolute -top-1 -left-1 w-6 h-6 bg-red-600 border-b-4 border-r-4 border-black" />
      
      <h2 className="text-4xl font-black italic uppercase text-center mb-6 tracking-tighter leading-none">
        Final Stats
      </h2>

      <div className="border-4 border-black mb-8 overflow-hidden bg-white">
        <div className="flex justify-between items-center p-4 border-b-4 border-black">
          <span className="font-black uppercase text-[10px] tracking-widest">Time Elapsed:</span>
          <span className="text-xl font-black text-red-600">
            {endStats?.totalTime || "N/A"}
          </span>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-end mb-2">
            <span className="font-black uppercase text-[10px] tracking-widest">Progress</span>
            <span className="text-2xl font-black italic leading-none">
              {endStats?.completionRate}%
            </span>
          </div>
          
          <div className="w-full bg-white border-2 border-black h-5 p-0.5">
            <div
              className="bg-green-500 h-full border-r-2 border-black transition-all duration-700"
              style={{ width: `${Math.min(endStats?.completionRate || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => window.location.href = `/eventsmaker/${eventId}/quiz`}
          disabled={!endStats?.canQuiz}
          className={`w-full py-4 border-4 border-black font-black uppercase text-lg transition-all active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
            endStats?.canQuiz 
              ? 'bg-green-400' 
              : 'bg-gray-200 text-gray-500 grayscale opacity-50'
          }`}
        >
          {endStats?.canQuiz ? "Start Quiz" : "Quiz Locked"}
        </button>

        <button
          onClick={() => window.location.href = `/eventsmaker/${eventId}/roulette`}
          className="w-full py-4 bg-green-400 border-4 border-black font-black uppercase text-lg transition-all active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          Spin Wheel
        </button>

        <button 
          onClick={() => setShowEndPopup(false)}
          className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
        >
          [ Close Stats ]
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default QRScanner;