"use client";
import { QRcodeMarkerData } from "./Logic";

export function LockedModal({
  marker,
  onClose,
}: {
  marker: QRcodeMarkerData;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center", // Centered vertically
        justifyContent: "center", // Centered horizontally
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px", // Softer rounded corners
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          fontFamily: "inherit",
          animation: "fadeInScale 0.2s ease-out",
        }}
      >
        {/* Image / Header */}
        {marker.image ? (
          <div
            style={{
              width: "100%",
              height: "200px",
              backgroundImage: `url(${marker.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.7)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "120px",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            🔒
          </div>
        )}

        <div style={{ padding: "24px" }}>
          <h2 style={{ 
            margin: "0 0 4px", 
            fontSize: "22px", 
            fontWeight: 700, 
            color: "#111" 
          }}>
            {marker.name}
          </h2>

          {marker.nameNepali && (
            <p style={{ margin: "0 0 16px", fontSize: "15px", color: "#666" }}>
              {marker.nameNepali}
            </p>
          )}

          <div
            style={{
              background: "#f8f8f8",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#555",
              fontSize: "14px",
            }}
          >
            <span style={{ fontSize: "18px" }}>📍</span>
            <span>Visit this location and scan the code to unlock details.</span>
          </div>

          <button
            onClick={onClose}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              background: "#000",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Got it
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}