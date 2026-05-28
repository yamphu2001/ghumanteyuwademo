
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  deleteField,
  deleteDoc,
} from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker";

interface GhumanteStallConfig {
  id: string;
  lng: number;
  lat: number;
  eventarea: string;
  status: "active" | "inactive";
}

const emptyGhumanteStall = (): GhumanteStallConfig => ({
  id: crypto.randomUUID(),
  lng: 0,
  lat: 0,
  eventarea: "",
  status: "active",
});

export default function GhumanteStallAdmin() {
  const { eventId } = useEventId();

  const [ghumanteStalls, setGhumanteStalls] = useState<GhumanteStallConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Map Selection States ──
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  // ── Fetch Event Boundary — reads from the correct subcollection path ──
  const fetchEventBoundary = useCallback(async () => {
    if (!eventId) return;
    try {
      // ✅ Correct path — matches where EventAreaAdmin saves the boundary
      const snap = await getDoc(doc(db, "events", eventId, "boundary", "data"));
      if (snap.exists()) {
        const rawCoords = snap.data().boundaryCoords;
        if (Array.isArray(rawCoords) && rawCoords.length > 0) {
          const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
          // Close the ring if needed
          const first = formatted[0];
          const last = formatted[formatted.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) formatted.push(first);
          setEventAreaBoundary([formatted]);
        }
      }
    } catch (e) {
      console.error("Error fetching boundary:", e);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setGhumanteStalls([]);
      return;
    }
    setLoading(true);
    fetchEventBoundary();

    const subCollectionRef = collection(db, "events", eventId, "ghumantestall");

    const unsub = onSnapshot(subCollectionRef, (snapshot) => {
      const stallsList: GhumanteStallConfig[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        stallsList.push({
          id: docSnap.id,
          lng: data.lng ?? 0,
          lat: data.lat ?? 0,
          eventarea: data.eventarea ?? "",
          status: data.status ?? "active",
        });
      });

      setGhumanteStalls(stallsList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [eventId, fetchEventBoundary]);

  // ── Helpers ──
  const updateGhumanteStall = (id: string, field: keyof GhumanteStallConfig, value: any) =>
    setGhumanteStalls((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const addGhumanteStall = () => setGhumanteStalls((prev) => [...prev, emptyGhumanteStall()]);

  // ── Remove: deletes from local state AND Firestore immediately ──
  const removeGhumanteStall = async (id: string) => {
    // Remove from local UI instantly
    setGhumanteStalls((prev) => prev.filter((s) => s.id !== id));

    // Also delete from Firestore so the live map removes it too
    if (!eventId) return;
    try {
      await deleteDoc(doc(db, "events", eventId, "ghumantestall", id));
    } catch (e: any) {
      alert("Failed to remove stall from database: " + e.message);
    }
  };

  // ── Map Picker Logic ──
  const openMapForGhumanteStall = (id: string) => {
    setActivePickerId(id);
    setIsMapFullScreen(true);
  };

  const handleMapSelect = (data: any) => {
    if (data.geometry?.coordinates && activePickerId) {
      const [lng, lat] = data.geometry.coordinates;
      updateGhumanteStall(activePickerId, "lng", lng);
      updateGhumanteStall(activePickerId, "lat", lat);
      setIsMapFullScreen(false);
      setActivePickerId(null);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!eventId) return alert("Please select an Event from the sidebar first!");
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const subCollectionRef = collection(db, "events", eventId, "ghumantestall");

      const currentSnapshot = await getDocs(subCollectionRef);
      const localIds = new Set(ghumanteStalls.map((s) => s.id));

      // Delete stalls removed locally
      currentSnapshot.forEach((docSnap) => {
        if (!localIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      // Upsert all current stalls
      ghumanteStalls.forEach((stall) => {
        const docRef = doc(db, "events", eventId, "ghumantestall", stall.id);
        batch.set(docRef, {
          lng: stall.lng,
          lat: stall.lat,
          eventarea: stall.eventarea,
          status: stall.status,
        }, { merge: true });
      });

      // Clean up any legacy top-level stallMarkers field
      const parentDocRef = doc(db, "events", eventId);
      batch.update(parentDocRef, { stallMarkers: deleteField() });

      await batch.commit();
      alert(`Successfully synchronized ${ghumanteStalls.length} stall(s) inside "ghumantestall" subcollection.`);
    } catch (e: any) {
      alert("Error saving data: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* ── Full-screen Map Overlay ── */}
      {isMapFullScreen && (
        <div style={{
          position: "fixed", inset: 0, background: "#000",
          zIndex: 10000, display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "10px 20px", background: "#1f2937",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", color: "#fff",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              Select Location for Ghumante Stall
            </span>
            <button
              onClick={() => setIsMapFullScreen(false)}
              style={{
                background: "#ef4444", color: "#fff", border: "none",
                padding: "6px 15px", borderRadius: 5, cursor: "pointer",
              }}
            >
              Close Map
            </button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <MapPicker
              mode="draw_point"
              onLocationSelect={handleMapSelect}
              boundary={eventAreaBoundary}
            />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🎪 Ghumante Stall Admin</h1>
          <p style={styles.subtitle}>
            Managing Event:{" "}
            <span style={{ color: "#3b82f6", fontWeight: 800 }}>
              {eventId || "None Selected"}
            </span>
          </p>
        </div>
      </header>

      {/* ── Body ── */}
      {!eventId ? (
        <div style={styles.emptyCard}>
          ⚠️ Please select an Event ID from the sidebar to manage stalls.
        </div>
      ) : loading ? (
        <div style={styles.emptyCard}>Loading stalls for {eventId}...</div>
      ) : (
        <>
          {ghumanteStalls.length === 0 && (
            <div style={styles.emptyCard}>
              No stalls yet. Click "+ Add Stall" to begin.
            </div>
          )}

          {ghumanteStalls.map((ghumanteStall, idx) => (
            <div key={ghumanteStall.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Ghumante Stall #{idx + 1}</span>
                <button
                  onClick={() => removeGhumanteStall(ghumanteStall.id)}
                  style={styles.removeBtn}
                >
                  ✕ Remove
                </button>
              </div>

              {/* Event Area Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Area Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Food Court"
                  value={ghumanteStall.eventarea}
                  onChange={(e) =>
                    updateGhumanteStall(ghumanteStall.id, "eventarea", e.target.value)
                  }
                />
              </div>

              {/* Coordinates */}
              <div style={{
                background: "#f8fafc", padding: "12px", borderRadius: "8px",
                border: "1px solid #e2e8f0", marginBottom: "15px",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "8px",
                }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>
                    📍 Coordinates
                  </label>
                  <button
                    onClick={() => openMapForGhumanteStall(ghumanteStall.id)}
                    style={{
                      background: "#3b82f6", color: "#fff", border: "none",
                      padding: "4px 8px", borderRadius: "4px",
                      fontSize: "11px", cursor: "pointer",
                    }}
                  >
                    🎯 Pick on Map
                  </button>
                </div>
                <div style={styles.grid2}>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, fontSize: "11px" }}>Longitude</label>
                    <input
                      type="number" step="any"
                      style={{ ...styles.input, marginBottom: 0 }}
                      value={ghumanteStall.lng}
                      onChange={(e) =>
                        updateGhumanteStall(
                          ghumanteStall.id, "lng",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, fontSize: "11px" }}>Latitude</label>
                    <input
                      type="number" step="any"
                      style={{ ...styles.input, marginBottom: 0 }}
                      value={ghumanteStall.lat}
                      onChange={(e) =>
                        updateGhumanteStall(
                          ghumanteStall.id, "lat",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Visibility</label>
                <select
                  style={styles.input}
                  value={ghumanteStall.status}
                  onChange={(e) =>
                    updateGhumanteStall(
                      ghumanteStall.id, "status",
                      e.target.value as "active" | "inactive"
                    )
                  }
                >
                  <option value="active">🟢 Active (Visible)</option>
                  <option value="inactive">🔴 Inactive (Hidden)</option>
                </select>
              </div>
            </div>
          ))}

          <div style={{
            maxWidth: 500, margin: "0 auto",
            display: "flex", gap: 10, marginTop: 12,
          }}>
            <button onClick={addGhumanteStall} style={styles.addBtn}>
              + Add Stall
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
            >
              {saving
                ? "Syncing..."
                : `PUSH ${ghumanteStalls.length} STALL(S) TO LIVE MAP`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", background: "#f4f6f9",
    padding: "32px 24px", fontFamily: "sans-serif",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 28,
  },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 14, color: "#888" },
  card: {
    background: "#fff", borderRadius: 12, padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    maxWidth: 500, margin: "0 auto 16px",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  cardTitle: { fontWeight: 700, fontSize: 15 },
  removeBtn: {
    background: "#fee2e2", color: "#dc2626", border: "none",
    borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12,
  },
  emptyCard: {
    textAlign: "center", padding: 40, background: "#fff",
    borderRadius: 12, color: "#666", maxWidth: 500, margin: "0 auto",
  },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    marginBottom: 5, color: "#444",
  },
  input: {
    padding: "10px", borderRadius: 6, border: "1px solid #ddd",
    width: "100%", marginBottom: 15, boxSizing: "border-box",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 },
  addBtn: {
    flex: 1, background: "#f0fdf4", color: "#16a34a",
    border: "1px solid #86efac", borderRadius: 8,
    padding: "12px", cursor: "pointer", fontWeight: 600,
  },
  saveBtn: {
    flex: 2, background: "#3b82f6", color: "#fff", border: "none",
    borderRadius: 8, padding: "12px", cursor: "pointer", fontWeight: 600,
  },
  formGroup: { marginBottom: 10 },
};