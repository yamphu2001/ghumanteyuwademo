"use client";

import styles from "./onboarding.module.css";

interface VerifyPopupProps {
  name: string;
  phone: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function VerifyPopup({
  name,
  phone,
  isSubmitting,
  onConfirm,
  onClose,
}: VerifyPopupProps) {
  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupCard}>
        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />

        <h2 className={styles.popupTitle}>Verify Details</h2>

        <p className={styles.popupSubtitle}>
          Please ensure your information is accurate before proceeding.
        </p>

        <div className="space-y-4 my-8">
          <div className={styles.dataPreviewBox}>
            <p className={styles.dataLabel}>Identity</p>
            <p className={styles.dataValue}>{name}</p>
          </div>

          <div className={styles.dataPreviewBox}>
            <p className={styles.dataLabel}>Phone</p>
            <p className={styles.dataValue}>{phone}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={styles.primaryBtn}
          >
            {isSubmitting ? "Processing..." : "Confirm & Proceed"}
          </button>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={styles.secondaryBtn}
          >
            Edit Information
          </button>
        </div>
      </div>
    </div>
  );
}