// 'use client';

// import React, { useState } from 'react';
// import { db, rtdb } from '@/lib/firebase';
// import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
// import { ref, update as updateRtdb } from 'firebase/database';
// import Link from 'next/link';

// // Exact absolute import for your event context hook
// import { useEventId } from "@/app/eventadmin/Eventidcontext";
// // Relative import to the scanner component inside the parent directory (see image_5a1a28.png)
// import QRScanner from '../qrscanner'; 

// interface ScannedPayload {
//   event: string;
//   player: string;
//   status: string;
//   progress: string;
//   time: string;
//   points: number;
//   prizeWon: string;
//   type: string;
// }

// export default function VerifyPage() {
//   // Extract the active eventId directly from your custom hook
//   const { eventId } = useEventId();

//   const [isScannerOpen, setIsScannerOpen] = useState(false);
//   const [scannedData, setScannedData] = useState<ScannedPayload | null>(null);
//   const [playerUid, setPlayerUid] = useState<string | null>(null);
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   // 1. Process decoded raw string from your QRScanner component
//   const handleScanSuccess = async (rawResult: string) => {
//     setError(null);
//     setSuccess(null);
//     setScannedData(null);
//     setPlayerUid(null);
//     setIsScannerOpen(false); 

//     try {
//       const parsed: ScannedPayload = JSON.parse(rawResult);

//       // 🌟 FIX 1: Strict Payload Validation
//       // Ensure the QR code actually contains the required data before querying Firebase
//       if (!parsed || !parsed.type || !parsed.event || !parsed.player) {
//         setError('Invalid QR Payload: Missing essential system values (event, player, or type).');
//         return;
//       }

//       // Verify system signature validation
//       if (parsed.type !== 'verification_finish') {
//         setError('Invalid QR Code type. This code cannot be verified here.');
//         return;
//       }

//       // Security Check: Ensure scanned player belongs to the admin's current active event context
//       if (eventId && parsed.event !== eventId) {
//         setError(`Event mismatch! Ticket is for Event ID: ${parsed.event}, but you are currently managing Event ID: ${eventId}`);
//         return;
//       }

//       setLoading(true);

//       // 2. Locate client match via user collection layout mapping
//       const usersRef = collection(db, 'users');
//       const q = query(usersRef, where('username', '==', parsed.player));
//       const querySnapshot = await getDocs(q);

//       if (querySnapshot.empty) {
//         setError(`Data parsed for "${parsed.player}", but no matching account UID exists in the database.`);
//         // 🌟 FIX 2: State remains null here, preventing the Confirm UI from rendering
//       } else {
//         const matchedUid = querySnapshot.docs[0].id;
//         setPlayerUid(matchedUid);
//         // 🌟 FIX 3: Only reveal the verification card if the DB check succeeds
//         setScannedData(parsed); 
//       }
//     } catch (err) {
//       console.error('QR Parsing error: ', err);
//       setError('Failed to parse code layout. Ensure it is a valid system verification string.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 3. Commit verification updates to Firestore and RTDB concurrently
//   const handleConfirmVerification = async () => {
//     if (!scannedData) return;
//     const targetEventId = scannedData.event;
    
//     setLoading(true);
//     setError(null);

//     try {
//       const updates = {
//         prizeStatus: 'CLAIMED',
//         verifiedAt: new Date().toISOString(),
//         verifiedByAdmin: true,
//       };

//       if (playerUid) {
//         // Write status updates directly to player log document parameters
//         const playerLogRef = doc(db, 'events', targetEventId, 'player_log', playerUid);
//         await updateDoc(playerLogRef, updates);

//         // Synchronize state down to live Realtime Database nodes
//         const rtdbProgressRef = ref(rtdb, `eventsProgress/${targetEventId}/${playerUid}`);
//         await updateRtdb(rtdbProgressRef, {
//           prize: 'CLAIMED',
//           verified: true
//         });
//       }

