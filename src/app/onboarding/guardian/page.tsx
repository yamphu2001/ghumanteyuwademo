'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Image from 'next/image';
import { handleGuardianSubmit } from './logic';
import AwaitingApproval from './Awaiting/AwaitingApproval'; 
import styles from './guardian.module.css';

function GuardianForm() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'Explorer';
  
  const [email, setEmail] = useState('');
  const [isAwaiting, setIsAwaiting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleGuardianSubmit(email);
      setIsAwaiting(true);
    } catch (err) {
      alert("Failed to sync safety link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.viewport}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>Safety First!</h1>
          <p className={styles.subtitle}>Almost ready to explore.</p>
        </header>

        <div className={styles.wrapper}>
          <div className={styles.mascotContainer}>
            <div className={styles.imageWrapper}>
              <Image 
                src="/images/Onboarding/Onboarding_mascot.png" 
                alt="Mascot" fill priority className={styles.mascotImage}
              />
            </div>
          </div>

          <div className={styles.card}>
            {!isAwaiting ? (
              <form onSubmit={handleSubmit} className={styles.cardContent}>
                <p className={styles.tagline}>GUARDIAN SAFETY SYNC</p>
                <h2 className={styles.mainText}>
                  Help <span className={styles.highlight}>{username}</span> stay safe.
                </h2>
                <p className={styles.description}>
                  Since you're under 18, we need a quick thumbs-up from a guardian to activate your account.
                </p>
                <div className={styles.inputGroup}>
                  <input 
                    type="email" required placeholder="Guardian's Email Address"
                    className={styles.emailInput} value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading} className={styles.primaryBtn}>
                  {loading ? "SYNCING..." : "SEND SAFETY LINK →"}
                </button>
                <p className={styles.hint}>We’ll send them a one-click approval link.</p>
              </form>
            ) : (
              <AwaitingApproval email={email} onEdit={() => setIsAwaiting(false)} />
            )}
          </div>
        </div>
        <footer className={styles.footer}>End-to-End Encrypted Safety</footer>
      </div>
    </main>
  );
}

export default function GuardianEmailPage() {
  return (
    <Suspense fallback={<div>Loading Safety Module...</div>}>
      <GuardianForm />
    </Suspense>
  );
}