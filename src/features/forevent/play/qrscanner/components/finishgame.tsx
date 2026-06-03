
// 'use client';

// import React, { useState, useCallback, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { db, auth } from "@/lib/firebase";
// import { onAuthStateChanged } from "firebase/auth"; // Import the auth listener
// import { doc, getDoc } from "firebase/firestore";
// import { useOfflineQueue } from '@/features/forevent/play/useOfflineQueue';
// import QRScanner from "../qrscanner";

// const END_QR_PREFIX = "ghumanteyuwa.com/eventsmaker/";

// export interface ScanResult {
//   success: boolean;
//   message: string;
//   askConfirmation?: boolean;
//   routeToFinish?: boolean;
// }

// // ── Pure logic ──
// export async function handleRouletteScan(
//   uid: string,
//   eventId: string,
//   scannedValue: string,
//   isConfirmed: boolean = false
// ): Promise<ScanResult> {
//   const cleanScannedValue = scannedValue.trim().toLowerCase();
//   const cleanEventId = eventId.trim().toLowerCase();
//   const expectedPattern = `${END_QR_PREFIX}${cleanEventId}/end`.toLowerCase();

//   if (!cleanScannedValue.includes(expectedPattern)) {
//     return {
//       success: false,
//       message: `Invalid QR. Expected: ghumanteyuwa.com/eventsmaker/${eventId}/end`,
//     };
//   }

//   // Check if finishat already recorded — but only when online.
//   // Offline: skip the Firestore read and proceed to confirmation/write.
//   if (navigator.onLine) {
//     try {
//       const playerLogRef = doc(db, "events", eventId, "player_log", uid);
//       const playerLogSnap = await getDoc(playerLogRef);

//       if (playerLogSnap.exists() && playerLogSnap.data()?.finishat) {
//         return {
//           success: true,
//           message: "Finish time already recorded previously!",
//           routeToFinish: true
//         };
//       }
//     } catch (error) {
//       console.warn("[EndGame] Firestore check failed, proceeding offline:", error);
//       // Fall through — let the write happen; dedup in handleConfirm will guard it.
//     }
//   }

//   if (!isConfirmed) {
//     return { success: true, message: "Valid finish QR scanned.", askConfirmation: true };
//   }

//   return { success: true, message: "Finish time recorded!", routeToFinish: true };
// }

// // ── UI Component ──
// interface FinishGameProps {
//   uid: string;
//   eventId: string;
//   onClose?: () => void;
//   initialValue?: string | null;
// }

// export default function FinishGame({ uid: propUid, eventId, onClose, initialValue }: FinishGameProps) {
//   const router = useRouter();
//   const [pendingValue, setPendingValue] = useState<string | null>(null);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [statusMessage, setStatusMessage] = useState("");
//   const [isProcessing, setIsProcessing] = useState(false);

//   // SOLVED: Track the true active authenticated UID reactively
//   const [activeUid, setActiveUid] = useState<string | null>(auth.currentUser?.uid || propUid);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         console.log("[Auth Sync] Active user detected:", user.uid);
//         setActiveUid(user.uid);
//       } else {
//         setActiveUid(null);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // Use just eventId as the queue key — consistent with how page.tsx flushes
//   const { enqueue } = useOfflineQueue(eventId);

//   useEffect(() => {
//     if (initialValue) {
//       setPendingValue(initialValue);
//       setShowConfirm(true);
//     }
//   }, [initialValue]);

//   const handleScanSuccess = useCallback(async (scannedValue: string) => {
//     if (isProcessing || showConfirm || !activeUid) return;
//     setIsProcessing(true);

//     const result = await handleRouletteScan(activeUid, eventId, scannedValue, false);

//     if (result.routeToFinish && !result.askConfirmation) {
//       router.push(`/eventsmaker/${eventId}/finish`);
//       return;
//     }

//     if (result.askConfirmation) {
//       setPendingValue(scannedValue);
//       setShowConfirm(true);
//       setStatusMessage("");
//     } else {
//       setStatusMessage(result.message);
//       setTimeout(() => setStatusMessage(""), 2000);
//     }

//     setIsProcessing(false);
//   }, [activeUid, eventId, isProcessing, showConfirm, router]);

//   const handleConfirm = async () => {
//     if (!pendingValue || !activeUid) return;
//     setIsProcessing(true);
//     setShowConfirm(false);

//     const result = await handleRouletteScan(activeUid, eventId, pendingValue, true);

//     if (result.routeToFinish) {
//       const finishTime = new Date().toLocaleString();

//       // 1. Online check to prevent duplicate logic
//       if (navigator.onLine) {
//         try {
//           const snap = await getDoc(doc(db, "events", eventId, "player_log", activeUid));
//           if (snap.exists() && snap.data()?.finishat) {
//             router.push(`/eventsmaker/${eventId}/finish`);
//             return;
//           }
//         } catch (err) {
//           console.warn("[FinishGame] Online check failed, falling back to queue:", err);
//         }
//       }

//       // 2. Enqueue only to Firestore. 
//       // This handles both online (immediate) and offline (queued) states.
//       try {
//         await enqueue({
//           type: 'set',
//           path: `events/${eventId}/player_log/${activeUid}`,
//           data: { finishat: finishTime },
//           merge: true,
//         });

//         router.push(`/eventsmaker/${eventId}/finish`);
//       } catch (err) {
//         console.error("[FinishGame] Queue error:", err);
//         setStatusMessage("Failed to record finish time. Please try again.");
//         setIsProcessing(false);
//       }
//     } else {
//       setStatusMessage(result.message);
//       setIsProcessing(false);
//     }
//   };

