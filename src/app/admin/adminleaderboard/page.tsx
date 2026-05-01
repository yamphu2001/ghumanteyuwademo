
// "use client";

// import { useEffect, useState } from "react";
// import { db } from "@/lib/firebase";
// import { collection, getDocs, setDoc, doc } from "firebase/firestore";

// interface LeaderboardEntry {
//   rank:           number;
//   uid:            string;
//   username:       string;
//   phone:          string;
//   timeTakenMs:    number;
//   timeTakenStr:   string;
//   completed:      number;
//   total:          number;
//   finished:       boolean;
//   quizCompleted:  boolean;
//   quizScore:      string;   
//   totalPoints:    number;
//   startTime:      string;   
//   finishTime:     string;   
// }

// function msToReadable(ms: number): string {
//   if (ms <= 0) return "0s";
//   const totalSec = Math.floor(ms / 1000);
//   const h = Math.floor(totalSec / 3600);
//   const m = Math.floor((totalSec % 3600) / 60);
//   const s = totalSec % 60;
//   if (h > 0) return `${h}h ${m}m ${s}s`;
//   if (m > 0) return `${m}m ${s}s`;
//   return `${s}s`;
// }

// function tsToString(ts: any): string {
//   if (!ts) return "—";
//   const date = ts.toDate ? ts.toDate() : new Date(ts);
//   return date.toLocaleString("en-US", {
//     month: "short", day: "2-digit", year: "numeric",
//     hour: "2-digit", minute: "2-digit", second: "2-digit",
//     hour12: true,
//   });
// }

// const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// export default function LeaderboardPage() {
//   const [entries,      setEntries]      = useState<LeaderboardEntry[]>([]);
//   const [loading,      setLoading]      = useState(true);
//   const [totalMarkers, setTotalMarkers] = useState(0);
//   const [saved,        setSaved]        = useState(false);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const markerSnap = await getDocs(collection(db, "events/test/qrMarkers"));
//         const total = markerSnap.size;
//         setTotalMarkers(total);

//         const participantsSnap = await getDocs(collection(db, "participants"));
//         const rows: LeaderboardEntry[] = [];

//         participantsSnap.docs.forEach((docSnap) => {
//           const d = docSnap.data();
//           if (!d.finished) return; 

//           const startMs  = d.startTime?.toMillis?.()  ?? 0;
//           const finishMs = d.finishTime?.toMillis?.() ?? 0;
//           const timeTakenMs = finishMs > startMs ? finishMs - startMs : 0;
//           const userProgress: any[] = d.userProgress ?? [];

//           rows.push({
//             rank:           0,
//             uid:            docSnap.id,
//             username:       d.username      ?? "Unknown",
//             phone:          d.phone         ?? "—",
//             timeTakenMs,
//             timeTakenStr:   msToReadable(timeTakenMs),
//             completed:      userProgress.length,
//             total,
//             finished:       d.finished      ?? false,
//             quizCompleted:  d.quizCompleted ?? false,
//             quizScore:      d.quiz          ?? "0/0",
//             totalPoints:    d.totalPoints   ?? 0,
//             startTime:      tsToString(d.startTime),
//             finishTime:     tsToString(d.finishTime),
//           });
//         });

//         rows.sort((a, b) => a.timeTakenMs - b.timeTakenMs);
//         rows.forEach((r, i) => { r.rank = i + 1; });
//         setEntries(rows);

//         await Promise.all(
//           rows.map((r) =>
//             setDoc(doc(db, "adminLeaderboard", r.uid), {
//               rank:           r.rank,
//               uid:            r.uid,
//               username:       r.username,
//               phone:          r.phone,
//               timeTakenMs:    r.timeTakenMs,
//               timeTakenStr:   r.timeTakenStr,
//               completed:      r.completed,
//               total:          r.total,
//               finished:       r.finished,
//               quizCompleted:  r.quizCompleted,
//               quizScore:      r.quizScore, 
//               totalPoints:    r.totalPoints,
//               startTime:      r.startTime,
//               finishTime:     r.finishTime,
//             })
//           )
//         );
//         setSaved(true);
//       } catch (err) {
//         console.error("[leaderboard] fetch/save failed:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   return (
//     <div className="min-h-screen bg-white text-black p-4 md:p-10 font-sans">
//       {/* Header Section */}
//       <div className="max-w-6xl mx-auto mb-8 border-b-4 border-red-600 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
//             Leader<span className="text-red-600">board</span>
//           </h1>
//           <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-2">
//             Sorted by fastest completion · {totalMarkers} total tasks
//           </p>
//         </div>
//         {saved && (
//           <div className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 self-start md:self-auto">
//             Data Synced
//           </div>
//         )}
//       </div>