//       setSuccess(`Successfully verified records and claimed rewards for ${scannedData.player}!`);
//       setScannedData(null);
//       setPlayerUid(null);
//     } catch (err: any) {
//       console.error('Verification failure: ', err);
//       setError(`Database transaction failure: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white text-black p-6 font-sans antialiased selection:bg-red-500 selection:text-white">
      
//       {/* Breadcrumb Header matching your admin configuration system */}
//       <header className="mb-8 border-b-2 border-black pb-6">
//         <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">
//           FOREVENT / ADMIN SYSTEM
//         </div>
//         <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
//           PLAYER VERIFICATION
//         </h1>
//         <div className="text-xs text-gray-500 font-mono uppercase">
//           Current Context Event: <span className="text-black font-bold">{eventId || "None Selected"}</span>
//         </div>
//       </header>

//       <div className="max-w-md mx-auto">
        
//         {/* Alerts Screen Block Layout */}
//         {error && (
//           <div className="border-2 border-red-600 bg-red-50 text-red-600 font-bold p-4 uppercase text-xs mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
//             ✕ Error: {error}
//           </div>
//         )}
//         {success && (
//           <div className="border-2 border-green-600 bg-green-50 text-green-700 font-bold p-4 uppercase text-xs mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
//             ✓ Success: {success}
//           </div>
//         )}

//         {/* Action Panel Box Area */}
//         {!scannedData && !loading && (
//           <div className="border-2 border-black p-8 text-center bg-gray-50 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
//             <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
//               • READY FOR DATA COMPILATION
//             </p>
//             <button
//               type="button"
//               onClick={() => setIsScannerOpen(true)}
//               className="w-full bg-red-600 text-white font-black uppercase tracking-tight py-4 border-2 border-black hover:bg-black transition-colors active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
//             >
//               Open Camera Scanner
//             </button>
//           </div>
//         )}

//         {/* Global Loading Block Status Indicator */}
//         {loading && (
//           <div className="text-center py-12 font-mono text-xs uppercase tracking-widest text-gray-400 animate-pulse font-bold">
//             Processing Core Database Stream Transaction...
//           </div>
//         )}

//         {/* Verification Record Output Manifest View Card */}
//         {scannedData && !loading && (
//           <div className="border-2 border-black p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
//             <div className="text-xs font-black tracking-widest text-red-600 uppercase">
//               • Scanner Record Target Acquired
//             </div>

//             <div className="space-y-4 font-mono text-xs border-b border-gray-200 pb-6">
//               <div>
//                 <span className="text-gray-400 block mb-0.5">PLAYER HANDLE</span>
//                 <span className="text-lg font-black text-black tracking-tight font-sans">{scannedData.player}</span>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <span className="text-gray-400 block mb-0.5">TOTAL SCORE</span>
//                   <span className="text-sm font-bold text-black">{scannedData.points} PTS</span>
//                 </div>
//                 <div>
//                   <span className="text-gray-400 block mb-0.5">ELAPSED TIME</span>
//                   <span className="text-sm font-bold text-black">{scannedData.time}</span>
//                 </div>
//               </div>
//               <div>
//                 <span className="text-gray-400 block mb-0.5">PROGRESS REPORT</span>
//                 <span className="bg-black text-white px-2 py-0.5 font-sans font-bold text-[11px] uppercase tracking-wide">
//                   {scannedData.progress} ({scannedData.status})
//                 </span>
//               </div>
//               <div>
//                 <span className="text-gray-400 block mb-0.5">REWARD COMMITTED</span>
//                 <span className="text-sm font-black text-red-600 italic font-sans uppercase">
//                   {scannedData.prizeWon}
//                 </span>
//               </div>
//             </div>

