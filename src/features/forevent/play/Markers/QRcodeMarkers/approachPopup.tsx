
// "use client";

// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
// import { QRcodeMarkerData } from "./popup"; 

// interface ApproachPopupProps {
//   marker: QRcodeMarkerData;
//   onClose: () => void;
// }

// export function ApproachPopup({ marker, onClose }: ApproachPopupProps) {

//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Escape key closes
//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handleKey);
//     return () => window.removeEventListener("keydown", handleKey);
//   }, [onClose]);

//   // If the browser environment isn't fully ready yet, render nothing safely
//   if (!mounted || !document.body) return null;

//   return createPortal(
//     <div style={s.overlay} onClick={onClose}>
//       <div style={s.sheet} onClick={(e) => e.stopPropagation()}>

//         {/* Close */}
//         <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

//         {/* Header strip */}
//         <div style={s.headerStrip}>
//           <span style={s.headerIcon}>📍</span>
//           <div>
//             <p style={s.headerLabel}>QR Checkpoint</p>
//             {/* Displaying dynamic marker name if available */}
//             <p style={s.headerName}>{marker.name || "Nearby Location"}</p>
//           </div>
//         </div>

//         <div style={s.body}>
//           {/* Steps */}
//           <div style={s.stepsWrapper}>
//             <Step number={1} icon="🚶" text="Walk to this marker's physical location." done={false} />
//             <Step number={2} icon="🔍" text="Look for the QR code posted at the location." done={false} />
//             <Step number={3} icon="📷" text="Scan the QR code using your phone camera." done={false} />
//             <Step number={4} icon="🧠" text="Read and remember the information — it may appear in the quiz!" done={false} />
//           </div>

//           <p style={s.cancelHint}>Tap outside or ✕ to dismiss.</p>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// }

// // ── Small step row ─────────────────────────────────────────────────────────────
// function Step({ number, icon, text, done }: {
//   number: number;
//   icon: string;
//   text: string;
//   done: boolean;
// }) {
//   return (
//     <div style={stepS.row}>
//       <div style={{ ...stepS.circle, background: done ? "#22c55e" : "#0f172a" }}>
//         {done ? "✓" : number}
//       </div>
//       <div style={stepS.iconText}>
//         <span style={{ fontSize: 18 }}>{icon}</span>
//         <p style={stepS.text}>{text}</p>
//       </div>
//     </div>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const s: Record<string, React.CSSProperties> = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     zIndex: 9999,
//     display: "flex",
//     alignItems: "flex-end",
//     justifyContent: "center",
//   },
//   sheet: {
//     position: "relative",
//     width: "100%",
//     maxWidth: 480,
//     maxHeight: "90vh",
//     overflowY: "auto",
//     backgroundColor: "#fff",
//     borderRadius: "20px 20px 0 0",
//     boxShadow: "0 -4px 30px rgba(0,0,0,0.25)",
//     paddingBottom: 32,
//   },
//   closeBtn: {
//     position: "absolute",
//     top: 14,
//     right: 16,
//     zIndex: 10,
//     background: "rgba(255,255,255,0.9)",
//     border: "none",
//     borderRadius: "50%",
//     width: 34,
//     height: 34,
//     fontSize: 16,
//     cursor: "pointer",
//     color: "#333",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
//   },
//   headerStrip: {
//     display: "flex",
//     alignItems: "center",
//     gap: 12,
//     background: "#0f172a",
//     color: "#fff",
//     padding: "20px 24px 16px",
//     borderRadius: "20px 20px 0 0",
//   },
//   headerIcon: { fontSize: 28 },
//   headerLabel: { margin: 0, fontSize: "0.72rem", color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" as const },
//   headerName: { margin: 0, fontSize: "1.1rem", fontWeight: 700 },
//   body: { padding: "20px 24px 0" },
//   stepsWrapper: {
//     display: "flex",
//     flexDirection: "column" as const,
//     gap: 14,
//     marginBottom: 20,
//   },
//   cancelHint: {
//     textAlign: "center" as const,
//     fontSize: "0.75rem",
//     color: "#94a3b8",
//     margin: 0,
//     marginTop: 10,
//   },
// };

// const stepS: Record<string, React.CSSProperties> = {
//   row: { display: "flex", alignItems: "flex-start", gap: 12 },
//   circle: {
//     minWidth: 28,
//     height: 28,
//     borderRadius: "50%",
//     color: "#fff",
//     fontWeight: 700,
//     fontSize: "0.8rem",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   iconText: { display: "flex", alignItems: "flex-start", gap: 8, paddingTop: 2 },
//   text: { margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: 1.5 },
// };



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

        {/* Close */}
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* Header strip */}
        <div style={s.headerStrip}>
          <div style={s.headerIconCircle}>
            <span style={{ fontSize: 20 }}>📍</span>
          </div>
          <div>
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
  headerStrip: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#000000",
    color: "#ffffff",
    padding: "20px 24px 18px",
    borderRadius: "16px 16px 0 0",
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: RED_LIGHT,
    border: `0.5px solid ${RED_MID}`,
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
    fontWeight: 500,
  },
  headerName: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  body: { padding: "20px 24px 28px" },
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
    borderRadius: "50%",
    color: "#ffffff",
    fontWeight: 500,
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: { display: "flex", alignItems: "flex-start", gap: 8, paddingTop: 3 },
  text: { margin: 0, fontSize: "0.9rem", color: "#000000", lineHeight: 1.55 },
};