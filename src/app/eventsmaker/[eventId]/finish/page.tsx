
'use client';

import React, { useEffect, useState } from 'react';
import { rtdb, db, auth } from '@/lib/firebase';
import { ref, get as getRtdb } from 'firebase/database';
// Added updateDoc to the firestore imports below
import { doc, getDoc as getFirestore, updateDoc } from 'firebase/firestore';
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
    wonPrize: null,
    prizeStatus: null,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && eventId) {
        try {
          // 1. Fetch Realtime DB progress data
          const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}`);
          const rtdbSnapshot = await getRtdb(userProgressRef);

          let progressPercent = 0;
          let roulettePrize = null;
          let currentPrizeStatus = null;

          if (rtdbSnapshot.exists()) {
            const rtdbData = rtdbSnapshot.val();
            if (typeof rtdbData.progress === 'string') {
              progressPercent = parseInt(rtdbData.progress, 10) || 0;
            } else {
              progressPercent = rtdbData.completionRate || 0;
            }

            currentPrizeStatus = rtdbData.prize || rtdbData.userInfo?.prize || null;
            roulettePrize = rtdbData.roulettePrize || rtdbData.userInfo?.roulettePrize || null;
          }

          // 2. Fetch Player Log metadata from Firestore (Times, Points, and Prizes)
          const playerLogRef = doc(db, "events", eventId as string, "player_log", user.uid);
          const playerLogSnapshot = await getFirestore(playerLogRef);

          let calculatedTimeTaken = "N/A";
          let computedTotalPoints = 0;

          if (playerLogSnapshot.exists()) {
            const logData = playerLogSnapshot.data();

            if (!roulettePrize) {
              roulettePrize = logData.roulettePrize || null;
            }

            // Calculate total points
            const qrPoints = logData.qrPoints || 0;
            const quizPoints = logData.quizPoints || 0;
            computedTotalPoints = qrPoints + quizPoints;

            // Calculate duration from human readable strings (startat and finishat)
            if (logData.startat && logData.finishat) {
              const startTime = new Date(logData.startat).getTime();
              const finishTime = new Date(logData.finishat).getTime();

              if (!isNaN(startTime) && !isNaN(finishTime)) {
                const diffMs = finishTime - startTime;
                if (diffMs >= 0) {
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffSecs = Math.floor((diffMs % 60000) / 1000);

                  const hours = Math.floor(diffMins / 60);
                  const mins = diffMins % 60;

                  if (hours > 0) {
                    calculatedTimeTaken = `${hours}h ${mins}m ${diffSecs}s`;
                  } else {
                    calculatedTimeTaken = `${mins}m ${diffSecs}s`;
                  }

                  // WRITE TO FIRESTORE: Updates 'totalTime' field inside the player_log document
                  if (logData.totalTime !== calculatedTimeTaken) {
                    await updateDoc(playerLogRef, {
                      totalTime: calculatedTimeTaken
                    });
                  }
                }
              }
            }
          }

          // 3. Fetch Player Username explicitly from the Firestore 'users' collection
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getFirestore(userDocRef);
          let firestoreUsername = user.displayName || "Explorer";

          if (userDocSnapshot.exists()) {
            firestoreUsername = userDocSnapshot.data()?.username || firestoreUsername;
          }

          // Update aggregated UI state container
          setEndStats({
            totalTime: calculatedTimeTaken,
            completionRate: progressPercent,
            canQuiz: progressPercent >= 80,
            username: firestoreUsername,
            wonPrize: roulettePrize,
            prizeStatus: currentPrizeStatus,
            totalPoints: computedTotalPoints
          });

          setTimeout(() => {
            setBarWidth(Math.min(progressPercent, 100));
          }, 150);

        } catch (error) {
          console.error("Error fetching event dashboard stats:", error);
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
    points: endStats.totalPoints,
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
          className="px-3 py-1.5 md:px-4 md:py-2 border-2 border-black bg-white text-black font-black text-[10px] md:text-xs uppercase hover:bg-red-600 hover:text-white transition-all active:scale-95 block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
          <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">
            Player: {endStats.username}
          </p>
          <div className="h-2 w-16 md:w-20 bg-black mt-2" />
        </header>

        {/* Stats Section */}
        <section className="space-y-8 md:space-y-10 mb-12 md:mb-16">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] md:text-[15px] font-bold uppercase tracking-[0.3em] text-black-600 mb-1">Time Elapsed</p>
              <p className="text-4xl md:text-2xl font-black tabular-nums text-red-600 tracking-tight">
                {endStats.totalTime}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] md:text-[12px] font-bold uppercase tracking-[0.3em] text-black-600 mb-1">Total Score</p>
              <p className="text-4xl md:text-2xl font-black tabular-nums text-black tracking-tight">
                {endStats.totalPoints} <span className="text-xs font-bold text-black-600">PTS</span>
              </p>
            </div>
          </div>

          {endStats.prizeStatus && (
            <div className="pt-2 animate-fadeIn">
              <p className="text-[9px] md:text-[15px] font-bold uppercase tracking-[0.3em] text-black-600 mb-1">Prize Status</p>
              <p className="text-3xl md:text-2xl font-black uppercase text-red-600 tracking-tight italic">
                {endStats.prizeStatus}
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between items-end mb-3">
              <p className="text-[9px] md:text-[15px] font-bold uppercase tracking-[0.3em] text-black-600">Mission Progress</p>
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
            className={`w-full py-4 md:py-5 font-black uppercase text-lg md:text-xl transition-all block ${endStats.canQuiz
              ? 'border-2 border-black bg-white text-black hover:bg-red-600 hover:text-white active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-gray-100 text-black-600 border-3 border-gray-300 cursor-not-allowed shadow-none'
              }`}
          >
            {endStats.canQuiz ? "Start Final Quiz" : "Quiz Locked"}
          </button>

          <button
            onClick={() => window.location.href = `/eventsmaker/${eventId}/roulette`}
            className="w-full py-4 md:py-5 bg-white border-3 border-black text-black font-black uppercase text-lg md:text-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Spin for Rewards
          </button>
        </div>

        {/* Staff Verification QR Section - Responsive Padding */}
        <div className="bg-black-600 border-2 border-dashed border-black/20 rounded-[2rem] p-6 md:p-8 text-center mb-12">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black-600 mb-4">Staff Verification</p>
          <div className="bg-white p-3 md:p-4 rounded-2xl inline-block shadow-sm border border-black/5 mb-4">
            <div className="hidden xs:block">
              <QRCodeSVG value={qrPayload} size={140} />
            </div>
            <div className="xs:hidden">
              <QRCodeSVG value={qrPayload} size={120} />
            </div>
          </div>

          <p className="text-[10px] md:text-[11px] font-bold text-black/60 uppercase leading-relaxed mt-2">
            Show this to staff to verify <br className="hidden md:block" /> your completion and reward
          </p>
        </div>

        {/* Footer Detail */}
        <footer className="mt-16 md:mt-20 border-t border-black/10 pt-8 pb-12">
          <p className="text-[8px] md:text-[9px] font-medium text-black-600 uppercase tracking-widest text-center px-4">
            Event ID: {eventId} <br className="md:hidden" /> • Unauthorized access prohibited
          </p>
        </footer>

      </div>
    </div>
  );
};

export default FinishPage;



