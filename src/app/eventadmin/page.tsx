

// "use client";

// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
// import { EventIdProvider, useEventId } from "@/app/eventadmin/Eventidcontext";

// // Sub-page Imports
// import LocationMarkers from "@/app/eventadmin/locationmarkers/page";
// import SpecialMarkers from "@/app/eventadmin/specialmarkers/page";
// import GameSettings from "@/app/eventadmin/setting/page";
// import ProgressBarAdmin from "@/app/eventadmin/progressbar/page";
// import EventAreaAdmin from "@/app/eventadmin/eventarea/page";
// import StallMarkerAdmin from "@/app/eventadmin/stallmarker/page";
// import LaGarauPlanner from "@/app/eventadmin/3dobject/page";

// import AdminQRMarkers from "@/app/eventadmin/qrcodemarkers/page";
// import AdminQuiz from "@/app/eventadmin/quiz/page";
// import AdminPrizePage from "./prize/page";
// import RouletteAdmin from "./roulette/page";
// import BoundaryMarkerAdmin from "./servicemarkers/page";

// const tabs = [
//   { id: "eventarea", label: "Event Area", icon: "🗺️" },
//   { id: "group_markers", label: "Event Markers", icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
//   { id: "location", label: "Location Markers", icon: "📍", indent: true, parent: "group_markers" },
//   { id: "qrcodemarker", label: "QR Markers", icon: "🔳", indent: true, parent: "group_markers" },
//   { id: "special", label: "Special Markers", icon: "⭐", indent: true, parent: "group_markers" },
//   { id: "progress", label: "Progress Bar", icon: "📊" },
//   { id: "quiz", label: "Quiz Management", icon: "🧠" },
//   { id: "group_rewards", label: "Rewards & Games", icon: "🎁", isHeader: true, children: ["prize", "roulette"] },
//   { id: "prize", label: "Prize Management", icon: "🎁", indent: true, parent: "group_rewards" },
//   { id: "roulette", label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },
//   { id: "group_stalls", label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["stall", "planner", "servicemarkers"] },
//   { id: "stall", label: "Stall Marker", icon: "🏪", indent: true, parent: "group_stalls" },
//   { id: "planner", label: "3d marker", icon: "🏗️", indent: true, parent: "group_stalls" },
//   { id: "servicemarkers", label: "Service Markers", icon: "🔧", indent: true, parent: "group_stalls" },
//   { id: "settings", label: "Game Settings", icon: "⚙️" },
// ];

// interface EventData {
//   id: string;
//   name: string;
//   description: string;
//   image: string;
//   lat: number;
//   lng: number;
//   radius: number;
//   status: "active" | "inactive";
// }

// const initialState: EventData = {
//   id: "",
//   name: "",
//   description: "",
//   image: "",
//   lat: 0,
//   lng: 0,
//   radius: 0,
//   status: "active",
// };

// function EventPicker({ onSelect }: { onSelect: (id: string) => void }) {
//   const [events, setEvents] = useState<EventData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [form, setForm] = useState<EventData>(initialState);

//   const fetchEvents = async () => {
//     setLoading(true);
//     try {
//       const snap = await getDocs(collection(db, "events"));
//       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventData));
//       setEvents(list);
//     } catch (e) {
//       console.error("Fetch error:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchEvents(); }, []);

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const slug = form.id.trim().toLowerCase().replace(/\s+/g, "-");
//     if (!slug || !form.name.trim()) return alert("Required fields missing");
//     setSaving(true);
//     try {
//       await setDoc(doc(db, "events", slug), { ...form, updatedAt: new Date().toISOString() });
//       alert(isEditing ? "Updated!" : "Created!");
//       await fetchEvents();
//       if (!isEditing) onSelect(slug);
//       resetForm();
//     } catch (e: any) { alert(e.message); } finally { setSaving(false); }
//   };

//   const resetForm = () => { setForm(initialState); setIsEditing(false); setShowForm(false); };
//   const startEdit = (ev: EventData) => { setForm({ ...ev }); setIsEditing(true); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
//   const handleDelete = async (id: string) => {
//     if (!confirm(`Delete ${id}?`)) return;
//     try { await deleteDoc(doc(db, "events", id)); fetchEvents(); } catch (e) { alert("Delete failed"); }
//   };

//   return (
//     <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center py-8 md:py-16 px-4 md:px-6 font-sans">
//       <div className="text-center mb-8">
//         <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Admin Dashboard</h1>
//         <p className="text-sm text-slate-500 mt-2">Ghumante Yuwa Phase 2</p>
//       </div>

