
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
  const [events,     setEvents]     = useState<EventData[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form,       setForm]       = useState(initialState);
  
  // ✅ NEW: Toggle state to show/hide the form
  const [isFormVisible, setIsFormVisible] = useState(false);

  // ✅ Map modal state
  const [showMap, setShowMap] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "events"));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id:          d.id,
          name:        data.name       || "",
          description: data.description || "",
          image:       data.image      || "",
          lat:         data.lat        ?? 0,
          lng:         data.lng        ?? 0,
          radius:      data.radius     ?? 1000,
          status:      data.status     || "inactive",
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

  // ✅ Updated: Reset form and hide it
  const resetForm = () => { 
    setForm(initialState); 
    setIsEditing(false); 
    setIsFormVisible(false);
  };

  // ✅ Updated: Set form to visible when loading for edit
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
    <div style={{ padding: "40px", fontFamily: "monospace", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#ffffff", color: "#000000" }}>

      {/* ✅ Fullscreen map modal */}
      {showMap && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.85)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", background: "#111", color: "white",
            fontFamily: "monospace", fontSize: "14px",
          }}>
            <span>📍 Drop a point to set event coordinates — then click CONFIRM</span>
            <button
              onClick={() => setShowMap(false)}
              style={{ background: "#dc2626", color: "white", border: "none", padding: "6px 14px", cursor: "pointer", fontFamily: "monospace", fontWeight: "bold" }}
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
                  setForm((prev) => ({
                    ...prev,
                    lat: Number(lat.toFixed(6)),
                    lng: Number(lng.toFixed(6)),
                  }));
                }
              }}
            />
            <button
              onClick={() => setShowMap(false)}
              style={{
                position: "absolute", bottom: "24px", left: "50%",
                transform: "translateX(-50%)",
                background: "#16a34a", color: "white",
                border: "none", padding: "14px 40px",
                fontFamily: "monospace", fontWeight: "bold",
                fontSize: "15px", cursor: "pointer",
                borderRadius: "4px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                zIndex: 10,
              }}
            >
              ✓ CONFIRM — {form.lat}, {form.lng}
            </button>
          </div>
        </div>
      )}

      {/* ✅ Toggle Button for creating new events */}
      {!isFormVisible && (
        <button 
          onClick={() => setIsFormVisible(true)}
          style={{ marginBottom: "20px", background: "#000", color: "#fff", padding: "12px 20px", border: "none", cursor: "pointer", fontWeight: "bold", fontFamily: "monospace" }}
        >
          + CREATE NEW EVENT
        </button>
      )}

      {/* ✅ Conditional Rendering: Show Form only if creating or editing */}
      {(isFormVisible || isEditing) && (
        <>
          <h1 style={{ textTransform: "uppercase", borderBottom: "6px solid red", paddingBottom: "10px" }}>
            {isEditing ? "Edit Event" : "Create Event"}
          </h1>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px", margin: "20px 0", padding: "30px", border: "6px solid red", background: "#ffffff" }}>
            {/* ... [Form fields remain exactly the same as your original code] ... */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <label>URL ID (Slug):
                <input disabled={isEditing} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={inputStyle} />
              </label>
              <label>Display Name:
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </label>
            </div>
            <label>Description:
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: "80px" }} />
            </label>
            <label>Image URL:
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={inputStyle} />
              {form.image && (
                <img src={form.image} alt="preview" onError={(e) => (e.currentTarget.style.display = "none")}
                  style={{ marginTop: 8, width: "100%", maxHeight: 120, objectFit: "cover", border: "2px solid black" }} />
              )}
            </label>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontFamily: "monospace", fontSize: "14px" }}>Coordinates</span>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  style={{ background: "#1d4ed8", color: "white", border: "none", padding: "8px 16px", cursor: "pointer", fontFamily: "monospace", fontWeight: "bold", fontSize: "13px" }}
                >
                  📍 PICK FROM MAP
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                <label>Latitude:
                  <input type="number" step="any" value={form.lat ?? 0} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} />
                </label>
                <label>Longitude:
                  <input type="number" step="any" value={form.lng ?? 0} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} />
                </label>
                <label>Radius (m):
                  <input type="number" value={form.radius ?? 0} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} />
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <label>Status:
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  style={{ ...inputStyle, marginLeft: "10px", width: "auto" }}>
                  <option value="inactive">INACTIVE</option>
                  <option value="active">ACTIVE</option>
                </select>
              </label>
              <button type="submit" style={{ flex: 1, background: "#dc2626", color: "white", padding: "12px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                {isEditing ? "UPDATE EVENT" : "SAVE NEW EVENT"}
              </button>
              <button type="button" onClick={resetForm} style={{ padding: "12px", background: "white", border: "2px solid red", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          </form>
        </>
      )}

      {/* ── Event Table ── */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading events...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", border: "4px solid red" }}>
          <thead style={{ background: "red", color: "white" }}>
            <tr>
              {["ID / URL", "NAME", "RADIUS", "STATUS", "ACTIONS"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#666" }}>
                  No events yet. Create one above.
                </td>
              </tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: "2px solid black", opacity: ev.status === "inactive" ? 0.5 : 1 }}>
                <td style={tdStyle}><code>{ev.id}</code></td>
                <td style={tdStyle}>{ev.name}</td>
                <td style={tdStyle}>{ev.radius}m</td>
                <td style={{ ...tdStyle, fontWeight: "bold", color: ev.status === "active" ? "#dc2626" : "#666" }}>
                  {ev.status.toUpperCase()}
                </td>
                <td style={{ ...tdStyle, display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button onClick={() => loadEventForEdit(ev)} style={btnStyle}>EDIT</button>
                  <button onClick={() => handleDelete(ev.id)} style={{ ...btnStyle, color: "#dc2626", borderColor: "#dc2626" }}>DEL</button>
                  <button
                    disabled={ev.status === "inactive"}
                    onClick={() => onSelect(ev.id)}
                    style={{ ...btnStyle, background: ev.status === "active" ? "#dc2626" : "#ccc", color: "white", border: "none", cursor: ev.status === "inactive" ? "not-allowed" : "pointer", fontWeight: "bold" }}
                  >
                    MANAGE →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px", border: "3px solid black", width: "100%", boxSizing: "border-box", fontFamily: "monospace", display: "block", marginTop: 4 };
const thStyle: React.CSSProperties = { padding: "12px", textAlign: "left" };
const tdStyle: React.CSSProperties = { padding: "12px", textAlign: "left", verticalAlign: "middle" };
const btnStyle: React.CSSProperties = { padding: "4px 10px", cursor: "pointer", background: "white", border: "2px solid black", fontFamily: "monospace" };