'use client';

import { useEffect, useRef } from 'react';
import localforage from 'localforage';
import { db, rtdb } from '@/lib/firebase';
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
  if (op.type === 'set') {
    const [first, ...rest] = splitPath(op.path);
    await setDoc(doc(db, first, ...rest), op.data, { merge: op.merge ?? true });
  } else if (op.type === 'update') {
    const [first, ...rest] = splitPath(op.path);
    await updateDoc(doc(db, first, ...rest), op.data);
  } else if (op.type === 'add') {
    const [first, ...rest] = splitPath(op.collectionPath);
    await addDoc(collection(db, first, ...rest), op.data);
  } else if (op.type === 'rtdbSet') {
    await rtdbSet(rtdbRef(rtdb, op.path), op.data);
  } else if (op.type === 'rtdbUpdate') {
    await rtdbUpdate(rtdbRef(rtdb, op.path), op.data);
  }
}

export async function flushQueue(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) return;

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
    console.log(`[OfflineQueue] Flushed ${flushed} queued operation(s).`);
  }
}

async function persistToQueue(op: QueuedOperation, eventId: string): Promise<void> {
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

  // Flush any leftover queue on mount (app reopen while online)
  useEffect(() => {
    if (navigator.onLine) flushQueue();
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
    if (navigator.onLine) {
      try {
        await executeOp(op);
      } catch (err) {
        // Network blip — fall back to queue
        console.warn('[OfflineQueue] Online write failed, queuing:', err);
        await persistToQueue(op, eventId);
      }
    } else {
      await persistToQueue(op, eventId);
    }
  };

  return { enqueue };
}
