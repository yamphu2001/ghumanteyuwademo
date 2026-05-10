// import { rtdb } from "@/lib/firebase";
// import { ref, get, update } from "firebase/database";

// const db = rtdb;

// const VALID_QR = "https://ghum@nteYuwa:/race";

// /**
//  * Validate QR Code
//  */
// const isValidRaceQR = (scannedText: string) => {
//   return scannedText === VALID_QR;
// };

// /**
//  * Handle QR scan (MAIN LOGIC)
//  */
// export const handleRaceScan = async (userId: string, scannedText: string) => {
//   if (!isValidRaceQR(scannedText)) {
//     console.log("❌ Invalid QR Code");
//     return { success: false, message: "Invalid QR" };
//   }

//   const formatTime = (timestamp: number) => {
//   return new Date(timestamp).toLocaleString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// };
//   const userRef = ref(db, `userProgress/${userId}/raceInfo`);

//   const snapshot = await get(userRef);

//   const now = Date.now();

//   // 🟢 FIRST TIME (START RACE)
//   if (!snapshot.exists()) {
//   await update(userRef, {
//     startTime: now,
//     startTimeReadable: formatTime(now), // 👈 added
//     status: "started",
//   });

//   console.log("🚀 Race Started");

//   return { success: true, message: "Race Started" };
// }

//   const data = snapshot.val();

//   // 🔴 If already finished → do nothing
//   if (data.status === "finished") {
//     console.log("⚠️ Race already finished");
//     return { success: false, message: "Race already finished" };
//   }

//   // 🟡 If started → END RACE
//   if (data.status === "started") {
//   const endTime = now;
//   const duration = endTime - data.startTime;

//   await update(userRef, {
//     endTime,
//     endTimeReadable: formatTime(endTime), // 👈 added
//     duration,
//     status: "finished",
//   });

//   console.log("🏁 Race Ended");

//   return { success: true, message: "Race Ended" };
// }

//   return { success: false, message: "Invalid state" };
// };


import { rtdb } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";

const db = rtdb;

const VALID_QR = "https://ghum@nteYuwa:/race";

/**
 * Convert timestamp to human-readable format
 * e.g. "April 10, 2026, 10:45:32 AM"
 */
const toReadableTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

/**
 * Convert duration in ms to "Xh Xm Xs" format
 * e.g. "0h 2m 35s"
 */
const toReadableDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

/**
 * Validate QR Code
 */
const isValidRaceQR = (scannedText: string) => {
  return scannedText === VALID_QR;
};

/**
 * Handle QR scan (MAIN LOGIC)
 */
export const handleRaceScan = async (userId: string, scannedText: string) => {
  if (!isValidRaceQR(scannedText)) {
    console.log("❌ Invalid QR Code");
    return { success: false, message: "Invalid QR" };
  }

  const userRef = ref(db, `userProgress/${userId}/raceInfo`);

  const snapshot = await get(userRef);

  const now = Date.now();

  // 🟢 FIRST TIME (START RACE)
  if (!snapshot.exists()) {
    await update(userRef, {
      startTime: toReadableTime(now),        // ✅ Human-readable
      startTimestamp: now,                   // ✅ Raw ms kept for duration calc
      status: "started",
    });

    console.log("🚀 Race Started");
    return { success: true, message: "Race Started" };
  }

  const data = snapshot.val();

  // 🔴 If already finished → do nothing
  if (data.status === "finished") {
    console.log("⚠️ Race already finished");
    return { success: false, message: "Race already finished" };
  }

  // 🟡 If started → END RACE
  if (data.status === "started") {
    const duration = now - data.startTimestamp;  // ✅ Use raw timestamp for math

    await update(userRef, {
      endTime: toReadableTime(now),              // ✅ Human-readable
      endTimestamp: now,                         // ✅ Raw ms kept for reference
      duration: toReadableDuration(duration),    // ✅ e.g. "0h 2m 35s"
      durationMs: duration,                      // ✅ Raw ms kept for sorting/filtering
      status: "finished",
    });

    console.log("🏁 Race Ended");
    return { success: true, message: "Race Ended" };
  }

  return { success: false, message: "Invalid state" };
};