
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

      // 1. Target document in the "users" collection
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // NEW USER: Capture profile details and creation time
        await setDoc(userRef, {
          email: user.email,
          username: user.displayName, 
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
        router.push("/onboarding");
      } else {
        // EXISTING USER: Update their login timeline using native server timestamps
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(), 
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