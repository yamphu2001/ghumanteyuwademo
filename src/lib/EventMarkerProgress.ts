
// import { rtdb, db } from "@/lib/firebase";
// import { ref, get, update } from "firebase/database";
// import { getDoc, setDoc, doc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// // ── Types ─────────────────────────────────────────────────────────────────────

// export type MarkerState = "default" | "nearby" | "unlocked";

// /**
//  * Valid categories that match your Firestore collections
//  * and Realtime Database paths.
//  * NOTE: museumMarkers removed — use qrcodemarkers instead.
//  */
// export type MarkerCategory =
//   | "qrcodemarkers"
//   | "locationMarkers"
//   | "specialMarkers"
//   |'mapPrizes';

// // ── Fallback distances ────────────────────────────────────────────────────────

// export const FALLBACK_DISTANCES: Record<MarkerCategory, number> = {
//   qrcodemarkers:   5,
//   locationMarkers: 5,
//   specialMarkers:  5,
//   mapPrizes:      5,
// };

// // ── Distance Cache Logic (Admin & Player shared) ──────────────────────────────

// let _distanceCache: Record<MarkerCategory, number> | null = null;


// export function clearDistanceCache() {
//   _distanceCache = null;
// }


// export async function getProximityDistances(): Promise<Record<MarkerCategory, number>> {
//   if (_distanceCache) return _distanceCache;

//   try {
//     const snap = await getDoc(doc(db, "gameSettings", "proximityDistances"));
//     if (snap.exists()) {
//       const data = snap.data() as Record<string, number>;
//       _distanceCache = {
//         qrcodemarkers:   data.qrcodemarkers   ?? FALLBACK_DISTANCES.qrcodemarkers,
//         locationMarkers: data.locationMarkers ?? FALLBACK_DISTANCES.locationMarkers,
//         specialMarkers:  data.specialMarkers  ?? FALLBACK_DISTANCES.specialMarkers,
//         mapPrizes:      data.mapPrizes       ?? FALLBACK_DISTANCES.mapPrizes,
//       };
//       return _distanceCache;
//     }
//   } catch (err) {
//     console.warn("markerProgress: could not fetch proximity distances, using fallback:", err);
//   }

//   _distanceCache = { ...FALLBACK_DISTANCES };
//   return _distanceCache;
// }

// /**
//  * Used by Admin Settings to save new distances to Firestore
//  * and update the local state.
//  */
// export async function saveProximityDistances(
//   distances: Record<MarkerCategory, number>
// ): Promise<void> {
//   try {
//     await setDoc(doc(db, "gameSettings", "proximityDistances"), distances);
//     _distanceCache = { ...distances };
//   } catch (err) {
//     console.error("markerProgress: Failed to save proximity distances:", err);
//     throw err;
//   }
// }

// // ── Username Helper ───────────────────────────────────────────────────────────

// let _cachedUsername: string | null = null;

// /**
//  * Retrieves the username from the Firestore 'users' collection
//  * to associate with progress logs.
//  */
// async function getUsername(): Promise<string> {
//   if (_cachedUsername) return _cachedUsername;
//   const user = getAuth().currentUser;
//   if (!user) return "unknown";
//   try {
//     const snap = await getDoc(doc(db, "users", user.uid));
//     if (snap.exists()) {
//       const data = snap.data();
//       _cachedUsername =
//         data.username ?? data.displayName ?? user.displayName ?? user.email ?? "unknown";
//       return _cachedUsername!;
//     }
//   } catch (err) {
//     console.warn("markerProgress: could not fetch username:", err);
//   }
//   _cachedUsername = user.displayName ?? user.email ?? "unknown";
//   return _cachedUsername!;
// }


// export async function loadUnlockedFromDB(
//   category: MarkerCategory,
//   eventId: string
// ): Promise<Record<string, MarkerState>> {
//   const uid = getAuth().currentUser?.uid;
//   if (!uid || !eventId) return {};

//   try {
//     const path = `eventsProgress/${eventId}/${uid}/${category}`;
//     const snap = await get(ref(rtdb, path));

//     if (!snap.exists()) return {};

//     const raw = snap.val() as Record<string, unknown>;
//     const normalised: Record<string, MarkerState> = {};

//     Object.entries(raw).forEach(([id, value]) => {
//       // Support both legacy string "unlocked" and the current object shape
//       // { status: "unlocked", pointsEarned, unlockedAt, serverTimestamp }
//       const isUnlocked =
//         value === "unlocked" ||
//         (typeof value === "object" &&
//           value !== null &&
//           (value as Record<string, unknown>).status === "unlocked");

//       if (isUnlocked) {
//         normalised[id] = "unlocked";
//       }
//     });

//     return normalised;
//   } catch (err) {
//     console.warn("markerProgress: RTDB load error:", err);
//     return {};
//   }
// }

// /**
//  * Saves a marker unlock to the database.
//  * Includes user info, timestamp, and points earned.
//  */
// export async function saveUnlocked(
//   category: MarkerCategory,
//   markerId: string,
//   eventId: string,
//   points: number = 0
// ): Promise<void> {
//   const uid = getAuth().currentUser?.uid;
//   if (!uid || !eventId) return;

//   try {
//     const username = await getUsername();
//     const now = new Date();
//     const isoTimestamp = now.toISOString();

//     // Human readable date for admin visibility
//     const humanReadableDate = now.toLocaleString("en-US", {
//       month: "short", day: "numeric", year: "numeric",
//       hour: "numeric", minute: "2-digit", hour12: true,
//     });

