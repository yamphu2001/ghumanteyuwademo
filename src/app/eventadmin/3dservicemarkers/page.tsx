
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, onSnapshot,
  collection, getDocs,
  writeBatch, deleteDoc
} from "firebase/firestore";
import { useEventId } from "../Eventidcontext";
import MapPicker from "../MapPicker";

export default function AdminServiceMarker() {
  const { eventId } = useEventId();
  const [services, setServices] = useState<any[]>([]);
  const [selectedBoundary, setSelectedBoundary] = useState<{ lng: number, lat: number }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    text: "",
    color: "#3b82f6",
    markerImage: "",
    popupImage: "",
    height: 20,
  });

  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch boundary from subcollection (same as GhumanteStallAdmin) ──
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

  // ── Listen to serviceboundaries subcollection via onSnapshot ──
  useEffect(() => {
    if (!eventId) {
      setServices([]);
      return;
    }
    fetchEventBoundary();

    const subColRef = collection(db, "events", eventId, "serviceboundaries");

    const unsub = onSnapshot(subColRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setServices(list);
    }, (err) => {
      console.error("Snapshot error:", err);
    });

    return () => unsub();
  }, [eventId, fetchEventBoundary]);

  const resetForm = () => {
    setFormData({ name: "", text: "", color: "#3b82f6", markerImage: "", popupImage: "", height: 20 });
    setSelectedBoundary([]);
    setEditingId(null);
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      text: service.text,
      color: service.color,
      markerImage: service.markerImage || "",
      popupImage: service.popupImage || "",
      height: service.height || 20,
    });
    setSelectedBoundary(service.boundary);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (service: any) => {
    const shiftedBoundary = service.boundary.map((pt: any) => ({
      lng: pt.lng + 0.0002,
      lat: pt.lat + 0.0002,
    }));
    setEditingId(null);
    setFormData({
      name: `${service.name} (Copy)`,
      text: service.text,
      color: service.color,
      markerImage: service.markerImage || "",
      popupImage: service.popupImage || "",
      height: service.height || 20,
    });
    setSelectedBoundary(shiftedBoundary);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Delete: removes doc directly from subcollection ──
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this area?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId, "serviceboundaries", id));
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleLocationSelect = (feature: any) => {
    if (feature?.geometry?.type === "Polygon") {
      const ring = feature.geometry.coordinates[0];
      const cleanPoints = ring.map((pt: any) => ({ lng: pt[0], lat: pt[1] }));
      setSelectedBoundary(cleanPoints);
    }
  };

  // ── Save: writes to serviceboundaries subcollection ──
  const handleSave = async () => {
    if (!eventId) return alert("Select Event ID");
    if (selectedBoundary.length < 3) return alert("Please draw the area on the map first");

    setIsSaving(true);

    // Use existing editingId or generate a stable new one
    const docId = editingId || `service_${Date.now()}`;

    const serviceData = {
      name: formData.name || "Unnamed Service",
      text: formData.text || "",
      color: formData.color,
      markerImage: formData.markerImage,
      popupImage: formData.popupImage,
      boundary: selectedBoundary,
      height: Number(formData.height),
      status: "active",
    };

    try {
      const batch = writeBatch(db);
      const docRef = doc(db, "events", eventId, "serviceboundaries", docId);
      batch.set(docRef, serviceData, { merge: true });
      await batch.commit();

      alert(`Successfully saved "${serviceData.name}" to serviceboundaries subcollection!`);
      resetForm();
    } catch (e: any) {
      alert("Error saving data: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen font-mono text-black">
      {isMapFullScreen && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col border-[12px] border-black">
          <div className="p-4 border-b-2 border-black flex justify-between items-center text-black bg-white">
            <span className="font-bold tracking-widest uppercase text-sm">
              <span className="text-red-600 mr-2">•</span>
              Drawing: {formData.name || "Area"}
            </span>
            <button onClick={() => setIsMapFullScreen(false)} className="px-6 py-2 bg-red-600 text-white font-bold tracking-widest uppercase hover:bg-red-700 transition-colors">
              Confirm Shape
            </button>
          </div>
          <div className="flex-1 relative">
            <MapPicker
              key={editingId || 'new'}
              mode="draw_polygon"
              onLocationSelect={handleLocationSelect}
              boundary={eventAreaBoundary}
              initialValue={selectedBoundary.length > 0 ? [selectedBoundary.map(p => [p.lng, p.lat])] : undefined}
            />
          </div>
        </div>
      )}

      {/* Header Section mimicking the reference image */}
      <div className="mb-6 pb-4 border-b-2 border-black">
        <p className="text-red-600 font-bold tracking-[0.2em] text-xs uppercase mb-2">Service Marker</p>
        <h1 className="text-3xl font-black tracking-widest uppercase">Configuration</h1>
      </div>

      <div className="bg-white border-2 border-black grid grid-cols-1 md:grid-cols-12 relative p-4 lg:p-6">
        <div className="md:col-span-6 p-4 lg:p-8 border-b-2 md:border-b-0 md:border-r-2 border-black space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black tracking-widest uppercase flex items-center">
              <span className="text-red-600 mr-2">•</span>
              {editingId ? "Edit Properties" : "New Properties"}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-bold text-red-600 border border-red-600 px-3 py-1 tracking-widest uppercase hover:bg-red-50 transition-colors">
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-red-600 tracking-widest uppercase mb-2">Area Name</label>
              <input placeholder="Enter Area Name..." className="w-full bg-transparent border border-gray-300 p-3 outline-none focus:border-red-600 focus:bg-red-50/20 transition-colors" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-red-600 tracking-widest uppercase mb-2">Description</label>
              <textarea placeholder="Enter Description..." className="w-full bg-transparent border border-gray-300 p-3 outline-none h-24 resize-none focus:border-red-600 focus:bg-red-50/20 transition-colors" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-red-600 tracking-widest uppercase mb-2">Marker URL</label>
                <input placeholder="https://..." className="w-full bg-transparent border border-gray-300 p-3 text-xs outline-none focus:border-red-600 focus:bg-red-50/20 transition-colors" value={formData.markerImage} onChange={(e) => setFormData({ ...formData, markerImage: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-600 tracking-widest uppercase mb-2">Popup URL</label>
                <input placeholder="https://..." className="w-full bg-transparent border border-gray-300 p-3 text-xs outline-none focus:border-red-600 focus:bg-red-50/20 transition-colors" value={formData.popupImage} onChange={(e) => setFormData({ ...formData, popupImage: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 p-4 border border-gray-300 flex justify-between items-center focus-within:border-red-600 transition-colors">
                <span className="text-xs font-bold tracking-widest uppercase">3D Height</span>
                <input type="number" className="w-16 bg-transparent text-right text-sm outline-none font-bold" value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} />
              </div>

              <div className="flex-1 p-4 border border-gray-300 flex justify-between items-center">
                <span className="text-xs font-bold tracking-widest uppercase">Color</span>
                <input type="color" className="h-8 w-12 cursor-pointer border-0 bg-transparent" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-200">
            <button onClick={() => setIsMapFullScreen(true)} className="w-full py-4 border-2 border-black text-black uppercase font-black tracking-widest hover:bg-black hover:text-white transition-colors flex justify-center items-center gap-2">
              <span className="text-red-600">📍</span> {selectedBoundary.length > 0 ? "Change Area Shape" : "Draw Area on Map"}
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={!eventId || selectedBoundary.length === 0 || isSaving}
                className="flex-[2] py-4 bg-[#DA291C] disabled:bg-gray-200 disabled:text-gray-400 text-white font-black tracking-widest uppercase hover:bg-red-800 transition-colors"
              >
                {isSaving ? "Saving..." : editingId ? "Update Configuration" : "Save Configuration"}
              </button>
              <button onClick={resetForm} className="flex-1 border-2 border-black text-black font-black tracking-widest uppercase hover:bg-gray-100 transition-colors">
                + New
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 bg-white flex flex-col items-center justify-center p-12 min-h-[400px]">
          {selectedBoundary.length > 0 ? (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-white flex items-center justify-center mb-6 border-4" style={{ borderColor: formData.color }}>
                {formData.markerImage ? <img src={formData.markerImage} className="w-12 h-12 object-contain" alt="preview" /> : <span className="text-red-600 text-2xl font-black">✓</span>}
              </div>
              <p className="font-black text-black tracking-widest uppercase">Shape Recorded</p>
              <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">Height: {formData.height}m</p>
            </div>
          ) : (
            <div className="text-center opacity-50 border-2 border-dashed border-gray-300 p-8">
              <p className="text-black font-black tracking-widest uppercase mb-2">No Area Drawn</p>
              <p className="text-xs text-gray-500">Configure parameters on the left</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 mb-4 pb-4 border-b-2 border-black flex items-end justify-between">
        <div>
          <p className="text-red-600 font-bold tracking-[0.2em] text-xs uppercase mb-2">Directory</p>
          <h2 className="text-2xl font-black tracking-widest uppercase">Existing Areas ({services.length})</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {services.map((service) => (
          <div key={service.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white border border-gray-300 group hover:border-black transition-colors">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-200" style={{ borderLeft: `6px solid ${service.color}` }}>
                {service.markerImage ? <img src={service.markerImage} className="w-6 h-6 object-contain" alt="marker" /> : <span className="text-xs">📍</span>}
              </div>
              <div>
                <h4 className="font-black text-black tracking-widest uppercase text-sm md:text-base">{service.name}</h4>
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px] md:max-w-[400px] font-mono">{service.text || "NO DESCRIPTION"}</p>
              </div>
            </div>
            <div className="flex gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDuplicate(service)} className="px-4 py-2 bg-white border border-black text-black text-xs font-black tracking-widest uppercase hover:bg-black hover:text-white transition-colors">Duplicate</button>
              <button onClick={() => handleEdit(service)} className="px-4 py-2 bg-white border border-black text-black text-xs font-black tracking-widest uppercase hover:bg-black hover:text-white transition-colors">Edit</button>
              <button onClick={() => handleDelete(service.id)} className="px-4 py-2 bg-white border border-red-600 text-red-600 text-xs font-black tracking-widest uppercase hover:bg-red-600 hover:text-white transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="p-8 border border-gray-300 text-center text-sm font-bold tracking-widest text-gray-400 uppercase">
            No areas configured yet.
          </div>
        )}
      </div>
    </div>
  );
}