//   const handleDeny = () => {
//     setPendingValue(null);
//     setShowConfirm(false);
//     setStatusMessage("");
//     if (onClose) onClose();
//   };

//   // Prevent interactions completely until Firebase Auth confirms who is logged in online
//   if (!activeUid) {
//     return (
//       <div style={s.overlay}>
//         <div style={s.pill}>Syncing secure user session...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ position: "relative", width: "100%", height: "100%" }}>
//       {!initialValue && (
//         <QRScanner onScanSuccess={handleScanSuccess} onClose={onClose} />
//       )}

//       {statusMessage && (
//         <div style={s.overlay}>
//           <div style={s.pill}>{statusMessage}</div>
//         </div>
//       )}

//       {showConfirm && (
//         <div style={s.overlay}>
//           <div style={s.modal}>
//             <h2 style={s.title}>Finish the game?</h2>
//             <p style={s.subtitle}>This will record your finish time. Are you sure?</p>
//             <div style={s.row}>
//               <button style={s.cancelBtn} onClick={handleDeny}>Cancel</button>
//               <button style={s.confirmBtn} onClick={handleConfirm} disabled={isProcessing}>
//                 {isProcessing ? "Saving..." : "Yes, I'm done!"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// const s: Record<string, React.CSSProperties> = {
//   overlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50 },
//   pill: { background: "rgba(15,23,42,0.85)", color: "#fff", padding: "12px 22px", borderRadius: 999, fontSize: "0.95rem", fontWeight: 600, backdropFilter: "blur(6px)" },
//   modal: { background: "#fff", borderRadius: 20, padding: 24, margin: "0 24px", display: "flex", flexDirection: "column", gap: 12 },
//   title: { margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" },
//   subtitle: { margin: 0, fontSize: "0.9rem", color: "#475569" },
//   row: { display: "flex", gap: 10, marginTop: 8 },
//   cancelBtn: { flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, cursor: "pointer" },
//   confirmBtn: { flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer" },
// };




'use client';

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth"; // Import the auth listener
import { doc, getDoc } from "firebase/firestore";
import { useOfflineQueue } from '@/features/forevent/play/useOfflineQueue';
import localforage from "localforage";
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

  // Duplicate-finish guard — three layers:
  // 1. localforage flag (works offline, set when finishat is first written)
  // 2. Firestore getDoc (works online, or offline if doc is in the local cache)
  // 3. If both miss, fall through — the enqueue write is idempotent (merge:true)
  try {
    const localFinishKey = `finishat_recorded_${eventId}_${uid}`;
    const locallyFinished = await localforage.getItem<boolean>(localFinishKey);
    if (locallyFinished) {
      return { success: true, message: "Finish time already recorded previously!", routeToFinish: true };
    }
  } catch (localErr) {
    console.warn("[EndGame] localforage finishat check failed:", localErr);
  }

  // Online: also verify against Firestore in case the player used a different device
  if (navigator.onLine) {
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
    } catch (error) {
      console.warn("[EndGame] Firestore check failed, proceeding offline:", error);
      // Fall through — let the write happen; dedup in handleConfirm will guard it.
    }
  }

  if (!isConfirmed) {
    return { success: true, message: "Valid finish QR scanned.", askConfirmation: true };
  }

  return { success: true, message: "Finish time recorded!", routeToFinish: true };
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

  // Track the true active authenticated UID reactively.
  // Seed from auth.currentUser or propUid so the scanner is never blocked
  // while waiting for onAuthStateChanged to resolve (which requires network).
  const [activeUid, setActiveUid] = useState<string | null>(
    auth.currentUser?.uid || propUid || null
  );

  useEffect(() => {
    // If we already have a UID from the eager seed above, no need to block on the
    // network — but still subscribe so we pick up any token refresh when online.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[Auth Sync] Active user detected:", user.uid);
        setActiveUid(user.uid);
      } else {
        // Only clear the UID if we are online and Firebase explicitly says no user.
        // Offline: Firebase emits null because it cannot reach the server;
        // don't wipe the propUid we already have — the player is still the same person.
        if (navigator.onLine) {
          setActiveUid(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Use just eventId as the queue key — consistent with how page.tsx flushes
  const { enqueue } = useOfflineQueue(eventId);

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
      const finishTime = new Date().toLocaleString();

      // 1. Online check to prevent duplicate logic
      if (navigator.onLine) {
        try {
          const snap = await getDoc(doc(db, "events", eventId, "player_log", activeUid));
          if (snap.exists() && snap.data()?.finishat) {
            router.push(`/eventsmaker/${eventId}/finish`);
            return;
          }
        } catch (err) {
          console.warn("[FinishGame] Online check failed, falling back to queue:", err);
        }
      }

      // 2. Enqueue only to Firestore.
      // This handles both online (immediate) and offline (queued) states.
      try {
        await enqueue({
          type: 'set',
          path: `events/${eventId}/player_log/${activeUid}`,
          data: { finishat: finishTime },
          merge: true,
        });

        // Persist a local flag so offline dedup guard catches any re-scan
        // before the queue is flushed to Firestore.
        try {
          await localforage.setItem(`finishat_recorded_${eventId}_${activeUid}`, true);
        } catch (flagErr) {
          console.warn("[FinishGame] Could not persist local finishat flag:", flagErr);
        }

        router.push(`/eventsmaker/${eventId}/finish`);
      } catch (err) {
        console.error("[FinishGame] Queue error:", err);
        setStatusMessage("Failed to record finish time. Please try again.");
        setIsProcessing(false);
      }
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