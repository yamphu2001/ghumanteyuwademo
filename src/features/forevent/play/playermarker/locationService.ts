
import { ref, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

interface SyncCoordsParams {
  eventId: string;
  uid: string;
  latitude: number;
  longitude: number;
}

export async function syncPlayerLocationToDB({
  eventId,
  uid,
  latitude,
  longitude,
}: SyncCoordsParams): Promise<void> {
  if (!eventId || !uid) {
    return;
  }

  const dbPath = `eventsProgress/${eventId}/${uid}/location`;

  try {
    const locationRef = ref(rtdb, dbPath);
    await set(locationRef, {
      latitude,
      longitude,
      updatedAt: new Date().toLocaleTimeString(), // e.g. "5:32:05 PM"
    });
  } catch (err) {
    throw err;
  }
}