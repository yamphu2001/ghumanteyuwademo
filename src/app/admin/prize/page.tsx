"use client";

import "@/lib/firebase";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyAndClaim, subscribeToClaims, VerifyResult, ClaimRecord } from "./verify";
import styles from "./prize.module.css";

export default function PrizeScannerPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"scan" | "history">("scan");
  const [history, setHistory] = useState<ClaimRecord[]>([]);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Real-time claims listener
  useEffect(() => {
    const unsub = subscribeToClaims(setHistory);
    return () => unsub();
  }, []);

  // QR Scanner setup
  useEffect(() => {
    if (activeTab !== "scan") {
      scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
      return;
    }

    const timeout = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        false
      );

      scanner.render(
        async (rawText) => {
          await scanner.clear().catch(() => {});
          scannerRef.current = null;
          setChecking(true);
          const verifyResult = await verifyAndClaim(rawText);
          setChecking(false);
          setResult(verifyResult);
        },
        () => {}
      );

      scannerRef.current = scanner;
    }, 100);

    return () => {
      clearTimeout(timeout);
      scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [activeTab]);

  const dismissModal = () => {
    setResult(null);
    setActiveTab("history");
    setTimeout(() => setActiveTab("scan"), 50);
  };

  const goToHistory = () => {
    setResult(null);
    setActiveTab("history");
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
          <h1 className={styles.headerTitle}>Prize Hub</h1>
          <div style={{ width: 60 }} />
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "scan" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("scan")}
          >
            Scan QR
          </button>
          <button
            className={`${styles.tab} ${activeTab === "history" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("history")}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>

        {activeTab === "scan" && (
          <div className={styles.scanArea}>
            <div className={styles.scannerWrap}>
              <div id="qr-reader" />
            </div>
            <p className={styles.scanHint}>Point camera at QR code</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className={styles.historyArea}>
            <p className={styles.historyLabel}>Claimed Prizes</p>
            {history.length === 0 ? (
              <p className={styles.emptyHistory}>No prizes claimed yet</p>
            ) : (
              history.map((claim) => (
                <div key={claim.id} className={styles.claimRow}>
                  <div className={styles.claimLeft}>
                    <div className={styles.claimUsername}>{claim.username}</div>
                  </div>
                  <div className={styles.claimRight}>
                    <div className={styles.claimBadge}>Claimed</div>
                    <div className={styles.claimTime}>{claim.claimedAt}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Checking spinner */}
      {checking && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.spinner} />
            <p className={styles.spinnerLabel}>Verifying...</p>
          </div>
        </div>
      )}

      {/* Result modal */}
      {result && !checking && (
        <div className={styles.overlay}>
          <div className={styles.modal}>

            {result.status === "success" && (
              <>
                <div className={styles.modalIcon}>🏆</div>
                <h2 className={`${styles.modalTitle} ${styles.modalTitleSuccess}`}>Confirmed!</h2>
                <p className={styles.modalUsername}>{result.username}</p>
                <p className={styles.modalSub}>Prize distributed ✓</p>
                <button className={`${styles.modalBtn} ${styles.modalBtnSuccess}`} onClick={goToHistory}>
                  View History
                </button>
              </>
            )}

            {result.status === "already_claimed" && (
              <>
                <div className={styles.modalIcon}>🚫</div>
                <h2 className={`${styles.modalTitle} ${styles.modalTitleDuplicate}`}>Already Claimed</h2>
                <p className={styles.modalUsername}>{result.username}</p>
                <p className={styles.modalSub}>Claimed at {result.claimedAt}</p>
                <button className={`${styles.modalBtn} ${styles.modalBtnDuplicate}`} onClick={dismissModal}>
                  Scan Again
                </button>
              </>
            )}

            {result.status === "not_found" && (
              <>
                <div className={styles.modalIcon}>⚠️</div>
                <h2 className={`${styles.modalTitle} ${styles.modalTitleNotFound}`}>Not Found</h2>
                <p className={styles.modalUsername}>{result.username}</p>
                <p className={styles.modalSub}>Username not in database</p>
                <button className={`${styles.modalBtn} ${styles.modalBtnNotFound}`} onClick={dismissModal}>
                  Scan Again
                </button>
              </>
            )}

            {result.status === "invalid_qr" && (
              <>
                <div className={styles.modalIcon}>❓</div>
                <h2 className={`${styles.modalTitle} ${styles.modalTitleNotFound}`}>Invalid QR</h2>
                <p className={styles.modalSub}>Could not read QR format</p>
                <button className={`${styles.modalBtn} ${styles.modalBtnNotFound}`} onClick={dismissModal}>
                  Try Again
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}