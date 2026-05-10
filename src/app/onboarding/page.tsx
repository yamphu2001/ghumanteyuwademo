'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import UsernamePicker from './Usernamepicker/UsernamePicker';
import AgePicker from './Age/AgePicker';
import { getOnboardingRedirect, completeOnboarding } from './logic'; 
import styles from './onboarding.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // New explicit check
  const [isSyncing, setIsSyncing] = useState(true); 
  const [userData, setUserData] = useState({
    username: '',
    birthDate: null as Date | null
  });

  // --- STRICT AUTH GUARD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // No user found, send them to login immediately
        console.log("Unauthorized access attempt. Redirecting to login...");
        router.replace('/login'); 
      } else {
        // User is logged in
        setIsAuthenticated(true);
        setIsSyncing(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleUsernameComplete = (name: string) => {
    setUserData(prev => ({ ...prev, username: name }));
    setStep(2);
  };

  const handleDateConfirm = async (date: Date) => {
    setIsSyncing(true);
    try {
      await completeOnboarding(userData.username, date);

      const nextPath = getOnboardingRedirect(date);
      const query = `?username=${encodeURIComponent(userData.username)}`;

      if (nextPath === 'guardian-email') {
        router.push(`/onboarding/guardian${query}`);
      } else {
        router.push(`/dashboard${query}`);
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to create profile.");
      setIsSyncing(false);
    }
  };

  // 1. Hard block: If not authenticated, show nothing or a full-screen loader
  // This prevents "flickering" where the user sees the onboarding for half a second
  if (!isAuthenticated) {
    return (
      <div className={styles.viewport} style={{ background: '#000', color: '#fff' }}>
        <div className="flex items-center justify-center h-full">
          <p className="animate-pulse">Verifying Security Clearances...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.viewport}>
      <div className={styles.contentWrapper}>
        <header>
          <h1 className={styles.title}>
            {step === 1 ? 'Welcome!' : `Hey, ${userData.username}!`}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 ? "Let's find you a great name." : "When is your birthday?"}
          </p>
        </header>

        <div className="w-full">
          {isSyncing ? (
            <div className="text-center p-10 font-black italic text-orange-500">
              UPDATING EXPLORER DATABASE...
            </div>
          ) : step === 1 ? (
            <UsernamePicker onComplete={handleUsernameComplete} />
          ) : (
            <AgePicker onConfirm={handleDateConfirm} />
          )}
        </div>

        <footer className={styles.footer}>GHUMANTE YUWA V0.1 BETA</footer>
      </div>
    </main>
  );
}