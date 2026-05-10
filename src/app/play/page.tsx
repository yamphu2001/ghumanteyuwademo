// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { auth } from "@/lib/firebase";
// import MapContainer from "@/features/frontend/play/MapContainer/MapContainer";
// import OneHandedMenu from "@/features/frontend/play/OneHandedMenu/OneHandedMenu";
// import NotificationRenderer from "@/features/backend/notifications/page";
// import BugReportModal from "@/features/frontend/play/beta/BetaReportModal"; // [NEW IMPORT]
// import styles from "./play.module.css";

// export default function PlayPage() {
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();

//   return (
//     <main className={styles.gameWrapper}>
//       {/* Layer 1: The Engine */}
//       <MapContainer />

//       {/* Layer 999: The Menu */}
//       <OneHandedMenu />

//       {/* Layer 10: HUD (XP, Stats, etc.) */}
//       <div className={styles.hudOverlay}>
//         {/* Components like <XPBar /> will go here later */}
//       </div>

//       {/* Notifications — renders on top of everything */}
//       <NotificationRenderer />

//       {/* [NEW COMPONENT] 
//           Placed here so it floats over the Map and HUD. 
//           Its high z-index will ensure it doesn't get buried. 
//       */}
//       <BugReportModal />
//     </main>
//   );
// }


"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth"; // Added this import
import MapContainer from "@/features/frontend/play/MapContainer/MapContainer";
import OneHandedMenu from "@/features/frontend/play/OneHandedMenu/OneHandedMenu";
import NotificationRenderer from "@/features/backend/notifications/page";
import BugReportModal from "@/features/frontend/play/beta/BetaReportModal"; 
import styles from "./play.module.css";

export default function PlayPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If no user is logged in, send them back to the landing/login page
        router.push("/login"); 
      } else {
        // User is authenticated, stop showing the loading state
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  // Prevent "flicker" where the game shows for a split second before redirecting
  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <p>Loading Game Engine...</p>
      </div>
    );
  }

  return (
    <main className={styles.gameWrapper}>
      {/* Layer 1: The Engine */}
      <MapContainer />

      {/* Layer 999: The Menu */}
      <OneHandedMenu />

      {/* Layer 10: HUD (XP, Stats, etc.) */}
      <div className={styles.hudOverlay}>
        {/* Components like <XPBar /> will go here later */}
      </div>

      {/* Notifications — renders on top of everything */}
      <NotificationRenderer />

      {/* Bug Report Modal */}
      <BugReportModal />
    </main>
  );
}