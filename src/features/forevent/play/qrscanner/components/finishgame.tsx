
'use client';

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth"; // Import the auth listener
import { doc, getDoc } from "firebase/firestore";
import { useOfflineQueue } from '@/features/forevent/play/useOfflineQueue';
import QRScanner from "../qrscanner";

const END_QR_PREFIX = "ghumanteyuwa.com/eventsmaker/";

export interface ScanResult {
  success: boolean;
  message: string;
  askConfirmation?: boolean;
  routeToFinish?: boolean;
}

// ── Pure logic ──
export async function handleRouletteScan(
  uid: string,
  eventId: string,
  scannedValue: string,
  isConfirmed: boolean = false
): Promise<ScanResult> {
  const cleanScannedValue = scannedValue.trim().toLowerCase();
  const cleanEventId = eventId.trim().toLowerCase();
  const expectedPattern = `${END_QR_PREFIX}${cleanEventId}/end`.toLowerCase();

  if (!cleanScannedValue.includes(expectedPattern)) {
    return {
      success: false,
      message: `Invalid QR. Expected: ghumanteyuwa.com/eventsmaker/${eventId}/end`,
    };
  }

  try {
    const playerLogRef = doc(db, "events", eventId, "player_log", uid);
    const playerLogSnap = await getDoc(playerLogRef);
    
    if (playerLogSnap.exists() && playerLogSnap.data()?.finishat) {
      return { 
        success: true, 
        message: "Finish time already recorded previously!", 
        routeToFinish: true 
      };
    }

    if (!isConfirmed) {
      return { success: true, message: "Valid finish QR scanned.", askConfirmation: true };
    }

    return { success: true, message: "Finish time recorded!", routeToFinish: true };
  } catch (error) {
    console.error("[EndGame] Error processing finish registration:", error);
    return { success: false, message: "Security or Connection error." };
  }
}

// ── UI Component ──
interface FinishGameProps {
  uid: string;
  eventId: string;
  onClose?: () => void;
  initialValue?: string | null;
}

export default function FinishGame({ uid: propUid, eventId, onClose, initialValue }: FinishGameProps) {
  const router = useRouter();
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // SOLVED: Track the true active authenticated UID reactively
  const [activeUid, setActiveUid] = useState<string | null>(auth.currentUser?.uid || propUid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[Auth Sync] Active user detected:", user.uid);
        setActiveUid(user.uid);
      } else {
        setActiveUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Isolate your queue engine safely with the active state variable
  const { enqueue } = useOfflineQueue(`${eventId}_${activeUid || 'unauth'}`);

  useEffect(() => {
    if (initialValue) {
      setPendingValue(initialValue);
      setShowConfirm(true);
    }
  }, [initialValue]);

  const handleScanSuccess = useCallback(async (scannedValue: string) => {
    if (isProcessing || showConfirm || !activeUid) return;
    setIsProcessing(true);

    const result = await handleRouletteScan(activeUid, eventId, scannedValue, false);

    if (result.routeToFinish && !result.askConfirmation) {
      router.push(`/eventsmaker/${eventId}/finish`);
      return;
    }

    if (result.askConfirmation) {
      setPendingValue(scannedValue);
      setShowConfirm(true);
      setStatusMessage("");
    } else {
      setStatusMessage(result.message);
      setTimeout(() => setStatusMessage(""), 2000);
    }

    setIsProcessing(false);
  }, [activeUid, eventId, isProcessing, showConfirm, router]);

  const handleConfirm = async () => {
    if (!pendingValue || !activeUid) return;
    setIsProcessing(true);
    setShowConfirm(false);

    const result = await handleRouletteScan(activeUid, eventId, pendingValue, true);

    if (result.routeToFinish) {
      // 1. Re-check Firestore — if finishat already exists, skip the write.
      //    This handles re-login / page refresh scenarios.
      try {
        const snap = await getDoc(doc(db, "events", eventId, "player_log", activeUid));
        if (snap.exists() && snap.data()?.finishat) {
          // Already recorded — just navigate, don't overwrite.
          router.push(`/eventsmaker/${eventId}/finish`);
          return;
        }
      } catch {
        // Offline — fall through and let the queue handle it.
        // The queue dedup below prevents double-writes.
      }

      // 2. Not in Firestore (or was deleted) — safe to write once.
      await enqueue({
        type: 'set',
        path: `events/${eventId}/player_log/${activeUid}`,
        data: { finishat: new Date().toLocaleString() },
        merge: true,
      });
      router.push(`/eventsmaker/${eventId}/finish`);
    } else {
      setStatusMessage(result.message);
      setIsProcessing(false);
    }
  };

  const handleDeny = () => {
    setPendingValue(null);
    setShowConfirm(false);
    setStatusMessage("");
    if (onClose) onClose();
  };

  // Prevent interactions completely until Firebase Auth confirms who is logged in online
  if (!activeUid) {
    return (
      <div style={s.overlay}>
        <div style={s.pill}>Syncing secure user session...</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {!initialValue && (
        <QRScanner onScanSuccess={handleScanSuccess} onClose={onClose} />
      )}

      {statusMessage && (
        <div style={s.overlay}>
          <div style={s.pill}>{statusMessage}</div>
        </div>
      )}

      {showConfirm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.title}>Finish the game?</h2>
            <p style={s.subtitle}>This will record your finish time. Are you sure?</p>
            <div style={s.row}>
              <button style={s.cancelBtn} onClick={handleDeny}>Cancel</button>
              <button style={s.confirmBtn} onClick={handleConfirm} disabled={isProcessing}>
                {isProcessing ? "Saving..." : "Yes, I'm done!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50 },
  pill: { background: "rgba(15,23,42,0.85)", color: "#fff", padding: "12px 22px", borderRadius: 999, fontSize: "0.95rem", fontWeight: 600, backdropFilter: "blur(6px)" },
  modal: { background: "#fff", borderRadius: 20, padding: 24, margin: "0 24px", display: "flex", flexDirection: "column", gap: 12 },
  title: { margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "0.9rem", color: "#475569" },
  row: { display: "flex", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer" },
};