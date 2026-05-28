"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Camera } from "lucide-react";
import styles from "./permissions.module.css";

type PermissionState = "prompt" | "granted" | "denied";

// 1. Move the core logic into an inner component
function PermissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract eventId from query parameters (?eventId=abc) or fallback to ?id=abc
  const eventId = searchParams.get("eventId") || searchParams.get("id");

  const [locationState, setLocationState] = useState<PermissionState>("prompt");
  const [cameraState, setCameraState] = useState<PermissionState>("prompt");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);

  // Manages the hard lock state cleanly to keep SSR layout balanced
  const [isLocked, setIsLocked] = useState(true);

  // Monitors permissions changes purely client-side to switch button states
  useEffect(() => {
    const allGranted = locationState === "granted" && cameraState === "granted";
    setIsLocked(!allGranted);
  }, [locationState, cameraState]);

  // LOCATION REQUEST HANDLER
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationState("granted");
        setLoadingLocation(false);
      },
      (err) => {
        console.error("Location tracking error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Permission Denied: Location access is blocked in your browser settings for this site.");
          setLocationState("denied");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          alert("Position Unavailable: Device cannot determine physical location coordinates right now.");
          setLocationState("prompt");
        } else if (err.code === err.TIMEOUT) {
          alert("Timeout: The request to fetch device location timed out.");
          setLocationState("prompt");
        } else {
          alert(`Location Error: ${err.message}`);
          setLocationState("prompt");
        }
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // CAMERA REQUEST HANDLER
  const requestCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera API is unsupported on this browser or connection context (Are you testing on an insecure HTTP link instead of HTTPS?).");
      return;
    }
    setLoadingCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraState("granted");
      stream.getTracks().forEach((t) => t.stop());
    } catch (err: any) {
      console.error("Camera access error:", err);
      alert(`Camera Error: ${err.name} - ${err.message}`);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraState("denied");
      }
    }
    setLoadingCamera(false);
  };

  const handleEnter = () => {
    if (isLocked) return;
    if (eventId) {
      router.push(`/eventsmaker/${eventId}`);
    } else {
      router.push("/eventsmaker");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />

      <main className={styles.main}>
        {/* HEADER BRANDING */}
        <section className={styles.branding}>
          <Image
            src="/images/Logo/logo.png"
            alt="Ghumante Yuwa"
            width={180}
            height={80}
            priority
            className={styles.logo}
          />
          <h1 className={styles.title}>Prepare Your Journey</h1>
          <p className={styles.subtitle}>
            Enable required permissions to enter the world of exploration.
          </p>
        </section>

        {/* PERMISSIONS INTERACTION GRID */}
        <section className={styles.permissionsGrid}>
          {/* LOCATION SERVICE CARD */}
          <div className={`${styles.card} ${styles[locationState]}`}>
            <div className={styles.cardTop}>
              <div className={styles.iconContainer}>
                <MapPin className={styles.uiIcon} size={28} strokeWidth={2} />
              </div>
              <div>
                <h2>Live Location</h2>
                <p>Required to unlock nearby checkpoints.</p>
              </div>
            </div>

            <button
              onClick={requestLocation}
              disabled={locationState === "granted" || loadingLocation}
              className={styles.permissionButton}
            >
              {loadingLocation
                ? "REQUESTING..."
                : locationState === "granted"
                ? "ENABLED"
                : locationState === "denied"
                ? "HELD BY BROWSER"
                : "ENABLE"}
            </button>
          </div>

          {/* CAMERA SERVICE CARD */}
          <div className={`${styles.card} ${styles[cameraState]}`}>
            <div className={styles.cardTop}>
              <div className={styles.iconContainer}>
                <Camera className={styles.uiIcon} size={28} strokeWidth={2} />
              </div>
              <div>
                <h2>Camera Access</h2>
                <p>Required for QR checkpoints & verification.</p>
              </div>
            </div>

            <button
              onClick={requestCamera}
              disabled={cameraState === "granted" || loadingCamera}
              className={styles.permissionButton}
            >
              {loadingCamera
                ? "REQUESTING..."
                : cameraState === "granted"
                ? "ENABLED"
                : cameraState === "denied"
                ? "HELD BY BROWSER"
                : "ENABLE"}
            </button>
          </div>
        </section>

        {/* EXPLICIT HARD-LOCKED SETTINGS WARNING */}
        {(locationState === "denied" || cameraState === "denied") && (
          <div className={styles.warning}>
            <strong>Permissions Blocked:</strong> Your device or browser has hard-locked access. 
            Please reset the site permissions in your browser address bar settings to re-allow tracking.
          </div>
        )}

        {/* GAME NAVIGATION ENTER GATE */}
        <button
          onClick={handleEnter}
          disabled={isLocked}
          suppressHydrationWarning
          className={`${styles.continueButton} ${!isLocked ? styles.ready : styles.locked}`}
        >
          ENTER THE GAME
        </button>
      </main>
    </div>
  );
}

// 2. Main default export wrapped cleanly in Suspense to clear the Netlify build worker
export default function PermissionsPage() {
  return (
    <Suspense fallback={
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        Loading configuration...
      </div>
    }>
      <PermissionsContent />
    </Suspense>
  );
}