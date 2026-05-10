// logic.ts (partial example)
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useLoginLogic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      // 1. Sign in with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // PLAYER FOUND -> Go to the game
        router.push("/play");
      } else {
        // NEW PLAYER -> Go to onboarding to set username, dob, etc.
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Something went wrong during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return { handleGoogleLogin, isLoading };
};