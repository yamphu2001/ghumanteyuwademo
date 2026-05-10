'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import styles from './awaiting.module.css';

interface Props {
  email: string;
  onEdit: () => void;
}

export default function AwaitingApproval({ email, onEdit }: Props) {
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // We keep the listener so you can still "force" entry via Console for development
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.data()?.isVerified === true) {
        router.push('/dashboard'); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className={styles.awaitingCardContent}>
      <p className={styles.statusTag}>SYSTEM UPDATE</p>
      <h2 className={styles.heading}>Safety Sync Paused</h2>
      
      <div className={styles.betaAlert}>
        Hey! We are currently upgrading our guardian verification system to ensure maximum safety. 
        Because of this, <strong>emails cannot be sent right now.</strong>
      </div>

      <p className={styles.infoText}>
        We’ve saved <strong>{email}</strong> as your guardian’s contact. 
        We’ll enable the verification link feature very soon!
      </p>
      
      <div className={styles.radarBox}>
        <div className={styles.scanner}></div> 
        <p className={styles.searchingText}>Feature Under Construction...</p>
      </div>

      <button onClick={onEdit} className={styles.backBtn}>
        ← USE DIFFERENT EMAIL
      </button>
    </div>
  );
}