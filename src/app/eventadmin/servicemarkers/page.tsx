
// 'use client';

// import React, { useState, useEffect, useCallback } from "react";
// import { db } from "@/lib/firebase";
// import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
// import { useEventId } from "../Eventidcontext";
// import MapPicker from "../MapPicker";

// export default function AdminServiceMarker() {
//   const { eventId } = useEventId();
//   const [services, setServices] = useState<any[]>([]);
//   const [selectedBoundary, setSelectedBoundary] = useState<{ lng: number, lat: number }[]>([]);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     text: "",
//     color: "#3b82f6",
//     markerImage: "",
//     popupImage: "",
//     height: 20 // Added initial height
//   });

//   const [isMapFullScreen, setIsMapFullScreen] = useState(false);
//   const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);
//   const [isSaving, setIsSaving] = useState(false);

//   const fetchEventBoundary = useCallback(async () => {
//     if (!eventId) return;
//     try {
//       const eventSnap = await getDoc(doc(db, "events", eventId));
//       if (eventSnap.exists()) {
//         const rawCoords = eventSnap.data().boundaryCoords;
//         if (rawCoords && Array.isArray(rawCoords)) {
//           const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
//           setEventAreaBoundary([formatted]);
//         }
//       }
//     } catch (e) { console.error(e); }
//   }, [eventId]);

//   useEffect(() => {
//     if (!eventId) return;
//     fetchEventBoundary();
//     const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
//       if (snap.exists()) {
//         setServices(snap.data().serviceBoundaries || []);
//       }
//     });
//     return () => unsub();
//   }, [eventId, fetchEventBoundary]);

//   const resetForm = () => {
//     setFormData({ name: "", text: "", color: "#3b82f6", markerImage: "", popupImage: "", height: 20 });
//     setSelectedBoundary([]);
//     setEditingId(null);
//   };

//   const handleEdit = (service: any) => {
//     setEditingId(service.id);
//     setFormData({
//       name: service.name,
//       text: service.text,
//       color: service.color,
//       markerImage: service.markerImage || "",
//       popupImage: service.popupImage || "",
//       height: service.height || 20 // Populate height
//     });
//     setSelectedBoundary(service.boundary);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleDuplicate = (service: any) => {
//     const shiftedBoundary = service.boundary.map((pt: any) => ({
//       lng: pt.lng + 0.0002,
//       lat: pt.lat + 0.0002
//     }));
//     setEditingId(null);
//     setFormData({
//       name: `${service.name} (Copy)`,
//       text: service.text,
//       color: service.color,
//       markerImage: service.markerImage || "",
//       popupImage: service.popupImage || "",
//       height: service.height || 20
//     });
//     setSelectedBoundary(shiftedBoundary);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this area?")) return;
//     try {
//       const eventRef = doc(db, "events", eventId);
//       const updatedList = services.filter(s => s.id !== id);
//       await updateDoc(eventRef, { serviceBoundaries: updatedList });
//     } catch (e) { alert("Delete failed"); }
//   };

//   const handleLocationSelect = (feature: any) => {
//     if (feature?.geometry?.type === "Polygon") {
//       const ring = feature.geometry.coordinates[0];
//       const cleanPoints = ring.map((pt: any) => ({ lng: pt[0], lat: pt[1] }));
//       setSelectedBoundary(cleanPoints);
//     }
//   };

//   const handleSave = async () => {
//     if (!eventId) return alert("Select Event ID");
//     if (selectedBoundary.length < 3) return alert("Please draw the area on the map first");

//     setIsSaving(true);
//     const serviceData = {
//       id: editingId || `service_${Date.now()}`,
//       name: formData.name || "Unnamed Service",
//       text: formData.text || "",
//       color: formData.color,
//       markerImage: formData.markerImage,
//       popupImage: formData.popupImage,
//       boundary: selectedBoundary,
//       height: Number(formData.height), // Save height as a number
//       status: "active"
//     };

//     try {
//       const eventRef = doc(db, "events", eventId);
//       let updatedList = editingId
//         ? services.map(s => s.id === editingId ? serviceData : s)
//         : [...services, serviceData];

//       await updateDoc(eventRef, { serviceBoundaries: updatedList });
//       alert("Saved successfully!");
//       resetForm();
//     } catch (error) {
//       alert("Error saving data.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen rounded-2xl">
//       {isMapFullScreen && (
//         <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col">
//           <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
//             <span>Drawing: {formData.name || "Area"}</span>
//             <button onClick={() => setIsMapFullScreen(false)} className="px-6 py-2 bg-blue-600 rounded-lg font-bold">Confirm Shape</button>
//           </div>
//           <div className="flex-1 relative">
//             <MapPicker
//               key={editingId || 'new'} // Forces a fresh map when switching items
//               mode="draw_polygon"
//               onLocationSelect={handleLocationSelect}
//               boundary={eventAreaBoundary}
//               initialValue={selectedBoundary.length > 0 ? [selectedBoundary.map(p => [p.lng, p.lat])] : undefined}
//             />
//           </div>
//         </div>
//       )}

