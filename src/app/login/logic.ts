"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const now = new Date();
      const readableDate = now.toLocaleDateString() + " " + now.toLocaleTimeString();

      // Inside your signIn function:

if (!userSnap.exists()) {
  // NEW USER: Capture both first and last login as the same date
  await setDoc(userRef, {
    email: user.email,
    username: user.displayName, 
    createdAt: serverTimestamp(),
  });
  router.push("/onboarding");
} else {
  // EXISTING USER: Only update the last login
  await setDoc(userRef, {
    // lastLogin: readableDate, 
  }, { merge: true });
  router.push("/permissions");
}
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
};