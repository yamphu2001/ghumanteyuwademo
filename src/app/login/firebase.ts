// src/app/login/firebase.ts
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const checkUserRegistration = async (uid: string): Promise<boolean> => {
  if (!uid) return false;

  try {
    // Recommendation: Use "users" as the collection name for standard convention
    const userDocRef = doc(db, "users", uid); 
    const userSnap = await getDoc(userDocRef);
    
    // Returns true if document exists (player has finished onboarding)
    return userSnap.exists();
  } catch (error) {
    // If there's a permission error or network issue, we fail safe to 'false'
    console.error("Firebase Check Error:", error);
    return false; 
  }
};