//       <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-200">
//         <div className="md:col-span-5 p-8 border-r border-slate-100 space-y-6">
//           <div className="flex justify-between items-center">
//             <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Area" : "New Area"}</h2>
//             {editingId && <button onClick={resetForm} className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Cancel Edit</button>}
//           </div>

//           <div className="space-y-4">
//             <input placeholder="Area Name" className="w-full bg-slate-50 border-2 p-3 rounded-xl outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
//             <textarea placeholder="Description" className="w-full bg-slate-50 border-2 p-3 rounded-xl outline-none h-20 resize-none" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} />

//             <div className="grid grid-cols-2 gap-3">
//               <input placeholder="Marker Icon URL" className="bg-slate-50 border-2 p-2 rounded-lg text-xs outline-none" value={formData.markerImage} onChange={(e) => setFormData({ ...formData, markerImage: e.target.value })} />
//               <input placeholder="Popup Image URL" className="bg-slate-50 border-2 p-2 rounded-lg text-xs outline-none" value={formData.popupImage} onChange={(e) => setFormData({ ...formData, popupImage: e.target.value })} />
//             </div>

//             {/* Height input added here */}
//             <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center border-2 border-slate-100">
//               <span className="text-sm font-bold">3D Height</span>
//               <input type="number" className="w-20 bg-white p-2 rounded-lg text-sm outline-none" value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} />
//             </div>

//             <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
//               <span className="text-sm font-bold">Theme Color</span>
//               <input type="color" className="h-10 w-16 cursor-pointer" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
//             </div>
//           </div>

//           <div className="space-y-3 pt-4">
//             <button onClick={() => setIsMapFullScreen(true)} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold">
//               📍 {selectedBoundary.length > 0 ? "Change Area Shape" : "Draw Area on Map"}
//             </button>
//             <div className="flex gap-2">
//               <button onClick={handleSave} disabled={!eventId || selectedBoundary.length === 0 || isSaving} className="flex-[2] py-4 bg-blue-600 disabled:bg-slate-200 text-white rounded-xl font-bold">
//                 {isSaving ? "Saving..." : editingId ? "Update Area" : "Save New Area"}
//               </button>
//               <button onClick={resetForm} className="flex-1 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition">+ New</button>
//             </div>
//           </div>
//         </div>

//         <div className="md:col-span-7 bg-slate-50 flex flex-col items-center justify-center p-12">
//           {selectedBoundary.length > 0 ? (
//             <div className="text-center">
//               <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4 border-4" style={{ borderColor: formData.color }}>
//                 {formData.markerImage ? <img src={formData.markerImage} className="w-10 h-10 object-contain" alt="preview" /> : "✓"}
//               </div>
//               <p className="font-bold text-slate-700">Area Shape Recorded</p>
//               <p className="text-xs text-slate-400">Height: {formData.height}m</p>
//             </div>
//           ) : <p className="text-slate-400 font-bold">No Map Area Drawn</p>}
//         </div>
//       </div>


//       <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
//         <h3 className="text-lg font-bold mb-4 text-slate-700">Existing Service Areas ({services.length})</h3>
//         <div className="grid grid-cols-1 gap-3">
//           {services.map((service) => (
//             <div key={service.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
//               <div className="flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm" style={{ borderLeft: `4px solid ${service.color}` }}>
//                   {service.markerImage ? <img src={service.markerImage} className="w-6 h-6 object-contain" alt="marker" /> : "📍"}
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-slate-800 leading-none">{service.name}</h4>
//                   <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{service.text || "No description"}</p>
//                 </div>
//               </div>
//               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
//                 <button onClick={() => handleDuplicate(service)} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-200">Duplicate</button>
//                 <button onClick={() => handleEdit(service)} className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200">Edit</button>
//                 <button onClick={() => handleDelete(service.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">Delete</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }



