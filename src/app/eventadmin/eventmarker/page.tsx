
"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext"; 

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

export default function EventsAdmin() {
  const [events,    setEvents]    = useState<EventData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form,      setForm]      = useState(initialState);

  // ✅ Context — available for any sub-collection queries you may add later
  const { eventId } = useEventId();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "events"));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
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
        name: form.name, description: form.description, image: form.image,
        lat: Number(form.lat), lng: Number(form.lng),
        radius: Number(form.radius), status: form.status,
      });
      alert(isEditing ? "Event Updated!" : "Event Created!");
      resetForm(); fetchEvents();
    } catch {
      alert("Error saving to Firestore");
    }
  };

  const resetForm = () => { setForm(initialState); setIsEditing(false); };

  const loadEventForEdit = (event: EventData) => {
    setForm({ ...event });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "monospace", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textTransform: "uppercase", borderBottom: "6px solid black", paddingBottom: "10px" }}>
        {isEditing ? "Edit Event" : "Create Event"}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px", margin: "20px 0", padding: "30px", border: "6px solid black", background: "#f0f0f0" }}>
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
        <label>Image Path:
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={inputStyle} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
          <label>Latitude:
            <input type="number" step="any" value={form.lat ?? 0} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} />
          </label>
          <label>Longitude:
            <input type="number" step="any" value={form.lng ?? 0} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} />
          </label>
          <label>Radius (Meters):
            <input type="number" value={form.radius ?? 0} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} />
          </label>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <label>Status:
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} style={{ ...inputStyle, marginLeft: "10px", width: "auto" }}>
              <option value="inactive">INACTIVE</option>
              <option value="active">ACTIVE</option>
            </select>
          </label>
          <button type="submit" style={{ flex: 1, background: "black", color: "white", padding: "12px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
            {isEditing ? "UPDATE EVENT" : "SAVE NEW EVENT"}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} style={{ padding: "12px", background: "white", border: "2px solid black", cursor: "pointer" }}>
              CANCEL
            </button>
          )}
        </div>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "4px solid black" }}>
        <thead style={{ background: "black", color: "white" }}>
          <tr>
            {["ID/URL", "NAME", "RADIUS", "STATUS", "ACTIONS"].map((h) => (
              <th key={h} style={tdStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} style={{ borderBottom: "2px solid black" }}>
              <td style={tdStyle}><code>{ev.id}</code></td>
              <td style={tdStyle}>{ev.name}</td>
              <td style={tdStyle}>{ev.radius}m</td>
              <td style={{ ...tdStyle, fontWeight: "bold", color: ev.status === "active" ? "green" : "red" }}>
                {ev.status.toUpperCase()}
              </td>
              <td style={tdStyle}>
                <button onClick={() => loadEventForEdit(ev)} style={{ marginRight: "10px", padding: "4px 8px", cursor: "pointer", background: "white", border: "2px solid black" }}>EDIT</button>
                <button onClick={async () => { if (confirm("Delete event?")) { await deleteDoc(doc(db, "events", ev.id)); fetchEvents(); } }} style={{ color: "red", padding: "4px 8px", cursor: "pointer", background: "white", border: "2px solid red" }}>DEL</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = { padding: "10px", border: "3px solid black", width: "100%", boxSizing: "border-box" as const, fontFamily: "monospace" };
const tdStyle    = { padding: "12px", textAlign: "left" as const };