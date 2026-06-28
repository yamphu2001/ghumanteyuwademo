
'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import QRScanner from '../qrscanner';

interface ScannedPayload {
  event: string;
  uid: string;
  player: string;
  status: string;
  progress: string;
  time: string;
  points: number;
  prizeWon: string;
  type: string;
}

export default function VerifyPage() {
  const { eventId } = useEventId();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastPlayer, setLastPlayer] = useState<string | null>(null);

  const handleScanSuccess = async (rawResult: string) => {
    setIsScannerOpen(false);
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const parsed: ScannedPayload = JSON.parse(rawResult);

      if (!parsed?.uid || !parsed?.event || parsed?.type !== 'verification_finish') {
        setError('Invalid QR code. Not a valid player verification code.');
        return;
      }

      if (eventId && parsed.event !== eventId) {
        setError(`Event mismatch. This code belongs to event: ${parsed.event}`);
        return;
      }

      // 1. Write to root finalqrscanned (unchanged)
      const customDocId = `${parsed.event}_${parsed.uid}`;
      const finalQrRef = doc(db, 'finalqrscanned', customDocId);
      await setDoc(finalQrRef, {
        event: parsed.event,
        uid: parsed.uid,
        prizeStatus: 'CLAIMED',
        claimedAt: new Date().toISOString(),
        scannedPlayer: parsed.player,
        scannedPrize: parsed.prizeWon,
        scannedPoints: parsed.points,
        scannedTime: parsed.time,
        scannedProgress: parsed.progress,
        scannedStatus: parsed.status,
      });

      // 2. ← NEW: also update player_log so finish page reflects CLAIMED
      const playerLogRef = doc(db, 'events', parsed.event, 'player_log', parsed.uid);
      await setDoc(
        playerLogRef,
        { prizeStatus: 'CLAIMED' },
        { merge: true }
      );

      setLastPlayer(parsed.player);
      setSuccess(`Prize claimed for ${parsed.player} in root table!`);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Could not read QR code. Invalid format.');
      } else if (err?.code === 'permission-denied') {
        setError('Permission denied. Check your Firestore rules allow root writes to finalqrscanned.');
      } else {
        setError(err?.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 font-sans">
      <header className="mb-8 border-b-2 border-black pb-6">
        <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">
          FOREVENT / ADMIN
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
          Player Verification (Root Table)
        </h1>
        <div className="text-xs text-gray-500 font-mono uppercase">
          Event: <span className="text-black font-bold">{eventId || 'None Selected'}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        {error && (
          <div className="border-2 border-red-600 bg-red-50 text-red-600 font-bold p-4 text-xs uppercase">
            ✕ {error}
          </div>
        )}
        {success && (
          <div className="border-2 border-green-600 bg-green-50 text-green-700 font-bold p-4 text-xs uppercase">
            ✓ {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 font-mono text-xs uppercase text-gray-400 animate-pulse font-bold">
            Saving...
          </div>
        ) : (
          <button
            type="button"
            disabled={!eventId}
            onClick={() => setIsScannerOpen(true)}
            className="w-full bg-red-600 text-white font-black uppercase tracking-tight py-4 border-2 border-black hover:bg-black transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {eventId ? 'Scan Player QR Code' : 'Select an Event First'}
          </button>
        )}

        {lastPlayer && !loading && (
          <div className="border-2 border-black p-4 text-xs font-mono text-gray-600">
            Last verified: <span className="font-black text-black">{lastPlayer}</span>
          </div>
        )}
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
        </div>
      )}
    </div>
  );
}