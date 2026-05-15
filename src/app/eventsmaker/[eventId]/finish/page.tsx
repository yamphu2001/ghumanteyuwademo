

// 'use client'  gaggaga;

// import React, { useEffect, useState } from 'react';
// import { rtdb, auth } from '@/lib/firebase';
// import { ref, get } from 'firebase/database';
// import { useParams } from 'next/navigation';
// import { onAuthStateChanged } from 'firebase/auth';
// import { QRCodeSVG } from "qrcode.react";
// import Link from 'next/link'; // Added Link for routing

// const FinishPage = () => {
//   const { eventId } = useParams();
//   const [endStats, setEndStats] = useState<any>({
//     totalTime: "N/A",
//     completionRate: 0,
//     canQuiz: false,
//     username: "Explorer",
//     wonPrize: null 
//   });
//   const [loading, setLoading] = useState(true);
//   const [barWidth, setBarWidth] = useState(0);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user && eventId) {
//         try {
//           const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}`);
//           const snapshot = await get(userProgressRef);
          
//           if (snapshot.exists()) {
//             const data = snapshot.val();
//             const rate = data.completionRate || 0;
            
//             const mainPrize = data.userInfo?.roulettePrize || null;

//             setEndStats({
//               totalTime: data.scannedTimes?.timeTaken || "N/A",
//               completionRate: rate,
//               canQuiz: rate >= 80,
//               username: data.userInfo?.username || user.displayName || "Explorer",
//               wonPrize: mainPrize 
//             });

//             setTimeout(() => {
//               setBarWidth(Math.min(rate, 100));
//             }, 150);
//           }
//         } catch (error) {
//           console.error("Error fetching stats:", error);
//         }
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [eventId]);

//   const qrPayload = JSON.stringify({
//     event: eventId,
//     player: endStats.username,
//     status: "FINISHED",
//     progress: `${endStats.completionRate}%`,
//     time: endStats.totalTime,
//     prizeWon: endStats.wonPrize || "No Prize Won", 
//     type: "verification_finish"
//   });

//   if (loading) return (
//     <div className="min-h-screen bg-white flex items-center justify-center">
//       <div className="text-black font-black uppercase tracking-tighter text-2xl animate-pulse">
//         Calculating Results...
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-white text-black font-sans selection:bg-red-500 selection:text-white relative">
      
//       {/* Top Right Leaderboard Button */}
//       <div className="absolute top-6 right-6 z-50">
//         <Link 
//           href={`/eventsmaker/${eventId}/leaderboard`}
//           className="px-4 py-2 border-2 border-black bg-white text-black font-black text-xs uppercase hover:bg-black hover:text-white transition-all active:scale-95 block"
//         >
//           Leaderboard
//         </Link>
//       </div>

//       <div className="max-w-md mx-auto pt-20 px-8">
        
//         {/* Header */}
//         <header className="mb-12">
//           <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none mb-2">
//             Finish<span className="text-red-600">Line</span>
//           </h1>
//           <div className="h-2 w-20 bg-black" />
//         </header>

//         {/* Stats Section */}
//         <section className="space-y-10 mb-16">
//           <div>
//             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-1">Time Elapsed</p>
//             <p className="text-5xl font-black tabular-nums text-red-600 tracking-tight">
//               {endStats.totalTime}
//             </p>
//           </div>

//           <div>
//             <div className="flex justify-between items-end mb-3">
//               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Mission Progress</p>
//               <p className="text-3xl font-black italic">{endStats.completionRate}%</p>
//             </div>
            
//             <div className="w-full bg-gray-100 h-4 relative overflow-hidden border border-black/5">
//               <div
//                 className="bg-black h-full transition-all duration-1000 ease-out"
//                 style={{ width: `${barWidth}%` }}
//               />
//             </div>
//           </div>
//         </section>

//         {/* Action Buttons */}
//         <div className="flex flex-col gap-4 mb-12">
//           <button
//             onClick={() => window.location.href = `/eventsmaker/${eventId}/quiz`}
//             disabled={!endStats.canQuiz}
//             className={`w-full py-5 border-[3px] border-black font-black uppercase text-xl transition-all ${
//               endStats.canQuiz 
//                 ? 'bg-black text-white hover:bg-red-600 hover:border-red-600 active:scale-[0.98]' 
//                 : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
//             }`}
//           >
//             {endStats.canQuiz ? "Start Final Quiz" : "Quiz Locked"}
//           </button>

//           <button
//             onClick={() => window.location.href = `/eventsmaker/${eventId}/roulette`}
//             className="w-full py-5 bg-white border-[3px] border-black text-black font-black uppercase text-xl hover:bg-black hover:text-white transition-all active:scale-[0.98]"
//           >
//             Spin for Rewards
//           </button>
//         </div>

//         {/* Staff Verification QR Section */}
//         <div className="bg-gray-50 border-2 border-dashed border-black/20 rounded-3xl p-8 text-center mb-12">
//             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Staff Verification</p>
//             <div className="bg-white p-4 rounded-2xl inline-block shadow-sm border border-black/5 mb-4">
//                <QRCodeSVG value={qrPayload} size={140} />
//             </div>
            
//             {endStats.wonPrize ? (
//               <div className="mb-2">
//                 <p className="text-[10px] font-black text-gray-400 uppercase">Grand Prize</p>
//                 <p className="text-lg font-black uppercase text-red-600">
//                   {endStats.wonPrize}
//                 </p>
//               </div>
//             ) : (
//               <p className="text-[10px] font-black text-gray-400 uppercase mb-2">
//                 Spin the wheel to win a prize
//               </p>
//             )}
            
//             <p className="text-[11px] font-bold text-black/60 uppercase">
//               Show this to staff to verify <br/> your completion and reward
//             </p>
//         </div>

