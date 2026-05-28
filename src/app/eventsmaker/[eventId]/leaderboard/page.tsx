"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase"; // Switched to Firestore instance
import { collection, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Trophy, ChevronLeft, Loader2, Crown, AlertCircle, Timer } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ─────────────────────────────────────────────
// Types & Helpers
// ─────────────────────────────────────────────
interface PlayerEntry {
  uid: string;
  username: string;
  totalPoints: number;
  qrPoints: number;
  quizPoints: number;
  prize: string | null;
  rank: number;
  displayTime: string | null;
  timeSeconds: number;
}

// Updated to parse hours, minutes, and seconds from format: "70h 57m 38s"
const timeToSeconds = (timeStr: string | null | undefined): number => {
  if (!timeStr || timeStr === "N/A") return 99999999;
  const hours = timeStr.match(/(\d+)h/);
  const minutes = timeStr.match(/(\d+)m/);
  const seconds = timeStr.match(/(\d+)s/);
  
  const h = hours ? parseInt(hours[1]) : 0;
  const m = minutes ? parseInt(minutes[1]) : 0;
  const s = seconds ? parseInt(seconds[1]) : 0;
  
  return (h * 3600) + (m * 60) + s;
};

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

      // 1. Reference the player_log subcollection in Firestore
      const playerLogRef = collection(db, "events", eventId, "player_log");
      
      const unsubscribeData = onSnapshot(playerLogRef, async (snapshot) => {
        try {
          const logDocs = snapshot.docs;

          // 2. Map through logs and pull human-readable usernames from the 'users' collection
          const entries = await Promise.all(
            logDocs.map(async (docSnap) => {
              const uid = docSnap.id;
              const data = docSnap.data();

              let fetchedUsername = "Unknown Explorer";
              try {
                const userDocSnap = await getDoc(doc(db, "users", uid));
                if (userDocSnap.exists()) {
                  fetchedUsername = userDocSnap.data()?.username || "Unknown Explorer";
                }
              } catch (e) {
                console.error(`Error loading username for profile ${uid}:`, e);
              }

              const qrP = Number(data?.qrPoints) || 0;
              const quizP = Number(data?.quizPoints) || 0;
              const finishTime = data?.totalTime || null;

              return {
                uid,
                username: fetchedUsername,
                totalPoints: qrP + quizP, // Summing up target metrics
                qrPoints: qrP,
                quizPoints: quizP,
                prize: data?.roulettePrize ?? null,
                displayTime: finishTime,
                timeSeconds: timeToSeconds(finishTime),
                rank: 1, // Fallback placeholder initial tier
              };
            })
          );

          // 3. Sorting Engine: Sort by points (Desc) -> Then by completion speed time (Asc)
          entries.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
              return b.totalPoints - a.totalPoints;
            }
            return a.timeSeconds - b.timeSeconds; // Less time taken wins the tiebreaker
          });

          // 4. Rank assignment sequence
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

          // 5. Sync your own current rank value back into your Firestore record document
          const myUpdatedRank = ranked.find(p => p.uid === user.uid)?.rank;
          if (myUpdatedRank) {
            const myLogDocRef = doc(db, "events", eventId, "player_log", user.uid);
            await updateDoc(myLogDocRef, {
              rank: myUpdatedRank
            });
          }
          
          setLoading(false);
        } catch (err) {
          console.error("Leaderboard population failure:", err);
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
                 <p className="text-[9px] font-bold text-black">QR: {player.qrPoints} | QUIZ: {player.quizPoints}</p>
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