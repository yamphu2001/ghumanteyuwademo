
"use client";

import { useEffect } from "react";
import { useGoogleAuth } from "./logic";
import { auth } from "@/lib/firebase"; // 🟢 Import auth directly
import { signOut } from "firebase/auth"; // 🟢 Import standard signOut

export default function LoginPage() {
  const { signIn, loading } = useGoogleAuth();

  useEffect(() => {
    // 🟢 SAFE CLEANUP: Kill the dirty background queues and revoke the token,
    // but leave the Firestore engine alive so the login script can use it!
    if (typeof window !== "undefined") {
      localStorage.clear(); 
      console.log("[Login Guard] Storage queues cleared safely.");
    }
    
    // Clear out any stale user tokens sitting in the browser cache
    signOut(auth).catch((err) => console.log("Session already clean."));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900">
            GHUMANTE<span className="text-[#E13746]"> YUWA</span>
          </h1>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900">Welcome Back!</h2>
        <p className="text-gray-600 mb-8">
          Continue your journey and collect more rewards.
        </p>
        
        <button
          onClick={signIn}
          disabled={loading}
          className={`w-full py-4 rounded-full text-white font-bold text-lg transition shadow-lg ${
            loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-[#E13746] hover:bg-[#c92f3d] active:scale-95"
          }`}
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="mt-8 text-xs text-gray-400">
          © 2026 Ghumante Yuwa | Privacy Policy | Terms
        </p>
      </div>
    </div>
  );
}