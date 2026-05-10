
// "use client";

// import React, { useEffect, useState } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { rtdb } from "@/lib/firebase";
// import { ref, onValue, update } from "firebase/database";
// import { motion } from "framer-motion";
// import { Trophy, ChevronLeft, Loader2, Crown, AlertCircle, Zap, Timer } from "lucide-react";
// import { useRouter, useParams } from "next/navigation";

// // ─────────────────────────────────────────────
// // Types & Helpers
// // ─────────────────────────────────────────────
// interface PlayerEntry {
//   uid: string;
//   username: string;
//   totalPoints: number;
//   locationPoints: number;
//   qrPoints: number;
//   specialPoints: number;
//   quizPoints: number;
//   prize: "claimed" | "not_claimed" | null;
//   rank: number;
//   displayTime: string | null; // From image_f6313a.png: "21m 23s"
//   timeSeconds: number;       // For mathematical sorting
// }

// /** 
//  * Helper to convert "21m 23s" into total seconds 
//  */
// const timeToSeconds = (timeStr: string | null | undefined): number => {
//   if (!timeStr) return 999999; // Default for players who haven't finished
//   const minutes = timeStr.match(/(\d+)m/);
//   const seconds = timeStr.match(/(\d+)s/);
//   const m = minutes ? parseInt(minutes[1]) : 0;
//   const s = seconds ? parseInt(seconds[1]) : 0;
//   return (m * 60) + s;
// };

// function sumPoints(categoryData: Record<string, any> | null | undefined): number {
//   if (!categoryData || typeof categoryData !== "object") return 0;
//   return Object.values(categoryData).reduce(
//     (acc, marker: any) => acc + (Number(marker?.pointsEarned) || 0),
//     0,
//   );
// }

// const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// // ─────────────────────────────────────────────
// // Main Component
// // ─────────────────────────────────────────────
// export default function LeaderboardPage() {
//   const router = useRouter();
//   const rawParams = useParams();
//   const eventId = (rawParams?.eventId || rawParams?.id) as string;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentUid, setCurrentUid] = useState<string | null>(null);
//   const [players, setPlayers] = useState<PlayerEntry[]>([]);

//   useEffect(() => {
//     if (!eventId) {
//       setError("Event ID missing.");
//       setLoading(false);
//       return;
//     }

//     const auth = getAuth();
//     const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         setLoading(false);
//         setError("Please log in to view the leaderboard.");
//         return;
//       }
//       setCurrentUid(user.uid);

//       const eventRef = ref(rtdb, `eventsProgress/${eventId}`);
//       const unsubscribeData = onValue(eventRef, (snapshot) => {
//         try {
//           const allData = snapshot.val() || {};

//           // 1. Map data into local objects
//           const entries = Object.entries(allData).map(([uid, data]: [string, any]) => {
//             const lp = sumPoints(data?.locationMarkers);
//             const qp = sumPoints(data?.qrcodemarkers);
//             const sp = sumPoints(data?.specialMarkers);
//             const quizP = Number(data?.quizResult?.totalScore) || 0;
//             const finishTime = data?.scannedTimes?.timeTaken || null;

//             return {
//               uid,
//               username: data?.userInfo?.username || "Unknown Explorer",
//               totalPoints: lp + qp + sp + quizP,
//               locationPoints: lp,
//               qrPoints: qp,
//               specialPoints: sp,
//               quizPoints: quizP,
//               prize: data?.userInfo?.prize ?? null,
//               displayTime: finishTime,
//               timeSeconds: timeToSeconds(finishTime),
//             };
//           });

//           // 2. DUAL-LAYER SORTING
//           entries.sort((a, b) => {
//             if (b.totalPoints !== a.totalPoints) {
//               return b.totalPoints - a.totalPoints; // Priority 1: Points (High to Low)
//             }
//             return a.timeSeconds - b.timeSeconds; // Priority 2: Time (Low to High)
//           });

//           // 3. Assign Ranks
//           let currentRank = 1;
//           const ranked: PlayerEntry[] = entries.map((p, i) => {
//             if (i > 0) {
//               const prev = entries[i - 1];
//               // If current player has fewer points OR same points but slower time, rank increases
//               if (p.totalPoints < prev.totalPoints || p.timeSeconds > prev.timeSeconds) {
//                 currentRank = i + 1;
//               }
//             }
//             return { ...p, rank: currentRank };
//           });

