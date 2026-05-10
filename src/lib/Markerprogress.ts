
// import { rtdb, db } from "@/lib/firebase";
// import { ref, get, set } from "firebase/database";
// import { getDoc, setDoc, doc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// // ── Types ─────────────────────────────────────────────────────────────────────

// export type MarkerState    = "default" | "nearby" | "unlocked";
// export type MarkerCategory =
//   | "museumMarkers"
//   | "locationMarkers"
//   | "specialMarkers";

// // ── Fallback distances ────────────────────────────────────────────────────────

// export const FALLBACK_DISTANCES: Record<MarkerCategory, number> = {
//   museumMarkers:   5,
//   locationMarkers: 5,
//   specialMarkers:  5,
// };

// // ── Distance cache ────────────────────────────────────────────────────────────
// // null  = not yet fetched
// // value = last fetched value (busted by clearDistanceCache())

// let _distanceCache: Record<MarkerCategory, number> | null = null;

// /** Clear the cache so the next getProximityDistances() call hits Firestore again. */
// export function clearDistanceCache() {
//   _distanceCache = null;
// }

// /**
//  * Fetch proximity distances from Firestore.
//  * Uses in-memory cache so players don't re-fetch on every GPS tick.
//  * Call clearDistanceCache() before this if you need a guaranteed fresh value.
//  */
// export async function getProximityDistances(): Promise<Record<MarkerCategory, number>> {
//   if (_distanceCache) return _distanceCache;

//   try {
//     const snap = await getDoc(doc(db, "gameSettings", "proximityDistances"));
//     if (snap.exists()) {
//       _distanceCache = {
//         ...FALLBACK_DISTANCES,
//         ...(snap.data() as Record<MarkerCategory, number>),
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
//  * Save new proximity distances to Firestore AND bust the local cache
//  * so the next getProximityDistances() call returns the updated values.
//  */
// export async function saveProximityDistances(
//   distances: Record<MarkerCategory, number>
// ): Promise<void> {
//   await setDoc(doc(db, "gameSettings", "proximityDistances"), distances);
//   // Bust cache so any component re-fetching gets fresh data immediately
//   _distanceCache = { ...distances };
// }

// /** Synchronous — returns cached value or fallback if cache is empty. */
// export function getFallbackDistances(): Record<MarkerCategory, number> {
//   return _distanceCache ?? { ...FALLBACK_DISTANCES };
// }

// // Legacy export — kept so existing imports don't break
// export const PROXIMITY_DISTANCE = FALLBACK_DISTANCES;

// // ── Username cache ────────────────────────────────────────────────────────────

// let _cachedUsername: string | null = null;

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

// // ── Haversine distance (metres) ───────────────────────────────────────────────

// export function getDistanceMetres(
//   lat1: number, lng1: number,
//   lat2: number, lng2: number,
// ): number {
//   const R = 6_371_000;
//   const toRad = (d: number) => (d * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// // ── RTDB: load unlocked states ────────────────────────────────────────────────

// export async function loadUnlockedFromDB(
//   category: MarkerCategory
// ): Promise<Record<string, MarkerState>> {
//   const uid = getAuth().currentUser?.uid;
//   if (!uid) return {};
//   try {
//     const snap = await get(ref(rtdb, `userProgress/${uid}/${category}`));
//     if (!snap.exists()) return {};
//     return snap.val() as Record<string, MarkerState>;
//   } catch (err) {
//     console.warn("markerProgress: RTDB load error:", err);
//     return {};
//   }
// }

// // ── RTDB: save on unlock ──────────────────────────────────────────────────────

// export async function saveUnlocked(
//   category: MarkerCategory,
//   markerId: string,
// ): Promise<void> {
//   const uid = getAuth().currentUser?.uid;
//   if (!uid) return;

//   try {
//     const username = await getUsername();
//     await set(ref(rtdb, `userProgress/${uid}/username`), username);
//   } catch (err) {
//     console.warn("markerProgress: RTDB username save error:", err);
//   }

