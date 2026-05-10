import { db, auth } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface BugReportData {
  topic: string; // The "Section" or "Area" (e.g., Map, UI, Auth)
  issue: string;
  recommendation?: string;
}

export const submitBugReport = async (data: BugReportData) => {
  const user = auth.currentUser;

  try {
    const reportRef = collection(db, "bug_reports");
    
    await addDoc(reportRef, {
      // 1. Section/Topic categorization
      topic: data.topic,
      
      // 2. The Report Details
      report: {
        issue: data.issue,
        recommendation: data.recommendation || "None provided",
      },

      // 3. Who made the report
      reporter: {
        uid: user?.uid || "anonymous",
        email: user?.email || "guest_user",
        displayName: user?.displayName || "Anonymous Scout",
      },

      // 4. When it happened
      createdAt: serverTimestamp(),
      status: "pending", // Default status for your internal workflow
    });

    return { success: true };
  } catch (error) {
    console.error("Firestore Upload Error:", error);
    throw error;
  }
};