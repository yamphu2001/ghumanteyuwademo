// "use client";
// import { useEffect, useRef, useState } from "react";
// import { ref, set } from "firebase/database";
// import { doc, getDoc } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth, db, rtdb } from "@/lib/firebase"; // db = Firestore, rtdb = Realtime DB

// interface Coords {
//   latitude: number;
//   longitude: number;
// }

// interface PlayerLocationEntry {
//   username: string;
//   datetime: string;   // when this write happened (12-hour)
//   latitude: number;
//   longitude: number;
//   updatedAt: string;  // human-readable last-update time (12-hour)
// }

// // ─── Helpers ────────────────────────────────────────────────────────────────

// function toHumanReadable(date: Date): string {
//   return date.toLocaleString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: true,
//   });
//   // e.g. "May 01, 2026, 02:35:10 PM"
// }

// /**
//  * Reads the username from Firestore: /participants/<uid>
//  * Matches the document structure visible in your Firebase console.
//  */
// async function fetchUsernameFromFirestore(uid: string): Promise<string | null> {
//   try {
//     const snap = await getDoc(doc(db, "participants", uid));
//     if (!snap.exists()) {
//       console.warn(`[coords] No participant doc found for uid: ${uid}`);
//       return null;
//     }
//     return (snap.data()?.username as string) ?? null;
//   } catch (err) {
//     console.error("[coords] Failed to fetch username from Firestore:", err);
//     return null;
//   }
// }

// async function saveToRealtimeDB(
//   username: string,
//   coords: Coords
// ): Promise<void> {
//   const now = new Date();
//   const humanNow = toHumanReadable(now);

//   const entry: PlayerLocationEntry = {
//     username,
//     datetime: humanNow,   // time this record was written
//     latitude: coords.latitude,
//     longitude: coords.longitude,
//     updatedAt: humanNow,  // human-readable — updates every 5 s
//   };

//   // Path: playerLocations/<username>
//   // One record per player — overwritten every 5 s
//   const playerRef = ref(rtdb, `playerLocations/${username}`);
//   await set(playerRef, entry);
// }

// // ─── Hook ───────────────────────────────────────────────────────────────────

// /**
//  * usePlayerCoords
//  *
//  * Drop this into PlayContent. It will:
//  *  1. Wait for Firebase Auth to resolve the logged-in user.
//  *  2. Fetch their username from Firestore /participants/<uid>.
//  *  3. Start GPS tracking and push coords to Realtime DB every 5 s.
//  *
//  * No props needed — auth + Firestore are resolved internally.
//  */
// export function usePlayerCoords(): void {
//   const [username, setUsername] = useState<string | null>(null);

//   const coordsRef    = useRef<Coords | null>(null);
//   const watchIdRef   = useRef<number | null>(null);
//   const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

//   // ── Step 1: Resolve Auth → Firestore username ──────────────────────────
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setUsername(null);
//         return;
//       }
//       const name = await fetchUsernameFromFirestore(user.uid);
//       setUsername(name);
//     });
//     return () => unsubscribe();
//   }, []);

//   // ── Step 2: Start tracking once username is known ──────────────────────
//   useEffect(() => {
//     if (!username) return;

//     if (!navigator.geolocation) {
//       console.warn("[coords] Geolocation is not supported by this browser.");
//       return;
//     }

//     // Watch GPS position — updates ref whenever device gets a new fix
//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (position) => {
//         coordsRef.current = {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         };
//       },
//       (error) => {
//         console.error("[coords] Geolocation error:", error.message);
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 0,
//         timeout: 10_000,
//       }
//     );

//     // Push to Realtime DB immediately, then every 5 seconds
//     const push = async () => {
//       if (!coordsRef.current) return; // no GPS fix yet — skip silently
//       try {
//         await saveToRealtimeDB(username, coordsRef.current);
//       } catch (err) {
//         console.error("[coords] Realtime DB write failed:", err);
//       }
//     };

//     push();
//     intervalRef.current = setInterval(push, 5_000);

//     // Cleanup on unmount or username change
//     return () => {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }
//       if (intervalRef.current !== null) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [username]);
// }



"use client";
import { useEffect, useRef, useState } from "react";
import { ref, set } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, rtdb } from "@/lib/firebase";

interface Coords {
  latitude: number;
  longitude: number;
}

interface PlayerLocationEntry {
  username: string;
  datetime: string;       // human-readable 12-hour (display only)
  latitude: number;
  longitude: number;
  updatedAt: string;      // human-readable (display only)
  updatedAtEpoch: number; // ← epoch ms — used for online/offline detection
}

function toHumanReadable(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

async function fetchUsernameFromFirestore(uid: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "participants", uid));
    if (!snap.exists()) return null;
    return (snap.data()?.username as string) ?? null;
  } catch (err) {
    console.error("[coords] Failed to fetch username:", err);
    return null;
  }
}

async function saveToRealtimeDB(username: string, coords: Coords): Promise<void> {
  const now = new Date();
  const humanNow = toHumanReadable(now);

  const entry: PlayerLocationEntry = {
    username,
    datetime: humanNow,
    latitude: coords.latitude,
    longitude: coords.longitude,
    updatedAt: humanNow,
    updatedAtEpoch: now.getTime(), // ← numeric epoch for staleness check
  };

  const playerRef = ref(rtdb, `playerLocations/${username}`);
  await set(playerRef, entry);
}

export function usePlayerCoords(): void {
  const [username, setUsername] = useState<string | null>(null);
  const coordsRef   = useRef<Coords | null>(null);
  const watchIdRef  = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setUsername(null); return; }
      const name = await fetchUsernameFromFirestore(user.uid);
      setUsername(name);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!username) return;
    if (!navigator.geolocation) {
      console.warn("[coords] Geolocation not supported.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        coordsRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      },
      (error) => console.error("[coords] Geolocation error:", error.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 }
    );

    const push = async () => {
      if (!coordsRef.current) return;
      try {
        await saveToRealtimeDB(username, coordsRef.current);
      } catch (err) {
        console.error("[coords] RTDB write failed:", err);
      }
    };

    push();
    intervalRef.current = setInterval(push, 5_000);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [username]);
}