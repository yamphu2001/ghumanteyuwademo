"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';
import { getRandomHeroImage } from '@/features/frontend/landing/backgroundchange'; 
import logoImg from './assets/landing_logo.png';

export default function LandingPage() {
  const [heroImg, setHeroImg] = useState<any>(null);

  // Set the image on mount to avoid hydration mismatch
  useEffect(() => {
    setHeroImg(getRandomHeroImage());
  }, []);

  return (
    <main className={styles.fullPageWrapper}>
      <div className={styles.contentSplitter}>
        
        {/* Background Mascot Container */}
        <div className={styles.heroSection}>
          {heroImg && (
            <Image 
              src={heroImg} 
              alt="Mascot" 
              fill
              priority
              className={styles.heroImage}
            />
          )}
        </div>

        {/* Foreground Content Section */}
        <div className={styles.actionSection}>
          <div className={styles.logoWrapper}>
            <Image 
               src={logoImg} 
               alt="Ghumante Logo" 
               width={160} 
               height={50} 
               style={{ objectFit: 'contain' }} 
            />
          </div>

          <h1 className={styles.title}>Explore like a Game.</h1>
          <p className={styles.subtitle}>
            Scan, explore, and collect rewards as you discover hidden gems across the city.
          </p>

          <div className={styles.buttonGroup}>
            <Link href="/login" className={styles.playButton}>START EXPLORING</Link>
            <Link href="/about" className={styles.learnMoreButton}>LEARN MORE</Link>
            
          </div>

          <footer className={styles.footer}>
            <span>© 2026 Ghumante Yuwa</span>
            <span>|</span>
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
            <span>|</span>
            <Link href="https://www.lagarau.com" style={{ color: 'inherit', textDecoration: 'none' }}>La Garau</Link>
          </footer>
        </div>

      </div>
    </main>
  );
}