//       <div className="w-full max-w-2xl">
//         {showForm ? (
//           <div className="bg-white rounded-2xl border border-blue-200 p-5 md:p-8 mb-8 shadow-xl">
//             <h2 className="text-lg font-bold text-blue-800 mb-6">{isEditing ? "📝 Edit Event" : "✨ New Event"}</h2>
//             <form onSubmit={handleSave} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="flex flex-col"><label style={labelStyle}>Event ID *</label><input disabled={isEditing} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={inputStyle} className="disabled:opacity-50" /></div>
//                 <div className="flex flex-col"><label style={labelStyle}>Display Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></div>
//               </div>
//               <div><label style={labelStyle}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 60, resize: "none" }} /></div>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div><label style={labelStyle}>Lat</label><input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} /></div>
//                 <div><label style={labelStyle}>Lng</label><input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} /></div>
//                 <div><label style={labelStyle}>Radius</label><input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} /></div>
//               </div>

//               {/* ✅ Status field — uses form.status */}
//               <div className="flex flex-col">
//                 <label style={labelStyle}>Status</label>
//                 <select
//                   value={form.status}
//                   onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
//                   style={inputStyle}
//                 >
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>

//               <div className="flex flex-col md:flex-row gap-3 pt-4">
//                 <button type="button" onClick={resetForm} className="flex-1 py-3 border rounded-xl font-semibold text-slate-500">Cancel</button>
//                 <button type="submit" disabled={saving} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">{saving ? "..." : isEditing ? "Update" : "Create"}</button>
//               </div>
//             </form>
//           </div>
//         ) : (
//           <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold mb-8">+ New Event</button>
//         )}

//         <div className="space-y-3">
//           {/* Admin sees all events; inactive are dimmed and cannot be selected */}
//           {events.map((ev) => (
//             <div key={ev.id} className={`bg-white border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${ev.status === "inactive" ? "opacity-50" : ""}`}>
//               <div className="flex items-center gap-3 cursor-pointer" onClick={() => ev.status === "active" && onSelect(ev.id)}>
//                 <div className="w-10 h-10 bg-blue-50 rounded-lg flex-shrink-0 flex items-center justify-center">📅</div>
//                 <div className="min-w-0">
//                   <h4 className="font-bold text-slate-800 truncate">{ev.name}</h4>
//                   <p className="text-[10px] text-slate-400">ID: {ev.id}</p>
//                 </div>
//               </div>
//               <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-0 pt-3 sm:pt-0">
//                 <span className={`text-[9px] px-2 py-1 rounded-full border ${ev.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>{ev.status}</span>
//                 <div className="flex gap-1">
//                   <button onClick={() => startEdit(ev)} className="p-2 text-sm">✏️</button>
//                   <button onClick={() => handleDelete(ev.id)} className="p-2 text-sm">🗑️</button>
//                   <button disabled={ev.status === "inactive"} onClick={() => onSelect(ev.id)} className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">Select</button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function AdminShell() {
//   const { eventId, setEventId } = useEventId();
//   const [activeTab, setActiveTab] = useState("eventarea");
//   const [openGroup, setOpenGroup] = useState<string | null>(null);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   if (!eventId) return <EventPicker onSelect={(id) => { setEventId(id); setActiveTab("eventarea"); }} />;

//   const renderContent = () => {
//     const components: any = { eventarea: <EventAreaAdmin />, location: <LocationMarkers />, qrcodemarker: <AdminQRMarkers />, special: <SpecialMarkers />, settings: <GameSettings />, progress: <ProgressBarAdmin />, stall: <StallMarkerAdmin />, planner: <LaGarauPlanner />, quiz: <AdminQuiz />, prize: <AdminPrizePage />, roulette: <RouletteAdmin />, servicemarkers: <BoundaryMarkerAdmin /> };
//     return components[activeTab] || <EventAreaAdmin />;
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-100 md:flex-row overflow-hidden">
//       {/* Mobile Top Bar */}
//       <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm z-50">
//         <h1 className="font-bold text-blue-600">Admin Panel</h1>
//         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl p-1">{isMobileMenuOpen ? "✕" : "☰"}</button>
//       </div>

//       {/* Sidebar - Animated Mobile Drawer */}
//       <nav className={`
//         fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
//         ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
//       `}>
//         <div className="flex flex-col h-full">
//           <div className="p-5 border-b hidden md:block">
//             <h1 className="font-bold text-xl text-blue-600">Admin Panel</h1>
//           </div>