//             {/* Tactical Control Triggers */}
//             <div className="flex gap-3">
//               <button
//                 type="button"
//                 onClick={handleConfirmVerification}
//                 className="flex-2 bg-red-600 text-white font-black text-xs uppercase tracking-wider py-4 border-2 border-black hover:bg-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
//               >
//                 Confirm & Claim Reward
//               </button>
//               <button
//                 type="button"
//                 onClick={() => { setScannedData(null); setPlayerUid(null); }}
//                 className="flex-1 bg-white text-black font-bold text-xs uppercase tracking-wide py-4 border-2 border-black hover:bg-gray-100 transition-all"
//               >
//                 Discard
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Camera Live Stream Port Intercept View Overlay */}
//       {isScannerOpen && (
//         <div className="fixed inset-0 z-[99999] bg-black">
//           <div className="absolute top-6 left-6 z-[100000] text-white font-mono text-[10px] font-bold tracking-widest uppercase bg-black/60 px-3 py-1 border border-white/20">
//             Scanning Mode Frame Active
//           </div>
//           <QRScanner 
//             onScanSuccess={handleScanSuccess} 
//             onClose={() => setIsScannerOpen(false)} 
//           />
//         </div>
//       )}

//     </div>
//   );
// }




'use client';

import React, { useState } from 'react';
import { db, rtdb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, update as updateRtdb } from 'firebase/database';
import Link from 'next/link';

// Exact absolute import for your event context hook
import { useEventId } from "@/app/eventadmin/Eventidcontext";
// Relative import to the scanner component inside the parent directory
import QRScanner from '../qrscanner'; 

interface ScannedPayload {
  event: string;
  uid: string; // 🌟 Directly passing player document ID mapping signature
  player: string;
  status: string;
  progress: string;
  time: string;
  points: number;
  prizeWon: string;
  type: string;
}

