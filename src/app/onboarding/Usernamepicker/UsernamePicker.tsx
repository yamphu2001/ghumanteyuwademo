'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PREFIXES,
  SUFFIXES,
  randomPrefix,
  randomSuffix,
  nextItem,
  prevItem,
  buildAlias
} from './logic';

import styles from './usernamepicker.module.css';

interface UsernamePickerProps {
  onComplete: (val: string) => void;
}

export default function UsernamePicker({ onComplete }: UsernamePickerProps) {
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  // Automatically builds the full alias (e.g., "BUDDHA_SATHI")
  const username = buildAlias(prefix, suffix);

  useEffect(() => {
    setPrefix(randomPrefix());
    setSuffix(randomSuffix());
  }, []);

  return (
    <div className={styles.wrapper}>
      
      {/* Mascot Section - Anchored to top of card */}
      <div className={styles.mascotContainer}>
        <div className={styles.imageWrapper}>
          <Image 
            src="/images/Onboarding/Onboarding_mascot.png" 
            alt="Mascot"
            fill
            sizes="(max-width: 440px) 130px"
            priority
            className={styles.mascotImage}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardContent}>
          <p className={styles.subtitle}>YOUR TEMPORARY ALIAS</p>
          <h1 className={styles.aliasDisplay}>{username}</h1>

          {/* PREFIX SELECTOR */}
          <div className={styles.selectorRow}>
            <button 
              className={styles.navBtn} 
              onClick={() => setPrefix(prevItem(PREFIXES, prefix))}
            >
              ◀
            </button>
            <span className={styles.selectorValue}>{prefix}</span>
            <button 
              className={styles.navBtn} 
              onClick={() => setPrefix(nextItem(PREFIXES, prefix))}
            >
              ▶
            </button>
          </div>

          {/* SUFFIX SELECTOR */}
          <div className={styles.selectorRow}>
            <button 
              className={styles.navBtn} 
              onClick={() => setSuffix(prevItem(SUFFIXES, suffix))}
            >
              ◀
            </button>
            <span className={styles.selectorValue}>{suffix}</span>
            <button 
              className={styles.navBtn} 
              onClick={() => setSuffix(nextItem(SUFFIXES, suffix))}
            >
              ▶
            </button>
          </div>

          <div className={styles.actionSection}>
            <button
              onClick={() => {
                setPrefix(randomPrefix());
                setSuffix(randomSuffix());
              }}
              className={styles.secondaryBtn}
            >
              SURPRISE ME
            </button>

            {/* The Return Trigger: Sends username back to parent page */}
            <button
              onClick={() => onComplete(username)}
              className={styles.primaryBtn}
            >
              CONTINUE
            </button>
          </div>

          <p className={styles.hint}>
            You can choose a custom name after Level 5.
          </p>
        </div>
      </div>
    </div>
  );
}