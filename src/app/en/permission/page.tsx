"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import styles from "./permission.module.css";

export default function PermissionPage() {
  const [locationStatus, setLocationStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [cameraStatus, setCameraStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [mounted, setMounted] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  const router = useRouter();
  const allGranted = locationStatus === "granted" && cameraStatus === "granted";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus("granted"),
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraStatus("granted");
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraStatus("denied");
    }
  };

  const handleStartExploring = async () => {
    const user = auth.currentUser;
    if (user && db) {
      try {
        const docRef = doc(db, "participants", user.uid);
        await setDoc(
          docRef,
          {
            startTime: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to record start time:", err);
      }
    }
    router.push("/en/play");
  };

  return (
    <main className={styles.main}>

      {/* HEADER / LOGO */}
      <div className={styles.logoWrapper}>
        <Image
          src="/landing/landing_logo.png"
          alt="Logo"
          width={140}
          height={40}
          className={styles.logo}
        />
      </div>

      {/* CENTER CONTENT */}
      <div className={styles.centerContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>PERMISSIONS</h1>
          <p className={styles.subtitle}>The mission requires active sensors.</p>
        </header>

        <div className={styles.permissionList}>

          {/* LOCATION */}
          <div className={styles.permissionRow}>
            <div className={styles.permissionLabel}>
              <h3>Location</h3>
              <p>GPS Protocol</p>
            </div>
            <button
              onClick={requestLocation}
              disabled={locationStatus === "granted"}
              className={`${styles.btn} ${locationStatus === "granted" ? styles.btnActive : styles.btnIdle}`}
            >
              {locationStatus === "granted" ? "ACTIVE" : "ALLOW"}
            </button>
          </div>

          {/* CAMERA */}
          <div className={styles.permissionRow}>
            <div className={styles.permissionLabel}>
              <h3>Camera</h3>
              <p>Visual Input</p>
            </div>
            <button
              onClick={requestCamera}
              disabled={cameraStatus === "granted"}
              className={`${styles.btn} ${cameraStatus === "granted" ? styles.btnActive : styles.btnIdle}`}
            >
              {cameraStatus === "granted" ? "ACTIVE" : "ALLOW"}
            </button>
          </div>
        </div>

        {/* ERROR MESSAGES */}
        {(locationStatus === "denied" || cameraStatus === "denied") && (
          <div className={styles.errorBanner}>
            <p>Access Denied. Please enable permissions in your browser settings to continue.</p>
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className={styles.footer}>
        <button
          onClick={handleStartExploring}
          disabled={mounted ? !allGranted : true}
          className={styles.ctaBtn}
        >
          {!mounted || !allGranted ? "WAITING FOR ACCESS" : "START EXPLORING"}
        </button>
      </div>

    </main>
  );
}