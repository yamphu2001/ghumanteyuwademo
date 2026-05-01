
"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import QRCode from "react-qr-code";
import { useRouter } from 'next/navigation';

function secondsToReadable(totalSec: number): string {
  if (totalSec <= 0) return "0s";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function QuizResultPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const snap = await getDoc(doc(db, "participants", user.uid));
      if (snap.exists()) setData(snap.data());
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading || !user || !data) {
    return <div className="p-6">Loading result...</div>;
  }

  const username     = data.username || user.email || "Player";
  const phone        = data.phone    || "Not provided";
  const correct      = data.correctanswers || 0;
  const userProgress = Array.isArray(data.userProgress) ? data.userProgress : [];
  const visitedCount = userProgress.length;

  const startSec    = data.startTime?.seconds  ?? 0;
  const finishSec   = data.finishTime?.seconds ?? 0;
  const durationSec = startSec && finishSec ? Math.max(0, finishSec - startSec) : 0;
  const durationStr = secondsToReadable(durationSec);

  // ── QR encodes exactly what is shown on screen — plain readable text ──────
  const qrText = [
    `User: ${username}`,
    `Phone: ${phone}`,
    `Correct Answers: ${correct}`,
    `Locations Visited: ${visitedCount}`,
    `Time Taken: ${durationStr}`,
    `Finished: ${data.finished ? "Yes" : "No"}`,
  ].join("\n");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-2xl shadow max-w-md w-full text-center">

        <img src="/landing/landing_logo.png" className="h-14 mx-auto mb-4" />
        <div>
          <button
            className="text-sm text-blue-500 hover:underline mb-4"
            onClick={() => router.push('/leaderboard')}
          >
            &larr; Leaderboard
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-4">Final Result</h1>

        <div className="text-left space-y-2 mb-4">
          <p><b>User:</b> {username}</p>
          <p><b>Phone:</b> {phone}</p>
          <p><b>Correct Answers:</b> {correct}</p>
          <p><b>Locations Visited:</b> {visitedCount}</p>
          <p><b>Time Taken:</b> {durationStr}</p>
        </div>

        <div className="flex justify-center my-4">
          <QRCode value={qrText} />
        </div>

        <p className="text-xs text-gray-500">Scan to verify participant progress</p>
      </div>
    </div>
  );
}