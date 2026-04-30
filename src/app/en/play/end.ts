import { getFirestore, doc, onSnapshot } from "firebase/firestore";

const db = getFirestore();

/**
 * Sets up a real-time listener to check if the user has finished.
 * @param onFinished Callback function to execute when finished is true
 * @returns An unsubscribe function to stop listening
 */
export const watchGameStatus = (
  eventId: string,
  userId: string,
  onFinished: () => void
) => {
  if (!eventId || !userId) return () => {};

  const participantRef = doc(db, "events", eventId, "participants", userId);

  // onSnapshot is better than a constant "check" (polling) because 
  // it uses a WebSocket to push data only when it changes.
  const unsubscribe = onSnapshot(participantRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      if (data.finished === true) {
        onFinished();
      }
    }
  });

  return unsubscribe;
};