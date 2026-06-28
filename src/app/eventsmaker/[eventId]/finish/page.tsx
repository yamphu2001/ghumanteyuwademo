
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { rtdb, db, auth } from '@/lib/firebase';
import { ref, get as getRtdb } from 'firebase/database';
import { doc, getDoc as getFirestore, updateDoc, onSnapshot } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from "qrcode.react";
import Link from 'next/link';

const FinishPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const [endStats, setEndStats] = useState<any>({
    uid: null,
    totalTime: "N/A",
    completionRate: 0,
    canQuiz: false,
    username: "Explorer",
    wonPrize: null,
    prizeStatus: null,
    totalPoints: 0,
    qrPoints: 0,
    quizPoints: 0,
    quizCompleted: false,
    rouletteCompleted: false
  });
  const [loading, setLoading] = useState(true);
  const [barWidth, setBarWidth] = useState(0);

  const allowQuizEntry = () => {
    if (typeof window === "undefined" || !eventId) return;
    window.sessionStorage.setItem(
      `quizAccess:${eventId}`,
      JSON.stringify({ eventId, ts: Date.now() })
    );
  };

  const allowRouletteEntry = () => {
    if (typeof window === "undefined" || !eventId) return;
    window.sessionStorage.setItem(
      `rouletteAccess:${eventId}`,
      JSON.stringify({ eventId, ts: Date.now() })
    );
  };

  useEffect(() => {
    let unsubscribeLog: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!eventId) {
        router.replace("/eventsmaker");
        return;
      }

      try {
        const { hasPlayerFinished } = await import("../play/_checkFinished");
        const finished = await hasPlayerFinished(eventId as string, user.uid);

        if (!finished) {
          router.replace(`/eventsmaker/${eventId}/play`);
          return;
        }

        const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}`);
        const rtdbSnapshot = await getRtdb(userProgressRef);

        let progressPercent = 0;
          let currentPrizeStatus = null;
          let rtdbRoulettePrize = null;

          if (rtdbSnapshot.exists()) {
            const rtdbData = rtdbSnapshot.val();
            if (typeof rtdbData.progress === 'string') {
              progressPercent = parseInt(rtdbData.progress, 10) || 0;
            } else {
              progressPercent = rtdbData.completionRate || 0;
            }

            currentPrizeStatus = rtdbData.prize || rtdbData.userInfo?.prize || null;
            rtdbRoulettePrize = rtdbData.roulettePrize || rtdbData.userInfo?.roulettePrize || null;
          }

          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getFirestore(userDocRef);
          let firestoreUsername = user.displayName || "Explorer";

          if (userDocSnapshot.exists()) {
            firestoreUsername = userDocSnapshot.data()?.username || firestoreUsername;
          }

          const playerLogRef = doc(db, "events", eventId as string, "player_log", user.uid);

          if (unsubscribeLog) unsubscribeLog();

          unsubscribeLog = onSnapshot(playerLogRef, (playerLogSnapshot) => {
            let calculatedTimeTaken = "N/A";
            let computedTotalPoints = 0;
            let computedQrPoints = 0;
            let computedQuizPoints = 0;
            let roulettePrize = rtdbRoulettePrize;
            let livePrizeStatus = currentPrizeStatus;
            let quizDone = false;
            let rouletteDone = false;

            if (playerLogSnapshot.exists()) {
              const logData = playerLogSnapshot.data();

              if (logData.prizeStatus) {
                livePrizeStatus = logData.prizeStatus;
              }
              if (logData.roulettePrize || logData.wonPrize) {
                roulettePrize = logData.roulettePrize || logData.wonPrize;
              }

              computedQrPoints = logData.qrPoints || 0;
              computedQuizPoints = logData.quizPoints || 0;
              computedTotalPoints = computedQrPoints + computedQuizPoints;

              quizDone = logData.quizCompleted === true || logData.quizPoints > 0;
              rouletteDone = logData.rouletteCompleted === true || !!(logData.roulettePrize || logData.wonPrize);

              if (logData.totalTime) {
                calculatedTimeTaken = logData.totalTime;
              } else if (logData.startat && logData.finishat) {
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

                    updateDoc(playerLogRef, {
                      totalTime: calculatedTimeTaken
                    }).catch(err => console.error("Error writing total time back:", err));
                  }
                }
              }
            }

            setEndStats({
              uid: user.uid,
              totalTime: calculatedTimeTaken,
              completionRate: progressPercent,
              canQuiz: progressPercent >= 80,
              username: firestoreUsername,
              wonPrize: roulettePrize,
              prizeStatus: livePrizeStatus,
              totalPoints: computedTotalPoints,
              qrPoints: computedQrPoints,
              quizPoints: computedQuizPoints,
              quizCompleted: quizDone,
              rouletteCompleted: rouletteDone
            });

            setTimeout(() => {
              setBarWidth(Math.min(progressPercent, 100));
            }, 150);

            setLoading(false);
          }, (error) => {
            console.error("Error streaming live log state snapshot:", error);
            setLoading(false);
          });

        } catch (error) {
          console.error("Error fetching event dashboard stats:", error);
          setLoading(false);
        }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeLog) unsubscribeLog();
    };
  }, [eventId]);

  const qrPayload = JSON.stringify({
    event: eventId,
    uid: endStats.uid,
    player: endStats.username,
    status: "FINISHED",
    progress: `${endStats.completionRate}%`,
    time: endStats.totalTime,
    points: endStats.totalPoints,
    prizeWon: endStats.wonPrize || "No Prize Won",
    type: "verification_finish"
  });

  const bothDone = endStats.quizCompleted && endStats.rouletteCompleted;
  const quizClickable = endStats.canQuiz && !endStats.quizCompleted && !bothDone;
  const showRoulette = endStats.quizCompleted;
  const rouletteClickable = showRoulette && !endStats.rouletteCompleted && !bothDone;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-black font-black uppercase tracking-tighter text-xl md:text-2xl animate-pulse">
        Calculating Results...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-500 selection:text-white relative overflow-x-hidden">

      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <Link
          href={`/eventsmaker/${eventId}/leaderboard`}
          className="px-3 py-1.5 md:px-4 md:py-2 border-2 border-black bg-white text-black font-black text-[10px] md:text-xs uppercase hover:bg-red-600 hover:text-white transition-all active:scale-95 block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Leaderboard
        </Link>
      </div>

      <div className="max-w-md mx-auto pt-16 md:pt-20 px-6 md:px-8">

        <header className="mb-10 md:mb-12">
          <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-2">
            Finish<span className="text-red-600">Line</span>
          </h1>
          <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">
            Player: {endStats.username}
          </p>
          <div className="h-2 w-16 md:w-20 bg-black mt-2" />
        </header>

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
              <p className="text-4xl md:text-2xl font-black tabular-nums text-red-600 tracking-tight">
                {endStats.totalPoints} <span className="text-xs font-bold text-black-600">PTS</span>
              </p>
              <div className="flex gap-3 justify-end mt-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-black-600">
                  QR: <span className="text-red-600">{endStats.qrPoints}</span>
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-black-600">
                  Quiz: <span className="text-red-600">{endStats.quizPoints}</span>
                </p>
              </div>
            </div>
          </div>

          {endStats.wonPrize && (
            <div className="pt-2 border-t border-dashed border-gray-200 animate-fadeIn">
              <p className="text-[9px] md:text-[15px] font-bold uppercase tracking-[0.3em] text-black-600 mb-1">Your Reward</p>
              <p className="text-3xl md:text-2xl font-black uppercase text-red-600 tracking-tight drop-shadow-sm">
                🎁 {endStats.wonPrize}
              </p>
            </div>
          )}

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

        <div className="flex flex-col gap-3 md:gap-4 mb-12">
          <button
            onClick={() => {
              if (!quizClickable) return;
              allowQuizEntry();
              window.location.href = `/eventsmaker/${eventId}/quiz`;
            }}
            disabled={!quizClickable}
            className={`w-full py-4 md:py-5 font-black uppercase text-lg md:text-xl transition-all block ${
              quizClickable
                ? 'border-2 border-black bg-white text-black hover:bg-red-600 hover:text-white active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gray-100 text-gray-400 border-2 border-gray-300 cursor-not-allowed shadow-none'
            }`}
          >
            {endStats.quizCompleted ? "Quiz Completed ✓" : endStats.canQuiz ? "Start Final Quiz" : "Quiz Locked"}
          </button>

          {showRoulette && (
            <button
              onClick={() => {
                if (!rouletteClickable) return;
                allowRouletteEntry();
                window.location.href = `/eventsmaker/${eventId}/roulette`;
              }}
              disabled={!rouletteClickable}
              className={`w-full py-4 md:py-5 font-black uppercase text-lg md:text-xl transition-all block ${
                rouletteClickable
                  ? 'bg-white border-2 border-black text-black hover:bg-red-600 hover:text-white active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-300 cursor-not-allowed shadow-none'
              }`}
            >
              {endStats.rouletteCompleted ? "Reward Claimed ✓" : "Spin for Rewards"}
            </button>
          )}
        </div>

        <div className="bg-black-600 border-2 border-dashed border-black/20 rounded-4xl p-6 md:p-8 text-center mb-12">
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