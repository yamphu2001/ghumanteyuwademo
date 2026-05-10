
// "use client";

// import React, { useEffect, useState } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { rtdb, db } from "@/lib/firebase";
// import { ref, onValue } from "firebase/database";
// import { doc, getDoc } from "firebase/firestore";
// import { QRCodeSVG } from "qrcode.react";
// import { motion } from "framer-motion";
// import {
//   User, Trophy, MapPin, Loader2, QrCode,
//   ChevronLeft, AlertCircle, Gift, Star, Zap
// } from "lucide-react";
// import { useRouter, useParams } from "next/navigation";

// // ─────────────────────────────────────────────
// // Types (Logic Unchanged)
// // ─────────────────────────────────────────────
// interface PlayerStats {
//   username: string;
//   locationPoints: number;
//   locationCount: number;
//   qrPoints: number;
//   qrCount: number;
//   specialPoints: number;
//   specialCount: number;
//   quizPoints: number;
//   quizProgress: string;
//   totalPoints: number;
//   prize: "claimed" | "not_claimed" | null;
//   prizeName: string | null;
//   roulettePrize: string | null;
//   rank: number;
//   totalPlayers: number;
//   timeTaken: string | null;
// }

// // ─────────────────────────────────────────────
// // Helpers (Logic Unchanged)
// // ─────────────────────────────────────────────
// function sumPoints(categoryData: Record<string, any> | null | undefined): number {
//   if (!categoryData || typeof categoryData !== "object") return 0;
//   return Object.values(categoryData).reduce(
//     (acc, marker: any) => acc + (Number(marker?.pointsEarned) || 0),
//     0,
//   );
// }

// function countKeys(obj: Record<string, any> | null | undefined): number {
//   if (!obj || typeof obj !== "object") return 0;
//   return Object.keys(obj).length;
// }

// // ─────────────────────────────────────────────
// // Main Component
// // ─────────────────────────────────────────────
// export default function PlayerProfilePage() {
//   const router = useRouter();
//   const rawParams = useParams();
//   const eventId = (rawParams?.eventId || rawParams?.id) as string;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [uid, setUid] = useState<string | null>(null);
//   const [stats, setStats] = useState<PlayerStats | null>(null);

//   const timeToSeconds = (timeStr: string | null | undefined): number => {
//     if (!timeStr) return 999999;
//     const [minutes, seconds] = timeStr.split(':').map(Number);
//     return (minutes * 60) + (seconds || 0);
//   };

//   useEffect(() => {
//     if (!eventId) return;
//     const auth = getAuth();

//     const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setLoading(false);
//         setError("Please log in to view your profile.");
//         return;
//       }
//       setUid(user.uid);

//       try {
//         const userDocRef = doc(db, "users", user.uid);
//         const userDocSnap = await getDoc(userDocRef);
//         const firestoreUsername = userDocSnap.exists()
//           ? userDocSnap.data().username
//           : null;

//         const eventRef = ref(rtdb, `eventsProgress/${eventId}`);

//         const unsubscribeRTDB = onValue(eventRef, (snapshot) => {
//           const allData = snapshot.val() || {};
//           const userData = allData[user.uid] || {};

//           const lp = sumPoints(userData.locationMarkers);
//           const lc = countKeys(userData.locationMarkers);
//           const qp = sumPoints(userData.qrcodemarkers);
//           const qc = countKeys(userData.qrcodemarkers);
//           const sp = sumPoints(userData.specialMarkers);
//           const sc = countKeys(userData.specialMarkers);
//           const quizPoints = Number(userData.quizResult?.totalScore) || 0;
//           const timeTaken = userData.scannedTimes?.timeTaken || null;
//           const quizProgress = userData.quizResult?.status === "finished" ? "Completed" : "Not Started";
//           const total = lp + qp + sp + quizPoints;

