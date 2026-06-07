
"use client";

import { useEffect } from "react";
import { useGoogleAuth } from "./logic";
import { auth } from "@/lib/firebase"; 
import { signOut } from "firebase/auth"; 

export default function LoginPage() {
  const { signIn, loading } = useGoogleAuth();

  useEffect(() => {
   
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
  className={`w-full py-4 text-white font-bold text-lg uppercase tracking-wider transition-all ${
    loading
      ? "bg-gray-400 cursor-not-allowed border-2 border-gray-400"
      : "bg-[#E13746] border-2 border-[#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
  }`}
  style={{
    borderRadius: "0px",
    boxShadow: loading ? "none" : "4px 4px 0px #111827",
  }}
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