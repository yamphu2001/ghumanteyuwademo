/**
 * Pushes a startat write into the offline queue.
 * Kept in a separate file so page.tsx can import it dynamically
 * (avoids bundling localforage into the initial page chunk).
 */
import localforage from "localforage";

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
  const queue: QueueEntry[] = (await localforage.getItem<QueueEntry[]>(QUEUE_KEY)) ?? [];

  // Avoid duplicate entries — if a startat op for this player+event is already queued, skip
  const alreadyQueued = queue.some(
    (entry) =>
      entry.op.type === "set" &&
      entry.op.path === `events/${eventId}/player_log/${uid}` &&
      "startat" in entry.op.data
  );

  if (alreadyQueued) return;

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
