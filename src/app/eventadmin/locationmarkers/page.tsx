
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, writeBatch, getDoc
} from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker";

// --- Types ---
type MarkerType = "landmark";

interface MarkerData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: MarkerType;
  image: string;
  popupImage?: string;
  description?: string;
  points: number;
  status: "active" | "inactive";
  eventlocation?: string;
}

type FormState = Omit<MarkerData, "id">;

const EMPTY_FORM: FormState = {
  name: "",
  lat: 0,
  lng: 0,
  type: "landmark",
  image: "",
  popupImage: "",
  description: "",
  points: 0,
  status: "active",
  eventlocation: "",
};

const MARKER_TYPES: MarkerType[] = ["landmark"];

export default function AdminLocationMarkers() {
  const { eventId: targetEventId } = useEventId();

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filterArea, setFilterArea] = useState<string>("all");
  
  // New State for Full Screen Map
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  const uniqueAreas = useMemo(() => {
    const areas = markers.map((m) => m.eventlocation || "Unassigned");
    return Array.from(new Set(areas));
  }, [markers]);

  const filteredMarkers = useMemo(() => {
    if (filterArea === "all") return markers;
    return markers.filter((m) => (m.eventlocation || "Unassigned") === filterArea);
  }, [markers, filterArea]);


  // Fetch markers within the sub-collection
  const fetchMarkers = useCallback(async () => {
    if (!targetEventId) { setMarkers([]); return; }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "events", targetEventId, "locationmarkers"));
      setMarkers(snap.docs.map((d) => ({
        id: d.id,
        status: "active",
        eventlocation: "",
        points: 0,
        ...(d.data() as any),
      })));
    } catch (e: any) {
      setError(`Failed to load: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [targetEventId]);

  
  // ✅ Fetch Event Boundary
  const fetchEventBoundary = useCallback(async () => {
    if (!targetEventId) return;
    try {
      const eventRef = doc(db, "events", targetEventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const data = eventSnap.data();
        const rawCoords = data.boundaryCoords; 

        if (rawCoords && Array.isArray(rawCoords)) {
          const formattedCoords = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
          
          if (formattedCoords.length > 0) {
            const first = formattedCoords[0];
            const last = formattedCoords[formattedCoords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              formattedCoords.push(first);
            }
          }
          setEventAreaBoundary([formattedCoords]);
        }
      }
    } catch (e) {
      console.error("Error fetching boundary:", e);
    }
  }, [targetEventId]);


  useEffect(() => { 
    fetchMarkers(); 
    fetchEventBoundary();
  }, [fetchMarkers, fetchEventBoundary]);

  // Handle Location Selection
  const handleMapSelect = (data: any) => {
    if (data.geometry && data.geometry.coordinates) {
      setForm(prev => ({
        ...prev,
        lng: data.geometry.coordinates[0],
        lat: data.geometry.coordinates[1]
      }));
      // Close map after selecting
      setIsMapFullScreen(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openAdd = () => {
    if (!targetEventId) { alert("Please select an Event ID first!"); return; }
    setEditingId(null); setForm(EMPTY_FORM); setError(null); setModalOpen(true); setIsMapFullScreen(false);
  };

  const openEdit = (m: MarkerData) => {
    setEditingId(m.id);
    setForm({ ...m });
    setError(null); setModalOpen(true); setIsMapFullScreen(false);
  };

  const closeModal = () => {
    setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); setError(null); setIsMapFullScreen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "lat" || name === "lng" || name === "points"
        ? (value === "" ? "" : parseFloat(value))
        : value,
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.image.trim() || !targetEventId) {
        setError("Missing required fields.");
        return;
    }

    setSaving(true); setError(null);
    const payload = { ...form };

    try {
      if (editingId) {
        await updateDoc(doc(db, "events", targetEventId, "locationmarkers", editingId), payload);
        showSuccess("Marker updated.");
      } else {
        await addDoc(collection(db, "events", targetEventId, "locationmarkers"), payload);
        showSuccess("Marker added.");
      }
      closeModal(); fetchMarkers();
    } catch (e: any) {
      setError(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "events", targetEventId, "locationmarkers", id));
      setDeleteConfirm(null); showSuccess("Marker deleted."); fetchMarkers();
    } catch (e: any) {
      setError(`Delete failed: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  }

  const handleBulkStatusUpdate = async (newStatus: "active" | "inactive") => {
    if (!targetEventId || filteredMarkers.length === 0) return;
    setBulkLoading(true);
    try {
      const batch = writeBatch(db);
      filteredMarkers.forEach((m) => {
        batch.update(doc(db, "events", targetEventId, "locationmarkers", m.id), { status: newStatus });
      });
      await batch.commit();
      showSuccess(`Updated ${filteredMarkers.length} markers.`);
      fetchMarkers();
    } catch (e: any) {
      setError(`Bulk update failed: ${e.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!targetEventId) return;
    let parsed: any[];
    try { parsed = JSON.parse(jsonText); } catch { setError("Invalid JSON."); return; }
    setBulkLoading(true);
    try {
      for (const m of parsed) {
        await addDoc(collection(db, "events", targetEventId, "locationmarkers"), {
            ...m,
            lat: Number(m.lat) || 0,
            lng: Number(m.lng) || 0,
            points: Number(m.points) || 0
        });
      }
      showSuccess("Bulk upload complete."); setBulkOpen(false); fetchMarkers();
    } catch (e: any) {
      setError(`Bulk failed: ${e.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div style={styles.page}>
        {/* --- Header & Toolbar --- */}
        <header style={styles.header}>
            <div>
                <h1 style={styles.title}>📍 Location Markers</h1>
                <p style={styles.subtitle}>
                    Nested Management for Event Sub-collections
                    {targetEventId && <span style={{ marginLeft: 8, color: "#3b82f6", fontWeight: 600 }}>— {targetEventId}</span>}
                </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <button style={styles.bulkBtn} onClick={() => { setBulkOpen(true); setError(null); }}>📦 Bulk JSON</button>
                <button style={styles.addBtn} onClick={openAdd}>+ Add Marker</button>
            </div>
        </header>

        {/* Filter Toolbar */}
        <div style={styles.filterBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>FILTER BY AREA:</span>
                <select style={{ ...styles.input, marginBottom: 0, minWidth: 180 }} value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="all">All Event Areas</option>
                    {uniqueAreas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <button disabled={bulkLoading || filteredMarkers.length === 0} onClick={() => handleBulkStatusUpdate("active")} style={{ ...styles.editBtn, background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>✅ Activate Showing</button>
                <button disabled={bulkLoading || filteredMarkers.length === 0} onClick={() => handleBulkStatusUpdate("inactive")} style={styles.deleteBtn}>🚫 Inactivate Showing</button>
            </div>
        </div>

      {success && <div style={styles.toastSuccess}>{success}</div>}
      {!targetEventId && <div style={styles.toastError}>⚠️ Select an Event ID in the sidebar to load markers.</div>}
      {error && !modalOpen && <div style={styles.toastError}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Loading markers for Event {targetEventId}…</div>
        ) : !targetEventId ? (
          <div style={styles.empty}>No Event ID selected.</div>
        ) : filteredMarkers.length === 0 ? (
          <div style={styles.empty}>No markers found for Event {targetEventId}.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>{["Icon", "Name", "Points", "Status", "Area", "Lat", "Lng", "Actions"].map((h) => (<th key={h} style={styles.th}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {filteredMarkers.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <td style={styles.td}>{m.image ? <img src={m.image} alt="" style={styles.thumb} /> : <span style={styles.noImg}>—</span>}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{m.name}</td>
                    <td style={styles.td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: (m.points ?? 0) > 0 ? "#fef9c3" : "#f3f4f6", color: (m.points ?? 0) > 0 ? "#92400e" : "#9ca3af", fontWeight: 700, fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${(m.points ?? 0) > 0 ? "#f59e0b" : "#e5e7eb"}` }}>
                        {(m.points ?? 0) > 0 ? `⭐ ${m.points}` : "—"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: m.status === "active" ? "#dcfce7" : "#fee2e2", color: m.status === "active" ? "#166534" : "#991b1b" }}>{m.status?.toUpperCase() ?? "ACTIVE"}</span>
                    </td>
                    <td style={styles.td}>{m.eventlocation || <span style={{ color: "#ccc" }}>Unassigned</span>}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{m.lat.toFixed(5)}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{m.lng.toFixed(5)}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={styles.editBtn} onClick={() => openEdit(m)}>✏️ Edit</button>
                        <button style={styles.deleteBtn} onClick={() => setDeleteConfirm(m.id)}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Main Edit/Add Modal --- */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingId ? "Edit Marker" : "Add New Marker"}</h2>
              <button style={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            {error && <div style={styles.inlineError}>{error}</div>}

            <div style={styles.grid2}>
              <label style={styles.label}>Status
                <select style={styles.input} name="status" value={form.status ?? "active"} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label style={styles.label}>Event Area
                <input style={styles.input} name="eventlocation" value={form.eventlocation ?? ""} onChange={handleChange} placeholder="e.g. Ground Floor" />
              </label>
            </div>

            <div style={styles.grid2}>
              <label style={styles.label}>Name *
                <input style={styles.input} name="name" value={form.name ?? ""} onChange={handleChange} />
              </label>
              <label style={styles.label}>Type *
                <select style={styles.input} name="type" value={form.type ?? "landmark"} onChange={handleChange}>
                  {MARKER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            {/* --- COORDINATES SECTION --- */}
            <div style={styles.coordBox}>
              <div style={styles.coordHeader}>
                <span style={styles.label}>📍 Coordinates</span>
                <button 
                  type="button"
                  onClick={() => setIsMapFullScreen(true)} 
                  style={styles.fullScreenBtn}
                >
                  🎯 Pick on Full Map
                </button>
              </div>

              <div style={styles.grid2}>
                <label style={styles.label}>Lat *
                  <input style={styles.input} name="lat" type="number" step="any" value={form.lat ?? ""} onChange={handleChange} />
                </label>
                <label style={styles.label}>Lng *
                  <input style={styles.input} name="lng" type="number" step="any" value={form.lng ?? ""} onChange={handleChange} />
                </label>
              </div>
            </div>

            <div style={styles.pointsBox}>
              <label style={{ ...styles.label, color: "#92400e", marginBottom: 6 }}>⭐ Points Awarded on Unlock</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input style={{ ...styles.input, marginBottom: 0, width: 120, fontWeight: 700, fontSize: 16, textAlign: "center" }} name="points" type="number" min={0} step={5} value={form.points ?? ""} onChange={handleChange} />
                <span style={{ fontSize: 13, color: "#b45309" }}>{(form.points ?? 0) > 0 ? `Player earns ⭐ ${form.points} pts` : "Set to 0 to award no points"}</span>
              </div>
            </div>

            <label style={styles.label}>Icon URL *
              <input style={styles.input} name="image" value={form.image ?? ""} onChange={handleChange} />
            </label>
            <label style={styles.label}>Popup Image URL
              <input style={styles.input} name="popupImage" value={form.popupImage ?? ""} onChange={handleChange} />
            </label>
            <label style={styles.label}>Description
              <textarea style={{ ...styles.input, height: 60 }} name="description" value={form.description ?? ""} onChange={handleChange} />
            </label>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Marker"}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL SCREEN MAP OVERLAY --- */}
      {isMapFullScreen && (
        <div style={styles.fullScreenOverlay}>
          <div style={styles.fullScreenHeader}>
             <div style={{color: 'white', fontWeight: 700}}>Select Location for "{form.name || 'New Marker'}"</div>
             <button onClick={() => setIsMapFullScreen(false)} style={styles.closeFullBtn}>Close Map</button>
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

      {/* Bulk Upload Modal */}
      {bulkOpen && (
        <div style={styles.modalOverlay} onClick={() => setBulkOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Bulk Upload → {targetEventId}</h2>
            </div>
            <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={10} style={{ ...styles.input, width: "100%", fontFamily: "monospace" }} />
            <div style={styles.modalFooter}>
              <button style={styles.saveBtn} onClick={handleBulkUpload} disabled={bulkLoading}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Delete this marker?</h2>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>No</button>
              <button style={{ ...styles.saveBtn, background: "#ef4444" }} onClick={() => handleDelete(deleteConfirm!)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles Update ---
const styles: Record<string, React.CSSProperties> = {
  // ... (Existing styles from your code)
  page: { minHeight: "100vh", background: "#f4f6f9", padding: "32px 24px", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 14, color: "#888" },
  filterBar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 20px", borderRadius: 12, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", borderBottom: "2px solid #f0f0f0", background: "#fafafa" },
  td: { padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 14, verticalAlign: "middle" },
  empty: { padding: 48, textAlign: "center", color: "#aaa" },
  thumb: { width: 36, height: 36, borderRadius: 6, objectFit: "cover" },
  noImg: { color: "#ccc" },
  addBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 },
  bulkBtn: { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 },
  editBtn: { background: "#f0f4ff", color: "#3b82f6", border: "1px solid #dbeafe", borderRadius: 6, padding: "5px 12px", cursor: "pointer" },
  deleteBtn: { background: "#fff5f5", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 12px", cursor: "pointer" },
  toastSuccess: { background: "#d1fae5", color: "#065f46", padding: "12px", borderRadius: 8, marginBottom: 20 },
  toastError: { background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: 8, marginBottom: 20 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 700 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", width: "100%", marginBottom: 10, boxSizing: "border-box" },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 },
  cancelBtn: { padding: "8px 16px", borderRadius: 6, border: "none", background: "#eee", cursor: "pointer" },
  saveBtn: { padding: "8px 16px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer" },
  inlineError: { color: "#ef4444", background: "#fee2e2", padding: "8px", borderRadius: 4, marginBottom: 15, fontSize: 13 },

  // --- NEW STYLES FOR FULLSCREEN ---
  coordBox: { background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 12, border: "1px solid #e2e8f0" },
  coordHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  fullScreenBtn: { background: "#3b82f6", color: "white", border: "none", borderRadius: 4, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700 },
  pointsBox: { background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: 8, padding: "14px 16px", marginBottom: 12 },
  
  fullScreenOverlay: { 
    position: "fixed", 
    inset: 0, 
    background: "#000", 
    zIndex: 2000, 
    display: "flex", 
    flexDirection: "column" 
  },
  fullScreenHeader: { 
    padding: "10px 20px", 
    background: "#1e293b", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  closeFullBtn: { 
    background: "#ef4444", 
    color: "white", 
    border: "none", 
    padding: "8px 16px", 
    borderRadius: "6px", 
    cursor: "pointer", 
    fontWeight: 600 
  }
};