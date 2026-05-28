
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface QRcodeMarkerData {
  id: string;
  name?: string;
  lat: number;
  lng: number;
  image?: string;
  popupImage?: string;
  popupText?: string;
  qrCodeId?: string;
  points?: number;
  scanned?: boolean;
}

export function MarkerPopup({
  marker,
  onClose,
}: {
  marker: QRcodeMarkerData;
  onClose: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  if (!mounted || !document.body) return null;

  return createPortal(
    <div style={popupStyles.overlay} onClick={onClose}>
      <div style={popupStyles.sheet} onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button style={popupStyles.closeBtn} onClick={onClose} aria-label="Close popup">
          ✕
        </button>

        {/* Image */}
        {marker.popupImage && (
          <div style={popupStyles.imageWrapper}>
            <img src={marker.popupImage} alt={marker.name} style={popupStyles.image} />
          </div>
        )}

        <div style={popupStyles.content}>
          <div style={popupStyles.badgeRow}>
            {!!marker.points && (
              <span style={popupStyles.badge}>⭐ {marker.points} pts</span>
            )}
            <span style={popupStyles.timerBadge}>⏱️ Closes in {timeLeft}s</span>
          </div>

          <h2 style={popupStyles.name}>{marker.name || "Unnamed"}</h2>

          {marker.popupText && (
            <p style={popupStyles.description}>{marker.popupText}</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const RED = "#e24b4a";
const RED_LIGHT = "#fcebeb";
const RED_MID = "#f09595";
const RED_DARK = "#a32d2d";

const popupStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",       // ← centered vertically
    justifyContent: "center",   // ← centered horizontally
  },
  sheet: {
    position: "relative",
    width: "calc(100% - 32px)",
    maxWidth: 440,
    maxHeight: "85vh",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    color: "#000000",
    borderRadius: 16,
    boxShadow: `6px 6px 0px 0px ${RED}`,  // ← down + right hard shadow
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    background: "#ffffff",
    border: `0.5px solid ${RED}`,
    borderRadius: "50%",
    width: 32,
    height: 32,
    fontSize: 14,
    cursor: "pointer",
    color: RED_DARK,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    width: "100%",
    height: 220,
    overflow: "hidden",
    borderRadius: "16px 16px 0 0",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  content: {
    padding: "20px 24px 28px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    background: RED_LIGHT,
    color: RED_DARK,
    border: `0.5px solid ${RED_MID}`,
    fontWeight: 600,
    fontSize: "0.78rem",
    padding: "4px 12px",
    borderRadius: 999,
  },
  timerBadge: {
    display: "inline-block",
    background: RED_LIGHT,
    color: RED_DARK,
    border: `0.5px solid ${RED_MID}`,
    fontWeight: 600,
    fontSize: "0.78rem",
    padding: "4px 12px",
    borderRadius: 999,
  },
  name: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#000000",
    margin: "0 0 10px",
    fontFamily: "system-ui",
  },
  description: {
    fontSize: "0.95rem",
    color: "#333333",
    lineHeight: 1.65,
    margin: 0,
    fontFamily: "system-ui",
  },
};