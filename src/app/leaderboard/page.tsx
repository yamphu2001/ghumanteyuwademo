
// "use client";

// import { useEffect, useState } from "react";
// import { db } from "@/lib/firebase";
// import { collection, getDocs } from "firebase/firestore";

// type Player = {
//   id: string;
//   username: string;
//   quizScore: number;
//   timeTakenStr: string;
// };

// export default function LeaderboardPage() {
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchLeaderboard = async () => {
//       try {
//         const querySnapshot = await getDocs(
//           collection(db, "adminLeaderboard")
//         );

//         const data: Player[] = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...(doc.data() as Omit<Player, "id">),
//         }));

//         // 🔥 UPDATED RANKING SYSTEM: ONLY TIME MATTERS
//         data.sort((a, b) => {
//           // Shortest time (ascending alphabetical/numeric string comparison) comes first
//           return a.timeTakenStr.localeCompare(b.timeTakenStr);
//         });

//         setPlayers(data);
//       } catch (error) {
//         console.error("Error fetching leaderboard:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLeaderboard();
//   }, []);

//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center text-xl font-black text-red-600 bg-white tracking-widest">
//         LOADING...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-white text-black font-sans p-4 md:p-10">
//       {/* Header */}
//       <div className="max-w-4xl mx-auto border-b-4 border-red-600 mb-6 md:mb-10 pb-4">
//         <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
//           Leader<span className="text-red-600">board</span>
//         </h1>
//         <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">
//           Ranked by Fastest Completion Time
//         </p>
//       </div>

//       <div className="max-w-4xl mx-auto">
//         {/* Table Header */}
//         <div className="hidden md:flex items-center justify-between px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-bold">
//           <div className="w-16">Rank</div>
//           <div className="flex-1">Player</div>
//           <div className="w-24 text-right">Score</div>
//           <div className="w-32 text-right">Time</div>
//         </div>

//         {/* Players List */}
//         <div className="border-t md:border-t-0 border-x border-b border-black">
//           {players.map((player, index) => {
//             const isTop3 = index < 3;

//             return (
//               <div
//                 key={player.id}
//                 className={`flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 transition-colors ${
//                   isTop3 ? "bg-red-50/40" : "bg-white"
//                 }`}
//               >
//                 {/* Rank & Name */}
//                 <div className="flex items-center flex-1 mb-2 md:mb-0">
//                   <div className="w-12 md:w-16">
//                     <span className={`inline-block px-2 py-1 font-black text-sm md:text-lg ${
//                       isTop3 ? "bg-red-600 text-white" : "bg-black text-white md:bg-transparent md:text-gray-400"
//                     }`}>
//                       {index + 1}
//                     </span>
//                   </div>
//                   <div className={`text-lg md:text-xl font-black uppercase truncate tracking-tight ${isTop3 ? 'text-red-600' : 'text-black'}`}>
//                     {player.username}
//                   </div>
//                 </div>

//                 {/* Score & Time */}
//                 <div className="flex items-center justify-between md:justify-end md:gap-8 border-t border-gray-100 pt-2 md:pt-0 md:border-none">
//                   <div className="md:w-24 text-left md:text-right">
//                     <span className="text-xs font-bold text-gray-400 uppercase md:hidden block">Score</span>
//                     <span className="text-xl md:text-2xl font-black tabular-nums opacity-50">
//                       {player.quizScore}
//                     </span>
//                   </div>

//                   <div className="md:w-32 text-right">
//                     <span className="text-xs font-bold text-gray-400 uppercase md:hidden block tracking-widest">Fastest Time</span>
//                     <span className="text-xs md:text-sm font-black bg-red-600 text-white px-3 py-1 italic uppercase tracking-tighter shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
//                       {player.timeTakenStr}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Footer Accent */}
//       <div className="max-w-4xl mx-auto mt-4 flex justify-end">
//         <div className="h-1 w-20 bg-red-600"></div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Player = {
  id: string;
  username: string;
  quizScore: number;
  timeTakenStr: string;
  timeTakenMs?: number; // Add this to the type
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "adminLeaderboard"));

        const data: Player[] = querySnapshot.docs.map((doc) => {
          const d = doc.data();
          
          // If your database doesn't have timeTakenMs, we'll parse the string safely
          const parseTimeToMs = (str: string) => {
            const m = str.match(/(\d+)M/);
            const s = str.match(/(\d+)S/);
            const pureS = str.match(/^(\d+)s$/i); // Handles "27s"
            
            let totalMs = 0;
            if (m) totalMs += parseInt(m[1]) * 60000;
            if (s) totalMs += parseInt(s[1]) * 1000;
            if (pureS) totalMs += parseInt(pureS[1]) * 1000;
            return totalMs || Infinity;
          };

          return {
            id: doc.id,
            username: d.username,
            quizScore: d.quizScore,
            timeTakenStr: d.timeTakenStr,
            // Prioritize a hidden ms field if it exists, otherwise parse the string
            timeTakenMs: d.timeTakenMs || parseTimeToMs(d.timeTakenStr),
          };
        });

        // 🔥 THE FIX: Sort by numeric Milliseconds, not the String
        data.sort((a, b) => (a.timeTakenMs || 0) - (b.timeTakenMs || 0));

        setPlayers(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl font-black text-red-600 bg-white tracking-widest uppercase">
        Loading Standings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans p-4 md:p-10">
      <div className="max-w-4xl mx-auto border-b-4 border-red-600 mb-6 md:mb-10 pb-4">
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
          LEADER<span className="text-red-600">BOARD</span>
        </h1>
        <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
          Ranked by Fastest Completion (Lowest Time = 1st)
        </p>
      </div>

      <div className="max-w-4xl mx-auto border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between px-6 py-3 bg-black text-white text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
          <div className="w-12 md:w-16">Rank</div>
          <div className="flex-1 text-left">Player</div>
          <div className="w-20 md:w-24 text-right">Score</div>
          <div className="w-24 md:w-32 text-right">Time</div>
        </div>

        <div>
          {players.map((player, index) => {
            const isTop3 = index < 3;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 last:border-b-0 transition-colors hover:bg-gray-50"
              >
                {/* Rank Box */}
                <div className="w-12 md:w-16">
                  <span className="bg-red-600 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-sm md:text-lg italic">
                    {index + 1}
                  </span>
                </div>

                {/* Player Name */}
                <div className="flex-1 text-left">
                  <span className={`text-lg md:text-2xl font-black uppercase tracking-tighter italic ${isTop3 ? 'text-red-600' : 'text-black'}`}>
                    {player.username}
                  </span>
                </div>

                {/* Score */}
                <div className="w-20 md:w-24 text-right">
                  <span className="text-xl md:text-3xl font-black tabular-nums text-gray-400 italic">
                    {player.quizScore}
                  </span>
                </div>

                {/* Time Highlight */}
                <div className="w-24 md:w-32 text-right flex justify-end">
                  <span className="bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 text-xs md:text-base font-black italic tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {player.timeTakenStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto mt-6 flex justify-end">
         <div className="h-1.5 w-24 bg-red-600"></div>
      </div>
    </div>
  );
}