//           const rankings = Object.entries(allData)
//             .map(([playerId, pData]: [string, any]) => ({
//               uid: playerId,
//               total: sumPoints(pData?.locationMarkers) +
//                 sumPoints(pData?.qrcodemarkers) +
//                 sumPoints(pData?.specialMarkers) +
//                 (Number(pData?.quizResult?.totalScore) || 0),
//               seconds: timeToSeconds(pData?.scannedTimes?.timeTaken)
//             }))
//             .sort((a, b) => {
//               if (b.total !== a.total) return b.total - a.total;
//               return a.seconds - b.seconds;
//             });

//           const rankIndex = rankings.findIndex((r) => r.uid === user.uid);
//           const currentRank = rankIndex !== -1 ? rankIndex + 1 : rankings.length;

//           setStats({
//             username: firestoreUsername || userData.userInfo?.username || user.displayName || "Explorer",
//             locationPoints: lp,
//             locationCount: lc,
//             qrPoints: qp,
//             qrCount: qc,
//             specialPoints: sp,
//             specialCount: sc,
//             quizPoints: quizPoints,
//             quizProgress: quizProgress,
//             totalPoints: total,
//             prize: userData.userInfo?.prize ?? null,
//             prizeName: userData.prizeSession?.name || null,
//             roulettePrize: userData.userInfo?.roulettePrize || null,
//             rank: currentRank,
//             totalPlayers: rankings.length,
//             timeTaken: timeTaken,
//           });
//           setLoading(false);
//         });

//         return () => unsubscribeRTDB();

//       } catch (err) {
//         setError("Failed to load profile data.");
//         setLoading(false);
//       }
//     });

//     return () => unsubscribeAuth();
//   }, [eventId]);

//   if (loading) return (
//     <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
//       <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
//       <p className="text-black font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Data...</p>
//     </div>
//   );

//   if (error || !stats) return (
//     <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-8 text-center">
//       <AlertCircle className="text-red-600 mb-4" size={48} />
//       <p className="text-black font-bold mb-6">{error || "User not found"}</p>
//       <button onClick={() => router.push("/")} className="px-8 py-4 bg-black text-white rounded-2xl font-black">GO HOME</button>
//     </div>
//   );

//   const qrPayload = JSON.stringify({
//     player: stats.username,
//     id: uid?.slice(0, 8),
//     totalScore: stats.totalPoints,
//     rank: `#${stats.rank}`,
//     tasks: {
//       locations: stats.locationCount,
//       qrScans: stats.qrCount,
//       quiz: stats.quizProgress,
//       special: stats.specialCount
//     },
//     prize: {
//       status: stats.prize || "pending",
//       win: stats.roulettePrize || stats.prizeName || "None"
//     },
//     eventId: eventId
//   });

//   return (
//     <main className="min-h-screen bg-white p-5 pb-24 text-black">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <button onClick={() => router.back()} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><ChevronLeft size={22} className="text-black" /></button>
//         <h1 className="text-xl font-black tracking-tight text-black">PLAYER CARD</h1>
//         <button onClick={() => router.push(`/eventsmaker/${eventId}/leaderboard`)} className="bg-red-600 text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2">
//           <Trophy size={14} /> Leaderboard
//         </button>
//       </div>

//       {/* Identity */}
//       <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 mb-4 flex items-center gap-4">
//         <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shrink-0"><User size={26} /></div>
//         <div className="flex-1 min-w-0">
//           <h2 className="text-lg font-black truncate text-black">{stats.username}</h2>
//           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">ID: {uid?.slice(0, 8)}</p>
//         </div>
//         <div className="bg-white border border-red-600 px-3 py-2 rounded-2xl text-center">
//           <p className="text-[9px] font-black text-red-600 uppercase">Rank</p>
//           <p className="text-lg font-black text-black leading-none">#{stats.rank}</p>
//         </div>
//       </motion.section>

//       {/* Stats Breakdown */}
//       <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 mb-4 space-y-4">
//         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity Progress</p>

//         {stats.timeTaken && (
//           <div className="flex items-center justify-between border-b border-gray-50 pb-2">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-black">
//                 <Loader2 size={15} />
//               </div>
//               <div>
//                 <p className="text-sm font-bold text-black leading-none">Total Time</p>
//                 <p className="text-[10px] text-gray-400 font-bold">Race Duration</p>
//               </div>
//             </div>
//             <span className="font-black text-sm text-red-600">{stats.timeTaken}</span>
//           </div>
//         )}

