// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "@/lib/firebase"; 
// import MapContainer from "@/features/forevent/play/MapContainer/MapContainer";

// export default function PlayPage() {
//   const params = useParams();
//   const router = useRouter();
  
//   // Safely extract eventId
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : undefined;
  
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     // 1. Listen for Auth State
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//       } else {
//         router.push("/"); 
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [router]);

//   // 2. Loading State (Kept your design, it looks great for a game/app context)
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center w-screen h-screen bg-white">
//         <div className="flex flex-col items-center gap-4">
//           <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
//           <p className="text-black text-xs font-bold tracking-[0.2em] uppercase">
//             Verifying Identity...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // 3. Final Guard: Redirect if no eventId exists in URL
//   if (!user || !eventId) {
//     router.replace("/eventsmaker");
//     return null;
//   }

//   return (
//     <main className="relative w-screen h-screen overflow-hidden bg-white text-black">
//       {/* Game Components */}
//       <MapContainer eventId={eventId} />
//     </main>
//   );
// }



"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; 
import { doc, setDoc, getDoc } from "firebase/firestore"; // Added getDoc to check existence
import MapContainer from "@/features/forevent/play/MapContainer/MapContainer";

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  
  // Safely extract eventId
  const eventId = typeof params?.eventId === 'string' ? params.eventId : undefined;
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Guard reference to prevent duplicate execution during React StrictMode double-renders
  const hasLoggedLanding = useRef(false);

  useEffect(() => {
    // 1. Listen for Auth State
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // ─── LOG LANDING ACTIVITY ONLY IF IT DOES NOT EXIST ───
        if (eventId && !hasLoggedLanding.current) {
          hasLoggedLanding.current = true; // Mark local ref as executed immediately
          
          try {
            // Reference to the player's log document
            const logDocRef = doc(db, "events", eventId, "player_log", currentUser.uid);
            
            // Check if the player already has an established record
            const logDocSnap = await getDoc(logDocRef);

            if (!logDocSnap.exists()) {
              // Get current local time in human-readable format
              const humanReadableTime = new Date().toLocaleString();

              // Write the timestamp only for the first time entry
              await setDoc(logDocRef, {
                startat: humanReadableTime, 
              }, { merge: true }); // merge protects this field during future additions
              
              console.log("First landing recorded. Timestamp locked.");
            } else {
              console.log("Player document already exists. Reload detected; start time unchanged.");
            }
          } catch (err) {
            console.error("Failed to verify/store landing log in Firestore:", err);
          }
        }
      } else {
        router.push("/"); 
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, eventId]);

  // 2. Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
          <p className="text-black text-xs font-bold tracking-[0.2em] uppercase">
            Verifying Identity...
          </p>
        </div>
      </div>
    );
  }

  // 3. Final Guard: Redirect if no eventId exists in URL
  if (!user || !eventId) {
    router.replace("/eventsmaker");
    return null;
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-white text-black">
      {/* Game Components */}
      <MapContainer eventId={eventId} />
    </main>
  );
}