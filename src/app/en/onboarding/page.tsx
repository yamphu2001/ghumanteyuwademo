"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db, auth } from "@/lib/firebase"; 
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import VerifySyncPopup from "./VerifyPopup";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize Anonymous Session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUserId(userCredential.user.uid);
        } catch (err: any) {
          console.error("Auth Error:", err);
          setError("FAILED TO INITIALIZE SESSION.");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError("");

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (formData.name.trim().length < 3) {
      setError("NAME TOO SHORT");
      return false;
    }

    const phoneRegex = /^(98|97)\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("ENTER VALID 10-DIGIT NUMBER");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("SESSION NOT READY. PLEASE WAIT.");
      return;
    }
    if (validateForm()) {
      setShowPopup(true);
    }
  };

  const handleConfirmAndStore = async () => {
    if (!db || !userId) {
      setError("DATABASE CONNECTION ERROR.");
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceData = {
        browser: navigator.userAgent,
        model: navigator.platform || "unknown",
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
      };

      // Pointing to the unique anonymous UID
      const docRef = doc(db, "participants", userId);

      await setDoc(
        docRef,
        {
          uid: userId,
          username: formData.name.trim().toUpperCase(),
          phone: formData.phone,
          setupComplete: true,
          lang: "en",
          device: deviceData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/en/permission");
    } catch (err: any) {
      console.error("Storage Error:", err);
      setError(err.message || "FAILED TO SYNC DATA");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      {/* BRAND LOGO */}
      <div className="mt-12 mb-8">
        <Image
          src="/landing/landing_logo.png"
          alt="Logo"
          width={130}
          height={50}
          className="object-contain"
        />
      </div>

      {/* MASCOT */}
      <div className={styles.mascotContainer}>
        <div className={styles.imageWrapper}>
          <Image
            src="/images/Onboarding/Onboarding_mascot.png"
            alt="Mascot"
            fill
            priority
            className={styles.mascotImage}
          />
        </div>
      </div>

      {/* MAIN CARD */}
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <p className={styles.subtitle}>Explorer Registration</p>
          <h1 className={styles.aliasDisplay}>WELCOME.</h1>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="text-left">
              <label className={styles.inputLabel}>Name</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.inputField}
                placeholder="Your Name"
              />
            </div>

            <div className="text-left">
              <label className={styles.inputLabel}>Phone Number</label>
              <input
                required
                type="tel"
                name="phone"
                inputMode="numeric"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.inputField}
                placeholder="98XXXXXXXX"
              />
            </div>

            {error && <div className={styles.errorBar}>{error}</div>}

            <button 
              type="submit" 
              className={styles.primaryBtn}
              disabled={!userId}
            >
              {userId ? "SUBMIT DETAILS" : "INITIALIZING..."}
            </button>
          </form>

          <p className={styles.hint}>
            We request you to put your correct details.
          </p>
        </div>
      </div>

      {showPopup && (
        <VerifySyncPopup
          name={formData.name}
          phone={formData.phone}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmAndStore}
          onClose={() => setShowPopup(false)}
        />
      )}

      <footer className="mt-auto pt-10 pb-10">
        <span className={styles.footerText}>
          © 2026 GHUMANTE YUWA x Swoyambhu Mahotsab
        </span>
      </footer>
    </main>
  );
}