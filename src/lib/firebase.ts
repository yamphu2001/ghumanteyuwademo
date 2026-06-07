// firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  terminate, 
  clearIndexedDbPersistence, 
  getFirestore 
} from "firebase/firestore";
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
 * Enforces persistentMultipleTabManager so cache sync never hangs on network shifts.
 */
import type { Firestore } from "firebase/firestore";
let db: Firestore;
try {
  db = initializeFirestore(app, { 
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager() // 🌟 FIXES HMR INTERACTION LOCKS
    }) 
  });
} catch {
  // Already initialized (hot-reload) — reuse the existing instance
  db = getFirestore(app);
}
export { db };

export const rtdb = getDatabase(app);

/**
 * 🟢 Infinite Loop Proof Session Clearer
 */
export async function safeSignOut() {
  try {
    if (typeof window !== "undefined") {
      localStorage.clear(); 
    }

    // Shut down the live pipeline safely
    await terminate(db);

    // Clear cache tracking states
    await clearIndexedDbPersistence(db);

    // Revoke token
    await firebaseSignOut(auth);
    
    console.log("[Auth Clean] Cache successfully wiped.");
    
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login"; 
    }
  } catch (error) {
    console.error("Error during safe logout sequence:", error);
  }
}