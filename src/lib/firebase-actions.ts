import { auth, db } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Function 1: For the Landing Page
export const initializeUser = async (lang: 'en' | 'ne') => {
  try {
    const ua = navigator.userAgent;

    const deviceInfo = {
      browser: ua.includes("Chrome")
        ? "Chrome"
        : ua.includes("Safari")
        ? "Safari"
        : "Other",
      model: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      userAgentRaw: ua,
    };

    console.log("👉 Starting anonymous sign-in...");

    const userCredential = await signInAnonymously(auth);

    console.log("👉 Auth success:", userCredential.user.uid);

    const uid = userCredential.user.uid;

    const userRef = doc(db, "participants", uid);

    console.log("👉 Writing Firestore doc...");

    await setDoc(
      userRef,
      {
        uid,
        lang,
        device: deviceInfo,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("👉 Firestore write success");

    return uid;
  } catch (error: any) {
    console.error("🔥 FULL ERROR:", error);
    console.error("🔥 ERROR CODE:", error.code);
    console.error("🔥 ERROR MESSAGE:", error.message);
    throw error;
  }
};

// Function 2: For the Onboarding Page (The one currently missing)
export const finalizeOnboarding = async (username: string, phone: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No active session found");

  const userRef = doc(db, "participants", user.uid);

  await updateDoc(userRef, {
    username: username.trim(),
    phone: phone.trim(),
    setupComplete: true,
  });

  return user.uid;
};