//       <div className="max-w-6xl mx-auto">
//         {loading ? (
//           <div className="text-center py-24 font-black text-red-600 animate-pulse tracking-widest uppercase">
//             Loading leaderboard...
//           </div>
//         ) : entries.length === 0 ? (
//           <div className="text-center py-24 font-bold text-gray-400 uppercase tracking-widest border-2 border-dashed border-gray-200">
//             No finished players yet.
//           </div>
//         ) : (
//           <div className="overflow-x-auto shadow-[10px_10px_0px_0px_rgba(220,38,38,1)] border-2 border-black">
//             {/* Header row - Desktop Only */}
//             <div className="hidden md:grid grid-cols-[60px_1fr_120px_120px_120px_100px_120px] bg-black text-white px-6 py-4 text-[11px] font-black uppercase tracking-widest">
//               <span>Rank</span>
//               <span>Player</span>
//               <span className="text-center">Progress</span>
//               <span className="text-center">Time Taken</span>
//               <span className="text-center">Quiz Score</span>
//               <span className="text-center">Status</span>
//               <span className="text-right">Details</span>
//             </div>

//             {entries.map((entry, idx) => {
//               const isTop3 = entry.rank <= 3;
              
//               return (
//                 <div
//                   key={entry.uid}
//                   className={`flex flex-col md:grid md:grid-cols-[60px_1fr_120px_120px_120px_100px_120px] items-center px-6 py-5 border-b border-gray-100 transition-colors hover:bg-gray-50 ${
//                     isTop3 ? "bg-red-50/30" : "bg-white"
//                   }`}
//                 >
//                   {/* Rank */}
//                   <div className="w-full md:w-auto flex justify-between md:block mb-2 md:mb-0">
//                     <span className={`text-xl font-black ${isTop3 ? "text-red-600" : "text-black"}`}>
//                       {MEDAL[entry.rank] ?? entry.rank}
//                     </span>
//                     <span className="md:hidden text-[10px] font-black text-red-600 uppercase">Rank</span>
//                   </div>

//                   {/* Player Info */}
//                   <div className="w-full md:w-auto mb-4 md:mb-0">
//                     <h3 className={`text-lg font-black uppercase truncate tracking-tight ${isTop3 ? 'text-red-600' : 'text-black'}`}>
//                       {entry.username}
//                     </h3>
//                     <p className="text-[10px] font-bold text-gray-400 font-mono">{entry.phone}</p>
//                   </div>

//                   {/* Progress */}
//                   <div className="w-full md:w-auto flex justify-between md:flex-col items-center gap-1 mb-3 md:mb-0">
//                     <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Progress</span>
//                     <div className="text-center">
//                       <span className="text-sm font-black">{entry.completed}/{entry.total}</span>
//                       <div className="w-20 md:w-full bg-gray-200 h-1.5 mt-1">
//                         <div 
//                           className="h-full bg-red-600" 
//                           style={{ width: `${(entry.completed/entry.total)*100}%` }} 
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Time Taken */}
//                   <div className="w-full md:w-auto flex justify-between md:block text-center mb-3 md:mb-0">
//                     <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Time</span>
//                     <span className="text-sm font-black tabular-nums bg-black text-white px-2 py-1 italic">
//                       {entry.timeTakenStr}
//                     </span>
//                   </div>

//                   {/* Quiz Score */}
//                   <div className="w-full md:w-auto flex justify-between md:block text-center mb-3 md:mb-0">
//                     <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Score</span>
//                     <span className="text-sm font-black text-red-600 border-2 border-red-600 px-2 py-0.5">
//                       {entry.quizScore}
//                     </span>
//                   </div>

