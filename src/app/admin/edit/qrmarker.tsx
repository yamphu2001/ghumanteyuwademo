"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QRMarker {
  id: string;
  name: string;
  nameNepali: string;
  description: string;
  descriptionNepali: string;
  lng: number;
  lat: number;
  unlockCode: string;
  imageUrl: string;
  createdAt?: string;
}

interface FirestoreEvent {
  id: string;
  name?: string;
}

const EMPTY_FORM = { 
  name: "", 
  nameNepali: "", 
  description: "", 
  descriptionNepali: "", 
  lng: "", 
  lat: "", 
  unlockCode: "", 
  imageUrl: "" 
};

export default function EventMarkerManager() {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [markers, setMarkers] = useState<QRMarker[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch Event List (Dependency array size: 0)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      const list = snap.docs.map((d) => ({ 
        id: d.id, 
        ...(d.data() as Omit<FirestoreEvent, "id">) 
      }));
      setEvents(list);
      // Logic to auto-select first event is moved to a separate check to keep this hook's deps empty
    });
    return () => unsub();
  }, []);

  // 2. Handle Auto-Selection (Keeps logic separate from data fetching)
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  // 3. Fetch Markers (Dependency array size: 1)
  useEffect(() => {
    if (!selectedEvent) {
      setMarkers([]);
      return;
    }

    const q = query(
      collection(db, "events", selectedEvent, "qrMarkers"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMarkers(snap.docs.map((d) => ({ 
        id: d.id, 
        ...(d.data() as Omit<QRMarker, "id">) 
      })));
    });

    return () => unsub();
  }, [selectedEvent]);

  // --- Handlers ---

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const startEdit = (m: QRMarker) => {
    setEditingId(m.id);
    setForm({
      name: m.name || "",
      nameNepali: m.nameNepali || "",
      description: m.description || "",
      descriptionNepali: m.descriptionNepali || "",
      lng: String(m.lng ?? ""),
      lat: String(m.lat ?? ""),
      unlockCode: m.unlockCode || "",
      imageUrl: m.imageUrl || "",
    });
  };

  const handleSave = async () => {
    const lng = parseFloat(form.lng);
    const lat = parseFloat(form.lat);

    if (!form.name.trim() || !form.nameNepali.trim()) return setError("Names are required.");
    if (isNaN(lng) || isNaN(lat)) return setError("Invalid coordinates.");
    if (!form.unlockCode.trim()) return setError("Unlock code is required.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nameNepali: form.nameNepali.trim(),
        description: form.description.trim(),
        descriptionNepali: form.descriptionNepali.trim(),
        lng,
        lat,
        unlockCode: form.unlockCode.trim().toUpperCase(),
        imageUrl: form.imageUrl.trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, "events", selectedEvent, "qrMarkers", editingId), payload);
      } else {
        await addDoc(collection(db, "events", selectedEvent, "qrMarkers"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }
      reset();
    } catch (e) {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this marker?")) return;
    await deleteDoc(doc(db, "events", selectedEvent, "qrMarkers", id));
  };

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-black p-4 text-white shadow-[4px_4px_0_0_#facd05]">
        <h1 className="font-black uppercase italic tracking-tighter text-xl text-yellow-400">QR Manager</h1>
        <select
          value={selectedEvent}
          onChange={(e) => { setSelectedEvent(e.target.value); reset(); }}
          className="bg-white text-black font-black uppercase p-2 border-2 border-black outline-none text-xs"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name ?? e.id}</option>
          ))}
        </select>
      </div>

      {/* Form Section */}
      <div className={`p-5 border-4 border-black shadow-[6px_6px_0_0_#000] bg-white space-y-4 ${editingId ? "ring-4 ring-yellow-400" : ""}`}>
        <h2 className="font-black uppercase">{editingId ? "✏️ Edit Marker" : "＋ New Marker"}</h2>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 inline-block">English Details</p>
          <input className={INPUT} placeholder="Marker Name (EN) *" value={form.name || ""} onChange={set("name")} />
          <textarea className={`${INPUT} min-h-[60px]`} placeholder="Description (EN)" value={form.description || ""} onChange={set("description")} />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 inline-block">नेपाली विवरण</p>
          <input className={INPUT} placeholder="नाम (नेपाली) *" value={form.nameNepali || ""} onChange={set("nameNepali")} />
          <textarea className={`${INPUT} min-h-[60px]`} placeholder="विवरण (नेपाली)" value={form.descriptionNepali || ""} onChange={set("descriptionNepali")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className={INPUT} type="number" step="any" placeholder="Longitude" value={form.lng || ""} onChange={set("lng")} />
          <input className={INPUT} type="number" step="any" placeholder="Latitude" value={form.lat || ""} onChange={set("lat")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
            <input className={`${INPUT} font-mono uppercase`} placeholder="Code *" value={form.unlockCode || ""} onChange={set("unlockCode")} />
            <input className={INPUT} placeholder="Image URL" value={form.imageUrl || ""} onChange={set("imageUrl")} />
        </div>

        {error && <p className="text-red-600 text-xs font-bold bg-red-50 p-2 border border-red-200">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-black text-white p-3 font-black uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Update" : "Save Marker"}
          </button>
          {editingId && (
            <button onClick={reset} className="px-4 border-4 border-black font-black hover:bg-gray-100">✕</button>
          )}
        </div>
      </div>

      {/* Marker List */}
      <div className="space-y-2">
        {markers.map((m) => (
          <div key={m.id} className={`p-3 border-2 border-black flex items-start gap-3 bg-white ${editingId === m.id ? "bg-yellow-50 border-yellow-400" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="font-black text-xs uppercase truncate">{m.name} / {m.nameNepali}</p>
              <div className="flex gap-3 mt-1">
                <span className="font-mono text-[9px] font-bold bg-gray-100 px-1 italic">Code: {m.unlockCode}</span>
                <span className="font-mono text-[9px] opacity-50">{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(m)} className="text-[10px] font-black border border-black px-2 py-0.5 hover:bg-black hover:text-white">EDIT</button>
              <button onClick={() => handleDelete(m.id)} className="text-[10px] font-black border border-red-500 text-red-500 px-2 py-0.5 hover:bg-red-500 hover:text-white">DEL</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const INPUT = "w-full p-2 border-2 border-black outline-none bg-gray-50 text-sm focus:bg-white transition-colors";