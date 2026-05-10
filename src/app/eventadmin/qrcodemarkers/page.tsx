"use client";

import React, { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker"; // Import MapPicker

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarkerData {
  id: string;
  eventId: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  image: string;
  popupImage: string;
  popupText: string;
  qrCodeId: string;
  points: number;
}

const EMPTY_FORM = (eventId: string): MarkerData => ({
  id: "",
  eventId,
  name: "",
  lat: 0,
  lng: 0,
  type: "qr_marker",
  image: "",
  popupImage: "",
  popupText: "",
  qrCodeId: "",
  points: 0,
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminQRMarkersPage() {
  const { eventId } = useEventId();
  
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [form, setForm] = useState<MarkerData>(EMPTY_FORM(""));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrModal, setQrModal] = useState<MarkerData | null>(null);

  // ── Full Screen Map State ──
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  const isEditMode = form.id !== "";

  useEffect(() => {
    if (eventId) {
      setForm(prev => ({ ...prev, eventId }));
    }
  }, [eventId]);

  // ── QR Generation ──────────────────────────────────────────────────────────

  const generateQRLink = (id: string, name: string) => {
    if (!id && !name) return "";
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `ID:${id || "?"}//https://www.ghumanteyuwa.com/${slug || "pending"}`;
  };

  const handleNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      qrCodeId: generateQRLink(prev.id, val),
    }));
  };

  // ── Database Operations ────────────────────────────────────────────────────

  const fetchMarkers = async () => {
    if (!eventId) return setMarkers([]);
    setLoading(true);
    try {
      const snap = await getDocs(
        collection(db, "events", eventId, "qrcodemarkers")
      );
      setMarkers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarkerData)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Event Boundary for MapPicker
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
    fetchMarkers(); 
    fetchEventBoundary();
  }, [eventId, fetchEventBoundary]);

  // Handle Location Selection from Map
  const handleMapSelect = (data: any) => {
    if (data.geometry?.coordinates) {
      setForm(prev => ({
        ...prev,
        lng: data.geometry.coordinates[0],
        lat: data.geometry.coordinates[1]
      }));
      setIsMapFullScreen(false);
    }
  };

  const handleSave = async () => {
    if (!eventId || !form.name) return alert("Missing required fields");
    setSaving(true);

    try {
      const payload = {
        eventId: eventId,
        name: form.name,
        lat: Number(form.lat),
        lng: Number(form.lng),
        type: form.type,
        image: form.image,
        popupImage: form.popupImage,
        popupText: form.popupText,
        qrCodeId: form.qrCodeId,
        points: Number(form.points || 0),
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        await setDoc(
          doc(db, "events", eventId, "qrcodemarkers", form.id),
          payload,
          { merge: true }
        );
        alert("Marker updated!");
      } else {
        const newRef = await addDoc(
          collection(db, "events", eventId, "qrcodemarkers"),
          { ...payload, createdAt: serverTimestamp() }
        );

        const finalQRId = generateQRLink(newRef.id, form.name);
        await setDoc(
          doc(db, "events", eventId, "qrcodemarkers", newRef.id),
          { qrCodeId: finalQRId },
          { merge: true }
        );

        alert("Marker created!");
      }

      setForm(EMPTY_FORM(eventId));
      fetchMarkers();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (marker: MarkerData) => {
    setForm(marker);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm(EMPTY_FORM(eventId || ""));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this marker?")) return;
    if (!eventId) return;
    await deleteDoc(doc(db, "events", eventId, "qrcodemarkers", id));
    fetchMarkers();
  };

  if (!eventId) {
    return (
      <div style={ui.wrapper}>
        <header style={ui.header}>
          <h1 style={ui.title}>QR Marker Management</h1>
        </header>
        <div style={ui.card}>Please select an event to manage markers.</div>
      </div>
    );
  }

  return (
    <div style={ui.wrapper}>
      <header style={ui.header}>
        <h1 style={ui.title}>QR Marker Management</h1>
      </header>

      <main style={ui.mainGrid}>
        <section style={ui.card}>
          <h2 style={ui.cardTitle}>
            {isEditMode ? `Editing: ${form.name}` : "Create New Marker"}
          </h2>

          {isEditMode && (
            <div style={ui.inputGroup}>
              <label style={ui.label}>Document ID (Read-only)</label>
              <input style={{ ...ui.input, background: "#edf2f7", color: "#718096" }} value={form.id} readOnly />
            </div>
          )}

          <div style={ui.formGrid}>
            <div style={ui.inputGroup}>
              <label style={ui.label}>Location Name</label>
              <input
                style={ui.input}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Central Museum"
              />
            </div>
            <div style={ui.inputGroup}>
              <label style={ui.label}>Type</label>
              <input
                style={ui.input}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
          </div>

          {/* --- COORDINATES SECTION --- */}
          <div style={ui.coordBox}>
            <div style={ui.coordHeader}>
              <label style={ui.label}>📍 Coordinates</label>
              <button 
                type="button" 
                onClick={() => setIsMapFullScreen(true)} 
                style={ui.fullScreenBtn}
              >
                🎯 Pick on Map
              </button>
            </div>
            <div style={ui.formGrid}>
              <div style={ui.inputGroup}>
                <label style={ui.label}>Latitude</label>
                <input
                  style={ui.input}
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div style={ui.inputGroup}>
                <label style={ui.label}>Longitude</label>
                <input
                  style={ui.input}
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div style={ui.inputGroup}>
            <label style={ui.label}>Reward Points</label>
            <input
              style={ui.input}
              type="number"
              placeholder="e.g. 50"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div style={ui.inputGroup}>
            <label style={ui.label}>Marker Image URL</label>
            <input
              style={ui.input}
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div style={ui.inputGroup}>
            <label style={ui.label}>Popup Image URL</label>
            <input
              style={ui.input}
              value={form.popupImage}
              onChange={(e) => setForm({ ...form, popupImage: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div style={ui.inputGroup}>
            <label style={ui.label}>Popup Description</label>
            <textarea
              style={{ ...ui.input, height: 80 }}
              value={form.popupText}
              onChange={(e) => setForm({ ...form, popupText: e.target.value })}
            />
          </div>

          <div style={ui.qrPreview}>
            <span style={ui.qrLabel}>
              {isEditMode ? "Current QR Data:" : "QR Preview:"}
            </span>
            <code style={ui.qrCode}>{form.qrCodeId || "Waiting for input..."}</code>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={saving ? ui.btnDisabled : ui.btnPrimary}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Processing..." : isEditMode ? "Update Marker" : "Create Marker"}
            </button>
            {isEditMode && (
              <button style={ui.btnSecondary} onClick={handleCancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
        </section>

        <section style={ui.card}>
          <h2 style={ui.cardTitle}>Existing Markers ({markers.length})</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div style={ui.list}>
              {markers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    ...ui.listItem,
                    border: form.id === m.id ? "2px solid #4299e1" : "1px solid #edf2f7",
                  }}
                >
                  <div>
                    <div style={ui.itemBold}>{m.name}</div>
                    <div style={ui.itemSmall}>ID: {m.id} | Points: {m.points || 0}</div>
                  </div>
                  <div style={ui.actions}>
                    <button style={ui.btnIcon} onClick={() => handleEdit(m)}>✏️</button>
                    <button style={ui.btnIcon} onClick={() => setQrModal(m)}>📷</button>
                    <button style={ui.btnDanger} onClick={() => handleDelete(m.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* --- FULL SCREEN MAP OVERLAY --- */}
      {isMapFullScreen && (
        <div style={ui.fullScreenOverlay}>
          <div style={ui.fullScreenHeader}>
             <div style={{color: 'white', fontWeight: 700}}>Select Location for "{form.name || 'New Marker'}"</div>
             <button onClick={() => setIsMapFullScreen(false)} style={ui.closeFullBtn}>Close Map</button>
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

      {qrModal && (
        <div style={ui.modalOverlay} onClick={() => setQrModal(null)}>
          <div style={ui.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 15 }}>{qrModal.name}</h3>
            <div style={ui.qrCenter}>
              <QRCodeSVG value={qrModal.qrCodeId} size={250} level="H" includeMargin />
            </div>
            <div style={ui.modalFooter}>
              <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{qrModal.qrCodeId}</code>
              <button style={ui.btnSecondary} onClick={() => window.print()}>Print QR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  wrapper: { backgroundColor: "#f4f7f9", minHeight: "100vh", padding: "20px", fontFamily: "system-ui, sans-serif" },
  header: { maxWidth: "1200px", margin: "0 auto 30px auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" },
  title: { color: "#1a202c", margin: 0 },
  mainGrid: { maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "25px" },
  card: { background: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "15px" },
  cardTitle: { margin: "0 0 10px 0", fontSize: "1.2rem", color: "#2d3748", borderBottom: "2px solid #edf2f7", paddingBottom: "10px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "0.85rem", fontWeight: "bold", color: "#4a5568" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "1rem" },
  qrPreview: { background: "#edf2f7", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #4299e1" },
  qrLabel: { display: "block", fontSize: "0.75rem", color: "#718096", marginBottom: "5px" },
  qrCode: { wordBreak: "break-all", fontSize: "0.9rem", color: "#2b6cb0" },
  btnPrimary: { background: "#4299e1", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  btnDisabled: { background: "#a0aec0", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", cursor: "not-allowed" },
  btnSecondary: { background: "#2d3748", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", transition: "0.2s" },
  itemBold: { fontWeight: "bold", color: "#2d3748" },
  itemSmall: { fontSize: "0.8rem", color: "#a0aec0" },
  actions: { display: "flex", gap: "8px" },
  btnIcon: { background: "#f7fafc", border: "1px solid #e2e8f0", padding: "5px 10px", borderRadius: "6px", cursor: "pointer" },
  btnDanger: { background: "#fff5f5", border: "1px solid #feb2b2", color: "#c53030", padding: "5px 10px", borderRadius: "6px", cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: "40px", borderRadius: "15px", textAlign: "center", maxWidth: "400px", width: "90%" },
  qrCenter: { background: "#fff", padding: "20px", display: "inline-block", borderRadius: "10px", boxShadow: "0 0 20px rgba(0,0,0,0.1)" },
  modalFooter: { marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" },

  // --- NEW STYLES FOR MAP PICKER ---
  coordBox: { background: "#f7fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "10px" },
  coordHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  fullScreenBtn: { background: "#4299e1", color: "white", border: "none", borderRadius: "6px", padding: "8px 12px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" },
  fullScreenOverlay: { position: "fixed", inset: 0, background: "#000", zIndex: 2000, display: "flex", flexDirection: "column" },
  fullScreenHeader: { padding: "10px 20px", background: "#1a202c", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeFullBtn: { background: "#e53e3e", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }
};