//         <PointsRow icon={<MapPin size={15} />} label="Locations" count={stats.locationCount} points={stats.locationPoints} color="bg-gray-100 text-black" />
//         <PointsRow icon={<QrCode size={15} />} label="QR Scans" count={stats.qrCount} points={stats.qrPoints} color="bg-gray-100 text-black" />

//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-black"><Trophy size={15} /></div>
//             <div>
//               <p className="text-sm font-bold text-black leading-none">Quiz Points</p>
//               <p className="text-[10px] text-gray-400 font-bold">{stats.quizProgress}</p>
//             </div>
//           </div>
//           <span className="font-black text-sm px-3 py-1 rounded-xl bg-red-600 text-white">{stats.quizPoints} pts</span>
//         </div>

//         <PointsRow icon={<Star size={15} />} label="Special" count={stats.specialCount} points={stats.specialPoints} color="bg-gray-100 text-black" />

//         <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
//           <div className="flex items-center gap-2 font-black text-black"><Zap size={16} className="text-red-600" /> Total Score</div>
//           <span className="text-2xl font-black text-black">{stats.totalPoints}</span>
          
//         </div>
//       </motion.section>

//       {/* Prize Status */}
//       <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-[32px] p-5 shadow-sm border mb-4 flex items-center justify-between ${stats.prize === "claimed" ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
//         <div className="flex items-center gap-3">
//           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stats.prize === "claimed" ? "bg-red-600" : "bg-gray-200"}`}><Gift size={18} className="text-white" /></div>
//           <div>
//             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prize Status</p>
//             <p className="font-black text-black text-sm">
//               {stats.roulettePrize
//                 ? `Won: ${stats.roulettePrize}`
//                 : (stats.prizeName || (stats.prize === "claimed" ? "Prize Awarded" : "No Prize Claimed"))
//               }
//             </p>
//           </div>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-[10px] font-black ${stats.prize === "claimed" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}>
//           {stats.prize === "claimed" ? "CLAIMED" : "PENDING"}
//         </span>
//       </motion.section>

//       {/* Verification QR */}
//       <motion.section initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-black rounded-[40px] p-8 text-center text-white shadow-xl">
//         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4">Verification Passport</p>
//         <div className="bg-white p-4 rounded-[32px] inline-block mb-6 shadow-inner">
//           <QRCodeSVG value={qrPayload} size={150} />
//         </div>
//         <p className="text-xs font-bold opacity-80">Show this to <span className="text-red-600">event staff</span> to claim rewards</p>
//       </motion.section>
//     </main>
//   );
// }