export default function VerifyPage() {
  // Extract the active eventId directly from your custom hook
  const { eventId } = useEventId();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedPayload | null>(null);
  const [playerUid, setPlayerUid] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Process decoded raw string from your QRScanner component
  const handleScanSuccess = async (rawResult: string) => {
    setError(null);
    setSuccess(null);
    setScannedData(null);
    setPlayerUid(null);
    setIsScannerOpen(false); 

    let parsed: ScannedPayload;
    try {
      parsed = JSON.parse(rawResult);
    } catch (err) {
      console.error('QR Parsing error: ', err);
      setError('Failed to parse code layout. Ensure it is a valid system verification string.');
      return;
    }

    // Security Verification Check
    if (!parsed || !parsed.type || !parsed.event || !parsed.player || !parsed.uid) {
      setError('Invalid QR Payload structure. Missing required tracking fields.');
      return;
    }

    // Verify system signature validation
    if (parsed.type !== 'verification_finish') {
      setError('Invalid QR Code type. This code cannot be verified here.');
      return;
    }

    // Security Check: Ensure scanned player belongs to the admin's current active event context
    if (eventId && parsed.event !== eventId) {
      setError(`Event mismatch! Ticket is for Event ID: ${parsed.event}, but you are currently managing Event ID: ${eventId}`);
      return;
    }

    // 🌟 Direct parameter mapping bypassing collection query rules limitations completely
    setPlayerUid(parsed.uid);
    setScannedData(parsed);
  };

  // 3. Commit verification updates to Firestore and RTDB concurrently
  const handleConfirmVerification = async () => {
    if (!scannedData || !playerUid) return;
    const targetEventId = scannedData.event;
    
    setLoading(true);
    setError(null);

    try {
      const updates = {
        prizeStatus: 'CLAIMED',
        verifiedAt: new Date().toISOString(),
        verifiedByAdmin: true,
      };

      // Write status updates directly to player log document parameters
      const playerLogRef = doc(db, 'events', targetEventId, 'player_log', playerUid);
      await updateDoc(playerLogRef, updates);

      // Synchronize state down to live Realtime Database nodes
      const rtdbProgressRef = ref(rtdb, `eventsProgress/${targetEventId}/${playerUid}`);
      await updateRtdb(rtdbProgressRef, {
        prize: 'CLAIMED',
        verified: true
      });

      setSuccess(`Successfully verified records and claimed rewards for ${scannedData.player}!`);
      setScannedData(null);
      setPlayerUid(null);
    } catch (err: any) {
      console.error('Verification failure: ', err);
      setError(`Database transaction failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 font-sans antialiased selection:bg-red-500 selection:text-white">
      
      {/* Breadcrumb Header matching your admin configuration system */}
      <header className="mb-8 border-b-2 border-black pb-6">
        <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">
          FOREVENT / ADMIN SYSTEM
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
          PLAYER VERIFICATION
        </h1>
        <div className="text-xs text-gray-500 font-mono uppercase">
          Current Context Event: <span className="text-black font-bold">{eventId || "None Selected"}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        
        {/* Alerts Screen Block Layout */}
        {error && (
          <div className="border-2 border-red-600 bg-red-50 text-red-600 font-bold p-4 uppercase text-xs mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ✕ Error: {error}
          </div>
        )}
        {success && (
          <div className="border-2 border-green-600 bg-green-50 text-green-700 font-bold p-4 uppercase text-xs mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ✓ Success: {success}
          </div>
        )}

        {/* Action Panel Box Area */}
        {!scannedData && !loading && (
          <div className="border-2 border-black p-8 text-center bg-gray-50 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              • READY FOR DATA COMPILATION
            </p>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full bg-red-600 text-white font-black uppercase tracking-tight py-4 border-2 border-black hover:bg-black transition-colors active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Open Camera Scanner
            </button>
          </div>
        )}

        {/* Global Loading Block Status Indicator */}
        {loading && (
          <div className="text-center py-12 font-mono text-xs uppercase tracking-widest text-gray-400 animate-pulse font-bold">
            Processing Core Database Stream Transaction...
          </div>
        )}

        {/* Verification Record Output Manifest View Card */}
        {scannedData && !loading && (
          <div className="border-2 border-black p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <div className="text-xs font-black tracking-widest text-red-600 uppercase">
              • Scanner Record Target Acquired
            </div>

            <div className="space-y-4 font-mono text-xs border-b border-gray-200 pb-6">
              <div>
                <span className="text-gray-400 block mb-0.5">PLAYER HANDLE</span>
                <span className="text-lg font-black text-black tracking-tight font-sans">{scannedData.player}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block mb-0.5">TOTAL SCORE</span>
                  <span className="text-sm font-bold text-black">{scannedData.points} PTS</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">ELAPSED TIME</span>
                  <span className="text-sm font-bold text-black">{scannedData.time}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">PROGRESS REPORT</span>
                <span className="bg-black text-white px-2 py-0.5 font-sans font-bold text-[11px] uppercase tracking-wide">
                  {scannedData.progress} ({scannedData.status})
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">REWARD COMMITTED</span>
                <span className="text-sm font-black text-red-600 italic font-sans uppercase">
                  {scannedData.prizeWon}
                </span>
              </div>
            </div>

            {/* Tactical Control Triggers */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleConfirmVerification}
                className="flex-2 bg-red-600 text-white font-black text-xs uppercase tracking-wider py-4 border-2 border-black hover:bg-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Confirm & Claim Reward
              </button>
              <button
                type="button"
                onClick={() => { setScannedData(null); setPlayerUid(null); }}
                className="flex-1 bg-white text-black font-bold text-xs uppercase tracking-wide py-4 border-2 border-black hover:bg-gray-100 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Live Stream Port Intercept View Overlay */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <div className="absolute top-6 left-6 z-[100000] text-white font-mono text-[10px] font-bold tracking-widest uppercase bg-black/60 px-3 py-1 border border-white/20">
            Scanning Mode Frame Active
          </div>
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            onClose={() => setIsScannerOpen(false)} 
          />
        </div>
      )}

    </div>
  );
}