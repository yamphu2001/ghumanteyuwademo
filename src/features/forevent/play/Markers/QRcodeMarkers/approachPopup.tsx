"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRcodeMarkerData } from "./popup";

interface ApproachPopupProps {
  marker: QRcodeMarkerData;
  onClose: () => void;
}

export function ApproachPopup({ marker, onClose }: ApproachPopupProps) {
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
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>

        {/* Close — inside header, not overflowing */}
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* Header strip */}
        <div style={s.headerStrip}>
          <div style={s.headerIconCircle}>
            <span style={{ fontSize: 20 }}>📍</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={s.headerLabel}>QR Checkpoint</p>
            <p style={s.headerName}>{marker.name || "Nearby Location"}</p>
          </div>
        </div>

        <div style={s.body}>
          <div style={s.stepsWrapper}>
            <Step number={1} icon="🚶" text="Walk to this marker's physical location." done={false} />
            <Step number={2} icon="🔍" text="Look for the QR code posted at the location." done={false} />
            <Step number={3} icon="📷" text="Scan the QR code using your phone camera." done={false} />
            <Step number={4} icon="🧠" text="Read and remember the information — it may appear in the quiz!" done={false} last />
          </div>

          <p style={s.cancelHint}>Tap outside or ✕ to dismiss.</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Step row ──────────────────────────────────────────────────────────────────
function Step({ number, icon, text, done, last }: {
  number: number;
  icon: string;
  text: string;
  done: boolean;
  last?: boolean;
}) {
  return (
    <div style={stepS.row}>
      <div style={{
        ...stepS.circle,
        background: done ? "#22c55e" : last ? RED : "#000000",
      }}>
        {done ? "✓" : number}
      </div>
      <div style={stepS.iconText}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <p style={stepS.text}>{text}</p>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const RED       = "#e24b4a";
const RED_LIGHT = "#fcebeb";
const RED_MID   = "#f09595";
const RED_DARK  = "#a32d2d";

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    maxHeight: "80vh",
    overflowY: "auto",
    overflowX: "hidden",           // ← kills horizontal scrollbar
    backgroundColor: "#ffffff",
    color: "#000000",
    borderRadius: 0,
    border: `2px solid #111827`,
    boxShadow: `6px 6px 0px 0px ${RED}`,
    // hide scrollbar visually across browsers
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
  headerStrip: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#000000",
    color: "#ffffff",
    padding: "20px 52px 18px 20px",  // ← right padding makes room for close btn
    borderRadius: 0,
    borderBottom: `2px solid #111827`,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 0,
    background: RED_LIGHT,
    border: `2px solid #111827`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerLabel: {
    margin: 0,
    fontSize: "0.68rem",
    color: RED_MID,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    fontWeight: 600,
  },
  headerName: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  body: { padding: "20px 20px 24px" },
  stepsWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
    marginBottom: 20,
  },
  cancelHint: {
    textAlign: "center" as const,
    fontSize: "0.75rem",
    color: "#888780",
    margin: 0,
    marginTop: 10,
  },
};

const stepS: Record<string, React.CSSProperties> = {
  row: { display: "flex", alignItems: "flex-start", gap: 12 },
  circle: {
    minWidth: 28,
    height: 28,
    borderRadius: 0,
    border: `2px solid #111827`,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: `2px 2px 0px #111827`,
  },
  iconText: { display: "flex", alignItems: "flex-start", gap: 8, paddingTop: 3 },
  text: { margin: 0, fontSize: "0.9rem", color: "#000000", lineHeight: 1.55 },
};