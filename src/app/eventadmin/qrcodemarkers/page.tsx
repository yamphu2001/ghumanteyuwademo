
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

  const [scanRadius, setScanRadius] = useState<number>(10);
  const [savingConfig, setSavingConfig] = useState(false);

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

  // ── Fetch Global Event Config from configs/qrcode ─────────────────────────
  useEffect(() => {
    if (!eventId) return;
    const fetchConfig = async () => {
      try {
        const configSnap = await getDoc(doc(db, "events", eventId, "configs", "qrcode"));
        if (configSnap.exists() && configSnap.data().scanRadius !== undefined) {
          setScanRadius(Number(configSnap.data().scanRadius));
        }
      } catch (e) {
        console.error("Failed to fetch event configs:", e);
      }
    };
    fetchConfig();
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

  // ── Save Global Event Config to configs/qrcode ────────────────────────────
  const handleSaveConfig = async () => {
    if (!eventId) return;
    setSavingConfig(true);
    try {
      await setDoc(
        doc(db, "events", eventId, "configs", "qrcode"),
        { scanRadius: Number(scanRadius) },
        { merge: true }
      );
      alert("Global scan radius saved successfully!");
    } catch (error) {
      console.error("Failed to save scan radius:", error);
      alert("Failed to save global config.");
    } finally {
      setSavingConfig(false);
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

  if (!eventId) return (
    <div style={{ padding: 40, fontFamily: "monospace", color: "#999" }}>Please select an event.</div>
  );

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: 28, fontFamily: "monospace" }}>

      {/* ── Page Header ── */}
      <div style={{ borderBottom: "3px solid #000", paddingBottom: 16, marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>FOREVENT</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#000", letterSpacing: 1 }}>QR CODE MARKERS</h1>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#999", letterSpacing: 1 }}>
          {loading ? "LOADING..." : `${items.length} MARKER${items.length !== 1 ? "S" : ""}`}
        </div>
      </div>

      {/* ── Global Settings ── */}
      <div style={{ border: "2px solid #000", padding: 20, marginBottom: 28, background: "#fff" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 12 }}>
          ● GLOBAL SETTINGS — APPLIES TO ALL MARKERS
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Scan Radius Threshold (meters)">
              <input
                type="number"
                style={ui.input}
                value={scanRadius}
                onChange={(e) => setScanRadius(Number(e.target.value))}
                placeholder="e.g. 10"
              />
            </Field>
          </div>
          <div style={{ marginBottom: 14 }}>
            <button style={ui.btnPrimary} onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? "SAVING..." : "SAVE RADIUS"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── Form ── */}
        <div style={{ border: "2px solid #000", padding: 24, background: "#fff" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 16, borderBottom: "1.5px solid #000", paddingBottom: 10 }}>
            ● {isEditMode ? "EDITING MARKER" : "ADD NEW MARKER"}
          </div>

          <Field label="Name *">
            <input style={ui.input} value={form.name} onChange={set("name")} placeholder="e.g. Checkpoint A" />
          </Field>

          <Field label="QR Code ID *">
            <input style={ui.input} value={form.qrCodeId} onChange={set("qrCodeId")} placeholder="e.g. QR_001" />
          </Field>

          {form.qrCodeId.trim() && (
            <div style={{ textAlign: "center", marginBottom: 14, padding: "12px 0", borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#999", marginBottom: 8 }}>QR PREVIEW</div>
              <img
                src={getQRUrl(form.qrCodeId, 120)}
                alt="QR preview"
                style={{ border: "2px solid #000" }}
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
            <textarea style={{ ...ui.input, height: 72, resize: "vertical" }} value={form.popupText} onChange={set("popupText")} />
          </Field>

          {/* Coords */}
          <div style={{ background: "#fafafa", border: "1.5px solid #e5e5e5", padding: 14, marginBottom: 16 }}>
            <button
              onClick={() => setIsMapFullScreen(true)}
              style={{ background: "#000", color: "#fff", border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 11, letterSpacing: 1, marginBottom: 10, width: "100%" }}
            >
              📍 PICK LOCATION ON MAP
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input type="number" style={{ ...ui.input, background: "#f0f0f0", color: "#666" }} value={form.lat} readOnly placeholder="Lat" />
              <input type="number" style={{ ...ui.input, background: "#f0f0f0", color: "#666" }} value={form.lng} readOnly placeholder="Lng" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={ui.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "SAVING..." : isEditMode ? "UPDATE MARKER" : "ADD MARKER"}
            </button>
            {isEditMode && (
              <button style={ui.btnSecondary} onClick={() => setForm(EMPTY_FORM(eventId))}>
                CANCEL
              </button>
            )}
          </div>
        </div>

        {/* ── List ── */}
        <div style={{ border: "2px solid #000", padding: 24, background: "#fff" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 16, borderBottom: "1.5px solid #000", paddingBottom: 10 }}>
            ● EXISTING MARKERS ({loading ? "..." : items.length})
          </div>

          {!loading && items.length === 0 && (
            <p style={{ color: "#999", fontSize: 12, letterSpacing: 1 }}>NO MARKERS YET.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0",
                  borderBottom: i < items.length - 1 ? "1.5px solid #e5e5e5" : "none",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#000" }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 3, letterSpacing: 0.5 }}>
                    ID: {item.qrCodeId || "—"} &nbsp;·&nbsp;
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>{item.points} pts</span> &nbsp;·&nbsp;
                    ({item.lat.toFixed(4)}, {item.lng.toFixed(4)})
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {item.qrCodeId && (
                    <button
                      style={ui.btnQR}
                      onClick={() => setQrModal({ name: item.name, qrCodeId: item.qrCodeId })}
                    >
                      QR
                    </button>
                  )}
                  <button style={ui.btnEdit} onClick={() => handleEdit(item)}>EDIT</button>
                  <button style={ui.btnDanger} onClick={() => handleDelete(item.id)}>DEL</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full-screen map picker ── */}
      {isMapFullScreen && (
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 2000 }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 2001,
            background: "#000", color: "#fff", padding: "12px 20px",
            fontFamily: "monospace", fontSize: 11, letterSpacing: 1,
            borderBottom: "2px solid #dc2626",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>📍 DROP A POINT TO SET MARKER COORDINATES</span>
            <button
              onClick={() => setIsMapFullScreen(false)}
              style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}
            >
              ✕ CLOSE
            </button>
          </div>
          <div style={{ position: "absolute", inset: 0, paddingTop: 46 }}>
            <MapPicker
              mode="draw_point"
              onLocationSelect={handleMapSelect}
              boundary={eventAreaBoundary}
            />
          </div>
        </div>
      )}

      {/* ── QR Code Modal ── */}
      {qrModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setQrModal(null)}
        >
          <div
            style={{ background: "#fff", padding: 28, width: 320, border: "2px solid #000", boxShadow: "6px 6px 0px 0px #dc2626" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>QR CODE</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: "#000" }}>{qrModal.name}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>ID: {qrModal.qrCodeId}</div>
              </div>
              <button
                onClick={() => setQrModal(null)}
                style={{ background: "#fff", border: "1.5px solid #000", width: 30, height: 30, cursor: "pointer", fontFamily: "monospace", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <img
              src={getQRUrl(qrModal.qrCodeId, 250)}
              alt={`QR code for ${qrModal.qrCodeId}`}
              style={{ display: "block", margin: "0 auto", border: "2px solid #000", width: 250, height: 250 }}
            />

            <button
              onClick={() => downloadQR(qrModal.qrCodeId, qrModal.name)}
              style={{ ...ui.btnPrimary, marginTop: 16, width: "100%", textAlign: "center" }}
            >
              ⬇ DOWNLOAD QR IMAGE
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
      <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 5, fontFamily: "monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #000",
    boxSizing: "border-box",
    fontFamily: "monospace",
    fontSize: 12,
    background: "#fff",
    color: "#000",
    outline: "none",
    display: "block",
  },
  btnPrimary: {
    flex: 1,
    background: "#dc2626",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 1,
  },
  btnSecondary: {
    background: "#fff",
    color: "#000",
    padding: "10px 16px",
    border: "1.5px solid #000",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 1,
  },
  btnEdit: {
    background: "#fff",
    color: "#000",
    padding: "4px 10px",
    border: "1.5px solid #000",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  btnDanger: {
    background: "#fff",
    color: "#dc2626",
    padding: "4px 10px",
    border: "1.5px solid #dc2626",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  btnQR: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "4px 10px",
    border: "1.5px solid #dc2626",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 0.5,
  },
};