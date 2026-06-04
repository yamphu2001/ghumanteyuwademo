
"use client";

import { useState, useCallback, useEffect } from "react";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useOfflineQueue } from '@/features/forevent/play/useOfflineQueue';
import localforage from "localforage";
import QRScanner from "../qrscanner";
import { MarkerPopup, TooFarPopup, AlreadyScannedPopup, QRcodeMarkerData } from "@/features/forevent/play/Markers/QRcodeMarkers/popup";

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getUserLocation(eventId: string): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    let cachedPosition: { latitude: number; longitude: number } | null = null;
    try {
      const saved = localStorage.getItem(`last_position_${eventId}`);
      if (saved) {
        const { latitude, longitude } = JSON.parse(saved);
        if (typeof latitude === "number" && typeof longitude === "number") {
          cachedPosition = { latitude, longitude };
        }
      }
    } catch (_) {}

    const fallbackTimer = setTimeout(() => {
      if (cachedPosition) {
        console.warn("[QRCodeScanner] GPS timeout — using last_position cache");
        resolve(cachedPosition);
      } else {
        reject(new Error("No location available"));
      }
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(fallbackTimer);
        if (cachedPosition) {
          console.warn("[QRCodeScanner] GPS error — using last_position cache");
          resolve(cachedPosition);
        } else {
          reject(new Error("No location available"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 10000,
      }
    );
  });
}

interface QRCodeScannerProps {
  eventId: string;
  userId: string;
  onCloseScanner?: () => void;
}

type ScanState = "idle" | "loading" | "locating" | "not_found" | "found" | "already_scanned" | "too_far" | "location_error";

