
"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

import MapPicker from "@/app/eventadmin/MapPicker";

interface EventData {
  id: string;
  name: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  radius: number;
  status: "active" | "inactive";
}

const initialState: EventData = {
  id: "", name: "", description: "", image: "",
  lat: 0, lng: 0, radius: 1000, status: "inactive",
};

interface EventsAdminProps {
  onSelect: (id: string) => void;
}

export default function EventsAdmin({ onSelect }: EventsAdminProps) {
  const [events,        setEvents]        = useState<EventData[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [isEditing,     setIsEditing]     = useState(false);
  const [form,          setForm]          = useState(initialState);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showMap,       setShowMap]       = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "events"));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id:          d.id,
          name:        data.name        || "",
          description: data.description || "",
          image:       data.image       || "",
          lat:         data.lat         ?? 0,
          lng:         data.lng         ?? 0,
          radius:      data.radius      ?? 1000,
          status:      data.status      || "inactive",
        } as EventData;
      });
      setEvents(list);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id) return alert("ID is required");
    try {
      await setDoc(doc(db, "events", form.id.toLowerCase().trim()), {
        name:        form.name,
        description: form.description,
        image:       form.image,
        lat:         Number(form.lat),
        lng:         Number(form.lng),
        radius:      Number(form.radius),
        status:      form.status,
      });
      alert(isEditing ? "Event Updated!" : "Event Created!");
      resetForm();
      fetchEvents();
    } catch {
      alert("Error saving to Firestore");
    }
  };

  const resetForm = () => {
    setForm(initialState);
    setIsEditing(false);
    setIsFormVisible(false);
  };

  const loadEventForEdit = (event: EventData) => {
    setForm({ ...event });
    setIsEditing(true);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    } catch {
      alert("Delete failed");
    }
  };

  const handleMapPick = (data: any) => {
    const coords = data?.geometry?.coordinates;
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;
    setForm((prev) => ({ ...prev, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }));
    setShowMap(false);
  };

  return (
    <div className="admin-view-container" style={{ padding: "32px", maxWidth: 1100, margin: "0 auto", background: "#fff", fontFamily: "monospace", boxSizing: "border-box" }}>
      
      {/* ── Responsive CSS Engine Injection ── */}
      <style>{`
        @media (max-width: 767px) {
          .admin-view-container {
            padding: 16px 12px !important;
          }
          .header-flex-wrapper {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .header-flex-wrapper button {
            width: 100% !important;
            text-align: center;
          }
          .form-grid-2x, .form-grid-3x {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .form-actions-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .form-actions-bar label, 
          .form-actions-bar select, 
          .form-actions-bar button {
            width: 100% !important;
          }
          .table-scroll-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .table-scroll-container table {
            min-width: 650px !important;
          }
          .map-modal-topbar {
            flex-direction: column !important;
            gap: 10px !important;
            align-items: stretch !important;
          }
        }
      `}</style>

      {/* ── Fullscreen Map Modal ── */}
      {showMap && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column" }}>
          <div 
            className="map-modal-topbar"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", background: "#000", color: "#fff",
              fontFamily: "monospace", fontSize: 12, letterSpacing: 1,
              borderBottom: "2px solid #dc2626",
            }}
          >
            <span>📍 DROP A POINT TO SET EVENT COORDINATES — THEN CLICK CONFIRM</span>
            <button
              onClick={() => setShowMap(false)}
              style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}
            >
              ✕ CLOSE
            </button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <MapPicker
              mode="draw_point"
              onLocationSelect={(data) => {
                const coords = data?.geometry?.coordinates;
                if (coords && coords.length >= 2) {
                  const [lng, lat] = coords;
                  setForm((prev) => ({ ...prev, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }));
                }
              }}
            />
            <button
              onClick={() => setShowMap(false)}
              style={{
                position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
                background: "#16a34a", color: "#fff", border: "none",
                padding: "14px 40px", fontFamily: "monospace", fontWeight: 700,
                fontSize: 14, cursor: "pointer", letterSpacing: 1,
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 10,
                width: "90%", maxWidth: "400px", textAlign: "center"
              }}
            >
              ✓ CONFIRM — {form.lat}, {form.lng}
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="header-flex-wrapper" style={{ marginBottom: 28, borderBottom: "3px solid #000", paddingBottom: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>FOREVENT</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#000", letterSpacing: 1 }}>EVENTS</h1>
        </div>
        {!isFormVisible && (
          <button
            onClick={() => setIsFormVisible(true)}
            style={{
              background: "#dc2626", color: "#fff", border: "none",
              padding: "10px 20px", cursor: "pointer",
              fontFamily: "monospace", fontWeight: 700, fontSize: 12,
              letterSpacing: 1,
            }}
          >
            + CREATE EVENT
          </button>
        )}
      </div>

      {/* ── Form ── */}
      {(isFormVisible || isEditing) && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 8 }}>
            {isEditing ? "● EDITING EVENT" : "● NEW EVENT"}
          </div>
          <form
            onSubmit={handleSubmit}
            style={{ border: "2px solid #000", padding: 24, background: "#fff", display: "grid", gap: 16 }}
          >
            <div className="form-grid-2x" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label style={labelStyle}>
                <span style={labelText}>URL ID (Slug)</span>
                <input
                  disabled={isEditing}
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  style={{ ...inputStyle, opacity: isEditing ? 0.5 : 1 }}
                />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Display Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </label>
            </div>

            <label style={labelStyle}>
              <span style={labelText}>Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 72, resize: "vertical" }} />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Image URL</span>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={inputStyle} />
              {form.image && (
                <img src={form.image} alt="preview" onError={(e) => (e.currentTarget.style.display = "none")}
                  style={{ marginTop: 8, width: "100%", maxHeight: 150, objectFit: "cover", border: "2px solid #000" }} />
              )}
            </label>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ ...labelText }}>Coordinates</span>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  style={{ background: "#000", color: "#fff", border: "none", padding: "7px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}
                >
                  📍 PICK FROM MAP
                </button>
              </div>
              <div className="form-grid-3x" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <label style={labelStyle}>
                  <span style={labelText}>Latitude</span>
                  <input type="number" step="any" value={form.lat ?? 0} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  <span style={labelText}>Longitude</span>
                  <input type="number" step="any" value={form.lng ?? 0} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  <span style={labelText}>Radius (m)</span>
                  <input type="number" value={form.radius ?? 0} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} />
                </label>
              </div>
            </div>

            <div className="form-actions-bar" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 0 }}>
                <span style={labelText}>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  style={{ ...inputStyle, width: "auto", display: "inline-block" }}
                >
                  <option value="inactive">INACTIVE</option>
                  <option value="active">ACTIVE</option>
                </select>
              </label>

              <button
                type="submit"
                style={{ flex: 1, background: "#dc2626", color: "#fff", padding: "11px 20px", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "monospace", fontSize: 12, letterSpacing: 1, minWidth: 140 }}
              >
                {isEditing ? "UPDATE EVENT" : "SAVE EVENT"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                style={{ color: "black", padding: "11px 20px", background: "#fff", border: "2px solid #000", cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Events Table ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, fontFamily: "monospace", fontSize: 12, color: "#999", letterSpacing: 2 }}>
          LOADING EVENTS...
        </div>
      ) : (
        <div className="table-scroll-container" style={{ border: "2px solid #000", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#000", color: "#fff" }}>
                {["ID / URL", "NAME", "RADIUS", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#999", fontFamily: "monospace", fontSize: 12 }}>
                    No events yet. Create one above.
                  </td>
                </tr>
              )}
              {events.map((ev, i) => (
                <tr
                  key={ev.id}
                  style={{
                    borderBottom: "1.5px solid #e5e5e5",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                    opacity: ev.status === "inactive" ? 0.55 : 1,
                  }}
                >
                  <td style={tdStyle}>
                    <code style={{ fontSize: 11, background: "#f5f5f5", padding: "2px 6px", border: "1px solid #e5e5e5" }}>
                      {ev.id}
                    </code>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{ev.name}</td>
                  <td style={tdStyle}>{ev.radius}m</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 1,
                      color: ev.status === "active" ? "#dc2626" : "#999",
                      background: ev.status === "active" ? "#fef2f2" : "#f5f5f5",
                      padding: "2px 8px", border: `1px solid ${ev.status === "active" ? "#dc2626" : "#ddd"}`,
                    }}>
                      {ev.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => loadEventForEdit(ev)}
                      style={actionBtn}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      style={{ ...actionBtn, color: "#dc2626", borderColor: "#dc2626" }}
                    >
                      DEL
                    </button>
                    <button
                      disabled={ev.status === "inactive"}
                      onClick={() => onSelect(ev.id)}
                      style={{
                        ...actionBtn,
                        background: ev.status === "active" ? "#dc2626" : "#e5e5e5",
                        color: ev.status === "active" ? "#fff" : "#999",
                        borderColor: ev.status === "active" ? "#dc2626" : "#e5e5e5",
                        cursor: ev.status === "inactive" ? "not-allowed" : "pointer",
                        fontWeight: 700,
                      }}
                    >
                      MANAGE →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelText: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: "#666",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  border: "1.5px solid #000",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "monospace",
  fontSize: 13,
  background: "#fff",
  color: "#000",
  outline: "none",
  display: "block",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  verticalAlign: "middle",
  fontFamily: "monospace",
  fontSize: 12,
  color: "#000",
};

const actionBtn: React.CSSProperties = {
  padding: "5px 10px",
  cursor: "pointer",
  background: "#fff",
  border: "1.5px solid #000",
  fontFamily: "monospace",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.5,
  color: "#000",
};