//                   {/* Finished Status */}
//                   <div className="w-full md:w-auto flex justify-between md:block text-center mb-3 md:mb-0">
//                     <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Status</span>
//                     <span className="text-sm">{entry.finished ? "🏁" : "❌"}</span>
//                   </div>

//                   {/* Timestamps */}
//                   <div className="w-full md:w-auto text-right">
//                     <div className="text-[9px] font-bold text-gray-400 leading-tight">
//                       <div className="flex justify-between md:block uppercase">
//                         <span>Start:</span> {entry.startTime}
//                       </div>
//                       <div className="flex justify-between md:block uppercase">
//                         <span>Finish:</span> {entry.finishTime}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Decorative Bottom Bar */}
//       <div className="max-w-6xl mx-auto mt-8 flex justify-end">
//         <div className="h-4 w-32 bg-red-600 italic font-black text-[10px] text-white flex items-center justify-center uppercase tracking-tighter">
//           Final Standings
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  setDoc, 
  doc, 
  onSnapshot, 
  query 
} from "firebase/firestore";

interface LeaderboardEntry {
  rank:           number;
  uid:            string;
  username:       string;
  phone:          string;
  timeTakenMs:    number;
  timeTakenStr:   string;
  completed:      number;
  total:          number;
  finished:       boolean;
  quizCompleted:  boolean;
  quizScore:      string;   
  totalPoints:    number;
  startTime:      string;   
  finishTime:     string;   
}

