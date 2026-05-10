import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const updateGuardianStatus = async (parentEmail: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User session not found.");

  const userRef = doc(db, "users", user.uid);

  return await updateDoc(userRef, {
    guardianEmail: parentEmail,
    verificationStatus: "pending",
    explorerType: "guarded", // Labeling them for the "Awaiting Approval" gate
    updatedAt: new Date().toISOString()
  });
};