//           setPlayers(ranked);

//           // 4. Update Database (Ensures the Map UI stays updated)
//           const myUpdatedRank = ranked.find(p => p.uid === user.uid)?.rank;
//           if (myUpdatedRank) {
//             update(ref(rtdb, `eventsProgress/${eventId}/${user.uid}/userInfo`), {
//               rank: myUpdatedRank
//             });
//           }

//           setLoading(false);
//         } catch (err) {
//           console.error("Leaderboard error:", err);
//           setError("Failed to sync leaderboard data.");
//           setLoading(false);
//         }
//       });

//       return () => unsubscribeData();
//     });

//     return () => unsubscribeAuth();
//   }, [eventId]);

//   const myEntry = players.find((p) => p.uid === currentUid);

//   if (loading) return (
//     <div className="h-screen w-screen flex flex-col items-center justify-center bg-indigo-600 text-white">
//       <Loader2 className="animate-spin mb-4" size={40} />
//       <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Calculating Ranks...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-8">
//        <AlertCircle className="text-rose-500 mb-4" size={48} />
//        <p className="text-slate-800 font-bold mb-6">{error}</p>
//        <button onClick={() => router.back()} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black">BACK</button>
//     </div>
//   );

//   return (
//     <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-32">
//       {/* Header */}
//       <div className="bg-white border-b border-slate-100 px-5 pt-5 pb-4 sticky top-0 z-10">
//         <div className="flex items-center gap-4">
//           <button onClick={() => router.back()} className="p-3 bg-slate-100 rounded-2xl active:scale-90 transition-transform">
//             <ChevronLeft size={20} />
//           </button>
//           <div>
//             <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
//               <Trophy size={20} className="text-amber-500" /> RANKINGS
//             </h1>
//             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{players.length} Competitors</p>
//           </div>
//         </div>
//       </div>

//       {/* Podium Section */}
//       {players.length > 0 && (
//         <div className="px-5 pt-6 pb-4">
//           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] p-6">
//             <div className="flex items-end justify-center gap-3">
//               {players[1] && <PodiumCard entry={players[1]} currentUid={currentUid} height="h-20" />}
//               {players[0] && <PodiumCard entry={players[0]} currentUid={currentUid} height="h-28" crown />}
//               {players[2] && <PodiumCard entry={players[2]} currentUid={currentUid} height="h-16" />}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* List Section */}
//       <div className="px-5 space-y-2 mt-4">
//         {players.map((player, i) => (
//           <motion.div
//             key={player.uid}
//             initial={{ opacity: 0, x: -10 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: Math.min(i * 0.03, 0.4) }}
//             className={`flex items-center gap-3 px-4 py-3 rounded-[24px] border transition-all ${
//               player.uid === currentUid ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-white border-slate-100"
//             }`}
//           >
//             <div className="w-8 text-center shrink-0 font-black text-xs">
//               {MEDAL[player.rank] || `#${player.rank}`}
//             </div>
//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${player.uid === currentUid ? "bg-white/20" : "bg-indigo-100 text-indigo-600"}`}>
//               {player.username.slice(0, 2).toUpperCase()}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-black text-sm truncate uppercase">{player.username}</p>
//               <div className="flex items-center gap-2 opacity-60">
//                  <p className="text-[9px] font-bold">PTS: {player.totalPoints}</p>
//                  {player.displayTime && (
//                    <p className="text-[9px] font-bold flex items-center gap-1">• <Timer size={10}/> {player.displayTime}</p>
//                  )}
//               </div>
//             </div>
//             <div className="text-right shrink-0">
//               <p className="text-lg font-black leading-tight">{player.totalPoints}</p>
//               <p className="text-[8px] font-black uppercase opacity-50">Total</p>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* Bottom Sticky User Rank */}
//       {myEntry && (
//         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-20">
//           <div className="flex items-center justify-between max-w-md mx-auto">
//             <div>
//               <p className="text-[10px] font-black text-slate-400 uppercase">Your Position</p>
//               <p className="text-2xl font-black text-indigo-600">#{myEntry.rank}</p>
//             </div>
//             <div className="text-right">
//               <p className="text-[10px] font-black text-slate-400 uppercase">Points / Time</p>
//               <p className="text-xl font-black text-indigo-600">{myEntry.totalPoints} <span className="text-xs text-slate-400 font-bold ml-1">{myEntry.displayTime || '--'}</span></p>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

