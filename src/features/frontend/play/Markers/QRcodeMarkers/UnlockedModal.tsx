"use client";
import { QRcodeMarkerData } from "./Logic";

export function UnlockedModal({
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
          borderRadius: "24px",
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          fontFamily: "inherit",
          animation: "fadeInScale 0.2s ease-out",
        }}
      >
        {/* Image */}
        {marker.image ? (
          <div
            style={{
              width: "100%",
              height: "220px",
              backgroundImage: `url(${marker.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "#22c55e",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 800,
                padding: "6px 12px",
                borderRadius: "20px",
                letterSpacing: "0.05em",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                textTransform: "uppercase"
              }}
            >
              Unlocked
            </div>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "120px",
              background: "#facd05",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
          </div>
        )}

        <div style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: "#111" }}>
            {marker.name}
          </h2>

          {marker.nameNepali && (
            <p style={{ margin: "0 0 16px", fontSize: "15px", color: "#666" }}>
              {marker.nameNepali}
            </p>
          )}

          <div style={{ 
            maxHeight: "200px", 
            overflowY: "auto", 
            paddingRight: "4px" 
          }}>
            <p style={{ margin: 0, fontSize: "15px", color: "#444", lineHeight: 1.6 }}>
              {marker.description || marker.descriptionNepali || "No description available."}
            </p>
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
            Close
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