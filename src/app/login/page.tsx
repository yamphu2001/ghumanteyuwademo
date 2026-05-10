"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link"; // Added for redirection
import styles from "./login.module.css";
import { useLoginLogic } from "./logic";

export default function LoginPage() {
  const { handleGoogleLogin, isLoading } = useLoginLogic();

  return (
    <div className={styles.container}>
      {/* Decorative background blur */}
      <div className={styles.backgroundDecor} />
      
      <main className={styles.main}>
        
        {/* BRANDING SECTION */}
        <div className={styles.logoContainer}>
          <div className={styles.imageWrapper}>
            <Image 
              src="/images/Logo/logo.png" 
              alt="Ghumante Yuwa" 
              width={200} 
              height={90} 
              priority
              className={styles.logo}
            />
          </div>
          <h1 className={styles.title}>
            Start Your Journey
          </h1>
        </div>

        {/* LOGIN CARD */}
        <div className={styles.welcomeCard}>
          <p className={styles.subtitle}>
            Join the community of explorers.
          </p>

          <button 
            className={styles.googleButton} 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loader}>CONNECTING...</span>
            ) : (
              <>
                CONTINUE WITH GOOGLE
              </>
            )}
          </button>

          {/* REDIRECTABLE LINKS */}
          <p className={styles.footerText}>
            By signing in, you agree to our <br/>
            <Link href="/terms" className={styles.legalText}>
              Terms
            </Link> 
            {" "}&{" "} 
            <Link href="/privacy" className={styles.legalText}>
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* VERSION TAG */}
        <div className={styles.versionTag}>
          GHUMANTE V0.1 BETA
        </div>

      </main>
    </div>
  );
}