// function PodiumCard({ entry, currentUid, height, crown = false }: { entry: PlayerEntry; currentUid: string | null; height: string; crown?: boolean }) {
//   const isMe = entry.uid === currentUid;
//   return (
//     <div className="flex flex-col items-center gap-2 flex-1">
//       {crown && <Crown size={20} className="text-amber-400 animate-bounce" />}
//       <div className={`w-full ${height} rounded-2xl flex flex-col items-center justify-center gap-1 ${isMe ? "bg-white border-2 border-amber-400 shadow-xl" : "bg-white/20 shadow-inner"}`}>
//         <span className="text-xl">{MEDAL[entry.rank]}</span>
//         <span className={`text-base font-black ${isMe ? "text-indigo-600" : "text-white"}`}>{entry.totalPoints}</span>
//       </div>
//       <p className="text-[9px] font-black text-center truncate w-full text-white/90">
//         {isMe ? "YOU" : entry.username.split(" ")[0]}
//       </p>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { motion } from "framer-motion";
import { Trophy, ChevronLeft, Loader2, Crown, AlertCircle, Zap, Timer } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ─────────────────────────────────────────────
// Types & Helpers (Logic Unchanged)
// ─────────────────────────────────────────────
interface PlayerEntry {
  uid: string;
  username: string;
  totalPoints: number;
  locationPoints: number;
  qrPoints: number;
  specialPoints: number;
  quizPoints: number;
  prize: "claimed" | "not_claimed" | null;
  rank: number;
  displayTime: string | null;
  timeSeconds: number;
}

const timeToSeconds = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 999999;
  const minutes = timeStr.match(/(\d+)m/);
  const seconds = timeStr.match(/(\d+)s/);
  const m = minutes ? parseInt(minutes[1]) : 0;
  const s = seconds ? parseInt(seconds[1]) : 0;
  return (m * 60) + s;
};

