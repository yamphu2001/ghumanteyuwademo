"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./landing.module.css";
import { initializeUser } from "@/lib/firebase-actions";

export default function LandingPage() {
  const [loading, setLoading] = useState<"en" | "ne" | null>(null);
  const router = useRouter();

  const handleStart = async (lang: "en" | "ne") => {
    console.log("🔥 HANDLE START TRIGGERED");

    if (loading) return;

    setLoading(lang);

    try {
      console.log("🔥 BEFORE INIT USER");

      const uid = await initializeUser(lang);

      console.log("🔥 AFTER INIT USER UID:", uid);

      router.push(`/${lang}/onboarding`);
    } catch (error: any) {
      console.error("🔥 HANDLE ERROR:", error);
      console.error("🔥 ERROR CODE:", error?.code);
      console.error("🔥 ERROR MESSAGE:", error?.message);

      alert(error?.code || "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <main className={styles.fullPageWrapper}>
      <div className={styles.contentSplitter}>
        
        {/* HERO IMAGE */}
        <div className={styles.heroSection}>
          <Image
            src="/landing/landing_heros/landing_hero_1.png"
            alt="Hero"
            fill
            priority
            className={styles.heroImage}
          />
        </div>

        {/* CONTENT */}
        <div className={styles.actionSection}>
          
          {/* LOGO */}
          <div className={styles.logoWrapper}>
            <Image
              src="/landing/landing_logo.png"
              alt="Ghumante Yuwa Logo"
              width={160}
              height={50}
            />
          </div>

          {/* TITLE */}
          <h1 className={styles.title}>
            Explore. Win.
          </h1>

          {/* SUBTITLE */}
          <p className={styles.subtitle}>
            Choose your language and begin your journey through heritage, quests, and rewards.
          </p>

          {/* BUTTONS */}
          <div className={styles.buttonGroup}>
            
            {/* ENGLISH */}
            <button
              disabled={loading !== null}
              onClick={() => handleStart("en")}
              className={styles.playButton}
            >
              {loading === "en" ? "..." : "START"}
            </button>

            {/* NEPALI */}
            {/* <button
              disabled={loading !== null}
              onClick={() => handleStart("ne")}
              className={styles.learnMoreButton}
            >
              {loading === "ne" ? "..." : "नेपालीमा सुरु गर्नुहोस्"}
            </button> */}

          </div>

          {/* FOOTER */}
          <footer className={styles.footer}>
            <span>© 2026 Ghumante Yuwa</span>
          </footer>

        </div>

      </div>
    </main>
  );
}