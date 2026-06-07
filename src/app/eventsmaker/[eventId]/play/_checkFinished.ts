import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function markPlayerFinished(eventId: string, uid: string): Promise<void> {
  try {
    const { updateDoc, doc: firestoreDoc } = await import("firebase/firestore");
    const playerLogRef = firestoreDoc(db, "events", eventId, "player_log", uid);
    await updateDoc(playerLogRef, {
      reachedFinish: true,
    //   reachedFinishAt: new Date().toLocaleString()
    });
  } catch (err) {
    console.error("[checkFinished] Failed to mark player finished:", err);
  }
}

export async function hasPlayerFinished(eventId: string, uid: string): Promise<boolean> {
  try {
    const playerLogRef = doc(db, "events", eventId, "player_log", uid);
    const snap = await getDoc(playerLogRef);
    if (!snap.exists()) return false;
    return snap.data()?.reachedFinish === true;
  } catch (err) {
    console.error("[checkFinished] Failed to check finish status:", err);
    return false;
  }
}