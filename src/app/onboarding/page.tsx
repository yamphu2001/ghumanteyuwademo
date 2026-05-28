"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { PhoneInput } from "./components/PhoneInput";
import { AgePicker } from "./components/AgeInput"; 

export default function OnboardingPage() {
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const phoneValid = /^9[78]\d{8}$/.test(phone);
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
 const dobValid = dob.day !== "" && dob.month !== "" && dob.year.length === 4;
  const canSubmit = phoneValid && dobValid && !loading;

  const handleComplete = async () => {
    setSubmitted(true);
    if (!canSubmit || !auth.currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        phoneNumber: phone,
        dateOfBirth: `${dob.year}-${dob.month}-${dob.day}`,
        onboardingCompleted: true,
      });
      router.push("/permissions");
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
    <div className="w-full max-w-sm">
      <div className="mb-9">
        <div className="w-[34px] h-[34px] rounded-full bg-[#E13746] mb-4" />
        <div
          style={{
            width: "28px",
            height: "2px",
            backgroundColor: "#E13746",
            borderRadius: "2px",
            marginBottom: "20px",
          }}
        />
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.3px",
            marginBottom: "6px",
          }}
        >
          Complete your profile
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Just a couple of things before you start exploring.
        </p>
      </div>

      <PhoneInput value={phone} onChange={setPhone} showError={submitted} />
      <AgePicker value={dob} onChange={setDob} showError={submitted} />

      <button
        onClick={handleComplete}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px 24px",
          borderRadius: "100px",
          border: "none",
          backgroundColor: loading ? "#e5e7eb" : "#E13746",
          color: loading ? "#9ca3af" : "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          cursor: loading ? "not-allowed" : "pointer",
          marginTop: "8px",
        }}
      >
        {loading ? "Saving…" : "Start Exploring"}
      </button>

      <p
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#9ca3af",
          marginTop: "14px",
        }}
      >
        Your info is only used to personalise your experience.
      </p>
    </div>
  </div>
);
}