// function PointsRow({ icon, label, count, points, color }: { icon: React.ReactNode, label: string, count: number, points: number, color: string }) {
//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
//         <div>
//           <p className="text-sm font-bold text-black leading-none">{label}</p>
//           <p className="text-[10px] text-gray-400 font-bold">{count} items</p>
//         </div>
//       </div>
//       <span className="font-black text-sm px-3 py-1 rounded-xl bg-white border border-gray-100 text-black">{points} pts</span>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { rtdb, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import {
  User, Trophy, MapPin, Loader2, QrCode,
  ChevronLeft, AlertCircle, Gift, Star, Zap, Timer
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface PlayerStats {
  username: string;
  locationPoints: number;
  locationCount: number;
  qrPoints: number;
  qrCount: number;
  specialPoints: number;
  specialCount: number;
  quizPoints: number;
  quizProgress: string;
  totalPoints: number;
  prize: "claimed" | "not_claimed" | null;
  prizeName: string | null;
  roulettePrize: string | null;
  rank: number;
  totalPlayers: number;
  timeTaken: string | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sumPoints(categoryData: Record<string, any> | null | undefined): number {
  if (!categoryData || typeof categoryData !== "object") return 0;
  return Object.values(categoryData).reduce(
    (acc, marker: any) => acc + (Number(marker?.pointsEarned) || 0),
    0,
  );
}

function countKeys(obj: Record<string, any> | null | undefined): number {
  if (!obj || typeof obj !== "object") return 0;
  return Object.keys(obj).length;
}

const timeToSeconds = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 999999;
  const match = timeStr.match(/(\d+)m\s*(\d+)s/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  const parts = timeStr.split(':').map(Number);
  return parts.length === 2 ? (parts[0] * 60) + parts[1] : 999999;
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function PlayerProfilePage() {
  const router = useRouter();
  const rawParams = useParams();
  const eventId = (rawParams?.eventId || rawParams?.id) as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const auth = getAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        setError("Please log in to view your profile.");
        return;
      }
      setUid(user.uid);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const firestoreUsername = userDocSnap.exists() ? userDocSnap.data().username : null;

        const eventRef = ref(rtdb, `eventsProgress/${eventId}`);
        const unsubscribeRTDB = onValue(eventRef, (snapshot) => {
          const allData = snapshot.val() || {};
          const userData = allData[user.uid] || {};

          const lp = sumPoints(userData.locationMarkers);
          const lc = countKeys(userData.locationMarkers);
          const qp = sumPoints(userData.qrcodemarkers);
          const qc = countKeys(userData.qrcodemarkers);
          const sp = sumPoints(userData.specialMarkers);
          const sc = countKeys(userData.specialMarkers);
          const quizPoints = Number(userData.quizResult?.totalScore) || 0;
          const timeTaken = userData.scannedTimes?.timeTaken || null;
          const quizProgress = userData.quizResult?.status === "finished" ? "Completed" : "Not Started";
          const total = lp + qp + sp + quizPoints;

          const rankings = Object.entries(allData)
            .map(([playerId, pData]: [string, any]) => ({
              uid: playerId,
              total: sumPoints(pData?.locationMarkers) +
                sumPoints(pData?.qrcodemarkers) +
                sumPoints(pData?.specialMarkers) +
                (Number(pData?.quizResult?.totalScore) || 0),
              seconds: timeToSeconds(pData?.scannedTimes?.timeTaken)
            }))
            .sort((a, b) => {
              if (b.total !== a.total) return b.total - a.total;
              return a.seconds - b.seconds;
            });

          const rankIndex = rankings.findIndex((r) => r.uid === user.uid);
          const currentRank = rankIndex !== -1 ? rankIndex + 1 : rankings.length;

          setStats({
            username: firestoreUsername || userData.userInfo?.username || user.displayName || "Explorer",
            locationPoints: lp,
            locationCount: lc,
            qrPoints: qp,
            qrCount: qc,
            specialPoints: sp,
            specialCount: sc,
            quizPoints: quizPoints,
            quizProgress: quizProgress,
            totalPoints: total,
            prize: userData.userInfo?.prize ?? null,
            prizeName: userData.prizeSession?.name || null,
            roulettePrize: userData.userInfo?.roulettePrize || null,
            rank: currentRank,
            totalPlayers: rankings.length,
            timeTaken: timeTaken,
          });
          setLoading(false);
        });

        return () => unsubscribeRTDB();
      } catch (err) {
        setError("Failed to load profile data.");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [eventId]);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
      <p className="text-black font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Profile...</p>
    </div>
  );

  if (error || !stats) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-8 text-center">
      <AlertCircle className="text-red-600 mb-4" size={48} />
      <p className="text-black font-bold mb-6">{error || "User not found"}</p>
      <button onClick={() => router.push("/")} className="px-8 py-4 bg-black text-white rounded-2xl font-black">GO HOME</button>
    </div>
  );

  const qrPayload = JSON.stringify({
    player: stats.username,
    totalScore: stats.totalPoints,
    rank: `#${stats.rank}`,
    prize: stats.prize || "pending",
    eventId: eventId
  });

  return (
    <main className="min-h-screen bg-white p-5 pb-24 text-black">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <ChevronLeft size={22} className="text-black" />
        </button>
        <h1 className="text-xl font-black tracking-tight">PLAYER CARD</h1>
        <button onClick={() => router.push(`/eventsmaker/${eventId}/leaderboard`)} className="bg-red-600 text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2">
          <Trophy size={14} /> Leaderboard
        </button>
      </div>

      {/* Identity Card */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-4xl p-5 shadow-sm border border-gray-100 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0">
          <User size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black truncate">{stats.username}</h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">UID: {uid?.slice(0, 8)}</p>
        </div>
        <div className="bg-white border border-red-600 px-3 py-2 rounded-2xl text-center">
          <p className="text-[9px] font-black text-red-600 uppercase">Rank</p>
          <p className="text-lg font-black text-black leading-none">#{stats.rank}</p>
        </div>
      </motion.section>

      {/* Progress Breakdown */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-4xl p-5 shadow-sm border border-gray-100 mb-4 space-y-4">
        <p className="text-[10px] font-black text-black uppercase tracking-widest">Activity Progress</p>

        {stats.timeTaken && (
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-black">
                <Timer size={15} />
              </div>
              <div>
                <p className="text-sm font-bold text-black leading-none">Total Time</p>
                <p className="text-[10px] text-gray-400 font-bold">Race Duration</p>
              </div>
            </div>
            <span className="font-black text-sm text-red-600">{stats.timeTaken}</span>
          </div>
        )}

        {/* Dynamic Rows based on image_f5bcf8.png style */}
        <PointsRow icon={<MapPin size={15} />} label="Locations" subtitle={`${stats.locationCount} items`} points={stats.locationPoints} badgeColor="bg-gray-100 text-black" />
        <PointsRow icon={<QrCode size={15} />} label="QR Scans" subtitle={`${stats.qrCount} items`} points={stats.qrPoints} badgeColor="bg-gray-100 text-black" />
        <PointsRow icon={<Trophy size={15} />} label="Quiz Points" subtitle={stats.quizProgress} points={stats.quizPoints} badgeColor="bg-gray-100 text-black" />
        <PointsRow icon={<Star size={15} />} label="Special" subtitle={`${stats.specialCount} items`} points={stats.specialPoints} badgeColor="bg-gray-100 text-black" />

        {/* Total Score section matching image_f5bcf8.png bottom alignment */}
        <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
          <div className="flex items-center gap-2 font-black text-black text-lg">
            <Zap size={22} className="text-red-600 fill-red-600" /> 
            <span>Total Score</span>
          </div>
          <span className="text-4xl font-black text-red-600 leading-none">{stats.totalPoints}</span>
        </div>
      </motion.section>

      {/* Prize Status */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-4xl p-5 shadow-sm border mb-4 flex items-center justify-between ${stats.prize === "claimed" ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stats.prize === "claimed" ? "bg-red-600" : "bg-gray-200"}`}>
            <Gift size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reward Status</p>
            <p className="font-black text-black text-sm">
              {stats.roulettePrize || stats.prizeName || (stats.prize === "claimed" ? "Prize Awarded" : "No Prize Claimed")}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${stats.prize === "claimed" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}>
          {stats.prize === "claimed" ? "CLAIMED" : "PENDING"}
        </span>
      </motion.section>

      {/* Staff Verification QR */}
      <motion.section initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-4xl p-8 text-center shadow-xl border border-gray-100">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-80 mb-4">Staff Verification</p>
        <div className="bg-white p-4 rounded-4xl inline-block mb-6 shadow-sm border border-red-100">
          <QRCodeSVG value={qrPayload} size={160} />
        </div>
        <p className="text-xs font-bold text-black opacity-80">Present this QR code to the <span className="text-red-600">Event Staff</span> to claim your rewards</p>
      </motion.section>
    </main>
  );
}

// ─────────────────────────────────────────────
// Styled Row Component
// ─────────────────────────────────────────────
function PointsRow({ 
  icon, 
  label, 
  subtitle, 
  points, 
  badgeColor 
}: { 
  icon: React.ReactNode, 
  label: string, 
  subtitle: string, 
  points: number, 
  badgeColor: string 
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-black border border-gray-100">
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-black leading-none">{label}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{subtitle}</p>
        </div>
      </div>
      <span className={`font-black text-xs px-3 py-1.5 rounded-xl shadow-sm w-12 text-center ${badgeColor}`}>
        {points} pts
      </span>
    </div>
  );
}