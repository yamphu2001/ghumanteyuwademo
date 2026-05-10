// "use client";

// import React, { useEffect, useState, useMemo } from 'react';
// import { useLandmarkStore } from '@/store/useLandmarkStore';
// import { addLandmark, deleteLandmark, updateLandmark } from '@/lib/landmarkService'; 
// import type { Landmark, LandmarkType } from '@/features/frontend/play/LocationMarkers/Landmark';
// import { Trash2, Edit2, Check, X, Search, PlusCircle, ImageIcon, MapPin } from 'lucide-react';

// const EMPTY_FORM = {
//   name: '',
//   description: '',
//   lng: '',
//   lat: '',
//   image: '',        // NOW EMPTY: Admin must provide Pin URL
//   popupImage: '',    // Actual Photo
//   type: 'landmark' as LandmarkType,
// };

// export default function AdminLandmarkPage() {
//   const landmarks = useLandmarkStore((s) => s.landmarks);
//   const fetchLandmarks = useLandmarkStore((s) => s.fetchLandmarks);

//   const [form, setForm] = useState(EMPTY_FORM);
//   const [saving, setSaving] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editForm, setEditForm] = useState<Partial<Landmark>>({});
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => { fetchLandmarks(); }, [fetchLandmarks]);

//   const filteredLandmarks = useMemo(() => {
//     return landmarks.filter(lm => 
//       lm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       lm.type.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [landmarks, searchTerm]);

//   const handleAdd = async () => {
//     if (!form.name || !form.lng || !form.lat || !form.image) {
//         alert("Please fill in Name, Coordinates, and Marker Icon URL");
//         return;
//     }
//     setSaving(true);
//     try {
//       await addLandmark({
//         ...form,
//         coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
//       });
//       await fetchLandmarks();
//       setForm(EMPTY_FORM);
//     } catch (err) {
//       console.error("Failed to add:", err);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const startEdit = (lm: Landmark) => {
//     setEditingId(lm.id);
//     setEditForm(lm);
//   };