// Helper: Convert MS to readable string
function msToReadable(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Helper: Convert Firebase Timestamp to String
function tsToString(ts: any): string {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  });
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const [entries,      setEntries]      = useState<LeaderboardEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [totalMarkers, setTotalMarkers] = useState(0);
  const [saved,        setSaved]        = useState(false);

  useEffect(() => {
    // 1. Listen for total markers count
    const unsubscribeMarkers = onSnapshot(collection(db, "events/test/qrMarkers"), (markerSnap) => {
      const currentTotalMarkers = markerSnap.size;
      setTotalMarkers(currentTotalMarkers);

      // 2. Listen for participant changes (Real-time)
      const q = collection(db, "participants");
      const unsubscribeParticipants = onSnapshot(q, async (participantsSnap) => {
        try {
          const rows: LeaderboardEntry[] = [];

          participantsSnap.docs.forEach((docSnap) => {
            const d = docSnap.data();
            // Only include players who have finished
            if (!d.finished) return; 

            const startMs  = d.startTime?.toMillis?.()  ?? 0;
            const finishMs = d.finishTime?.toMillis?.() ?? 0;
            const timeTakenMs = finishMs > startMs ? finishMs - startMs : 0;
            const userProgress: any[] = d.userProgress ?? [];

            rows.push({
              rank:           0,
              uid:            docSnap.id,
              username:       d.username      ?? "Unknown",
              phone:          d.phone         ?? "—",
              timeTakenMs,
              timeTakenStr:   msToReadable(timeTakenMs),
              completed:      userProgress.length,
              total:          currentTotalMarkers,
              finished:       d.finished      ?? false,
              quizCompleted:  d.quizCompleted ?? false,
              quizScore:      d.quiz          ?? "0/0",
              totalPoints:    d.totalPoints   ?? 0,
              startTime:      tsToString(d.startTime),
              finishTime:     tsToString(d.finishTime),
            });
          });

          // Sort by fastest time
          rows.sort((a, b) => a.timeTakenMs - b.timeTakenMs);
          
          // Assign ranking numbers
          rows.forEach((r, i) => { r.rank = i + 1; });
          
          setEntries(rows);

          // 3. Sync to adminLeaderboard collection automatically
          // This keeps the database updated without manual refreshes
          await Promise.all(
            rows.map((r) =>
              setDoc(doc(db, "adminLeaderboard", r.uid), r)
            )
          );
          
          setSaved(true);
        } catch (err) {
          console.error("[leaderboard] Real-time sync failed:", err);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribeParticipants();
    });

    // Cleanup listeners on unmount
    return () => unsubscribeMarkers();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-10 font-sans">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 border-b-4 border-red-600 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
            Leader<span className="text-red-600">board</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-2">
            Sorted by fastest completion · {totalMarkers} total tasks
          </p>
        </div>
        {saved && (
          <div className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 self-start md:self-auto animate-bounce">
            Live Synced
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-24 font-black text-red-600 animate-pulse tracking-widest uppercase">
            Fetching real-time data...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24 font-bold text-gray-400 uppercase tracking-widest border-2 border-dashed border-gray-200">
            No finished players yet.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-[10px_10px_0px_0px_rgba(220,38,38,1)] border-2 border-black">
            {/* Header row - Desktop Only */}
            <div className="hidden md:grid grid-cols-[60px_1fr_120px_120px_120px_100px_120px] bg-black text-white px-6 py-4 text-[11px] font-black uppercase tracking-widest">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-center">Progress</span>
              <span className="text-center">Time Taken</span>
              <span className="text-center">Quiz Score</span>
              <span className="text-center">Status</span>
              <span className="text-right">Details</span>
            </div>

            {entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              
              return (
                <div
                  key={entry.uid}
                  className={`flex flex-col md:grid md:grid-cols-[60px_1fr_120px_120px_120px_100px_120px] items-center px-6 py-5 border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                    isTop3 ? "bg-red-50/30" : "bg-white"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-full md:w-auto flex justify-between md:block mb-2 md:mb-0">
                    <span className={`text-xl font-black ${isTop3 ? "text-red-600" : "text-black"}`}>
                      {MEDAL[entry.rank] ?? entry.rank}
                    </span>
                    <span className="md:hidden text-[10px] font-black text-red-600 uppercase">Rank</span>
                  </div>

                  {/* Player Info */}
                  <div className="w-full md:w-auto mb-4 md:mb-0">
                    <h3 className={`text-lg font-black uppercase truncate tracking-tight ${isTop3 ? 'text-red-600' : 'text-black'}`}>
                      {entry.username}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 font-mono">{entry.phone}</p>
                  </div>

                  {/* Progress */}
                  <div className="w-full md:w-auto flex justify-between md:flex-col items-center gap-1 mb-3 md:mb-0">
                    <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Progress</span>
                    <div className="text-center">
                      <span className="text-sm font-black">{entry.completed}/{entry.total}</span>
                      <div className="w-20 md:w-full bg-gray-200 h-1.5 mt-1">
                        <div 
                          className="h-full bg-red-600" 
                          style={{ width: `${(entry.completed/entry.total)*100}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time Taken */}
                  <div className="w-full md:w-auto flex justify-between md:block text-center mb-3 md:mb-0">
                    <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Time</span>
                    <span className="text-sm font-black tabular-nums bg-black text-white px-2 py-1 italic">
                      {entry.timeTakenStr}
                    </span>
                  </div>

                  {/* Quiz Score */}
                  <div className="w-full md:w-auto flex justify-between md:block text-center mb-3 md:mb-0">
                    <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Score</span>
                    <span className="text-sm font-black text-red-600 border-2 border-red-600 px-2 py-0.5">
                      {entry.quizScore}
                    </span>
                  </div>

                  {/* Finished Status */}
                  <div className="w-full md:w-auto flex justify-between md:block text-center mb-3 md:mb-0">
                    <span className="md:hidden text-[10px] font-black uppercase text-gray-400">Status</span>
                    <span className="text-sm">{entry.finished ? "🏁" : "❌"}</span>
                  </div>

                  {/* Timestamps */}
                  <div className="w-full md:w-auto text-right">
                    <div className="text-[9px] font-bold text-gray-400 leading-tight">
                      <div className="flex justify-between md:block uppercase">
                        <span>Start:</span> {entry.startTime}
                      </div>
                      <div className="flex justify-between md:block uppercase">
                        <span>Finish:</span> {entry.finishTime}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decorative Bottom Bar */}
      <div className="max-w-6xl mx-auto mt-8 flex justify-end">
        <div className="h-4 w-32 bg-red-600 italic font-black text-[10px] text-white flex items-center justify-center uppercase tracking-tighter">
          Final Standings
        </div>
      </div>
    </div>
  );
}