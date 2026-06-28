
// "use client";

// import { useState } from "react";
// import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
// import { useRouter } from "next/navigation";

// export const useGoogleAuth = () => {
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const signIn = async () => {
//     setLoading(true);
//     const provider = new GoogleAuthProvider();

//     try {
//       const result = await signInWithPopup(auth, provider);
//       const user = result.user;

//       // 1. Target document in the "users" collection
//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (!userSnap.exists()) {
//         // NEW USER: Capture profile details and creation time
//         await setDoc(userRef, {
//           email: user.email,
//           username: user.displayName, 
//           createdAt: serverTimestamp(),
//           lastLoginAt: serverTimestamp(),
//         });
//         router.push("/onboarding");
//       } else {
//         // EXISTING USER: Update their login timeline using native server timestamps
//         await setDoc(userRef, {
//           lastLoginAt: serverTimestamp(), 
//         }, { merge: true });
//         router.push("/permissions");
//       }
//     } catch (error) {
//       console.error("Error signing in:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { signIn, loading };
// };




"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { measureNetworkSpeed, getNativeNetworkType, fetchIspDetails } from "./networkUtils"; 

const MOBILE_CARRIERS = ["ncell", "nepal telecom", "ntc", "smart cell"];

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Gather all advanced network metrics on login
      let speed = 0;
      let nativeType = "unknown";
      let ispInfo = { isp: "Unknown ISP", country: "Unknown" };

      try {
        speed = await measureNetworkSpeed();
        nativeType = getNativeNetworkType();
        ispInfo = await fetchIspDetails();

        // Safe resolution for iOS (translates carrier strings if native network details are hidden)
        if (nativeType === "unknown" || nativeType === "restricted") {
          const lowerISP = ispInfo.isp.toLowerCase();
          const isMobile = MOBILE_CARRIERS.some(carrier => lowerISP.includes(carrier));
          nativeType = isMobile ? "cellular" : "wifi/broadband";
        }
      } catch (err) {
        console.error("Failed to gather diagnostics, falling back to clean slate", err);
      }

      // Format the network structural snapshot
      const networkProfile = {
        connectionType: nativeType,
        isp: ispInfo.isp,
        speedMbps: speed,
        device: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown Device"
      };

      // 2. Target document in the "users" collection
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // NEW USER: Capture profile details, creation time, AND network metrics
        await setDoc(userRef, {
          email: user.email,
          username: user.displayName, 
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          networkProfile: networkProfile // 👈 Stored in Firebase
        });
        router.push("/onboarding");
      } else {
        // EXISTING USER: Update login timeline AND fresh network snapshots
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(), 
          networkProfile: networkProfile // 👈 Overwritten in Firebase with current login session specs
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