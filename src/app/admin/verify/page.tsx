"use client";
import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "@/lib/firebase";
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, onSnapshot, orderBy, query
} from "firebase/firestore";

interface PrizeClaim {
  uid: string;
  username: string;
  phone: string;
  correctanswers: number;
  visitedCount: number;
  durationMinutes: number;
  finished: boolean;
  markers: string[];
  claimedAt: any;
}

export default function AdminPrizeScanner() {
  const scannerRef = useRef<any>(null);
  const [lastResult, setLastResult] = useState<PrizeClaim | null>(null);
  const [status, setStatus] = useState<string>("Waiting for scan...");
  const [history, setHistory] = useState<PrizeClaim[]>([]);
  const [activeTab, setActiveTab] = useState<"scanner" | "history">("scanner");

  // Live history from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "prizeClaims"),
      orderBy("claimedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => d.data() as PrizeClaim));
    });
    return () => unsub();
  }, []);

  // Scanner
  useEffect(() => {
    if (activeTab !== "scanner") return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const data = JSON.parse(decodedText);

          if (!data.uid) {
            setStatus("❌ Invalid QR (no UID)");
            return;
          }

          const prizeRef = doc(db, "prizeClaims", data.uid);
          const existing = await getDoc(prizeRef);

          if (existing.exists()) {
            setStatus("⚠️ Already claimed");
            setLastResult(existing.data() as PrizeClaim);
            return;
          }

          // Clean markers — filter out nulls
          const cleanMarkers = Array.isArray(data.markers)
            ? data.markers.filter((m: any) => m !== null && m !== undefined)
            : [];

          const prizeData: PrizeClaim = {
            uid: data.uid,
            username: data.username ?? "Unknown",
            phone: data.phone ?? "N/A",
            correctanswers: data.correctanswers ?? 0,
            visitedCount: data.visitedCount ?? 0,
            durationMinutes: Math.abs(data.durationMinutes ?? 0), // fix negative
            finished: data.finished ?? false,
            markers: cleanMarkers,
            claimedAt: serverTimestamp(),
          };

          await setDoc(prizeRef, prizeData);
          setLastResult(prizeData);
          setStatus("✅ Prize recorded successfully!");
        } catch (err) {
          console.error(err);
          setStatus("❌ Invalid QR format");
        }
      },
      () => {} // ignore scan errors
    );

    scannerRef.current = scanner;
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [activeTab]);

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">🎁 Prize Claim Admin</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === "scanner"
                ? "bg-black text-white"
                : "bg-white text-black border"
            }`}
          >
            📷 Scanner
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === "history"
                ? "bg-black text-white"
                : "bg-white text-black border"
            }`}
          >
            📋 History ({history.length})
          </button>
        </div>

        {/* Scanner Tab */}
        {activeTab === "scanner" && (
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-2xl shadow p-4 w-full max-w-md">
              <div id="qr-reader" className="w-full" />
            </div>

            <div className={`mt-4 px-4 py-2 rounded-lg font-medium text-sm ${
              status.startsWith("✅") ? "bg-green-100 text-green-700" :
              status.startsWith("⚠️") ? "bg-yellow-100 text-yellow-700" :
              status.startsWith("❌") ? "bg-red-100 text-red-700" :
              "bg-gray-200 text-gray-600"
            }`}>
              {status}
            </div>

            {lastResult && (
              <div className="mt-6 bg-white p-5 rounded-2xl shadow w-full max-w-md">
                <h2 className="font-bold text-lg mb-3 border-b pb-2">Last Scanned</h2>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Name:</span> {lastResult.username}</p>
                  <p><span className="font-semibold">Phone:</span> {lastResult.phone}</p>
                  <p><span className="font-semibold">Score:</span> {lastResult.correctanswers}</p>
                  <p><span className="font-semibold">Visited:</span> {lastResult.visitedCount} markers</p>
                  <p><span className="font-semibold">Duration:</span> {lastResult.durationMinutes} min</p>
                  <p><span className="font-semibold">Finished:</span> {lastResult.finished ? "✅ Yes" : "❌ No"}</p>
                  {lastResult.markers.length > 0 && (
                    <div>
                      <p className="font-semibold mt-2">Markers visited:</p>
                      <ul className="list-disc list-inside text-gray-600 mt-1">
                        {lastResult.markers.map((m, i) => (
                          <li key={i}>{typeof m === "string" ? m : JSON.stringify(m)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No claims yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Name</th>
                      <th className="text-left px-4 py-3 font-semibold">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold">Score</th>
                      <th className="text-left px-4 py-3 font-semibold">Visited</th>
                      <th className="text-left px-4 py-3 font-semibold">Duration</th>
                      <th className="text-left px-4 py-3 font-semibold">Finished</th>
                      <th className="text-left px-4 py-3 font-semibold">Claimed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((claim, i) => (
                      <tr key={claim.uid} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-medium">{claim.username}</td>
                        <td className="px-4 py-3 text-gray-600">{claim.phone}</td>
                        <td className="px-4 py-3">{claim.correctanswers}</td>
                        <td className="px-4 py-3">{claim.visitedCount}</td>
                        <td className="px-4 py-3">{claim.durationMinutes} min</td>
                        <td className="px-4 py-3">{claim.finished ? "✅" : "❌"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(claim.claimedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}