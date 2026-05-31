
"use client";

import { useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDatabase, ref, get } from "firebase/database";
import { useOfflineQueue } from '@/features/forevent/play/Useofflinequeue';
import QRScanner from "../qrscanner";
import { MarkerPopup, QRcodeMarkerData } from "@/features/forevent/play/Markers/QRcodeMarkers/popup";

interface QRCodeScannerProps {
  eventId: string;
  userId: string;
  onCloseScanner?: () => void;
}

type ScanState = "idle" | "loading" | "not_found" | "found" | "already_scanned";

export default function QRCodeScanner({ eventId, userId, onCloseScanner }: QRCodeScannerProps) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [foundMarker, setFoundMarker] = useState<QRcodeMarkerData | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string>("");
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const { enqueue } = useOfflineQueue(eventId);

  const handleScan = useCallback(
    async (scannedValue: string) => {
      let cleanValue = scannedValue?.trim();
      if (!cleanValue) return;

      // ── Detect and hand off finish QR to FinishGame ──
      if (cleanValue.toLowerCase().includes("ghumanteyuwa.com/eventsmaker/") && cleanValue.toLowerCase().includes("/end")) {
        console.log("[QRCodeScanner] Skipping end-game QR code (will be handled by FinishGame):", scannedValue);
        window.dispatchEvent(new CustomEvent("open-finish-scanner", { detail: { value: scannedValue } }));
        return;
      }

      // Extract ID from URL if scanned value is a full URL
      if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
        try {
          const url = new URL(cleanValue);
          const pathSegments = url.pathname.split("/").filter(Boolean);
          if (pathSegments.length > 0) {
            cleanValue = pathSegments[pathSegments.length - 1];
          }
        } catch (e) {
          console.error("Failed parsing scanned URL format:", e);
        }
      }

      // Debounce — skip if same code or already processing
      if (cleanValue === lastScannedId || scanState !== "idle") return;

      console.log("[QRCodeScanner] Querying Firestore for target ID:", cleanValue);
      setLastScannedId(cleanValue);
      setScanState("loading");

      try {
        // ── Step 1: Look up the QR marker in Firestore ──
        const q = query(
          collection(db, "events", eventId, "qrcodemarkers"),
          where("qrCodeId", "==", cleanValue)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          console.warn("[QRCodeScanner] No matching QR marker found for:", cleanValue);
          setScanState("not_found");
          setTimeout(() => {
            setScanState("idle");
            setLastScannedId("");
          }, 3000);
          return;
        }

        const docSnap = snap.docs[0];
        const data = docSnap.data() as Record<string, unknown>;

        const marker: QRcodeMarkerData = {
          id: docSnap.id,
          name: String(data.name ?? ""),
          lat: Number(data.lat ?? 0),
          lng: Number(data.lng ?? 0),
          image: String(data.image ?? ""),
          popupImage: String(data.popupImage ?? ""),
          popupText: String(data.popupText ?? ""),
          qrCodeId: String(data.qrCodeId ?? ""),
          points: Number(data.points ?? 0),
          scanned: true,
        };

        console.log("[QRCodeScanner] Matched marker:", marker.name);

        // ── Step 2: Check RTDB if already scanned ──
        const rtdb = getDatabase();
        const scannedRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes/${marker.id}`);

        try {
          const existingScan = await get(scannedRef);

          if (existingScan.exists()) {
            setScannerActive(false);
            setFoundMarker(marker);
            setScanState("already_scanned");
            return;
          }

          // ── Step 3: Write this scan to RTDB ──
          const now = new Date();
          const readableTime = now.toLocaleString();

                  // Use queued RTDB write so scan is persisted if offline/reloaded
                  await enqueue({
                    type: 'rtdbUpdate',
                    path: `eventsProgress/${eventId}/${userId}/scannedQRCodes/${marker.id}`,
                    data: {
                      qrCodeId: marker.qrCodeId,
                      pointsEarned: marker.points,
                      markerName: marker.name,
                      scannedAt: readableTime,
                    },
                  });

          console.log("[RTDB] Scan recorded successfully.");

          // ── Step 4: Tally ALL qrPoints from RTDB and write total to Firestore ──
          try {
            const allScansRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
            const allScansSnap = await get(allScansRef);

            let totalQrPoints = 0;
            if (allScansSnap.exists()) {
              allScansSnap.forEach((child) => {
                totalQrPoints += Number(child.val().pointsEarned ?? 0);
              });
            }

            console.log(`[Firestore] Calculated total qrPoints: ${totalQrPoints}`);

            await enqueue({
              type: 'set',
              path: `events/${eventId}/player_log/${userId}`,
              data: { qrPoints: totalQrPoints },
              merge: true,
            });

            console.log(`[OfflineQueue] queued player_log/${userId} → qrPoints: ${totalQrPoints}`);
          } catch (tallyErr) {
            console.error("[Firestore] Failed to update player_log qrPoints:", tallyErr);
          }
        } catch (rtdbError) {
          console.error("[RTDB] Error checking or saving player progress:", rtdbError);
        }

        // ── Step 5: Mark QR marker as scanned in Firestore ──
        try {
          await enqueue({
            type: 'update',
            path: `events/${eventId}/qrcodemarkers/${docSnap.id}`,
            data: { scanned: true },
          });
        } catch (updateError) {
          console.warn("[QRCodeScanner] Failed to queue scanned flag:", updateError);
        }

        // ── Step 6: Show success popup ──
        setScannerActive(false);
        setFoundMarker(marker);
        setScanState("found");
      } catch (e) {
        console.error("[QRCodeScanner] Firestore query crashed:", e);
        setScanState("idle");
        setLastScannedId("");
      }
    },
    [eventId, userId, lastScannedId, scanState]
  );

  const handleClose = useCallback(() => {
    setFoundMarker(null);
    setScanState("idle");
    setLastScannedId("");
    setScannerActive(true);
    if (typeof onCloseScanner === "function") {
      onCloseScanner();
    }
  }, [onCloseScanner]);

  const handleCloseScanner = useCallback(() => {
    window.dispatchEvent(new Event("close-scanner"));
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {scannerActive && (
        <QRScanner onScanSuccess={handleScan} onClose={handleCloseScanner} />
      )}

      {scanState === "loading" && (
        <div style={s.overlay}>
          <div style={s.pill}>
            <span style={s.spinner} />
            Looking up QR code…
          </div>
        </div>
      )}

      {scanState === "not_found" && (
        <div style={s.overlay}>
          <div style={{ ...s.pill, background: "#fee2e2", color: "#991b1b" }}>
            ❌ QR code not found for this event
          </div>
        </div>
      )}

      {scanState === "found" && foundMarker && (
        <MarkerPopup marker={foundMarker} onClose={handleClose} />
      )}

      {scanState === "already_scanned" && foundMarker && (
        <AlreadyScannedPopup marker={foundMarker} onClose={handleClose} />
      )}
    </div>
  );
}

// ── Already Scanned Popup ──
function AlreadyScannedPopup({ marker, onClose }: { marker: QRcodeMarkerData; onClose: () => void }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={popupStyles.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={popupStyles.closeBtn} onClick={onClose} aria-label="Close popup">✕</button>
        <div style={popupStyles.header}>
          <h2 style={popupStyles.title}>Already Scanned</h2>
          <p style={popupStyles.subtitle}>{marker.name || "This QR code"} has already been recorded.</p>
        </div>
        <div style={popupStyles.body}>
          <p style={popupStyles.message}>This QR code has already been scanned. Try a different code.</p>
          {marker.popupText && <p style={popupStyles.description}>{marker.popupText}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const popupStyles: Record<string, React.CSSProperties> = {
  sheet: {
    position: "relative", width: "100%", maxWidth: 480, maxHeight: "85vh",
    overflowY: "auto", backgroundColor: "#fff", borderRadius: "20px 20px 0 0",
    boxShadow: "0 -4px 30px rgba(0,0,0,0.2)", padding: 24,
  },
  closeBtn: {
    position: "absolute", top: 14, right: 16, zIndex: 10,
    background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
    width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#333",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  header: { marginBottom: 22 },
  title: { margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" },
  subtitle: { margin: "8px 0 0", color: "#475569", fontSize: "0.95rem" },
  body: { display: "flex", flexDirection: "column", gap: 12 },
  message: { margin: 0, color: "#334155", fontSize: "0.95rem", lineHeight: 1.6 },
  description: { margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5 },
};

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute", inset: 0, display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 100, pointerEvents: "auto",
  },
  pill: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(15,23,42,0.85)", color: "#fff",
    padding: "12px 22px", borderRadius: 999, fontSize: "0.95rem",
    fontWeight: 600, fontFamily: "system-ui", backdropFilter: "blur(6px)", pointerEvents: "auto",
  },
  spinner: {
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
};