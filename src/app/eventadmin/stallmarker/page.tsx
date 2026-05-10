"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
// 1. IMPORT MAP PICKER
import MapPicker from "@/app/eventadmin/MapPicker";

interface StallConfig {
  id: string;
  lng: number;
  lat: number;
  eventarea: string;
  status: "active" | "inactive";
}

const emptyStall = (): StallConfig => ({
  id: crypto.randomUUID(),
  lng: 85.3255,
  lat: 27.6724,
  eventarea: "",
  status: "active",
});

export default function StallMarkerAdmin() {
  const { eventId } = useEventId();

  const [stalls, setStalls] = useState<StallConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Map Selection States ──
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  // Fetch Event Boundary for Map Context
  const fetchEventBoundary = useCallback(async () => {
    if (!eventId) return;
    try {
      const eventSnap = await getDoc(doc(db, "events", eventId));
      if (eventSnap.exists()) {
        const rawCoords = eventSnap.data().boundaryCoords;
        if (rawCoords && Array.isArray(rawCoords)) {
          const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
          if (formatted.length > 0) {
            const first = formatted[0];
            const last = formatted[formatted.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) formatted.push(first);
          }
          setEventAreaBoundary([formatted]);
        }
      }
    } catch (e) { console.error("Error fetching boundary:", e); }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setStalls([]);
      return;
    }
    setLoading(true);
    fetchEventBoundary();

    const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.stallMarkers)) {
          setStalls(data.stallMarkers);
        } else if (data.stallMarker) {
          setStalls([{ ...data.stallMarker, id: crypto.randomUUID() }]);
        } else {
          setStalls([]);
        }
      } else {
        setStalls([]);
      }
      setLoading(false);
    }, (err) => { 
      console.error(err); 
      setLoading(false); 
    });
    return () => unsub();
  }, [eventId, fetchEventBoundary]);

  // ── Helpers ──
  const updateStall = (id: string, field: keyof StallConfig, value: any) =>
    setStalls((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const addStall = () => setStalls((prev) => [...prev, emptyStall()]);

  const removeStall = (id: string) =>
    setStalls((prev) => prev.filter((s) => s.id !== id));

  // ── Map Picker Logic ──
  const openMapForStall = (id: string) => {
    setActivePickerId(id);
    setIsMapFullScreen(true);
  };

  const handleMapSelect = (data: any) => {
    if (data.geometry?.coordinates && activePickerId) {
      const [lng, lat] = data.geometry.coordinates;
      updateStall(activePickerId, "lng", lng);
      updateStall(activePickerId, "lat", lat);
      setIsMapFullScreen(false);
      setActivePickerId(null);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!eventId) return alert("Please select an Event from the sidebar first!");
    setSaving(true);
    try {
      const ref = doc(db, "events", eventId);
      await setDoc(ref, { stallMarkers: stalls }, { merge: true });
      alert(`Saved ${stalls.length} stall(s) for Event ${eventId}`);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* 2. MAP OVERLAY */}
      {isMapFullScreen && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 10000, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 20px", background: "#1f2937", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
             <span style={{ fontSize: 14, fontWeight: 700 }}>Select Location for Stall</span>
             <button onClick={() => setIsMapFullScreen(false)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 15px", borderRadius: 5, cursor: "pointer" }}>Close Map</button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <MapPicker 
                mode="draw_point" 
                onLocationSelect={handleMapSelect} 
                boundary={eventAreaBoundary} 
            />
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🎪 Stall Marker Admin</h1>
          <p style={styles.subtitle}>
            Managing Event: <span style={{ color: "#3b82f6", fontWeight: 800 }}>{eventId || "None Selected"}</span>
          </p>
        </div>
      </header>

      {!eventId ? (
        <div style={styles.emptyCard}>⚠️ Please select an Event ID from the sidebar to manage stalls.</div>
      ) : loading ? (
        <div style={styles.emptyCard}>Loading stalls for {eventId}...</div>
      ) : (
        <>
          {stalls.length === 0 && (
            <div style={styles.emptyCard}>No stalls yet. Click "+ Add Stall" to begin.</div>
          )}

          {stalls.map((stall, idx) => (
            <div key={stall.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Stall #{idx + 1}</span>
                <button onClick={() => removeStall(stall.id)} style={styles.removeBtn}>
                  ✕ Remove
                </button>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Event Area Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Food Court"
                  value={stall.eventarea}
                  onChange={(e) => updateStall(stall.id, "eventarea", e.target.value)}
                />
              </div>

              {/* 3. COORDINATE INPUTS WITH MAP PICKER TRIGGER */}
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>📍 Coordinates</label>
                  <button 
                    onClick={() => openMapForStall(stall.id)}
                    style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                  >
                    🎯 Pick on Map
                  </button>
                </div>
                <div style={styles.grid2}>
                  <div style={styles.formGroup}>
                    <label style={{...styles.label, fontSize: '11px'}}>Longitude</label>
                    <input
                      type="number" step="any" style={{...styles.input, marginBottom: 0}}
                      value={stall.lng}
                      onChange={(e) => updateStall(stall.id, "lng", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{...styles.label, fontSize: '11px'}}>Latitude</label>
                    <input
                      type="number" step="any" style={{...styles.input, marginBottom: 0}}
                      value={stall.lat}
                      onChange={(e) => updateStall(stall.id, "lat", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Visibility</label>
                <select
                  style={styles.input}
                  value={stall.status}
                  onChange={(e) => updateStall(stall.id, "status", e.target.value as any)}
                >
                  <option value="active">🟢 Active (Visible)</option>
                  <option value="inactive">🔴 Inactive (Hidden)</option>
                </select>
              </div>
            </div>
          ))}

          <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={addStall} style={styles.addBtn}>+ Add Stall</button>
            <button onClick={handleSave} disabled={saving} style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Syncing..." : `PUSH ${stalls.length} STALL(S) TO LIVE MAP`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f4f6f9", padding: "32px 24px", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 14, color: "#888" },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: 500, margin: "0 auto 16px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontWeight: 700, fontSize: 15 },
  removeBtn: { background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 },
  emptyCard: { textAlign: "center", padding: 40, background: "#fff", borderRadius: 12, color: "#666", maxWidth: 500, margin: "0 auto" },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#444" },
  input: { padding: "10px", borderRadius: 6, border: "1px solid #ddd", width: "100%", marginBottom: 15, boxSizing: "border-box" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 },
  addBtn: { flex: 1, background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 8, padding: "12px", cursor: "pointer", fontWeight: 600 },
  saveBtn: { flex: 2, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontWeight: 600 },
  formGroup: { marginBottom: 10 },
};