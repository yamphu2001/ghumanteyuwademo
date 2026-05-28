
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker";

interface ItemData {
  id: string;
  eventId: string;
  name: string;
  lat: number;
  lng: number;
  image: string;
  popupImage: string;
  popupText: string;
  qrCodeId: string;
  points: number;
}

const COLLECTION_NAME = "qrcodemarkers";

const EMPTY_FORM = (eventId: string): ItemData => ({
  id: "",
  eventId,
  name: "",
  lat: 0,
  lng: 0,
  image: "",
  popupImage: "",
  popupText: "",
  qrCodeId: "",
  points: 0,
});

// ── QR Code helpers ───────────────────────────────────────────────────────────
const getQRUrl = (qrCodeId: string, size = 250) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrCodeId)}&margin=10`;

const downloadQR = async (qrCodeId: string, name: string) => {
  const url = getQRUrl(qrCodeId, 500);
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name || qrCodeId}_qr.png`;
  a.click();
  URL.revokeObjectURL(a.href);
};

export default function AdminQRcodeMarkerPage() {
  const { eventId } = useEventId();

  const [items, setItems] = useState<ItemData[]>([]);
  const [form, setForm] = useState<ItemData>(EMPTY_FORM(""));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  // ── NEW: QR modal state ───────────────────────────────────────────────────
  const [qrModal, setQrModal] = useState<{ name: string; qrCodeId: string } | null>(null);

  const isEditMode = form.id !== "";

  const set = (field: keyof ItemData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
      console.error(e);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setItems([]); return; }

    setForm((prev) => ({ ...prev, eventId }));
    fetchEventBoundary();
    setLoading(true);

    const unsub = onSnapshot(
      collection(db, "events", eventId, COLLECTION_NAME),
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ItemData)));
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );

    return () => unsub();
  }, [eventId, fetchEventBoundary]);

  const handleMapSelect = (data: any) => {
    if (data.geometry?.coordinates) {
      setForm((prev) => ({
        ...prev,
        lng: data.geometry.coordinates[0],
        lat: data.geometry.coordinates[1],
      }));
      setIsMapFullScreen(false);
    }
  };

  const handleSave = async () => {
    if (!eventId || !form.name) return alert("Name is required");
    if (!form.lat || !form.lng) return alert("Please pick a location on the map");
    setSaving(true);
    try {
      const { id, ...rest } = form;
      const payload = { ...rest, updatedAt: serverTimestamp() };

      if (isEditMode) {
        await setDoc(doc(db, "events", eventId, COLLECTION_NAME, id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "events", eventId, COLLECTION_NAME), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      alert("Saved successfully!");
      setForm(EMPTY_FORM(eventId));
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ItemData) => setForm(item);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this QR marker?")) return;
    await deleteDoc(doc(db, "events", eventId!, COLLECTION_NAME, id));
  };

  if (!eventId) return <div style={ui.wrapper}>Please select an event.</div>;

  return (
    <div style={ui.wrapper}>
      <header style={ui.header}>
        <h1 style={ui.title}>QR Code Markers</h1>
      </header>

      <main style={ui.mainGrid}>
        {/* ── Form ── */}
        <section style={ui.card}>
          <h2 style={ui.cardTitle}>{isEditMode ? "Edit Marker" : "Add New Marker"}</h2>

          <Field label="Name *">
            <input style={ui.input} value={form.name} onChange={set("name")} placeholder="e.g. Checkpoint A" />
          </Field>

          <Field label="QR Code ID *">
            <input style={ui.input} value={form.qrCodeId} onChange={set("qrCodeId")} placeholder="e.g. QR_001" />
          </Field>

          {/* ── NEW: live QR preview inside form when qrCodeId is typed ── */}
          {form.qrCodeId.trim() && (
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <p style={{ fontSize: "0.75rem", color: "#888", marginBottom: 6 }}>QR Preview</p>
              <img
                src={getQRUrl(form.qrCodeId, 120)}
                alt="QR preview"
                style={{ border: "1px solid #e2e8f0", borderRadius: 6 }}
              />
            </div>
          )}

          <Field label="Points">
            <input
              type="number"
              style={ui.input}
              value={form.points}
              onChange={(e) => setForm((p) => ({ ...p, points: Number(e.target.value) }))}
            />
          </Field>

          <Field label="Marker Icon URL">
            <input style={ui.input} value={form.image} onChange={set("image")} placeholder="https://..." />
          </Field>

          <Field label="Popup Image URL">
            <input style={ui.input} value={form.popupImage} onChange={set("popupImage")} placeholder="https://..." />
          </Field>

          <Field label="Popup Text">
            <textarea style={{ ...ui.input, height: 72 }} value={form.popupText} onChange={set("popupText")} />
          </Field>

          <div style={ui.coordBox}>
            <button onClick={() => setIsMapFullScreen(true)} style={ui.fullScreenBtn}>
              📍 Pick Location on Map
            </button>
            <div style={ui.formGrid}>
              <input type="number" style={ui.input} value={form.lat} readOnly placeholder="Lat" />
              <input type="number" style={ui.input} value={form.lng} readOnly placeholder="Lng" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={ui.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update Marker" : "Add Marker"}
            </button>
            {isEditMode && (
              <button style={ui.btnSecondary} onClick={() => setForm(EMPTY_FORM(eventId))}>
                Cancel
              </button>
            )}
          </div>
        </section>

        {/* ── List ── */}
        <section style={ui.card}>
          <h2 style={ui.cardTitle}>
            Existing Markers ({loading ? "…" : items.length})
          </h2>
          {items.map((item) => (
            <div key={item.id} style={ui.listItem}>
              <div>
                <strong>{item.name}</strong>
                <div style={ui.listMeta}>
                  QR: {item.qrCodeId || "—"} · {item.points} pts · ({item.lat.toFixed(4)}, {item.lng.toFixed(4)})
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {/* ── NEW: QR button — only shows when qrCodeId exists ── */}
                {item.qrCodeId && (
                  <button
                    style={ui.btnQR}
                    onClick={() => setQrModal({ name: item.name, qrCodeId: item.qrCodeId })}
                  >
                    QR
                  </button>
                )}
                <button style={ui.btnEdit} onClick={() => handleEdit(item)}>Edit</button>
                <button style={ui.btnDanger} onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <p style={{ color: "#999", fontSize: "0.85rem" }}>No markers yet.</p>
          )}
        </section>
      </main>

      {/* ── Full-screen map picker ── */}
      {isMapFullScreen && (
        <div style={ui.fullScreenOverlay}>
          <button onClick={() => setIsMapFullScreen(false)} style={ui.closeFullBtn}>
            ✕ Close
          </button>
          <MapPicker
            mode="draw_point"
            onLocationSelect={handleMapSelect}
            boundary={eventAreaBoundary}
          />
        </div>
      )}

      {/* ── NEW: QR Code Modal ── */}
      {qrModal && (
        <div
          style={ui.qrOverlay}
          onClick={() => setQrModal(null)} // click outside to close
        >
          <div style={ui.qrBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>{qrModal.name}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>ID: {qrModal.qrCodeId}</p>
              </div>
              <button
                onClick={() => setQrModal(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#555" }}
              >
                ✕
              </button>
            </div>

            <img
              src={getQRUrl(qrModal.qrCodeId, 250)}
              alt={`QR code for ${qrModal.qrCodeId}`}
              style={{ display: "block", margin: "0 auto", borderRadius: 8, border: "1px solid #e2e8f0" }}
            />

            <button
              onClick={() => downloadQR(qrModal.qrCodeId, qrModal.name)}
              style={{ ...ui.btnPrimary, marginTop: 16, width: "100%", textAlign: "center" }}
            >
              ⬇ Download QR Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={ui.label}>{label}</label>
      {children}
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  wrapper: { backgroundColor: "#f4f7f9", minHeight: "100vh", padding: "20px", fontFamily: "system-ui" },
  header: { maxWidth: "1200px", margin: "0 auto 30px auto" },
  title: { color: "#1a202c" },
  mainGrid: { maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" },
  card: { background: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" },
  cardTitle: { marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: 8 },
  label: { display: "block", fontSize: "0.8rem", fontWeight: "bold", marginBottom: 5, color: "#555" },
  input: { width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" },
  coordBox: { padding: "12px", background: "#f8f9fa", borderRadius: "8px", marginBottom: "15px" },
  fullScreenBtn: { background: "#4299e1", color: "white", padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer" },
  btnPrimary: { flex: 1, background: "#48bb78", color: "white", padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer" },
  btnSecondary: { background: "#e2e8f0", color: "#333", padding: "10px 16px", borderRadius: "6px", border: "none", cursor: "pointer" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" },
  listMeta: { fontSize: "0.78rem", color: "#888", marginTop: 2 },
  btnEdit: { background: "#bee3f8", color: "#2b6cb0", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer" },
  btnDanger: { background: "#feb2b2", color: "red", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer" },
  // ── NEW styles ──
  btnQR: { background: "#fef9c3", color: "#854d0e", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 600 },
  qrOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" },
  qrBox: { background: "#fff", borderRadius: 12, padding: 24, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  fullScreenOverlay: { position: "fixed", inset: 0, background: "white", zIndex: 2000 },
  closeFullBtn: { position: "absolute", top: 10, right: 10, zIndex: 2001, padding: "10px 16px", background: "#333", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
};