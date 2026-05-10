// src/app/onboarding/firebase.ts
import { db, auth } from "@/lib/firebase"; 
import { doc, setDoc } from "firebase/firestore";

export const saveUserToFirestore = async (data: any) => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("Authentication required to save profile.");
  }

  // Use the Google UID as the document ID in the 'users' collection
  const userRef = doc(db, "users", user.uid);
  
  return await setDoc(userRef, data, { merge: true });
};