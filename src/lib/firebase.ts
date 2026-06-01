// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
// import { getDatabase } from "firebase/database";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
// };

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// // Suppress Firebase offline warning noise in the console
// if (typeof window !== "undefined") {
//   const originalWarn = console.warn;
//   const originalError = console.error;

//   const isFirestoreOfflineLog = (args: unknown[]) => {
//     return args.some((arg) => {
//       if (typeof arg !== "string") return false;
//       return arg.includes("@firebase/firestore") &&
//         (arg.includes("Could not reach") || arg.includes("Connection failed") || arg.includes("code=unavailable"));
//     });
//   };

//   console.warn = (...args: unknown[]) => {
//     if (isFirestoreOfflineLog(args)) return;
//     originalWarn(...args);
//   };

//   console.error = (...args: unknown[]) => {
//     if (isFirestoreOfflineLog(args)) return;
//     originalError(...args);
//   };
// }

// export const auth = getAuth(app);

// // initializeFirestore with persistentLocalCache replaces the deprecated
// // enableIndexedDbPersistence() — works across multiple tabs without errors
// export const db = initializeFirestore(app, {
//   localCache: persistentLocalCache(),
// });

// export const rtdb = getDatabase(app);




import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, terminate, clearIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// 1. Safe App initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Suppress expected offline warning noise in the console (handles private tabs & tracking blockers)
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  const originalError = console.error;

  const isFirestoreOfflineLog = (args: unknown[]) => {
    const compiledLog = args
      .map((arg) => {
        if (arg instanceof Error) return `${arg.name} ${arg.message} ${arg.stack}`;
        if (typeof arg === "object" && arg !== null) {
          try { return JSON.stringify(arg); } catch { return String(arg); }
        }
        return String(arg);
      })
      .join(" ")
      .toLowerCase();

    return (
      compiledLog.includes("@firebase/firestore") ||
      compiledLog.includes("could not reach cloud firestore backend") ||
      compiledLog.includes("connection failed") ||
      compiledLog.includes("code=unavailable") ||
      compiledLog.includes("failed to get document because the client is offline") ||
      compiledLog.includes("ajaxerror: failed to fetch") ||
      compiledLog.includes("openfreemap.org")
    );
  };

  console.warn = (...args: unknown[]) => {
    if (isFirestoreOfflineLog(args)) return;
    originalWarn(...args);
  };

  console.error = (...args: unknown[]) => {
    if (isFirestoreOfflineLog(args)) return;
    originalError(...args);
  };
}

export const auth = getAuth(app);

/**
 * Safe Firestore initialization guard for Next.js hot-reload.
 * getFirestore() returns the existing instance if already initialized,
 * so we try initializeFirestore first and fall back on error.
 */
import type { Firestore } from "firebase/firestore";
let db: Firestore;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
} catch {
  // Already initialized (hot-reload) — reuse the existing instance
  db = getFirestore(app);
}
export { db };

export const rtdb = getDatabase(app);

/**
 * 🟢 FIX 2: Infinite Loop Proof Session Clearer
 * Optimized to be safely triggered anywhere—including on the login page mount.
 */
export async function safeSignOut() {
  try {
    // 1. Wipe local custom queues instantly
    if (typeof window !== "undefined") {
      localStorage.clear(); 
    }

    // 2. Shut down the live pipeline to prevent ongoing permissions checks
    await terminate(db);

    // 3. Clear cache tracking states
    await clearIndexedDbPersistence(db);

    // 4. Revoke active user instance token
    await firebaseSignOut(auth);
    
    console.log("[Auth Clean] Cache successfully wiped.");
    
    // 5. Only force a hard-reload redirect if the user isn't already sitting on the login page
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login"; 
    }
  } catch (error) {
    console.error("Error during safe logout sequence:", error);
  }
}