export default function QRCodeScanner({ eventId, userId, onCloseScanner }: QRCodeScannerProps) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [foundMarker, setFoundMarker] = useState<QRcodeMarkerData | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string>("");
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const { enqueue } = useOfflineQueue(eventId);

  useEffect(() => {
    if (!eventId) return;
    const syncScanRadius = async () => {
      try {
        if (!navigator.onLine) return;
        const configSnap = await getDoc(doc(db, "events", eventId, "configs", "qrcode"));
        if (configSnap.exists() && configSnap.data().scanRadius !== undefined) {
          const cacheKey = `event_config_${eventId}`;
          const existing = (await localforage.getItem<any>(cacheKey)) ?? {};
          await localforage.setItem(cacheKey, {
            ...existing,
            scanRadius: Number(configSnap.data().scanRadius),
          });
          console.log("[QRCodeScanner] synced scanRadius from Firestore:", configSnap.data().scanRadius);
        }
      } catch (e) {
        console.warn("[QRCodeScanner] Could not sync scanRadius config:", e);
      }
    };

    syncScanRadius();

    const handleOnline = () => {
      console.log("[QRCodeScanner] Back online — re-syncing scanRadius");
      syncScanRadius();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [eventId]);

  const handleScan = useCallback(
    async (scannedValue: string) => {
      let cleanValue = scannedValue?.trim();
      if (!cleanValue) return;

      if (cleanValue.toLowerCase().includes("ghumanteyuwa.com/eventsmaker/") && cleanValue.toLowerCase().includes("/end")) {
        window.dispatchEvent(new CustomEvent("open-finish-scanner", { detail: { value: scannedValue } }));
        return;
      }

      if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
        try {
          const url = new URL(cleanValue);
          const pathSegments = url.pathname.split("/").filter(Boolean);
          if (pathSegments.length > 0) cleanValue = pathSegments[pathSegments.length - 1];
        } catch (e) {
          console.error("Failed parsing scanned URL format:", e);
        }
      }

      if (cleanValue === lastScannedId || scanState !== "idle") return;

      console.log("[QRCodeScanner] Querying targets for ID:", cleanValue);
      setLastScannedId(cleanValue);
      setScanState("loading");

      const loadMarkerFromCache = async (): Promise<QRcodeMarkerData | null> => {
        try {
          const cached = await localforage.getItem<any>(`qrcodemarkers_${eventId}`);
          if (!cached) return null;
          const cachedArray = Array.isArray(cached) ? cached : Object.values(cached);
          return cachedArray.find((item: any) => item.qrCodeId === cleanValue || item.id === cleanValue) ?? null;
        } catch (cacheErr) {
          console.warn("[QRCodeScanner] Failed reading cached QR markers:", cacheErr);
          return null;
        }
      };

      try {
        let docSnap: { id: string; data: () => Record<string, any> } | null = null;
        const cachedMarker = await loadMarkerFromCache();

        if (cachedMarker) {
          docSnap = {
            id: cachedMarker.id || cachedMarker.qrCodeId || cleanValue,
            data: () => cachedMarker,
          };
        }

        if (!docSnap && navigator.onLine) {
          try {
            const q = query(
              collection(db, "events", eventId, "qrcodemarkers"),
              where("qrCodeId", "==", cleanValue)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const matchedDoc = snap.docs[0];
              docSnap = { id: matchedDoc.id, data: () => matchedDoc.data() };
              try {
                const cacheKey = `qrcodemarkers_${eventId}`;
                const existing = await localforage.getItem<any[]>(cacheKey) ?? [];
                const alreadyCached = existing.some((m) => m.id === matchedDoc.id);
                if (!alreadyCached) {
                  existing.push({ id: matchedDoc.id, ...matchedDoc.data() });
                  await localforage.setItem(cacheKey, existing);
                }
              } catch (warmErr) {
                console.warn("[QRCodeScanner] Cache warm failed:", warmErr);
              }
            }
          } catch (firestoreErr) {
            console.warn("[QRCodeScanner] Firestore query failed:", firestoreErr);
          }
        }

        if (!docSnap) {
          setScanState("not_found");
          setTimeout(() => { setScanState("idle"); setLastScannedId(""); }, 3000);
          return;
        }

        const data = docSnap.data();
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

        // ── Step 2: Duplicate check FIRST ──
        let alreadyScanned = false;
        const localScanRecordKey = `scanned_history_${eventId}_${userId}`;
        const localScannedItems = (await localforage.getItem<string[]>(localScanRecordKey)) ?? [];
        if (localScannedItems.includes(marker.id)) alreadyScanned = true;

        if (!alreadyScanned && navigator.onLine) {
          try {
            const allScansRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
            const allScansSnap = await get(allScansRef);
            if (allScansSnap.exists()) {
              allScansSnap.forEach((child) => {
                const scanData = child.val();
                if (child.key === marker.id || (marker.qrCodeId && scanData?.qrCodeId === marker.qrCodeId)) {
                  alreadyScanned = true;
                  return true;
                }
              });
            }
          } catch (rtdbCheckErr) {
            console.warn("[QRCodeScanner] RTDB check failed:", rtdbCheckErr);
          }
        }

        if (alreadyScanned) {
          setScannerActive(false);
          setFoundMarker(marker);
          setScanState("already_scanned");
          return;
        }

        // ── Step 1.5: Proximity check ──
        setScanState("locating");
        try {
          const userLocation = await getUserLocation(eventId);
          const eventConfig = await localforage.getItem<any>(`event_config_${eventId}`);
          const scanRadius = eventConfig?.scanRadius ?? 10;

          const distance = getDistanceInMeters(
            userLocation.latitude,
            userLocation.longitude,
            marker.lat,
            marker.lng
          );

          console.log(`[QRCodeScanner] Distance: ${distance.toFixed(2)}m | Threshold: ${scanRadius}m | User: ${userLocation.latitude},${userLocation.longitude} | Marker: ${marker.lat},${marker.lng}`);

          if (distance > scanRadius) {
            setScannerActive(false);
            setFoundMarker(marker);
            setScanState("too_far");
            return;
          }
        } catch (geoErr) {
          console.warn("[QRCodeScanner] Could not determine user location:", geoErr);
          setScannerActive(false);
          setScanState("location_error");
          return;
        }

        // ── Step 3: Award points ──
        localScannedItems.push(marker.id);
        await localforage.setItem(localScanRecordKey, localScannedItems);

        const localPointsKey = `total_points_tally_${eventId}_${userId}`;
        let runningTotalPoints = (await localforage.getItem<number>(localPointsKey)) ?? 0;

        if (runningTotalPoints === 0) {
          try {
            const cachedScans = await localforage.getItem<any[]>(`offline_scans_points_${eventId}_${userId}`) ?? [];
            if (cachedScans.length > 0) {
              runningTotalPoints = cachedScans.reduce((sum: number, s: any) => sum + (Number(s.pointsEarned) || 0), 0);
            }
          } catch (offlineSeedErr) {
            console.warn("[QRCodeScanner] Could not seed points:", offlineSeedErr);
          }

          if (runningTotalPoints === 0 && navigator.onLine) {
            try {
              const allScansRef = ref(rtdb, `eventsProgress/${eventId}/${userId}/scannedQRCodes`);
              const allScansSnap = await get(allScansRef);
              if (allScansSnap.exists()) {
                allScansSnap.forEach((child) => {
                  runningTotalPoints += Number(child.val().pointsEarned ?? 0);
                });
              }
            } catch (seedErr) {
              console.warn("[QRCodeScanner] Could not seed base total points:", seedErr);
            }
          }
        }

        runningTotalPoints += (marker.points ?? 0);
        await localforage.setItem(localPointsKey, runningTotalPoints);

        try {
          const offlineScansKey = `offline_scans_points_${eventId}_${userId}`;
          const offlineScans = await localforage.getItem<any[]>(offlineScansKey) ?? [];
          offlineScans.push({ markerId: marker.id, pointsEarned: marker.points ?? 0 });
          await localforage.setItem(offlineScansKey, offlineScans);
        } catch (offlinePersistErr) {
          console.warn("[QRCodeScanner] Could not persist offline scan record:", offlinePersistErr);
        }

        const now = new Date();
        const readableTime = now.toLocaleString();

        await enqueue({
          type: 'rtdbUpdate',
          path: `eventsProgress/${eventId}/${userId}/scannedQRCodes/${marker.id}`,
          data: { qrCodeId: marker.qrCodeId, pointsEarned: marker.points ?? 0, markerName: marker.name, scannedAt: readableTime },
        });

        await enqueue({
          type: 'set',
          path: `events/${eventId}/player_log/${userId}`,
          data: { qrPoints: runningTotalPoints },
          merge: true,
        });

        window.dispatchEvent(new CustomEvent("qr-scanned-local"));

        setScannerActive(false);
        setFoundMarker(marker);
        setScanState("found");
      } catch (e) {
        console.error("[QRCodeScanner] Critical failure:", e);
        setScanState("idle");
        setLastScannedId("");
      }
    },
    [eventId, userId, lastScannedId, scanState, enqueue]
  );

  const handleClose = useCallback(() => {
    setFoundMarker(null);
    setScanState("idle");
    setLastScannedId("");
    setScannerActive(true);
    if (typeof onCloseScanner === "function") onCloseScanner();
  }, [onCloseScanner]);

  const handleCloseScanner = useCallback(() => {
    window.dispatchEvent(new Event("close-scanner"));
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {scannerActive && <QRScanner onScanSuccess={handleScan} onClose={handleCloseScanner} />}

      {scanState === "loading" && (
        <div style={s.overlay}><div style={s.pill}><span style={s.spinner} />Looking up QR code…</div></div>
      )}
      {scanState === "locating" && (
        <div style={s.overlay}><div style={s.pill}><span style={s.spinner} />Verifying your location...</div></div>
      )}
      {scanState === "location_error" && (
        <div style={s.overlay} onClick={handleClose}>
          <div style={{ ...s.pill, background: "#fef08a", color: "#854d0e", cursor: "pointer" }}>
            ⚠️ Please enable GPS/Location services to scan. (Tap to dismiss)
          </div>
        </div>
      )}
      {scanState === "not_found" && (
        <div style={s.overlay}>
          <div style={{ ...s.pill, background: "#fee2e2", color: "#991b1b" }}>❌ QR code not found for this event</div>
        </div>
      )}
      {scanState === "too_far" && foundMarker && <TooFarPopup marker={foundMarker} onClose={handleClose} />}
      {scanState === "found" && foundMarker && <MarkerPopup marker={foundMarker} onClose={handleClose} />}
      {scanState === "already_scanned" && foundMarker && <AlreadyScannedPopup marker={foundMarker} onClose={handleClose} />}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, pointerEvents: "auto" },
  pill: { display: "flex", alignItems: "center", gap: 10, background: "rgba(15,23,42,0.85)", color: "#fff", padding: "12px 22px", borderRadius: 999, fontSize: "0.95rem", fontWeight: 600, fontFamily: "system-ui", backdropFilter: "blur(6px)", pointerEvents: "auto" },
  spinner: { display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
};