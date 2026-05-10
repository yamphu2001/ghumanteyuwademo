"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
// 1. IMPORT MAP PICKER
import MapPicker from "@/app/eventadmin/MapPicker";

interface Marker {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  image: string;
  popupText: string;
  eventId: string;
  points: number; 
}

const emptyForm: Marker = {
  name: "",
  lat: 0,
  lng: 0,
  type: "special",
  image: "",
  popupText: "",
  eventId: "",
  points: 0 
};

export default function AdminMarkers() {
  const { eventId: globalEventId } = useEventId();

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [form, setForm] = useState<Marker>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(`[{"name":"National Museum","lat":27.7152,"lng":85.3123,"type":"special","image":"","popupText":"","eventId":"","points":50}]`);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Map Selection States ──
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  useEffect(() => {
    if (globalEventId) {
      setForm(prev => ({ ...prev, eventId: globalEventId }));
    }
  }, [globalEventId]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMarkers = async () => {
    const activeId = globalEventId || form.eventId;
    if (!activeId) return;
    
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "events", activeId, "specialmarkers"));
      setMarkers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Marker) })));
    } catch (err) {
      console.error(err);
      showToast("Could not load markers", "error");
    } finally { setLoading(false); }
  };

  // Fetch Event Boundary to guide the Map Picker
  const fetchEventBoundary = useCallback(async () => {
    if (!globalEventId) return;
    try {
      const eventSnap = await getDoc(doc(db, "events", globalEventId));
      if (eventSnap.exists()) {
        const rawCoords = eventSnap.data().boundaryCoords;
        if (rawCoords && Array.isArray(rawCoords)) {
          const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
          // Close the polygon if needed
          if (formatted.length > 0) {
            const first = formatted[0];
            const last = formatted[formatted.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) formatted.push(first);
          }
          setEventAreaBoundary([formatted]);
        }
      }
    } catch (e) { console.error("Error fetching boundary:", e); }
  }, [globalEventId]);

  useEffect(() => {
    loadMarkers();
    fetchEventBoundary();
  }, [globalEventId, fetchEventBoundary]);

  // Handle Location Selection from Map
  const handleMapSelect = (data: any) => {
    if (data.geometry?.coordinates) {
      setForm(prev => ({
        ...prev,
        lng: data.geometry.coordinates[0],
        lat: data.geometry.coordinates[1]
      }));
      setIsMapFullScreen(false);
      showToast("Location updated from map");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "points" || name === "lat" || name === "lng" ? Number(value) : value });
  };

  const handleSubmit = async () => {
    const activeId = globalEventId || form.eventId;
    if (!form.name.trim() || !activeId.trim()) return showToast("Name and Event ID required", "error");

    setLoading(true);
    try {
      const data = {
        name: form.name,
        lat: Number(form.lat),
        lng: Number(form.lng),
        type: form.type,
        image: form.image,
        popupText: form.popupText,
        eventId: activeId,
        points: Number(form.points) || 0,
      };

      if (editingId) {
        const docRef = doc(db, "events", activeId, "specialmarkers", editingId);
        await updateDoc(docRef, data);
        showToast("Marker updated");
        setEditingId(null);
      } else {
        const colRef = collection(db, "events", activeId, "specialmarkers");
        await addDoc(colRef, data);
        showToast("Marker added to " + activeId);
      }
      setForm({ ...emptyForm, eventId: activeId });
      loadMarkers();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    } finally { setLoading(false); }
  };

  const startEdit = (m: Marker) => {
    setForm({ ...m, points: m.points ?? 0 });
    setEditingId(m.id!);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async (id: string) => {
    const activeId = globalEventId || form.eventId;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "events", activeId, "specialmarkers", id));
      showToast("Marker deleted");
      setDeleteConfirm(null);
      loadMarkers();
    } catch { showToast("Delete failed", "error"); }
    finally { setLoading(false); }
  };

  const uploadJSON = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) return showToast("JSON must be an array", "error");
      setLoading(true);

      for (const m of parsed) {
        const targetEventId = m.eventId || globalEventId || form.eventId;
        if (!targetEventId) continue;

        await addDoc(collection(db, "events", targetEventId, "specialmarkers"), {
          name: m.name || "",
          lat: Number(m.lat) || 0,
          lng: Number(m.lng) || 0,
          type: m.type || "special",
          image: m.image || "",
          popupText: m.popupText || m.description || "",
          eventId: targetEventId,
          points: Number(m.points) || 0 
        });
      }
      showToast(`${parsed.length} markers uploaded`);
      setJsonText("");
      loadMarkers();
    } catch { showToast("Invalid JSON", "error"); }
    finally { setLoading(false); }
  };

  const filtered = markers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 5, fontSize: 13, background: "#fff", outline: "none" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 3 };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", paddingBottom: 50, fontFamily: "sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 9999, background: toast.type === "success" ? "#064e3b" : "#7f1d1d", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, maxWidth: 320, width: "90%", textAlign: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Delete this marker?</h3>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirm)} style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL SCREEN MAP OVERLAY */}
      {isMapFullScreen && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 10000, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 20px", background: "#1f2937", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
             <span style={{ fontSize: 14, fontWeight: 700 }}>Select Location for: {form.name || "Untitled Marker"}</span>
             <button onClick={() => setIsMapFullScreen(false)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 15px", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}>Close Map</button>
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

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 22, marginBottom: 18, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#2563eb" }}>🏛️ Special Marker Management</h2>

          {/* Top Row: Event ID and Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 15, marginBottom: 15 }}>
            <div>
              <label style={lbl}>Event ID (Global)</label>
              <input 
                name="eventId" 
                value={globalEventId || form.eventId} 
                readOnly 
                style={{ ...inp, border: "2px solid #2563eb", background: "#f9fafb", cursor: "not-allowed" }} 
                placeholder="Select from sidebar" 
              />
            </div>
            <div>
              <label style={lbl}>Marker Name</label>
              <input name="name" value={form.name} onChange={handleChange} style={inp} placeholder="National Museum" />
            </div>
          </div>

          {/* 3. COORDINATES SECTION WITH MAP TRIGGER */}
          <div style={{ background: "#f9fafb", padding: 15, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>📍 Coordinates</label>
                <button 
                    type="button"
                    onClick={() => setIsMapFullScreen(true)}
                    style={{ background: "#2563eb", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                    🎯 Pick on Map
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={lbl}>Latitude</label>
                  <input name="lat" type="number" value={form.lat} onChange={handleChange} style={inp} step="any" />
                </div>
                <div>
                  <label style={lbl}>Longitude</label>
                  <input name="lng" type="number" value={form.lng} onChange={handleChange} style={inp} step="any" />
                </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 15, marginBottom: 15 }}>
            <div>
              <label style={lbl}>Icon Image URL (Optional)</label>
              <input name="image" value={form.image} onChange={handleChange} style={inp} placeholder="https://..." />
            </div>
            <div>
              <label style={lbl}>Marker Type</label>
              <select name="type" value={form.type} onChange={handleChange} style={inp}>
                <option value="special">special</option>
                <option value="landmark">landmark</option>
                <option value="museum">museum</option>
              </select>
            </div>
            <div>
              <label style={{ ...lbl, color: "#b45309" }}>Reward Points</label>
              <input
                name="points"
                type="number"
                value={form.points ?? 0}
                onChange={handleChange}
                style={{ ...inp, border: "1px solid #f59e0b" }}
                placeholder="e.g. 50"
              />
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={lbl}>Popup Description</label>
            <textarea
              name="popupText"
              value={form.popupText}
              onChange={handleChange}
              style={{ ...inp, height: 80, resize: "vertical" }}
              placeholder="Tell a story about this location..."
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleSubmit} disabled={loading || !globalEventId} style={{ background: editingId ? "#f59e0b" : "#2563eb", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13, opacity: (!globalEventId) ? 0.5 : 1 }}>
              {loading ? "Processing..." : editingId ? "✓ Update Marker" : "+ Add to Firestore"}
            </button>
            <button onClick={uploadJSON} disabled={loading || !globalEventId} style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13, opacity: (!globalEventId) ? 0.5 : 1 }}>
              Bulk Upload JSON
            </button>
          </div>

          {editingId && (
            <button onClick={() => { setEditingId(null); setForm({ ...emptyForm, eventId: globalEventId || "" }) }} style={{ background: "none", border: "none", color: "#6b7280", marginLeft: 10, cursor: "pointer", fontSize: 13 }}>Cancel Edit</button>
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: 15, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Markers in "{globalEventId || "No Event"}"</span>
            <input placeholder="Filter by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #ddd", fontSize: 12 }} />
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#6b7280" }}>NAME</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#6b7280" }}>POINTS</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#6b7280" }}>DESCRIPTION</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 11, color: "#6b7280" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: 12, fontSize: 12, fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: 12, fontSize: 12, color: "#b45309", fontWeight: 700 }}>+{m.points || 0}</td>
                    <td style={{ padding: 12, fontSize: 12, color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.popupText || "No description"}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button onClick={() => startEdit(m)} style={{ marginRight: 10, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                      <button onClick={() => setDeleteConfirm(m.id!)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: 30, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>{globalEventId ? "No markers found." : "Please select an event ID to view markers."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}