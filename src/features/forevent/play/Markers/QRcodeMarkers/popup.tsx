
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

const RED = "#e24b4a";
const RED_LIGHT = "#fcebeb";
const RED_MID = "#f09595";
const RED_DARK = "#a32d2d";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.55)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

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
    <div style={overlayStyle} onClick={onClose}>
      <div style={popupStyles.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={popupStyles.closeBtn} onClick={onClose} aria-label="Close popup">
          ✕
        </button>

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

export function TooFarPopup({
  marker,
  onClose,
}: {
  marker: QRcodeMarkerData;
  onClose: () => void;
}) {
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

  if (!mounted || !document.body) return null;

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={popupStyles.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={popupStyles.closeBtn} onClick={onClose} aria-label="Close popup">✕</button>
        <div style={popupStyles.content}>
          <h2 style={{ ...popupStyles.name, color: "#991b1b" }}>Too Far Away!</h2>
          <p style={{ fontSize: "0.95rem", color: "#475569", marginTop: 4, fontFamily: "system-ui" }}>
            {marker.name || "This QR code"}
          </p>
          <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: 1.6, marginTop: 12, fontFamily: "system-ui" }}>
            You must be closer to the physical location to scan this marker. Get closer and try again!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AlreadyScannedPopup({
  marker,
  onClose,
}: {
  marker: QRcodeMarkerData;
  onClose: () => void;
}) {
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

  if (!mounted || !document.body) return null;

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={popupStyles.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={popupStyles.closeBtn} onClick={onClose} aria-label="Close popup">✕</button>
        <div style={popupStyles.content}>
          <h2 style={popupStyles.name}>Already Scanned</h2>
          <p style={{ fontSize: "0.95rem", color: "#475569", marginTop: 4, fontFamily: "system-ui" }}>
            {marker.name || "This QR code"} has already been recorded.
          </p>
          <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: 1.6, marginTop: 12, fontFamily: "system-ui" }}>
            This QR code has already been scanned. Try a different code.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

const popupStyles: Record<string, React.CSSProperties> = {
  sheet: {
    position: "relative",
    width: "calc(100% - 32px)",
    maxWidth: 440,
    maxHeight: "85vh",
    overflowY: "auto",
    overflowX: "hidden",
    backgroundColor: "#ffffff",
    color: "#000000",
    borderRadius: 0,
    border: `2px solid #111827`,
    boxShadow: `6px 6px 0px 0px ${RED}`,
    scrollbarWidth: "none" as any,
    msOverflowStyle: "none" as any,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    background: RED,
    border: `2px solid #111827`,
    borderRadius: 0,
    width: 32,
    height: 32,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `2px 2px 0px #111827`,
  },
  imageWrapper: {
    width: "100%",
    height: 220,
    overflow: "hidden",
    borderRadius: 0,
    borderBottom: `2px solid #111827`,
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
    flexWrap: "wrap" as const,
  },
  badge: {
    display: "inline-block",
    background: RED_LIGHT,
    color: RED_DARK,
    border: `2px solid #111827`,
    fontWeight: 700,
    fontSize: "0.78rem",
    padding: "4px 12px",
    borderRadius: 0,
    boxShadow: `2px 2px 0px #111827`,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  timerBadge: {
    display: "inline-block",
    background: "#000000",
    color: "#ffffff",
    border: `2px solid #111827`,
    fontWeight: 700,
    fontSize: "0.78rem",
    padding: "4px 12px",
    borderRadius: 0,
    boxShadow: `2px 2px 0px ${RED}`,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  name: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#000000",
    margin: "0 0 10px",
    fontFamily: "system-ui",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  },
  description: {
    fontSize: "0.95rem",
    color: "#333333",
    lineHeight: 1.65,
    margin: 0,
    fontFamily: "system-ui",
  },
};