//         {/* Footer Detail */}
//         <footer className="mt-20 border-t border-black/10 pt-8 pb-12">
//           <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest text-center">
//             Event ID: {eventId} • Unauthorized access prohibited
//           </p>
//         </footer>

//       </div>
//     </div>
//   );
// };

// export default FinishPage;



'use client';

import React, { useEffect, useState } from 'react';
import { rtdb, auth } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from "qrcode.react";
import Link from 'next/link';

const FinishPage = () => {
  const { eventId } = useParams();
  const [endStats, setEndStats] = useState<any>({
    totalTime: "N/A",
    completionRate: 0,
    canQuiz: false,
    username: "Explorer",
    wonPrize: null 
  });
  const [loading, setLoading] = useState(true);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && eventId) {
        try {
          const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}`);
          const snapshot = await get(userProgressRef);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            const rate = data.completionRate || 0;
            const mainPrize = data.userInfo?.roulettePrize || null;

            setEndStats({
              totalTime: data.scannedTimes?.timeTaken || "N/A",
              completionRate: rate,
              canQuiz: rate >= 80,
              username: data.userInfo?.username || user.displayName || "Explorer",
              wonPrize: mainPrize 
            });

            setTimeout(() => {
              setBarWidth(Math.min(rate, 100));
            }, 150);
          }
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  const qrPayload = JSON.stringify({
    event: eventId,
    player: endStats.username,
    status: "FINISHED",
    progress: `${endStats.completionRate}%`,
    time: endStats.totalTime,
    prizeWon: endStats.wonPrize || "No Prize Won", 
    type: "verification_finish"
  });

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-black font-black uppercase tracking-tighter text-xl md:text-2xl animate-pulse">
        Calculating Results...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-500 selection:text-white relative overflow-x-hidden">
      
      {/* Responsive Top Right Leaderboard Button */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <Link 
          href={`/eventsmaker/${eventId}/leaderboard`}
          className="px-3 py-1.5 md:px-4 md:py-2 border-2 border-black bg-white text-black font-black text-[10px] md:text-xs uppercase hover:bg-black hover:text-white transition-all active:scale-95 block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Leaderboard
        </Link>
      </div>

      <div className="max-w-md mx-auto pt-16 md:pt-20 px-6 md:px-8">
        
        {/* Header - Fluid Typography */}
        <header className="mb-10 md:mb-12">
          <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-2">
            Finish<span className="text-red-600">Line</span>
          </h1>
          <div className="h-2 w-16 md:w-20 bg-black" />
        </header>

        {/* Stats Section */}
        <section className="space-y-8 md:space-y-10 mb-12 md:mb-16">
          <div>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-1">Time Elapsed</p>
            <p className="text-4xl md:text-5xl font-black tabular-nums text-red-600 tracking-tight">
              {endStats.totalTime}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Mission Progress</p>
              <p className="text-2xl md:text-3xl font-black italic">{endStats.completionRate}%</p>
            </div>
            
            <div className="w-full bg-gray-100 h-3 md:h-4 relative overflow-hidden border border-black/5">
              <div
                className="bg-black h-full transition-all duration-1000 ease-out"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </section>

        {/* Action Buttons - Tactile sizing for mobile */}
        <div className="flex flex-col gap-3 md:gap-4 mb-12">
          <button
            onClick={() => window.location.href = `/eventsmaker/${eventId}/quiz`}
            disabled={!endStats.canQuiz}
            className={`w-full py-4 md:py-5 border-[3px] border-black font-black uppercase text-lg md:text-xl transition-all ${
              endStats.canQuiz 
                ? 'bg-black text-white hover:bg-red-600 hover:border-red-600 active:scale-[0.98]' 
                : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
            }`}
          >
            {endStats.canQuiz ? "Start Final Quiz" : "Quiz Locked"}
          </button>

          <button
            onClick={() => window.location.href = `/eventsmaker/${eventId}/roulette`}
            className="w-full py-4 md:py-5 bg-white border-[3px] border-black text-black font-black uppercase text-lg md:text-xl hover:bg-black hover:text-white transition-all active:scale-[0.98]"
          >
            Spin for Rewards
          </button>
        </div>

        {/* Staff Verification QR Section - Responsive Padding */}
        <div className="bg-gray-50 border-2 border-dashed border-black/20 rounded-[2rem] p-6 md:p-8 text-center mb-12">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Staff Verification</p>
            <div className="bg-white p-3 md:p-4 rounded-2xl inline-block shadow-sm border border-black/5 mb-4">
               {/* QR Resizes slightly for smaller screens */}
               <div className="hidden xs:block">
                 <QRCodeSVG value={qrPayload} size={140} />
               </div>
               <div className="xs:hidden">
                 <QRCodeSVG value={qrPayload} size={120} />
               </div>
            </div>
            
            {endStats.wonPrize ? (
              <div className="mb-2 px-2">
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Grand Prize</p>
                <p className="text-base md:text-lg font-black uppercase text-red-600 break-words">
                  {endStats.wonPrize}
                </p>
              </div>
            ) : (
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase mb-2">
                Spin the wheel to win a prize
              </p>
            )}
            
            <p className="text-[10px] md:text-[11px] font-bold text-black/60 uppercase leading-relaxed">
              Show this to staff to verify <br className="hidden md:block"/> your completion and reward
            </p>
        </div>

        {/* Footer Detail */}
        <footer className="mt-16 md:mt-20 border-t border-black/10 pt-8 pb-12">
          <p className="text-[8px] md:text-[9px] font-medium text-gray-400 uppercase tracking-widest text-center px-4">
            Event ID: {eventId} <br className="md:hidden"/> • Unauthorized access prohibited
          </p>
        </footer>

      </div>
    </div>
  );
};

export default FinishPage;