
"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker";

interface BoundaryPoint {
  lat: number;
  lng: number;
}

export default function EventAreaAdmin() {
  const { eventId } = useEventId();

  const [saving,           setSaving]          = useState(false);
  const [loading,          setLoading]         = useState(true);
  const [saved,            setSaved]           = useState(false);
  const [currentBoundary, setCurrentBoundary] = useState<number[][][]>([]);
  const [drawnCoords,     setDrawnCoords]     = useState<number[][][] | null>(null);

  // Load existing boundary data from the dedicated parallel 'boundary' subcollection
  useEffect(() => {
    if (!eventId) return;
    const fetchBoundary = async () => {
      setLoading(true);
      try {
        // FIXED PATH: events -> eventId -> boundary (subcollection) -> data (document)
        const snap = await getDoc(doc(db, "events", eventId, "boundary", "data"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.boundaryCoords && data.boundaryCoords.length > 0) {
            // Convert {lat,lng}[] → [lng,lat][][] for MapPicker
            const converted: number[][] = data.boundaryCoords.map(
              (p: BoundaryPoint) => [p.lng, p.lat]
            );
            setCurrentBoundary([converted]);
          }
        } else {
          setCurrentBoundary([]);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBoundary();
  }, [eventId]);

  const handleMapDraw = (data: any) => {
    const coords = data?.geometry?.coordinates;
    if (!coords || coords.length === 0) {
      setDrawnCoords(null);
      return;
    }
    setDrawnCoords(coords);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!drawnCoords || drawnCoords.length === 0) return alert("Draw a boundary first.");
    if (!eventId) return alert("No event selected.");

    // Convert [lng,lat][][] → {lat,lng}[] — the format useMapInit reads
    const ring = drawnCoords[0];
    const boundaryCoords: BoundaryPoint[] = ring.map(([lng, lat]) => ({
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7)),
    }));

    setSaving(true);
    try {
      // FIXED PATH: Saves to 'boundary' subcollection parallel to 'player_log'
      const docRef = doc(db, "events", eventId, "boundary", "data");
      await setDoc(docRef, { boundaryCoords }, { merge: true });
      
      // Fixes the UI state alignment to show new polygon instantly
      const formattedForMap = boundaryCoords.map(p => [p.lng, p.lat]);
      setCurrentBoundary([formattedForMap]);
      
      setSaved(true);
      alert("Boundary saved to dedicated subcollection successfully!");
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save boundary.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear the saved boundary?")) return;
    try {
      // Clear data path targeting the parallel subcollection document
      const docRef = doc(db, "events", eventId, "boundary", "data");
      await setDoc(docRef, { boundaryCoords: [] }, { merge: true });
      
      setCurrentBoundary([]);
      setDrawnCoords(null);
      setSaved(false);
    } catch (e) {
      alert("Failed to clear boundary.");
    }
  };

  const pointCount = drawnCoords?.[0]?.length
    ? drawnCoords[0].length - 1  // subtract closing point
    : 0;

  return (
    <div style={{ fontFamily: "monospace", color: "#000" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "6px solid red", paddingBottom: "10px" }}>
        <div>
          <h1 style={{ textTransform: "uppercase", margin: 0 }}>Event Area / Boundary</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: "13px" }}>
            Location: <strong>events/{eventId}/boundary/data</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Status badge */}
          {currentBoundary.length > 0 && (
            <span style={{ fontSize: "12px", background: "#dcfce7", color: "#16a34a", border: "1px solid #16a34a", padding: "4px 10px" }}>
              ✓ BOUNDARY SET
            </span>
          )}

          {/* Clear saved boundary */}
          {currentBoundary.length > 0 && (
            <button
              onClick={handleClear}
              style={{ background: "white", color: "#dc2626", border: "2px solid #dc2626", padding: "8px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: "bold" }}
            >
              CLEAR BOUNDARY
            </button>
          )}

          {/* Save drawn boundary */}
          <button
            onClick={handleSave}
            disabled={!drawnCoords || saving}
            style={{
              background: drawnCoords && !saving ? "#dc2626" : "#ccc",
              color: "white", border: "none",
              padding: "10px 24px", cursor: drawnCoords ? "pointer" : "not-allowed",
              fontFamily: "monospace", fontWeight: "bold", fontSize: "14px",
            }}
          >
            {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE BOUNDARY"}
          </button>
        </div>
      </div>

      {/* ── Instructions ── */}
      <div style={{ background: "#fffbeb", border: "2px solid #f59e0b", padding: "12px 16px", marginBottom: "16px", fontSize: "13px" }}>
        <strong>HOW TO USE:</strong> Select the polygon tool (📐) from the toolbar → click points on the map to draw the event boundary → double-click to finish → click <strong>SAVE BOUNDARY</strong>.
        The existing boundary (if any) is shown in blue for reference.
      </div>

      {/* ── Draw stats ── */}
      {drawnCoords && (
        <div style={{ background: "#f0f9ff", border: "2px solid #3b82f6", padding: "10px 16px", marginBottom: "16px", fontSize: "13px", display: "flex", gap: "24px" }}>
          <span>📐 Points drawn: <strong>{pointCount}</strong></span>
          <span>
            Center: <strong>
              {(drawnCoords[0].reduce((s, p) => s + p[1], 0) / drawnCoords[0].length).toFixed(5)},&nbsp;
              {(drawnCoords[0].reduce((s, p) => s + p[0], 0) / drawnCoords[0].length).toFixed(5)}
            </strong>
          </span>
        </div>
      )}

      {/* ── Map ── */}
      {loading ? (
        <div style={{ height: "600px", display: "grid", placeItems: "center", border: "4px solid red", color: "#666" }}>
          Loading existing boundary...
        </div>
      ) : (
        <div style={{ height: "600px", border: "4px solid red" }}>
          <MapPicker
            mode="draw_polygon"
            onLocationSelect={handleMapDraw}
            boundary={currentBoundary.length > 0 ? currentBoundary : undefined}
            initialValue={currentBoundary.length > 0 ? currentBoundary : undefined}
          />
        </div>
      )}

      {/* ── Coordinate table ── */}
      {currentBoundary.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ textTransform: "uppercase", borderBottom: "3px solid red", paddingBottom: "6px" }}>
            Saved Boundary Coordinates ({currentBoundary[0].length - 1} points)
          </h3>
          <div style={{ maxHeight: "200px", overflowY: "auto", border: "2px solid black" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead style={{ background: "red", color: "white", position: "sticky", top: 0 }}>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>LATITUDE</th>
                  <th style={thStyle}>LONGITUDE</th>
                </tr>
              </thead>
              <tbody>
                {currentBoundary[0].slice(0, -1).map(([lng, lat], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{lat.toFixed(6)}</td>
                    <td style={tdStyle}>{lng.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontFamily: "monospace" };
const tdStyle: React.CSSProperties = { padding: "6px 12px", fontFamily: "monospace" };