

import { rtdb, db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";

const END_QR_PREFIX = "ghumanteyuwa.com/eventsmaker/";

// Must match ProgressBar.tsx category keys
const MARKER_CATEGORIES = {
  locationmarkers: "locationMarkers",
  specialmarkers: "specialMarkers",
  QRcodeMarkers: "qrcodemarkers",
} as const;

export interface ScanResult {
  success: boolean;
  message: string;
  showEndPopup?: boolean;
  stats?: {
    totalTime: string;
    completionRate: number;
    canQuiz: boolean;
  };
}

export async function handleRouletteScan(
  uid: string,
  eventId: string,
  scannedValue: string
): Promise<ScanResult> {
  // 1. Normalize and validate scan value
  const isEndQR = scannedValue.toLowerCase().includes(`${END_QR_PREFIX}${eventId}/end`.toLowerCase());
  
  if (!isEndQR) {
    return { success: false, message: "Invalid Race End QR." };
  }

  try {
    // 2. Fetch User Progress from Realtime Database
    const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${uid}`);
    const userSnap = await get(userProgressRef);

    if (!userSnap.exists()) {
      return { success: false, message: "Progress record not found." };
    }

    const userData = userSnap.val();
    const userInfo = userData.userInfo || {};
    const scannedTimes = userData.scannedTimes || {};

    // If finishedAt already exists, don't update anything and just show the previous stats
    if (scannedTimes.finishedAt) {
      return {
        success: true,
        message: "You have already completed this race!",
        showEndPopup: true,
        stats: {
          totalTime: scannedTimes.timeTaken || "N/A",
          completionRate: userData.completionRate || 0, // Assuming you store this
          canQuiz: (userData.completionRate || 0) >= 80,
        }
      };
    }

    // 3. Calculate Total Completed Markers (RTDB)
    // Sums keys from locationMarkers, specialMarkers, and qrcodemarkers
    let totalCompleted = 0;
    Object.values(MARKER_CATEGORIES).forEach((rtdbKey) => {
      const categoryData = userData[rtdbKey];
      if (categoryData && typeof categoryData === "object") {
        totalCompleted += Object.keys(categoryData).length;
      }
    });

    // 4. Calculate Total Available Markers (Firestore)
    // Fetches the live count of documents in all active event collections
    const collectionsToTrack = ["locationmarkers", "qrcodemarkers", "specialmarkers"];
    const firestoreSnapshots = await Promise.all(
      collectionsToTrack.map((colName) => 
        getDocs(collection(db, "events", eventId, colName))
      )
    );

    const totalMarkersInEvent = firestoreSnapshots.reduce(
      (acc, snap) => acc + snap.docs.length, 
      0
    );

    // 5. Derive Final Percentage
    const completionRate = totalMarkersInEvent === 0 
      ? 0 
      : Math.round((totalCompleted / totalMarkersInEvent) * 100);
    
    // Eligibility threshold (80%)
    const canQuiz = completionRate >= 80;

    // 6. Time Duration Calculation
    const startTimeStr = scannedTimes.scannedAt; 
    const now = new Date();
    let timeDiffDisplay = "N/A";

    if (startTimeStr) {
      const start = new Date(startTimeStr);
      const diffInMs = Math.max(0, now.getTime() - start.getTime());
      
      const hrs = Math.floor(diffInMs / 3600000);
      const mins = Math.floor((diffInMs % 3600000) / 60000);
      const secs = Math.floor((diffInMs % 60000) / 1000);
      
      // Formatting: e.g., "1h 5m 10s" or "5m 10s"
      const parts = [];
      if (hrs > 0) parts.push(`${hrs}h`);
      if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);
      
      timeDiffDisplay = parts.join(" ");
    }

    // 7. Record Finish Time in RTDB
    // Matches format: "May 5, 2026, 04:24:48 PM"
    const finishedAtStr = now.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    await update(ref(rtdb, `eventsProgress/${eventId}/${uid}/scannedTimes`), {
      finishedAt: finishedAtStr,
      timeTaken: timeDiffDisplay // Saves the "1h 5m 10s" result
    });

    await update(ref(rtdb, `eventsProgress/${eventId}/${uid}/scannedTimes`), {
      
      finishedAt: finishedAtStr,
    });

  return {
  success: true,
  message: "Finish Line Reached!",
  showEndPopup: true,
  stats: {
    totalTime: timeDiffDisplay,
    completionRate,
    canQuiz,
  }
};

  } catch (error) {
    console.error("[EndGame] Error processing scan:", error);
    return { success: false, message: "Server connection failed." };
  }
}