//     const updates: Record<string, unknown> = {};

//     // 1. Update Global Event User Info
//     updates[`eventsProgress/${eventId}/${uid}/userInfo/username`] = username;
//     updates[`eventsProgress/${eventId}/${uid}/userInfo/lastActive`] = isoTimestamp;

//     // 2. Save detailed unlock data
//     updates[`eventsProgress/${eventId}/${uid}/${category}/${markerId}`] = {
//       status: "unlocked",
//       pointsEarned: points,
//       unlockedAt: humanReadableDate,
//       serverTimestamp: isoTimestamp,
//     };

//     await update(ref(rtdb), updates);
//     console.log(`[Success] Saved ${points} points for ${markerId} in event ${eventId}`);
//   } catch (err) {
//     console.error("markerProgress: Failed to save progress:", err);
//   }
// }


import { rtdb, db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarkerState = "default" | "nearby" | "unlocked";
export type MarkerCategory = "qrcodemarkers" | "locationMarkers" | "specialMarkers" | 'mapPrizes';

// ── Fallback distances ────────────────────────────────────────────────────────

export const FALLBACK_DISTANCES: Record<MarkerCategory, number> = {
  qrcodemarkers: 5,
  locationMarkers: 5,
  specialMarkers: 5,
  mapPrizes: 5,
};

// ── Event-Specific Distance Cache ──────────────────────────────────────────────

// Cache stores data by eventId: { [eventId]: distances }
let _distanceCache: Record<string, Record<MarkerCategory, number>> = {};

export function clearDistanceCache() {
  _distanceCache = {};
}

export async function getProximityDistances(eventId: string): Promise<Record<MarkerCategory, number>> {
  if (!eventId) return FALLBACK_DISTANCES;
  if (_distanceCache[eventId]) return _distanceCache[eventId];

  try {
    // Path changed to event-specific sub-collection
    const snap = await getDoc(doc(db, "events", eventId, "settings", "proximityDistances"));
    if (snap.exists()) {
      const data = snap.data() as Record<string, number>;
      _distanceCache[eventId] = {
        qrcodemarkers:   data.qrcodemarkers   ?? FALLBACK_DISTANCES.qrcodemarkers,
        locationMarkers: data.locationMarkers ?? FALLBACK_DISTANCES.locationMarkers,
        specialMarkers:  data.specialMarkers  ?? FALLBACK_DISTANCES.specialMarkers,
        mapPrizes:       data.mapPrizes       ?? FALLBACK_DISTANCES.mapPrizes,
      };
      return _distanceCache[eventId];
    }
  } catch (err) {
    console.warn(`markerProgress: could not fetch distances for ${eventId}:`, err);
  }

  return { ...FALLBACK_DISTANCES };
}

export async function saveProximityDistances(
  eventId: string,
  distances: Record<MarkerCategory, number>
): Promise<void> {
  if (!eventId) throw new Error("Event ID is required to save distances.");
  try {
    const docRef = doc(db, "events", eventId, "settings", "proximityDistances");
    await setDoc(docRef, distances);
    _distanceCache[eventId] = { ...distances };
  } catch (err) {
    console.error(`markerProgress: Failed to save distances for ${eventId}:`, err);
    throw err;
  }
}

// ── Username Helper ───────────────────────────────────────────────────────────

let _cachedUsername: string | null = null;

async function getUsername(): Promise<string> {
  if (_cachedUsername) return _cachedUsername;
  const user = getAuth().currentUser;
  if (!user) return "unknown";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      _cachedUsername = data.username ?? data.displayName ?? user.displayName ?? user.email ?? "unknown";
      return _cachedUsername!;
    }
  } catch (err) {
    console.warn("markerProgress: could not fetch username:", err);
  }
  _cachedUsername = user.displayName ?? user.email ?? "unknown";
  return _cachedUsername!;
}

// ── Progress Loading & Saving ──────────────────────────────────────────────────

export async function loadUnlockedFromDB(
  category: MarkerCategory,
  eventId: string
): Promise<Record<string, MarkerState>> {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !eventId) return {};

  try {
    const path = `eventsProgress/${eventId}/${uid}/${category}`;
    const snap = await get(ref(rtdb, path));
    if (!snap.exists()) return {};

    const raw = snap.val() as Record<string, unknown>;
    const normalised: Record<string, MarkerState> = {};

    Object.entries(raw).forEach(([id, value]) => {
      const isUnlocked =
        value === "unlocked" ||
        (typeof value === "object" && value !== null && (value as any).status === "unlocked");

      if (isUnlocked) normalised[id] = "unlocked";
    });

    return normalised;
  } catch (err) {
    console.warn("markerProgress: RTDB load error:", err);
    return {};
  }
}

export async function saveUnlocked(
  category: MarkerCategory,
  markerId: string,
  eventId: string,
  points: number = 0
): Promise<void> {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !eventId) return;

  try {
    const username = await getUsername();
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const humanReadableDate = now.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    const updates: Record<string, unknown> = {};
    updates[`eventsProgress/${eventId}/${uid}/userInfo/username`] = username;
    updates[`eventsProgress/${eventId}/${uid}/userInfo/lastActive`] = isoTimestamp;
    updates[`eventsProgress/${eventId}/${uid}/${category}/${markerId}`] = {
      status: "unlocked",
      pointsEarned: points,
      unlockedAt: humanReadableDate,
      serverTimestamp: isoTimestamp,
    };

    await update(ref(rtdb), updates);
  } catch (err) {
    console.error("markerProgress: Failed to save progress:", err);
  }
}