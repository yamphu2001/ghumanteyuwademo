'use client';

import { useEffect, useRef } from 'react';
import localforage from 'localforage';
import { db, rtdb, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { ref as rtdbRef, set as rtdbSet, update as rtdbUpdate } from 'firebase/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueuedOperation =
  | { type: 'set';        path: string;           data: Record<string, unknown>; merge?: boolean }
  | { type: 'update';     path: string;           data: Record<string, unknown> }
  | { type: 'add';        collectionPath: string; data: Record<string, unknown> }
  | { type: 'rtdbSet';    path: string;           data: Record<string, unknown> }
  | { type: 'rtdbUpdate'; path: string;           data: Record<string, unknown> };

interface QueueEntry {
  id: string;
  op: QueuedOperation;
  timestamp: number;
  eventId: string;
}

const QUEUE_KEY = 'offline_write_queue';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadQueue(): Promise<QueueEntry[]> {
  return (await localforage.getItem<QueueEntry[]>(QUEUE_KEY)) ?? [];
}

async function saveQueue(queue: QueueEntry[]): Promise<void> {
  await localforage.setItem(QUEUE_KEY, queue);
}

/** Split a slash-joined path string into segments for Firestore APIs */
function splitPath(path: string): [string, ...string[]] {
  const segs = path.split('/').filter(Boolean);
  if (segs.length === 0) throw new Error(`[OfflineQueue] Invalid path: "${path}"`);
  return segs as [string, ...string[]];
}

async function executeOp(op: QueuedOperation): Promise<void> {
  // Guard: reject any operation whose path contains 'undefined' — this means
  // a document ID was not resolved before being queued (e.g. offline cache miss).
  const pathToCheck = op.type === 'add' ? op.collectionPath : op.path;
  if (pathToCheck.includes('undefined') || pathToCheck.includes('null')) {
    console.warn('[OfflineQueue] Skipping operation with invalid path:', pathToCheck);
    return;
  }

  console.log("[executeOp] Executing operation:", op.type, "on path:", pathToCheck);

  if (op.type === 'set') {
    const [first, ...rest] = splitPath(op.path);
    console.log("[executeOp] Firestore setDoc:", first, rest, op.data);
    await setDoc(doc(db, first, ...rest), op.data, { merge: op.merge ?? true });
    console.log("[executeOp] Firestore setDoc completed");
  } else if (op.type === 'update') {
    const [first, ...rest] = splitPath(op.path);
    console.log("[executeOp] Firestore updateDoc:", first, rest, op.data);
    await updateDoc(doc(db, first, ...rest), op.data);
    console.log("[executeOp] Firestore updateDoc completed");
  } else if (op.type === 'add') {
    const [first, ...rest] = splitPath(op.collectionPath);
    console.log("[executeOp] Firestore addDoc:", first, rest, op.data);
    await addDoc(collection(db, first, ...rest), op.data);
    console.log("[executeOp] Firestore addDoc completed");
  } else if (op.type === 'rtdbSet') {
    console.log("[executeOp] RTDB set:", op.path, op.data);
    await rtdbSet(rtdbRef(rtdb, op.path), op.data);
    console.log("[executeOp] RTDB set completed");
  } else if (op.type === 'rtdbUpdate') {
    console.log("[executeOp] RTDB update:", op.path, op.data);
    await rtdbUpdate(rtdbRef(rtdb, op.path), op.data);
    console.log("[executeOp] RTDB update completed");
  }
}

export async function flushQueue(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) return;

  console.log("[flushQueue] Processing", queue.length, "queued operations");
  const failed: QueueEntry[] = [];

  for (const entry of queue) {
    try {
      await executeOp(entry.op);
    } catch (err) {
      console.error('[OfflineQueue] Failed to flush entry:', entry.id, err);
      failed.push(entry);
    }
  }

  await saveQueue(failed);
  const flushed = queue.length - failed.length;
  if (flushed > 0) {
    console.log(`[OfflineQueue] Successfully flushed ${flushed} operation(s)`);
  }
  if (failed.length > 0) {
    console.log(`[OfflineQueue] ${failed.length} operations failed and remain queued`);
  }
}

async function persistToQueue(op: QueuedOperation, eventId: string): Promise<void> {
  // Guard: don't persist operations with invalid paths
  const pathToCheck = op.type === 'add' ? op.collectionPath : op.path;
  if (pathToCheck.includes('undefined') || pathToCheck.includes('null')) {
    console.warn('[OfflineQueue] Refusing to queue operation with invalid path:', pathToCheck);
    return;
  }

  const queue = await loadQueue();
  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    op,
    timestamp: Date.now(),
    eventId,
  });
  await saveQueue(queue);
}


export function useOfflineQueue(eventId: string) {
  const flushing = useRef(false);

  // Flush any leftover queue on mount (app reopen while online).
  // Wait for Firebase auth to be ready to avoid unauthenticated writes.
  useEffect(() => {
    let unsub = () => {};

    const tryFlush = async () => {
      if (navigator.onLine && auth.currentUser) await flushQueue();
    };

    // If auth is already available, flush immediately.
    if (auth.currentUser) {
      tryFlush();
    } else {
      // Otherwise wait for auth state change and flush when user is present.
      unsub = onAuthStateChanged(auth, (user) => {
        if (user && navigator.onLine) {
          flushQueue().catch((e) => console.error('[OfflineQueue] flush error after auth:', e));
        }
      });
    }

    return () => {
      try { unsub(); } catch {}
    };
  }, []);

  // Flush when device reconnects
  useEffect(() => {
    const handleOnline = async () => {
      if (flushing.current) return;
      flushing.current = true;
      try {
        await flushQueue();
      } finally {
        flushing.current = false;
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const enqueue = async (op: QueuedOperation): Promise<void> => {
    if (navigator.onLine && auth.currentUser) {
      try {
        await executeOp(op);
      } catch (err) {
        // Network blip or permission error — fall back to queue
        console.warn('[OfflineQueue] Online write failed, queuing:', err);
        await persistToQueue(op, eventId);
      }
    } else {
      // Not authenticated or offline — persist to queue for later flush
      await persistToQueue(op, eventId);
    }
  };

  return { enqueue };
}
