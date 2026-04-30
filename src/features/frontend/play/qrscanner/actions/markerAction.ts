import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, getDoc,
  doc, setDoc, updateDoc, arrayUnion, serverTimestamp
} from "firebase/firestore";
import { getCurrentLocation } from "@/utils/location";
import { QRcodeMarkerData } from "@/features/frontend/play/Markers/QRcodeMarkers/Logic";

export type MarkerScanResult =
  | { success: false }
  | { success: true; marker: QRcodeMarkerData };

export const handleMarkerScan = async (
  fullUrl: string,
  userId: string,
  eventId: string
): Promise<MarkerScanResult> => {
  try {
    const cleanUrl = fullUrl.trim().replace(/\/$/, "");
    const segments = cleanUrl.split("/");
    const scannedCode = segments[segments.length - 1].toUpperCase();

    const markersRef = collection(db, "events", eventId, "qrMarkers");
    const q = query(markersRef, where("unlockCode", "==", scannedCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("❌ No marker found for code:", scannedCode);
      return { success: false };
    }

    const markerDoc = querySnapshot.docs[0];
    const markerData = markerDoc.data();
    const markerId = markerDoc.id;

    console.log("✅ Marker found:", markerId, markerData.name);

    const participantRef = doc(db, "participants", userId);
    const participantSnap = await getDoc(participantRef);

    if (participantSnap.exists()) {
      const progress: any[] = participantSnap.data()?.userProgress ?? [];
      const alreadyScanned = progress.some(
        (p: any) => p?.location?.markerId === markerId
      );
      if (alreadyScanned) {
        console.log("⚠️ Already scanned:", markerId);
        // Still return marker so modal can show
        return {
          success: true,
          marker: {
            id: markerId,
            name: markerData.name ?? "",
            nameNepali: markerData.nameNepali ?? "",
            lat: Number(markerData.lat ?? 0),
            lng: Number(markerData.lng ?? 0),
            type: markerData.type ?? "museum",
            image: markerData.image ?? "",
            popupImage: markerData.popupImage ?? "",
            description: markerData.description ?? "",
            descriptionNepali: markerData.descriptionNepali ?? "",
            qrCodeId: markerData.qrCodeId ?? "",
            eventId,
          },
        };
      }
    }

    const position = await getCurrentLocation();

    const progressEntry = {
      location: {
        markerId,
        markerName: markerData.name ?? "Checkpoint",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      scannedAt: new Date().toISOString(),
      username: participantSnap.exists()
        ? (participantSnap.data()?.username ?? "")
        : "",
    };

    try {
      await updateDoc(participantRef, {
        userProgress: arrayUnion(progressEntry),
        lastActive: serverTimestamp(),
      });
    } catch (e: any) {
      if (e.code === "not-found") {
        await setDoc(participantRef, {
          userProgress: [progressEntry],
          lastActive: serverTimestamp(),
        }, { merge: true });
      } else {
        throw e;
      }
    }

    await setDoc(doc(db, "scans", `${userId}_${Date.now()}`), {
      location: progressEntry.location,
      scannedAt: serverTimestamp(),
      userId,
      eventId,
    });

    console.log("✅ Scan saved for marker:", markerId);

    return {
      success: true,
      marker: {
        id: markerId,
        name: markerData.name ?? "",
        nameNepali: markerData.nameNepali ?? "",
        lat: Number(markerData.lat ?? 0),
        lng: Number(markerData.lng ?? 0),
        type: markerData.type ?? "museum",
        image: markerData.image ?? "",
        popupImage: markerData.popupImage ?? "",
        description: markerData.description ?? "",
        descriptionNepali: markerData.descriptionNepali ?? "",
        qrCodeId: markerData.qrCodeId ?? "",
        eventId,
      },
    };
  } catch (e) {
    console.error("❌ Marker scan error:", e);
    return { success: false };
  }
};