//   try {
//     await set(ref(rtdb, `userProgress/${uid}/${category}/${markerId}`), "unlocked");
//   } catch (err) {
//     console.warn("markerProgress: RTDB marker save error:", err);
//   }
// }


import { rtdb, db } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarkerState    = "default" | "nearby" | "unlocked";
export type MarkerCategory =
  | "museumMarkers"
  | "locationMarkers"
  | "specialMarkers";

// ── Fallback distances ────────────────────────────────────────────────────────

export const FALLBACK_DISTANCES: Record<MarkerCategory, number> = {
  museumMarkers:   5,
  locationMarkers: 5,
  specialMarkers:  5,
};

// ── Distance cache ────────────────────────────────────────────────────────────

let _distanceCache: Record<MarkerCategory, number> | null = null;

export function clearDistanceCache() {
  _distanceCache = null;
}

export async function getProximityDistances(): Promise<Record<MarkerCategory, number>> {
  if (_distanceCache) return _distanceCache;

  try {
    const snap = await getDoc(doc(db, "gameSettings", "proximityDistances"));
    if (snap.exists()) {
      _distanceCache = {
        ...FALLBACK_DISTANCES,
        ...(snap.data() as Record<MarkerCategory, number>),
      };
      return _distanceCache;
    }
  } catch (err) {
    console.warn("markerProgress: could not fetch proximity distances, using fallback:", err);
  }

  _distanceCache = { ...FALLBACK_DISTANCES };
  return _distanceCache;
}

export async function saveProximityDistances(
  distances: Record<MarkerCategory, number>
): Promise<void> {
  await setDoc(doc(db, "gameSettings", "proximityDistances"), distances);
  _distanceCache = { ...distances };
}

export function getFallbackDistances(): Record<MarkerCategory, number> {
  return _distanceCache ?? { ...FALLBACK_DISTANCES };
}

export const PROXIMITY_DISTANCE = FALLBACK_DISTANCES;

// ── Username cache ────────────────────────────────────────────────────────────

let _cachedUsername: string | null = null;

async function getUsername(): Promise<string> {
  if (_cachedUsername) return _cachedUsername;
  const user = getAuth().currentUser;
  if (!user) return "unknown";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      _cachedUsername =
        data.username ?? data.displayName ?? user.displayName ?? user.email ?? "unknown";
      return _cachedUsername!;
    }
  } catch (err) {
    console.warn("markerProgress: could not fetch username:", err);
  }
  _cachedUsername = user.displayName ?? user.email ?? "unknown";
  return _cachedUsername!;
}

// ── RTDB: load unlocked states (Now requires eventId) ─────────────────────────

export async function loadUnlockedFromDB(
  category: MarkerCategory,
  eventId: string // New Parameter
): Promise<Record<string, MarkerState>> {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !eventId) return {};
  try {
    // TABLE CHANGED: userProgress -> eventUserProgress
    // PATH CHANGED: added eventId
    const snap = await get(ref(rtdb, `eventUserProgress/${uid}/${eventId}/${category}`));
    if (!snap.exists()) return {};
    return snap.val() as Record<string, MarkerState>;
  } catch (err) {
    console.warn("markerProgress: RTDB load error:", err);
    return {};
  }
}

// ── RTDB: save on unlock (Now requires eventId) ───────────────────────────────

export async function saveUnlocked(
  category: MarkerCategory,
  markerId: string,
  eventId: string // New Parameter
): Promise<void> {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !eventId) return;

  try {
    const username = await getUsername();
    // Save username at the event root for easy identification in RTDB
    await set(ref(rtdb, `eventUserProgress/${uid}/${eventId}/username`), username);
  } catch (err) {
    console.warn("markerProgress: RTDB username save error:", err);
  }

  try {
    // TABLE CHANGED: userProgress -> eventUserProgress
    // PATH CHANGED: added eventId
    await set(ref(rtdb, `eventUserProgress/${uid}/${eventId}/${category}/${markerId}`), "unlocked");
  } catch (err) {
    console.warn("markerProgress: RTDB marker save error:", err);
  }
}