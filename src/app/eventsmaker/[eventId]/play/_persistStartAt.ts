import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import localforage from "localforage";

// Simplified QueueEntry for Firestore only
interface QueueEntry {
  id: string;
  op: {
    type: 'set';
    path: string;
    data: Record<string, unknown>;
    merge?: boolean;
  };
  timestamp: number;
}

const QUEUE_KEY = "offline_write_queue";

export async function persistStartAt(
  eventId: string,
  uid: string,
  humanReadableTime: string
): Promise<void> {
  const firestorePath = `events/${eventId}/player_log/${uid}`;
  const docRef = doc(db, "events", eventId, "player_log", uid);

  console.log("[persistStartAt] Starting process for:", firestorePath);

  // 1. Online Check
  if (navigator.onLine) {
    try {
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.startat) {
        console.log("[persistStartAt] Already exists in Firestore. Done.");
        return;
      }
      
      // If we are online and it doesn't exist, try a direct write
      await setDoc(docRef, { startat: humanReadableTime }, { merge: true });
      console.log("[persistStartAt] Successfully wrote to Firestore.");
      return; // Success!
    } catch (err) {
      console.error("[persistStartAt] Direct Firestore write failed (falling back to queue):", err);
    }
  }

  // 2. Offline Fallback (Queueing)
  try {
    const queue: QueueEntry[] = (await localforage.getItem<QueueEntry[]>(QUEUE_KEY)) ?? [];
    
    // Dedupe
    const alreadyQueued = queue.some((entry) => entry.op.path === firestorePath);
    if (alreadyQueued) {
      console.log("[persistStartAt] Already in queue, skipping.");
      return;
    }

    const newEntry: QueueEntry = {
      id: `startat_${Date.now()}`,
      op: { type: 'set', path: firestorePath, data: { startat: humanReadableTime }, merge: true },
      timestamp: Date.now(),
    };

    await localforage.setItem(QUEUE_KEY, [...queue, newEntry]);
    console.log("[persistStartAt] Successfully queued for later sync.");
  } catch (err) {
    console.error("[persistStartAt] Critical error queueing data:", err);
  }
}