
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
          <img
            src="/images/Logo/logo_1.png"
            alt="Ghumante Nepal"
            style={{
              height: "56px",
              width: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              marginBottom: "20px",
              display: "block",
            }}
          />
          <p style={{ fontSize: "14px", color: "black" }}>
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
            borderRadius: "0px",
            border: "2px solid #111827",
            backgroundColor: loading ? "#e5e7eb" : "#E13746",
            color: loading ? "#9ca3af" : "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
            boxShadow: loading ? "none" : "4px 4px 0px #111827",
            transition: "box-shadow 0.15s ease, transform 0.15s ease",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px #111827";
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(4px, 4px)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px #111827";
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(0px, 0px)";
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