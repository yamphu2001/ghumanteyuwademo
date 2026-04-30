import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore();

/**
 * Initializes the play session. 
 * Only updates the database if startTime doesn't exist.
 */
export const initializePlaySession = async (eventId: string, userId: string) => {
  if (!eventId || !userId) return;

  try {
    const participantRef = doc(db, "events", eventId, "participants", userId);
    const docSnap = await getDoc(participantRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Only set startTime if it hasn't been set yet
      if (!data.startTime) {
        await updateDoc(participantRef, {
          startTime: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
        console.log("Play session started.");
      } else {
        console.log("Session already exists, skipping initialization.");
      }
    }
  } catch (error) {
    console.error("Error initializing session:", error);
  }
};