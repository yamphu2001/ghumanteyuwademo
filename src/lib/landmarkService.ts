// @/lib/firebase/landmarkService.ts
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // your firebase init
import type { Landmark } from '@/features/frontend/play/LocationMarkers/Landmark';

const COLLECTION = 'landmarks';

// ── Read all landmarks ──
export async function fetchLandmarks(): Promise<Landmark[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Landmark[];
}

// ── Add a new landmark (admin) ──
export async function addLandmark(
  data: Omit<Landmark, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update a landmark (admin) ──
export async function updateLandmark(
  id: string,
  data: Partial<Omit<Landmark, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ── Delete a landmark (admin) ──
export async function deleteLandmark(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}