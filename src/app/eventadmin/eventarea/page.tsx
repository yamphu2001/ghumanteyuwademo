
"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker"; // Ensure you created this file!

const DEFAULT_COORDS = [
  [85.26180698204308, 27.773355651198045],
  [85.43363234753912, 27.766015666665908],
  [85.42377814026258, 27.642775417731144],
  [85.23674706106999, 27.655492758252294],
  [85.26174968794811, 27.773106095233743],
];

export default function EventAreaAdmin() {
  const { eventId: manualEventId } = useEventId();

  const [boundaryInput, setBoundaryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync from Firebase
  useEffect(() => {
    if (!manualEventId) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "events", manualEventId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.boundaryCoords && Array.isArray(data.boundaryCoords)) {
          const readableArrays = data.boundaryCoords.map((obj: any) => [obj.lng, obj.lat]);
          setBoundaryInput(JSON.stringify(readableArrays, null, 2));
        } else {
          setBoundaryInput("");
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [manualEventId]);

  // Sync FROM Map TO JSON Input
  const handleMapUpdate = (feature: any) => {
    const coords = feature.geometry.coordinates[0]; // Polygon coordinates
    setBoundaryInput(JSON.stringify(coords, null, 2));
  };

  const handleLoadDefaults = () => {
    if (window.confirm("Replace current text with default coordinates?")) {
      setBoundaryInput(JSON.stringify(DEFAULT_COORDS, null, 2));
    }
  };

  const handleSaveBoundary = async () => {
    if (!manualEventId) return alert("Please select an Event ID!");
    setSaving(true);
    try {
      const parsedCoords = JSON.parse(boundaryInput);
      const firestoreReadyCoords = parsedCoords.map((pair: number[]) => ({
        lng: Number(pair[0]),
        lat: Number(pair[1]),
      }));

      // Calculate Center for the event
const avgLng = firestoreReadyCoords.reduce((sum: number, p: { lng: number }) => sum + p.lng, 0) / firestoreReadyCoords.length;
const avgLat = firestoreReadyCoords.reduce((sum: number, p: { lat: number }) => sum + p.lat, 0) / firestoreReadyCoords.length;

      await setDoc(doc(db, "events", manualEventId), {
        boundaryCoords: firestoreReadyCoords,
        lat: avgLat, 
        lng: avgLng,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      alert(`Successfully saved boundary!`);
    } catch (error: any) {
      alert("Save failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>🗺️ Event Area Admin</h1>
        <p style={{ color: "#666" }}>
          Target Event: {manualEventId ? <b style={{ color: "#3b82f6" }}>{manualEventId}</b> : "None"}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "600px" }}>
        
        {/* LEFT SIDE: MAP */}
        <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
           <MapPicker mode="draw_polygon" onLocationSelect={handleMapUpdate} />
        </div>

        {/* RIGHT SIDE: DATA EDITOR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Boundary JSON {loading && "(Loading...)"}</strong>
            <button onClick={handleLoadDefaults} style={secondaryBtnStyle}>Load Default Box</button>
          </div>

          <textarea
            value={boundaryInput}
            onChange={(e) => setBoundaryInput(e.target.value)}
            placeholder="Drawing on the map will update this JSON automatically..."
            style={textareaStyle}
          />

          <button
            onClick={handleSaveBoundary}
            disabled={saving || !manualEventId}
            style={{ ...primaryBtnStyle, width: "100%", marginTop: "auto", opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Syncing..." : `Save Coordinates to ${manualEventId}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles remain same as your previous version
const textareaStyle = {
  flex: 1, padding: "15px", fontFamily: "monospace", fontSize: "12px",
  borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", resize: "none" as const
};
const primaryBtnStyle = {
  padding: "16px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" as const
};
const secondaryBtnStyle = {
  padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px"
};