//   const handleUpdate = async () => {
//     if (!editingId || !editForm.name) return;
//     try {
//       await updateLandmark(editingId, editForm);
//       await fetchLandmarks();
//       setEditingId(null);
//     } catch (err) {
//       alert("Update failed");
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (confirm("Are you sure you want to delete this landmark?")) {
//       await deleteLandmark(id);
//       await fetchLandmarks();
//     }
//   };

//   return (
//     <div className="p-8 max-w-7xl mx-auto font-sans text-slate-800">
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Landmark Manager</h1>
//         <div className="relative">
//           <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
//           <input 
//             className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
//             placeholder="Search landmarks..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//       </header>

//       {/* Quick Add Section */}
//       <section className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-10 shadow-sm">
//         <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
//           <PlusCircle size={16} /> Create New Landmark
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />

//           <div className="flex gap-2">
//             <input className="input-field w-1/2" placeholder="Lng" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} />
//             <input className="input-field w-1/2" placeholder="Lat" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} />
//           </div>

//           <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value as LandmarkType})}>
//             {['temple', 'stupa', 'bazaar', 'shrine', 'landmark'].map(t => <option key={t} value={t}>{t}</option>)}
//           </select>

//           {/* DYNAMIC ICON INPUT */}
//           <input className="input-field" placeholder="Marker Icon URL (e.g. /pin.png)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />

//           <input className="input-field lg:col-span-2" placeholder="Popup Photo URL" value={form.popupImage} onChange={e => setForm({...form, popupImage: e.target.value})} />

//           <input className="input-field lg:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

//           <button 
//             onClick={handleAdd} 
//             disabled={saving}
//             className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400 col-span-full"
//           >
//             {saving ? 'Creating...' : 'Add Landmark to Database'}
//           </button>
//         </div>
//       </section>

//       {/* Data Table */}
//       <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-slate-50 border-b border-slate-200">
//             <tr>
//               <th className="px-6 py-4 font-semibold text-slate-700">Previews</th>
//               <th className="px-6 py-4 font-semibold text-slate-700">Name / Type</th>
//               <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
//               <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {filteredLandmarks.map((lm) => (
//               <tr key={lm.id} className="hover:bg-slate-50/50 transition-colors">

//                 {/* Previews Column */}
//                 <td className="px-6 py-4">
//                   <div className="flex items-center gap-3">
//                     {/* Pin Preview */}
//                     <div className="text-center">
//                       <div className="w-10 h-10 rounded-full border bg-white flex items-center justify-center overflow-hidden mb-1">
//                         {lm.image ? <img src={lm.image} className="w-6 h-6 object-contain" /> : <MapPin size={14}/>}
//                       </div>
//                       <span className="text-[10px] text-slate-400 uppercase">Pin</span>
//                     </div>
//                     {/* Popup Photo Preview */}
//                     <div className="text-center">
//                       <div className="w-14 h-10 rounded border bg-slate-100 flex items-center justify-center overflow-hidden mb-1">
//                         {lm.popupImage ? <img src={lm.popupImage} className="w-full h-full object-cover" /> : <ImageIcon size={14}/>}
//                       </div>
//                       <span className="text-[10px] text-slate-400 uppercase">Photo</span>
//                     </div>
//                   </div>
//                 </td>

//                 <td className="px-6 py-4">
//                   {editingId === lm.id ? (
//                     <div className="flex flex-col gap-2">
//                       <input className="p-1 border rounded text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
//                       <input className="p-1 border rounded text-xs" placeholder="Icon URL" value={editForm.image} onChange={e => setEditForm({...editForm, image: e.target.value})} />
//                     </div>
//                   ) : (
//                     <div>
//                       <div className="font-bold text-slate-900">{lm.name}</div>
//                       <div className="text-xs text-blue-600 font-medium uppercase">{lm.type}</div>
//                       <div className="text-[10px] text-slate-400 font-mono mt-1">{lm.coordinates[0].toFixed(4)}, {lm.coordinates[1].toFixed(4)}</div>
//                     </div>
//                   )}
//                 </td>

//                 <td className="px-6 py-4 text-sm text-slate-600">
//                    {editingId === lm.id ? (
//                      <div className="flex flex-col gap-2">
//                         <input className="p-1 border rounded text-xs" placeholder="Photo URL" value={editForm.popupImage} onChange={e => setEditForm({...editForm, popupImage: e.target.value})} />
//                         <textarea className="p-1 border rounded text-xs" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
//                      </div>
//                    ) : (
//                      <p className="line-clamp-2 max-w-xs">{lm.description || 'No description'}</p>
//                    )}
//                 </td>

//                 <td className="px-6 py-4 text-right">
//                   <div className="flex justify-end gap-2">
//                     {editingId === lm.id ? (
//                       <>
//                         <button onClick={handleUpdate} className="p-2 bg-green-100 text-green-700 rounded-lg">
//                           <Check size={18} />
//                         </button>
//                         <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-700 rounded-lg">
//                           <X size={18} />
//                         </button>
//                       </>
//                     ) : (
//                       <>
//                         <button onClick={() => startEdit(lm)} className="p-2 text-slate-400 hover:text-blue-600">
//                           <Edit2 size={18} />
//                         </button>
//                         <button onClick={() => handleDelete(lm.id)} className="p-2 text-slate-400 hover:text-red-600">
//                           <Trash2 size={18} />
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <style jsx>{`
//         .input-field {
//           @apply px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all;
//         }
//       `}</style>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useLandmarkStore } from '@/store/useLandmarkStore';
import { addLandmark, deleteLandmark, updateLandmark } from '@/lib/landmarkService';
import type { Landmark, LandmarkType } from '@/features/frontend/play/LocationMarkers/Landmark';
import { Trash2, Edit2, Check, X, Search, PlusCircle, ImageIcon, MapPin } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  description: '',
  lng: '',
  lat: '',
  image: '',        // NOW EMPTY: Admin must provide Pin URL
  popupImage: '',    // Actual Photo
  type: 'landmark' as LandmarkType,
};