//           <div className="px-4 py-3 border-b bg-blue-50">
//             <div className="flex items-center justify-between gap-2">
//               <p className="text-sm font-bold text-blue-700 truncate">{eventId}</p>
//               <button onClick={() => setEventId("")} className="text-[10px] px-2 py-1 bg-white border rounded">Switch</button>
//             </div>
//           </div>

//           <ul className="flex-1 overflow-y-auto p-3 space-y-1">
//             {tabs.map((tab) => {
//               if (tab.isHeader) return (
//                 <li key={tab.id} className="pt-2">
//                   <button onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)} className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-bold uppercase tracking-wider">
//                     {tab.label} <span>{openGroup === tab.id ? "−" : "+"}</span>
//                   </button>
//                 </li>
//               );
//               if (tab.indent && openGroup !== tab.parent) return null;
//               return (
//                 <li key={tab.id}>
//                   <button onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
//                     <span>{tab.icon}</span> {tab.label}
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       </nav>

//       {/* Overlay for mobile menu */}
//       {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

//       <main className="flex-1 overflow-y-auto">
//         <div className="p-4 md:p-8 max-w-full overflow-x-hidden">
//           {renderContent()}
//         </div>
//       </main>
//     </div>
//   );
// }

// export default function AdminDashboard() {
//   return (<EventIdProvider><AdminShell /></EventIdProvider>);
// }

// const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" };
// const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#f8fafc" };



"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { EventIdProvider, useEventId } from "@/app/eventadmin/Eventidcontext";

// Sub-page Imports
import LocationMarkers from "@/app/eventadmin/locationmarkers/page";
import SpecialMarkers from "@/app/eventadmin/specialmarkers/page";
import GameSettings from "@/app/eventadmin/setting/page";
import ProgressBarAdmin from "@/app/eventadmin/progressbar/page";
import EventAreaAdmin from "@/app/eventadmin/eventarea/page";
import StallMarkerAdmin from "@/app/eventadmin/stallmarker/page";
import LaGarauPlanner from "@/app/eventadmin/3dobject/page";

import AdminQRMarkers from "@/app/eventadmin/qrcodemarkers/page";
import AdminQuiz from "@/app/eventadmin/quiz/page";
import AdminPrizePage from "./prize/page";
import RouletteAdmin from "./roulette/page";
import BoundaryMarkerAdmin from "./servicemarkers/page";

const tabs = [
  { id: "eventarea", label: "Event Area", icon: "🗺️" },
  { id: "group_markers", label: "Event Markers", icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
  { id: "location", label: "Location Markers", icon: "📍", indent: true, parent: "group_markers" },
  { id: "qrcodemarker", label: "QR Markers", icon: "🔳", indent: true, parent: "group_markers" },
  { id: "special", label: "Special Markers", icon: "⭐", indent: true, parent: "group_markers" },
  { id: "progress", label: "Progress Bar", icon: "📊" },
  { id: "quiz", label: "Quiz Management", icon: "🧠" },
  { id: "group_rewards", label: "Rewards & Games", icon: "🎁", isHeader: true, children: ["prize", "roulette"] },
  { id: "prize", label: "Prize Management", icon: "🎁", indent: true, parent: "group_rewards" },
  { id: "roulette", label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },
  { id: "group_stalls", label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["stall", "planner", "servicemarkers"] },
  { id: "stall", label: "Stall Marker", icon: "🏪", indent: true, parent: "group_stalls" },
  { id: "planner", label: "3d marker", icon: "🏗️", indent: true, parent: "group_stalls" },
  { id: "servicemarkers", label: "Service Markers", icon: "🔧", indent: true, parent: "group_stalls" },
  { id: "settings", label: "Game Settings", icon: "⚙️" },
];

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
  id: "",
  name: "",
  description: "",
  image: "",
  lat: 0,
  lng: 0,
  radius: 0,
  status: "active",
};

function EventPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventData>(initialState);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "events"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventData));
      setEvents(list);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug || !form.name.trim()) return alert("Required fields missing");
    setSaving(true);
    try {
      await setDoc(doc(db, "events", slug), { ...form, updatedAt: new Date().toISOString() });
      alert(isEditing ? "Updated!" : "Created!");
      await fetchEvents();
      if (!isEditing) onSelect(slug);
      resetForm();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  const resetForm = () => { setForm(initialState); setIsEditing(false); setShowForm(false); };
  const startEdit = (ev: EventData) => { setForm({ ...ev }); setIsEditing(true); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleDelete = async (id: string) => {
    if (!confirm(`Delete ${id}?`)) return;
    try { await deleteDoc(doc(db, "events", id)); fetchEvents(); } catch (e) { alert("Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center py-8 md:py-16 px-4 md:px-6 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2">Ghumante Yuwa Phase 2</p>
      </div>

      <div className="w-full max-w-2xl">
        {showForm ? (
          <div className="bg-white rounded-2xl border border-blue-200 p-5 md:p-8 mb-8 shadow-xl">
            <h2 className="text-lg font-bold text-blue-800 mb-6">{isEditing ? "📝 Edit Event" : "✨ New Event"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col"><label style={labelStyle}>Event ID *</label><input disabled={isEditing} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={inputStyle} className="disabled:opacity-50" /></div>
                <div className="flex flex-col"><label style={labelStyle}>Display Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 60, resize: "none" }} /></div>
              <div className="flex flex-col gap-2">
                <label style={labelStyle}>Image URL</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." style={inputStyle} />
                {form.image ? (
                  <img src={form.image} alt="Preview" onError={(e) => (e.currentTarget.style.display = "none")} className="w-full h-36 object-cover rounded-xl border border-slate-200 mt-1" />
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label style={labelStyle}>Lat</label><input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Lng</label><input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Radius</label><input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} /></div>
              </div>

              {/* ✅ Status field — uses form.status */}
              <div className="flex flex-col">
                <label style={labelStyle}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  style={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-3 border rounded-xl font-semibold text-slate-500">Cancel</button>
                <button type="submit" disabled={saving} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">{saving ? "..." : isEditing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold mb-8">+ New Event</button>
        )}

        <div className="space-y-3">
          {/* Admin sees all events; inactive are dimmed and cannot be selected */}
          {events.map((ev) => (
            <div key={ev.id} className={`bg-white border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${ev.status === "inactive" ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => ev.status === "active" && onSelect(ev.id)}>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex-shrink-0 flex items-center justify-center">📅</div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{ev.name}</h4>
                  <p className="text-[10px] text-slate-400">ID: {ev.id}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-0 pt-3 sm:pt-0">
                <span className={`text-[9px] px-2 py-1 rounded-full border ${ev.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>{ev.status}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(ev)} className="p-2 text-sm">✏️</button>
                  <button onClick={() => handleDelete(ev.id)} className="p-2 text-sm">🗑️</button>
                  <button disabled={ev.status === "inactive"} onClick={() => onSelect(ev.id)} className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">Select</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminShell() {
  const { eventId, setEventId } = useEventId();
  const [activeTab, setActiveTab] = useState("eventarea");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!eventId) return <EventPicker onSelect={(id) => { setEventId(id); setActiveTab("eventarea"); }} />;

  const renderContent = () => {
    const components: any = { eventarea: <EventAreaAdmin />, location: <LocationMarkers />, qrcodemarker: <AdminQRMarkers />, special: <SpecialMarkers />, settings: <GameSettings />, progress: <ProgressBarAdmin />, stall: <StallMarkerAdmin />, planner: <LaGarauPlanner />, quiz: <AdminQuiz />, prize: <AdminPrizePage />, roulette: <RouletteAdmin />, servicemarkers: <BoundaryMarkerAdmin /> };
    return components[activeTab] || <EventAreaAdmin />;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm z-50">
        <h1 className="font-bold text-blue-600">Admin Panel</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl p-1">{isMobileMenuOpen ? "✕" : "☰"}</button>
      </div>

      {/* Sidebar - Animated Mobile Drawer */}
      <nav className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b hidden md:block">
            <h1 className="font-bold text-xl text-blue-600">Admin Panel</h1>
          </div>

          <div className="px-4 py-3 border-b bg-blue-50">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-blue-700 truncate">{eventId}</p>
              <button onClick={() => setEventId("")} className="text-[10px] px-2 py-1 bg-white border rounded">Switch</button>
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto p-3 space-y-1">
            {tabs.map((tab) => {
              if (tab.isHeader) return (
                <li key={tab.id} className="pt-2">
                  <button onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)} className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-bold uppercase tracking-wider">
                    {tab.label} <span>{openGroup === tab.id ? "−" : "+"}</span>
                  </button>
                </li>
              );
              if (tab.indent && openGroup !== tab.parent) return null;
              return (
                <li key={tab.id}>
                  <button onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-full overflow-x-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (<EventIdProvider><AdminShell /></EventIdProvider>);
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#f8fafc" };