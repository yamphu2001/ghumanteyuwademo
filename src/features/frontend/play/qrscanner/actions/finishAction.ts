import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const handleFinishScan = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  try {
    const participantRef = doc(db, "participants", userId);
    await updateDoc(participantRef, {
      finished: true,
      finishTime: serverTimestamp(),
      lastUpdated: new Date().toISOString(),
    });
    console.log("🏁 Progress finalized for user:", userId);
    window.location.href = "/quiz";
    return true;
  } catch (e) {
    console.error("❌ Failed to record finish time:", e);
    return false;
  }
};