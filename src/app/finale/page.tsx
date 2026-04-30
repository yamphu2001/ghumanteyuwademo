"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import QRCode from "react-qr-code";

export default function QuizResultPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      setLoading(true);

      const ref = doc(db, "participants", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setData(snap.data());
      }

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading || !user || !data) {
    return <div className="p-6">Loading result...</div>;
  }

  const username = data.username || user.email || "Player";
  const phone = data.phone || "Not provided";
  const correct = data.correctanswers || 0;

  // LOCATION PROGRESS (safe)
  const userProgress = Array.isArray(data.userProgress) ? data.userProgress : [];
  const visitedCount = userProgress.length;

  // TIME CALC (Firestore timestamps -> MINUTES, safe against negative)
  const start = data.startTime?.seconds || 0;
  const finish = data.finishTime?.seconds || 0;

  const durationMinutes = start && finish
    ? Math.max(0, Math.round((finish - start) / 60))
    : 0;

  const qrPayload = {
    uid: user.uid,
    username,
    phone,
    correctanswers: correct,
    visitedCount,
    durationMinutes,
    finished: data.finished || false,
    markers: Array.isArray(userProgress)
      ? userProgress
          .map((p: any) => p?.markerId)
          .filter(Boolean)
      : []
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-2xl shadow max-w-md w-full text-center">

        {/* Logo */}
        <img
          src="/landing/landing_logo.png"
          className="h-14 mx-auto mb-4"
        />

        <h1 className="text-2xl font-bold mb-4">Final Result</h1>

        <div className="text-left space-y-2 mb-4">
          <p><b>User:</b> {username}</p>
          <p><b>Phone:</b> {phone}</p>
          <p><b>Correct Answers:</b> {correct}</p>
          <p><b>Locations Visited:</b> {visitedCount}</p>
          <p><b>Time Taken:</b> {durationMinutes} minutes</p>
        </div>

        <div className="flex justify-center my-4">
          <QRCode value={JSON.stringify(qrPayload)} />
        </div>

        <p className="text-xs text-gray-500">
          Scan to verify participant progress
        </p>

      </div>
    </div>
  );
}