export default function AdminLandmarkPage() {
  const landmarks = useLandmarkStore((s) => s.landmarks);
  const fetchLandmarks = useLandmarkStore((s) => s.fetchLandmarks);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Landmark>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [jsonInput, setJsonInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);


  const handleBulkUpload = async () => {
  if (!jsonInput) {
    alert("Paste JSON data first");
    return;
  }

  setBulkLoading(true);

  try {
    const parsed = JSON.parse(jsonInput);

    if (!Array.isArray(parsed)) {
      alert("JSON must be an array of landmarks");
      return;
    }

    for (const item of parsed) {
      // ✅ SUPPORT BOTH FORMATS WITHOUT CHANGING UI
      let lng = item.lng;
      let lat = item.lat;

      // fallback: coordinates array format
      if ((!lng || !lat) && Array.isArray(item.coordinates)) {
        lng = item.coordinates[0];
        lat = item.coordinates[1];
      }

      if (!item.name || !lng || !lat || !item.image) continue;

      await addLandmark({
        name: item.name,
        description: item.description || "",
        coordinates: [parseFloat(String(lng)), parseFloat(String(lat))],
        image: item.image,
        popupImage: item.popupImage || "",
        type: item.type || "landmark",
      });
    }

    await fetchLandmarks();
    setJsonInput("");

    alert("Bulk upload successful 🚀");
  } catch (err) {
    console.error(err);
    alert("Invalid JSON format");
  } finally {
    setBulkLoading(false);
  }
};

  useEffect(() => { fetchLandmarks(); }, [fetchLandmarks]);

  const filteredLandmarks = useMemo(() => {
    return landmarks.filter(lm =>
      lm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lm.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [landmarks, searchTerm]);

  const handleAdd = async () => {
    if (!form.name || !form.lng || !form.lat || !form.image) {
      alert("Please fill in Name, Coordinates, and Marker Icon URL");
      return;
    }
    setSaving(true);
    try {
      await addLandmark({
        ...form,
        coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
      });
      await fetchLandmarks();
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Failed to add:", err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (lm: Landmark) => {
    setEditingId(lm.id);
    setEditForm(lm);
  };

  const handleUpdate = async () => {
    if (!editingId || !editForm.name) return;
    try {
      await updateLandmark(editingId, editForm);
      await fetchLandmarks();
      setEditingId(null);
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this landmark?")) {
      await deleteLandmark(id);
      await fetchLandmarks();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-800">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Landmark Manager</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Search landmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Bulk JSON Upload */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 mb-10 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Bulk Upload (JSON)
            </h2>

            <textarea
              className="w-full h-40 p-3 border rounded-lg font-mono text-xs"
              placeholder={`Paste JSON like:
[
  {
    "name": "Pashupatinath Temple",
    "description": "Famous Hindu temple",
    "coordinates": [85.3488, 27.7104],
    "image": "/images/pin.png",
    "popupImage": "https://example.com/image.jpg",
    "type": "temple"
  }
]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />

            <button
              onClick={handleBulkUpload}
              disabled={bulkLoading}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              {bulkLoading ? "Uploading..." : "Upload JSON Data"}
            </button>
          </section>
        </div>
      </header>

      {/* Quick Add Section */}
      <section className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-10 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <PlusCircle size={16} /> Create New Landmark
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

          <div className="flex gap-2">
            <input className="input-field w-1/2" placeholder="Lng" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
            <input className="input-field w-1/2" placeholder="Lat" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
          </div>

          <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as LandmarkType })}>
            {['temple', 'stupa', 'bazaar', 'shrine', 'landmark'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* DYNAMIC ICON INPUT */}
          <input className="input-field" placeholder="Marker Icon URL (e.g. /pin.png)" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />

          <input className="input-field lg:col-span-2" placeholder="Popup Photo URL" value={form.popupImage} onChange={e => setForm({ ...form, popupImage: e.target.value })} />

          <input className="input-field lg:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          <button
            onClick={handleAdd}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400 col-span-full"
          >
            {saving ? 'Creating...' : 'Add Landmark to Database'}
          </button>
        </div>
      </section>

      {/* Data Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Previews</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Name / Type</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLandmarks.map((lm) => (
              <tr key={lm.id} className="hover:bg-slate-50/50 transition-colors">

                {/* Previews Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Pin Preview */}
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full border bg-white flex items-center justify-center overflow-hidden mb-1">
                        {lm.image ? <img src={lm.image} className="w-6 h-6 object-contain" /> : <MapPin size={14} />}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">Pin</span>
                    </div>
                    {/* Popup Photo Preview */}
                    <div className="text-center">
                      <div className="w-14 h-10 rounded border bg-slate-100 flex items-center justify-center overflow-hidden mb-1">
                        {lm.popupImage ? <img src={lm.popupImage} className="w-full h-full object-cover" /> : <ImageIcon size={14} />}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">Photo</span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {editingId === lm.id ? (
                    <div className="flex flex-col gap-2">
                      <input className="p-1 border rounded text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      <input className="p-1 border rounded text-xs" placeholder="Icon URL" value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} />
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-slate-900">{lm.name}</div>
                      <div className="text-xs text-blue-600 font-medium uppercase">{lm.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{lm.coordinates[0].toFixed(4)}, {lm.coordinates[1].toFixed(4)}</div>
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {editingId === lm.id ? (
                    <div className="flex flex-col gap-2">
                      <input className="p-1 border rounded text-xs" placeholder="Photo URL" value={editForm.popupImage} onChange={e => setEditForm({ ...editForm, popupImage: e.target.value })} />
                      <textarea className="p-1 border rounded text-xs" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                    </div>
                  ) : (
                    <p className="line-clamp-2 max-w-xs">{lm.description || 'No description'}</p>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === lm.id ? (
                      <>
                        <button onClick={handleUpdate} className="p-2 bg-green-100 text-green-700 rounded-lg">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(lm)} className="p-2 text-slate-400 hover:text-blue-600">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(lm.id)} className="p-2 text-slate-400 hover:text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .input-field {
          @apply px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all;
        }
      `}</style>
    </div>
  );
}