/**
 * Pushes a startat write into the offline queue.
 * Kept in a separate file so page.tsx can import it dynamically
 * (avoids bundling localforage into the initial page chunk).
 *
 * Rules:
 * - If startat already exists in Firestore → skip (even if player re-logs in).
 * - If startat was deleted from Firestore → allow the write.
 * - If already queued locally (offline, not yet flushed) → skip.
 */
import localforage from "localforage";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface QueueEntry {
  id: string;
  op: {
    type: "set";
    path: string;
    data: Record<string, unknown>;
    merge: boolean;
  };
  timestamp: number;
  eventId: string;
}

const QUEUE_KEY = "offline_write_queue";

export async function persistStartAt(
  eventId: string,
  uid: string,
  humanReadableTime: string
): Promise<void> {
  // 1. Check Firestore first — if startat already exists there, never overwrite it.
  try {
    const snap = await getDoc(doc(db, "events", eventId, "player_log", uid));
    if (snap.exists() && snap.data()?.startat) {
      // startat is already persisted in Firestore — do nothing.
      return;
    }
  } catch {
    // Offline or fetch failed — fall through to the queue check below.
    // The queue dedup will prevent double-writes when connectivity returns.
  }

  // 2. Check the local offline queue — avoid stacking duplicate pending writes.
  const queue: QueueEntry[] =
    (await localforage.getItem<QueueEntry[]>(QUEUE_KEY)) ?? [];

  const alreadyQueued = queue.some(
    (entry) =>
      entry.op.type === "set" &&
      entry.op.path === `events/${eventId}/player_log/${uid}` &&
      "startat" in entry.op.data
  );

  if (alreadyQueued) return;

  // 3. Neither in Firestore nor queued — safe to queue the write.
  queue.push({
    id: `startat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    op: {
      type: "set",
      path: `events/${eventId}/player_log/${uid}`,
      data: { startat: humanReadableTime },
      merge: true,
    },
    timestamp: Date.now(),
    eventId,
  });

  await localforage.setItem(QUEUE_KEY, queue);
}
