
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc, onSnapshot, getDoc,
  collection, getDocs,
  writeBatch, deleteField, deleteDoc,
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

  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  const fetchEventBoundary = useCallback(async () => {
    if (!eventId) return;
    try {
      const snap = await getDoc(doc(db, "events", eventId, "boundary", "data"));
      if (snap.exists()) {
        const rawCoords = snap.data().boundaryCoords;
        if (Array.isArray(rawCoords) && rawCoords.length > 0) {
          const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
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
    if (!eventId) { setGhumanteStalls([]); return; }
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
    }, (err) => { console.error(err); setLoading(false); });

    return () => unsub();
  }, [eventId, fetchEventBoundary]);

  const updateGhumanteStall = (id: string, field: keyof GhumanteStallConfig, value: any) =>
    setGhumanteStalls((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const addGhumanteStall = () => setGhumanteStalls((prev) => [...prev, emptyGhumanteStall()]);

  const removeGhumanteStall = async (id: string) => {
    setGhumanteStalls((prev) => prev.filter((s) => s.id !== id));
    if (!eventId) return;
    try {
      await deleteDoc(doc(db, "events", eventId, "ghumantestall", id));
    } catch (e: any) {
      alert("Failed to remove stall from database: " + e.message);
    }
  };

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

  const handleSave = async () => {
    if (!eventId) return alert("Please select an Event from the sidebar first!");
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const subCollectionRef = collection(db, "events", eventId, "ghumantestall");
      const currentSnapshot = await getDocs(subCollectionRef);
      const localIds = new Set(ghumanteStalls.map((s) => s.id));

      currentSnapshot.forEach((docSnap) => {
        if (!localIds.has(docSnap.id)) batch.delete(docSnap.ref);
      });

      ghumanteStalls.forEach((stall) => {
        const docRef = doc(db, "events", eventId, "ghumantestall", stall.id);
        batch.set(docRef, {
          lng: stall.lng,
          lat: stall.lat,
          eventarea: stall.eventarea,
          status: stall.status,
        }, { merge: true });
      });

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
    <div style={{ background: "#fff", minHeight: "100vh", padding: 28, fontFamily: "monospace" }}>

      {/* ── Full-screen Map ── */}
      {isMapFullScreen && (
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 10000, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: "12px 20px", background: "#000", color: "#fff",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: "2px solid #dc2626", fontFamily: "monospace", fontSize: 11, letterSpacing: 1,
          }}>
            <span>📍 SELECT LOCATION FOR GHUMANTE STALL</span>
            <button
              onClick={() => setIsMapFullScreen(false)}
              style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}
            >
              ✕ CLOSE
            </button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <MapPicker mode="draw_point" onLocationSelect={handleMapSelect} boundary={eventAreaBoundary} />
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ borderBottom: "3px solid #000", paddingBottom: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>FOREVENT</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#000", letterSpacing: 1 }}>GHUMANTE STALL</h1>
        <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
          EVENT: <span style={{ color: "#dc2626", fontWeight: 700 }}>{eventId || "NONE SELECTED"}</span>
        </div>
      </div>

      {!eventId ? (
        <div style={{ padding: 40, border: "1.5px solid #e5e5e5", fontFamily: "monospace", fontSize: 12, color: "#999", textAlign: "center" }}>
          ⚠ Please select an Event ID from the sidebar to manage stalls.
        </div>
      ) : loading ? (
        <div style={{ padding: 40, fontFamily: "monospace", fontSize: 12, color: "#999", letterSpacing: 2, textAlign: "center" }}>
          LOADING STALLS FOR {eventId}...
        </div>
      ) : (
        <>
          {ghumanteStalls.length === 0 && (
            <div style={{ padding: 40, border: "1.5px solid #e5e5e5", fontFamily: "monospace", fontSize: 12, color: "#999", textAlign: "center", marginBottom: 16 }}>
              No stalls yet. Click "+ ADD STALL" to begin.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
            {ghumanteStalls.map((stall, idx) => (
              <div key={stall.id} style={{ border: "2px solid #000", padding: 20, background: "#fff" }}>

                {/* Card header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1.5px solid #e5e5e5", paddingBottom: 12 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700 }}>
                    ● STALL #{idx + 1}
                  </div>
                  <button
                    onClick={() => removeGhumanteStall(stall.id)}
                    style={{ background: "#fff", color: "#dc2626", border: "1.5px solid #dc2626", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}
                  >
                    ✕ REMOVE
                  </button>
                </div>

                {/* Event Area Name */}
                <Field label="Event Area Name">
                  <input
                    style={ui.input}
                    placeholder="e.g. Food Court"
                    value={stall.eventarea}
                    onChange={(e) => updateGhumanteStall(stall.id, "eventarea", e.target.value)}
                  />
                </Field>

                {/* Coordinates */}
                <div style={{ background: "#fafafa", border: "1.5px solid #e5e5e5", padding: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 9, letterSpacing: 1.5, color: "#666", fontWeight: 700 }}>COORDINATES</span>
                    <button
                      onClick={() => openMapForGhumanteStall(stall.id)}
                      style={{ background: "#000", color: "#fff", border: "none", padding: "5px 12px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 10, letterSpacing: 1 }}
                    >
                      📍 PICK ON MAP
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Longitude">
                      <input type="number" step="any" style={ui.input} value={stall.lng}
                        onChange={(e) => updateGhumanteStall(stall.id, "lng", parseFloat(e.target.value) || 0)} />
                    </Field>
                    <Field label="Latitude">
                      <input type="number" step="any" style={ui.input} value={stall.lat}
                        onChange={(e) => updateGhumanteStall(stall.id, "lat", parseFloat(e.target.value) || 0)} />
                    </Field>
                  </div>
                </div>

                {/* Status */}
                <Field label="Visibility">
                  <select
                    style={ui.input}
                    value={stall.status}
                    onChange={(e) => updateGhumanteStall(stall.id, "status", e.target.value as "active" | "inactive")}
                  >
                    <option value="active">🟢 Active (Visible)</option>
                    <option value="inactive">🔴 Inactive (Hidden)</option>
                  </select>
                </Field>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ maxWidth: 520, display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={addGhumanteStall}
              style={{ flex: 1, background: "#fff", color: "#000", border: "1.5px solid #000", padding: "12px 0", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}
            >
              + ADD STALL
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 2, background: saving ? "#e5e5e5" : "#dc2626", color: saving ? "#999" : "#fff", border: "none", padding: "12px 0", cursor: saving ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}
            >
              {saving ? "SYNCING..." : `PUSH ${ghumanteStalls.length} STALL(S) TO LIVE MAP`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 5, fontFamily: "monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  input: {
    padding: "9px 12px",
    border: "1.5px solid #000",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "monospace",
    fontSize: 12,
    background: "#fff",
    color: "#000",
    outline: "none",
    display: "block",
  },
};