'use client';

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
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
    height: 20 // Added initial height
  });
  

  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEventBoundary = useCallback(async () => {
    if (!eventId) return;
    try {
      const eventSnap = await getDoc(doc(db, "events", eventId));
      if (eventSnap.exists()) {
        const rawCoords = eventSnap.data().boundaryCoords;
        if (rawCoords && Array.isArray(rawCoords)) {
          const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
          setEventAreaBoundary([formatted]);
        }
      }
    } catch (e) { console.error(e); }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    fetchEventBoundary();
    const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (snap.exists()) {
        setServices(snap.data().serviceBoundaries || []);
      }
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
      height: service.height || 20 // Populate height
    });
    setSelectedBoundary(service.boundary);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (service: any) => {
    const shiftedBoundary = service.boundary.map((pt: any) => ({
      lng: pt.lng + 0.0002,
      lat: pt.lat + 0.0002
    }));
    setEditingId(null);
    setFormData({
      name: `${service.name} (Copy)`,
      text: service.text,
      color: service.color,
      markerImage: service.markerImage || "",
      popupImage: service.popupImage || "",
      height: service.height || 20
    });
    setSelectedBoundary(shiftedBoundary);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this area?")) return;
    try {
      const eventRef = doc(db, "events", eventId);
      const updatedList = services.filter(s => s.id !== id);
      await updateDoc(eventRef, { serviceBoundaries: updatedList });
    } catch (e) { alert("Delete failed"); }
  };

  const handleLocationSelect = (feature: any) => {
    if (feature?.geometry?.type === "Polygon") {
      const ring = feature.geometry.coordinates[0];
      const cleanPoints = ring.map((pt: any) => ({ lng: pt[0], lat: pt[1] }));
      setSelectedBoundary(cleanPoints);
    }
  };

  const handleSave = async () => {
    if (!eventId) return alert("Select Event ID");
    if (selectedBoundary.length < 3) return alert("Please draw the area on the map first");

    setIsSaving(true);
    const serviceData = {
      id: editingId || `service_${Date.now()}`,
      name: formData.name || "Unnamed Service",
      text: formData.text || "",
      color: formData.color,
      markerImage: formData.markerImage,
      popupImage: formData.popupImage,
      boundary: selectedBoundary,
      height: Number(formData.height), // Save height as a number
      status: "active"
    };

    try {
      const eventRef = doc(db, "events", eventId);
      let updatedList = editingId
        ? services.map(s => s.id === editingId ? serviceData : s)
        : [...services, serviceData];

      await updateDoc(eventRef, { serviceBoundaries: updatedList });
      alert("Saved successfully!");
      resetForm();
    } catch (error) {
      alert("Error saving data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen rounded-2xl">
      {isMapFullScreen && (
        <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col">
          <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
            <span>Drawing: {formData.name || "Area"}</span>
            <button onClick={() => setIsMapFullScreen(false)} className="px-6 py-2 bg-blue-600 rounded-lg font-bold">Confirm Shape</button>
          </div>
          <div className="flex-1 relative">
            <MapPicker
              key={editingId || 'new'} // Forces a fresh map when switching items
              mode="draw_polygon"
              onLocationSelect={handleLocationSelect}
              boundary={eventAreaBoundary}
              initialValue={selectedBoundary.length > 0 ? [selectedBoundary.map(p => [p.lng, p.lat])] : undefined}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-200">
        <div className="md:col-span-5 p-8 border-r border-slate-100 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Area" : "New Area"}</h2>
            {editingId && <button onClick={resetForm} className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Cancel Edit</button>}
          </div>

          <div className="space-y-4">
            <input placeholder="Area Name" className="w-full bg-slate-50 border-2 p-3 rounded-xl outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <textarea placeholder="Description" className="w-full bg-slate-50 border-2 p-3 rounded-xl outline-none h-20 resize-none" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} />

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Marker Icon URL" className="bg-slate-50 border-2 p-2 rounded-lg text-xs outline-none" value={formData.markerImage} onChange={(e) => setFormData({ ...formData, markerImage: e.target.value })} />
              <input placeholder="Popup Image URL" className="bg-slate-50 border-2 p-2 rounded-lg text-xs outline-none" value={formData.popupImage} onChange={(e) => setFormData({ ...formData, popupImage: e.target.value })} />
            </div>

            {/* Height input added here */}
            <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center border-2 border-slate-100">
              <span className="text-sm font-bold">3D Height</span>
              <input type="number" className="w-20 bg-white p-2 rounded-lg text-sm outline-none" value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
              <span className="text-sm font-bold">Theme Color</span>
              <input type="color" className="h-10 w-16 cursor-pointer" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button onClick={() => setIsMapFullScreen(true)} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold">
              📍 {selectedBoundary.length > 0 ? "Change Area Shape" : "Draw Area on Map"}
            </button>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!eventId || selectedBoundary.length === 0 || isSaving} className="flex-[2] py-4 bg-blue-600 disabled:bg-slate-200 text-white rounded-xl font-bold">
                {isSaving ? "Saving..." : editingId ? "Update Area" : "Save New Area"}
              </button>
              <button onClick={resetForm} className="flex-1 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition">+ New</button>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 bg-slate-50 flex flex-col items-center justify-center p-12">
          {selectedBoundary.length > 0 ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4 border-4" style={{ borderColor: formData.color }}>
                {formData.markerImage ? <img src={formData.markerImage} className="w-10 h-10 object-contain" alt="preview" /> : "✓"}
              </div>
              <p className="font-bold text-slate-700">Area Shape Recorded</p>
              <p className="text-xs text-slate-400">Height: {formData.height}m</p>
            </div>
          ) : <p className="text-slate-400 font-bold">No Map Area Drawn</p>}
        </div>
      </div>


      <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold mb-4 text-slate-700">Existing Service Areas ({services.length})</h3>
        <div className="grid grid-cols-1 gap-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm" style={{ borderLeft: `4px solid ${service.color}` }}>
                  {service.markerImage ? <img src={service.markerImage} className="w-6 h-6 object-contain" alt="marker" /> : "📍"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 leading-none">{service.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{service.text || "No description"}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleDuplicate(service)} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-200">Duplicate</button>
                <button onClick={() => handleEdit(service)} className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200">Edit</button>
                <button onClick={() => handleDelete(service.id)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}