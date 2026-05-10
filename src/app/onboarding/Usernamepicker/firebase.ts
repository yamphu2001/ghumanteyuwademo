// src/lib/firebase.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Your firebase init file

/**
 * Checks if a username is available in the 'usernames' collection.
 * @param username The generated alias (e.g., "MOMO_SOLTI")
 * @returns true if available, false if taken
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  if (!username) return false;
  
  // We normalize to lowercase to ensure "Momo" and "MOMO" are the same
  const usernameRef = doc(db, "usernames", username.toLowerCase());
  
  try {
    const docSnap = await getDoc(usernameRef);
    // If docSnap.exists() is true, the name is taken.
    // We return the opposite: true if it DOES NOT exist.
    return !docSnap.exists();
  } catch (error) {
    console.error("Error checking username:", error);
    // On error, we default to false to be safe (don't allow use)
    return false;
  }
};