function sumPoints(categoryData: Record<string, any> | null | undefined): number {
  if (!categoryData || typeof categoryData !== "object") return 0;
  return Object.values(categoryData).reduce(
    (acc, marker: any) => acc + (Number(marker?.pointsEarned) || 0),
    0,
  );
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LeaderboardPage() {
  const router = useRouter();
  const rawParams = useParams();
  const eventId = (rawParams?.eventId || rawParams?.id) as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerEntry[]>([]);

  useEffect(() => {
    if (!eventId) {
      setError("Event ID missing.");
      setLoading(false);
      return;
    }

    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        setError("Please log in to view the leaderboard.");
        return;
      }
      setCurrentUid(user.uid);

      const eventRef = ref(rtdb, `eventsProgress/${eventId}`);
      const unsubscribeData = onValue(eventRef, (snapshot) => {
        try {
          const allData = snapshot.val() || {};
          const entries = Object.entries(allData).map(([uid, data]: [string, any]) => {
            const lp = sumPoints(data?.locationMarkers);
            const qp = sumPoints(data?.qrcodemarkers);
            const sp = sumPoints(data?.specialMarkers);
            const quizP = Number(data?.quizResult?.totalScore) || 0;
            const finishTime = data?.scannedTimes?.timeTaken || null;

            return {
              uid,
              username: data?.userInfo?.username || "Unknown Explorer",
              totalPoints: lp + qp + sp + quizP,
              locationPoints: lp,
              qrPoints: qp,
              specialPoints: sp,
              quizPoints: quizP,
              prize: data?.userInfo?.prize ?? null,
              displayTime: finishTime,
              timeSeconds: timeToSeconds(finishTime),
            };
          });

          entries.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
              return b.totalPoints - a.totalPoints;
            }
            return a.timeSeconds - b.timeSeconds;
          });

          let currentRank = 1;
          const ranked: PlayerEntry[] = entries.map((p, i) => {
            if (i > 0) {
              const prev = entries[i - 1];
              if (p.totalPoints < prev.totalPoints || p.timeSeconds > prev.timeSeconds) {
                currentRank = i + 1;
              }
            }
            return { ...p, rank: currentRank };
          });

          setPlayers(ranked);

          const myUpdatedRank = ranked.find(p => p.uid === user.uid)?.rank;
          if (myUpdatedRank) {
            update(ref(rtdb, `eventsProgress/${eventId}/${user.uid}/userInfo`), {
              rank: myUpdatedRank
            });
          }
          setLoading(false);
        } catch (err) {
          setError("Failed to sync leaderboard data.");
          setLoading(false);
        }
      });
      return () => unsubscribeData();
    });
    return () => unsubscribeAuth();
  }, [eventId]);

  const myEntry = players.find((p) => p.uid === currentUid);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-black">
      <Loader2 className="animate-spin mb-4 text-red-600" size={40} />
      <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Calculating Ranks...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-8">
       <AlertCircle className="text-red-600 mb-4" size={48} />
       <p className="text-black font-bold mb-6">{error}</p>
       <button onClick={() => router.back()} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black">BACK</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans text-black pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 pt-5 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-gray-100 rounded-2xl active:scale-90 transition-transform">
            <ChevronLeft size={20} className="text-black" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-black">
              <Trophy size={20} className="text-red-600" /> RANKINGS
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{players.length} Competitors</p>
          </div>
        </div>
      </div>

      {/* Podium Section */}
      {players.length > 0 && (
        <div className="px-5 pt-6 pb-4">
          <div className="bg-white border border-gray-100 rounded-4xl p-6 shadow-sm">
            <div className="flex items-end justify-center gap-3">
              {players[1] && <PodiumCard entry={players[1]} currentUid={currentUid} height="h-20" />}
              {players[0] && <PodiumCard entry={players[0]} currentUid={currentUid} height="h-28" crown />}
              {players[2] && <PodiumCard entry={players[2]} currentUid={currentUid} height="h-16" />}
            </div>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="px-5 space-y-2 mt-4">
        {players.map((player, i) => (
          <motion.div
            key={player.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className={`flex items-center gap-3 px-4 py-3 rounded-[24px] border transition-all bg-white shadow-sm ${
              player.uid === currentUid ? "border-red-600" : "border-gray-100"
            }`}
          >
            <div className={`w-8 text-center shrink-0 font-black text-xs ${player.uid === currentUid ? "text-red-600" : "text-gray-400"}`}>
              {MEDAL[player.rank] || `#${player.rank}`}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${player.uid === currentUid ? "bg-red-50 text-red-600 border border-red-200" : "bg-gray-100 text-black"}`}>
              {player.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate uppercase text-black">{player.username}</p>
              <div className="flex items-center gap-2 opacity-60">
                 <p className="text-[9px] font-bold text-black">PTS: {player.totalPoints}</p>
                 {player.displayTime && (
                   <p className="text-[9px] font-bold flex items-center gap-1 text-black">• <Timer size={10} className="text-red-600"/> {player.displayTime}</p>
                 )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black leading-tight text-black">{player.totalPoints}</p>
              <p className={`text-[8px] font-black uppercase ${player.uid === currentUid ? "text-red-600" : "text-gray-400"}`}>Total</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Sticky User Rank */}
      {myEntry && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-20">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Your Position</p>
              <p className="text-2xl font-black text-red-600">#{myEntry.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase">Points / Time</p>
              <p className="text-xl font-black text-black">{myEntry.totalPoints} <span className="text-xs text-red-600 font-bold ml-1">{myEntry.displayTime || '--'}</span></p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PodiumCard({ entry, currentUid, height, crown = false }: { entry: PlayerEntry; currentUid: string | null; height: string; crown?: boolean }) {
  const isMe = entry.uid === currentUid;
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      {crown && <Crown size={20} className="text-red-600 animate-bounce" />}
      <div className={`w-full ${height} rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-white border ${isMe ? "border-red-600 shadow-md scale-105" : "border-gray-200 shadow-sm"}`}>
        <span className="text-xl">{MEDAL[entry.rank]}</span>
        <span className={`text-base font-black ${isMe ? "text-red-600" : "text-black"}`}>{entry.totalPoints}</span>
      </div>
      <p className={`text-[9px] font-black text-center truncate w-full ${isMe ? "text-red-600" : "text-black opacity-70"}`}>
        {isMe ? "YOU" : entry.username.split(" ")[0]}
      </p>
    </div>
  );
}