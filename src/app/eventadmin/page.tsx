
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

// import AdminQRMarkers from "@/app/eventadmin/qrcodemarkers/page";
// import AdminQuiz from "@/app/eventadmin/quiz/page";
// import AdminPrizePage from "./prize/page";
// import RouletteAdmin from "./roulette/page";
// import BoundaryMarkerAdmin from "./servicemarkers/page";


// // ── Reordered Tab config ─────────────────────────────────────────────────────
// const tabs = [ 
//   // 1. Event Area (Default)
//   { id: "eventarea", label: "Event Area", icon: "🗺️" },

//   // 2. Event Markers Group
//   { id: "group_markers", label: "Event Markers", icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
//   { id: "location", label: "Location Markers", icon: "📍", indent: true, parent: "group_markers" },
//   { id: "qrcodemarker", label: "QR Markers", icon: "🔳", indent: true, parent: "group_markers" },
//   { id: "special", label: "Special Markers", icon: "⭐", indent: true, parent: "group_markers" },

//   // 3. Progress Bar
//   { id: "progress", label: "Progress Bar", icon: "📊" },

//   // 4. Quiz
//   { id: "quiz", label: "Quiz Management", icon: "🧠" },

//   // 5. Rewards Group
//   { id: "group_rewards", label: "Rewards & Games", icon: "🎁", isHeader: true, children: ["prize", "roulette"] },
//   { id: "prize", label: "Prize Management", icon: "🎁", indent: true, parent: "group_rewards" },
//   { id: "roulette", label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },

//   // 6. Stall & Service Group
//   { id: "group_stalls", label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["stall", "servicemarkers"] },
//   { id: "stall", label: "Stall Marker", icon: "🏪", indent: true, parent: "group_stalls" },
//   { id: "servicemarkers", label: "Service Markers", icon: "🔧", indent: true, parent: "group_stalls" },

//   // 7. Game Settings
//   { id: "settings", label: "Game Settings", icon: "⚙️" },
// ];

// // ── Types ─────────────────────────────────────────────────────────────────────
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
//   id: "", name: "", description: "", image: "",
//   lat: 0, lng: 0, radius: 1000, status: "inactive",
// };

// // ── Consolidated Event Picker & Management ────────────────────────────────────
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
//       const list = snap.docs.map((d) => {
//         const data = d.data();
//         return {
//           id: d.id,
//           name: data.name || "",
//           description: data.description || "",
//           image: data.image || "",
//           lat: data.lat ?? 0,
//           lng: data.lng ?? 0,
//           radius: data.radius ?? 1000,
//           status: data.status || "inactive",
//         } as EventData;
//       });
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
    
//     if (!slug) return alert("Event ID (Slug) is required");
//     if (!form.name.trim()) return alert("Display Name is required");

//     setSaving(true);
//     try {
//       await setDoc(doc(db, "events", slug), {
//         name: form.name.trim(),
//         description: form.description.trim(),
//         image: form.image.trim(),
//         status: form.status,
//         lat: Number(form.lat),
//         lng: Number(form.lng),
//         radius: Number(form.radius),
//         updatedAt: new Date().toISOString(),
//       });
      
//       alert(isEditing ? "Event Updated!" : "Event Created!");
//       await fetchEvents();
//       if (!isEditing) onSelect(slug); 
//       resetForm();
//     } catch (e: any) {
//       alert("Error saving: " + e.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const resetForm = () => {
//     setForm(initialState);
//     setIsEditing(false);
//     setShowForm(false);
//   };

//   const startEdit = (ev: EventData) => {
//     setForm({ ...ev });
//     setIsEditing(true);
//     setShowForm(true);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm(`Are you sure you want to permanently delete event: ${id}?`)) return;
//     try {
//       await deleteDoc(doc(db, "events", id));
//       fetchEvents();
//     } catch (e) {
//       alert("Delete failed");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center py-16 px-6 font-sans">
//       <div className="text-center mb-10">
//         <h1 className="text-3xl font-extrabold text-slate-800 m-0">Admin Dashboard</h1>
//         <p className="text-slate-500 mt-2">Ghumante Yuwa Phase 2 — Select or create an event</p>
//       </div>

//       <div className="w-full max-w-2xl">
//         {showForm ? (
//           <div className="bg-white rounded-2xl border border-blue-200 p-8 mb-8 shadow-xl shadow-blue-900/5">
//             <h2 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
//               {isEditing ? "📝 Edit Event" : "✨ Create New Event"}
//             </h2>

//             <form onSubmit={handleSave} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label style={labelStyle}>Event ID (Slug) *</label>
//                   <input
//                     disabled={isEditing}
//                     placeholder="e.g. ghumante-2024"
//                     value={form.id}
//                     onChange={(e) => setForm({ ...form, id: e.target.value })}
//                     style={inputStyle}
//                     className="disabled:opacity-50 disabled:cursor-not-allowed"
//                   />
//                 </div>
//                 <div>
//                   <label style={labelStyle}>Display Name *</label>
//                   <input
//                     placeholder="e.g. Ghumante Phase 2"
//                     value={form.name}
//                     onChange={(e) => setForm({ ...form, name: e.target.value })}
//                     style={inputStyle}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label style={labelStyle}>Description</label>
//                 <textarea
//                   placeholder="Short event description..."
//                   value={form.description}
//                   onChange={(e) => setForm({ ...form, description: e.target.value })}
//                   style={{ ...inputStyle, height: 60, resize: "none" }}
//                 />
//               </div>

//               <div>
//                 <label style={labelStyle}>Image Path / URL</label>
//                 <input
//                   placeholder="/images/event-banner.jpg"
//                   value={form.image}
//                   onChange={(e) => setForm({ ...form, image: e.target.value })}
//                   style={inputStyle}
//                 />
//               </div>

//               <div className="grid grid-cols-3 gap-4">
//                 <div>
//                   <label style={labelStyle}>Latitude</label>
//                   <input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} />
//                 </div>
//                 <div>
//                   <label style={labelStyle}>Longitude</label>
//                   <input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} />
//                 </div>
//                 <div>
//                   <label style={labelStyle}>Radius (m)</label>
//                   <input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} />
//                 </div>
//               </div>

//               <div>
//                 <label style={labelStyle}>Status</label>
//                 <select 
//                   value={form.status} 
//                   onChange={(e) => setForm({ ...form, status: e.target.value as any })} 
//                   style={inputStyle}
//                 >
//                   <option value="inactive">INACTIVE</option>
//                   <option value="active">ACTIVE</option>
//                 </select>
//               </div>

//               <div className="flex items-center gap-4 pt-4">
//                 <button type="button" onClick={resetForm} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
//                   Cancel
//                 </button>
//                 <button type="submit" disabled={saving} className="flex-[2] py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-lg shadow-blue-200">
//                   {saving ? "Processing..." : isEditing ? "Update Event" : "Create & Open"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         ) : (
//           <button
//             onClick={() => setShowForm(true)}
//             className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all mb-8 shadow-sm"
//           >
//             + Create New Event
//           </button>
//         )}

//         <div className="flex items-center justify-between mb-4">
//            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Existing Events</h3>
//            <span className="text-xs text-slate-400">{events.length} Total</span>
//         </div>

//         {loading ? (
//           <p className="text-center py-10 text-slate-400">Loading events...</p>
//         ) : events.length === 0 ? (
//           <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
//              <p className="text-slate-400 m-0">No events found. Start by creating one!</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {events.map((ev) => (
//               <div key={ev.id} className="group bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-blue-400 hover:shadow-lg transition-all">
//                 <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => onSelect(ev.id)}>
//                   <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl overflow-hidden">
//                     {ev.image ? (
//                       <img src={ev.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "https://placehold.co/100?text=Ev" }} />
//                     ) : "📅"}
//                   </div>
//                   <div>
//                     <h4 className="font-bold text-slate-800 m-0">{ev.name}</h4>
//                     <p className="text-xs text-slate-400 m-0">
//                       ID: <span className="text-blue-500 font-mono">{ev.id}</span> • Radius: {ev.radius}m
//                     </p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${ev.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
//                     {ev.status.toUpperCase()}
//                   </span>
//                   <button onClick={() => startEdit(ev)} title="Edit Details" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">✏️</button>
//                   <button onClick={() => handleDelete(ev.id)} title="Delete Event" className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">🗑️</button>
//                   <button onClick={() => onSelect(ev.id)} className="ml-2 bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Select ›</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ── Main Shell ────────────────────────────────────────────────────────────────
// function AdminShell() {
//   const { eventId, setEventId } = useEventId();
//   // Changed default tab to eventarea
//   const [activeTab, setActiveTab] = useState("eventarea");
//   const [openGroup, setOpenGroup] = useState<string | null>(null);

//   if (!eventId) {
//     return <EventPicker onSelect={(id) => { setEventId(id); setActiveTab("eventarea"); }} />;
//   }

//   const renderContent = () => {
//     switch (activeTab) {
//       case "eventarea":      return <EventAreaAdmin />;
//       case "location":       return <LocationMarkers />;
//       case "qrcodemarker":   return <AdminQRMarkers />;
//       case "special":        return <SpecialMarkers />;
//       case "settings":       return <GameSettings />;
//       case "progress":       return <ProgressBarAdmin />;
//       case "stall":          return <StallMarkerAdmin />;
//       case "quiz":           return <AdminQuiz />;
//       case "prize":          return <AdminPrizePage/>;
//       case "roulette":       return <RouletteAdmin />;
//       case "servicemarkers": return <BoundaryMarkerAdmin />;
//       default:               return <EventAreaAdmin />;
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-100 overflow-hidden">
//       {/* ── Sidebar ── */}
//       <nav className="w-64 bg-white border-r shadow-sm flex flex-col">
//         <div className="p-5 border-b">
//           <h1 className="font-bold text-xl text-blue-600">Admin Panel</h1>
//           <p className="text-xs text-gray-400 mt-0.5">Ghumante Yuwa Phase 2</p>
//         </div>

//         {/* Active event chip */}
//         <div className="px-4 py-3 border-b bg-blue-50">
//           <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">
//             Active Event
//           </p>
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-bold text-blue-700 truncate max-w-[130px]">
//               {eventId}
//             </p>
//             <button
//               onClick={() => setEventId("")}
//               className="text-[10px] px-2 py-1 rounded bg-white border border-blue-200 text-blue-500 font-bold hover:bg-blue-100 transition-colors"
//             >
//               ← Switch
//             </button>
//           </div>
//           <p className="text-[11px] text-green-600 font-medium mt-1">
//             ✅ Live Configuration
//           </p>
//         </div>

//         {/* Nav with Conditional Logic */}
//         <ul className="flex-1 overflow-y-auto space-y-0.5 p-3">
//           {tabs.map((tab) => {
//             // Logic to show/hide sub-items based on parent selection
//             const isChild = !!tab.indent;
//             const isParentOpen = openGroup === tab.parent || (tab.parent && activeTab === tab.id);

//             // Group Header Rendering
//             if (tab.isHeader) {
//               return (
//                 <li key={tab.id} className="pt-2">
//                   <button 
//                     onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)}
//                     className="w-full flex items-center justify-between px-3 py-2 text-[14px] font-bold text-black-600 uppercase tracking-widest hover:text-blue-500 transition-colors"
//                   >
//                     <span>{tab.label}</span>
//                     <span>{openGroup === tab.id ? "−" : "+"}</span>
//                   </button>
//                 </li>
//               );
//             }

//             // Hide children if the group isn't open
//             if (isChild && openGroup !== tab.parent) return null;

//             // Normal Tab Button Rendering
//             return (
//               <li key={tab.id}>
//                 <button
//                   onClick={() => {
//                     setActiveTab(tab.id);
//                     // Automatically open parent group if child is clicked
//                     if (tab.parent) setOpenGroup(tab.parent);
//                   }}
//                   className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
//                     tab.indent ? "ml-2 w-[calc(100%-8px)] border-l border-gray-100" : ""
//                   } ${
//                     activeTab === tab.id
//                       ? "bg-blue-600 text-white shadow-md"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <span className="text-base leading-none">{tab.icon}</span>
//                   {tab.label}
//                 </button>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>

//       {/* ── Main content ── */}
//       <main className="flex-1 overflow-y-auto">
//         <div className="max-w-7xl mx-auto p-6">
//           {renderContent()}
//         </div>
//       </main>
//     </div>
//   );
// }

// // ── Root ──────────────────────────────────────────────────────────────────────
// export default function AdminDashboard() {
//   return (
//     <EventIdProvider>
//       <AdminShell />
//     </EventIdProvider>
//   );
// }

// // ── Shared styles ─────────────────────────────────────────────────────────────
// const labelStyle: React.CSSProperties = {
//   display: "block", fontSize: 11, fontWeight: 700,
//   color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.025em"
// };
// const inputStyle: React.CSSProperties = {
//   width: "100%", padding: "10px 14px", borderRadius: "10px",
//   border: "1px solid #e2e8f0", fontSize: "14px",
//   background: "#f8fafc", transition: "all 0.2s",
// };



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
import LaGarauPlanner from "@/app/eventadmin/3dobject/page"; // <--- Added this import

import AdminQRMarkers from "@/app/eventadmin/qrcodemarkers/page";
import AdminQuiz from "@/app/eventadmin/quiz/page";
import AdminPrizePage from "./prize/page";
import RouletteAdmin from "./roulette/page";
import BoundaryMarkerAdmin from "./servicemarkers/page";


// ── Reordered Tab config ─────────────────────────────────────────────────────
const tabs = [ 
  // 1. Event Area (Default)
  { id: "eventarea", label: "Event Area", icon: "🗺️" },

  // 2. Event Markers Group
  { id: "group_markers", label: "Event Markers", icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
  { id: "location", label: "Location Markers", icon: "📍", indent: true, parent: "group_markers" },
  { id: "qrcodemarker", label: "QR Markers", icon: "🔳", indent: true, parent: "group_markers" },
  { id: "special", label: "Special Markers", icon: "⭐", indent: true, parent: "group_markers" },

  // 3. Progress Bar
  { id: "progress", label: "Progress Bar", icon: "📊" },

  // 4. Quiz
  { id: "quiz", label: "Quiz Management", icon: "🧠" },

  // 5. Rewards Group
  { id: "group_rewards", label: "Rewards & Games", icon: "🎁", isHeader: true, children: ["prize", "roulette"] },
  { id: "prize", label: "Prize Management", icon: "🎁", indent: true, parent: "group_rewards" },
  { id: "roulette", label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },

  // 6. Stall & Service Group
  { id: "group_stalls", label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["stall", "planner", "servicemarkers"] },
  { id: "stall", label: "Stall Marker", icon: "🏪", indent: true, parent: "group_stalls" },
  { id: "planner", label: "3d marker", icon: "🏗️", indent: true, parent: "group_stalls" }, // <--- Added to sidebar
  { id: "servicemarkers", label: "Service Markers", icon: "🔧", indent: true, parent: "group_stalls" },

  // 7. Game Settings
  { id: "settings", label: "Game Settings", icon: "⚙️" },
];

// 1. Define the structure of an Event
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

// 2. Define the starting values for the form
const initialState: EventData = {
  id: "",
  name: "",
  description: "",
  image: "",
  lat: 0, // Default to a central location (e.g., Kathmandu)
  lng: 0,
  radius: 0,
  status: "active",
};
// ... (EventData types and EventPicker component remain exactly the same)

// ── Consolidated Event Picker & Management ────────────────────────────────────
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
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          description: data.description || "",
          image: data.image || "",
          lat: data.lat ?? 0,
          lng: data.lng ?? 0,
          radius: data.radius ?? 1000,
          status: data.status || "inactive",
        } as EventData;
      });
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
    
    if (!slug) return alert("Event ID (Slug) is required");
    if (!form.name.trim()) return alert("Display Name is required");

    setSaving(true);
    try {
      await setDoc(doc(db, "events", slug), {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        status: form.status,
        lat: Number(form.lat),
        lng: Number(form.lng),
        radius: Number(form.radius),
        updatedAt: new Date().toISOString(),
      });
      
      alert(isEditing ? "Event Updated!" : "Event Created!");
      await fetchEvents();
      if (!isEditing) onSelect(slug); 
      resetForm();
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(initialState);
    setIsEditing(false);
    setShowForm(false);
  };

  const startEdit = (ev: EventData) => {
    setForm({ ...ev });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete event: ${id}?`)) return;
    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    } catch (e) {
      alert("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center py-16 px-6 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 m-0">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Ghumante Yuwa Phase 2 — Select or create an event</p>
      </div>

      <div className="w-full max-w-2xl">
        {showForm ? (
          <div className="bg-white rounded-2xl border border-blue-200 p-8 mb-8 shadow-xl shadow-blue-900/5">
            <h2 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
              {isEditing ? "📝 Edit Event" : "✨ Create New Event"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Event ID (Slug) *</label>
                  <input
                    disabled={isEditing}
                    placeholder="e.g. ghumante-2024"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    style={inputStyle}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Display Name *</label>
                  <input
                    placeholder="e.g. Ghumante Phase 2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Short event description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, height: 60, resize: "none" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Image Path / URL</label>
                <input
                  placeholder="/images/event-banner.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle}>Latitude</label>
                  <input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Longitude</label>
                  <input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Radius (m)</label>
                  <input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })} 
                  style={inputStyle}
                >
                  <option value="inactive">INACTIVE</option>
                  <option value="active">ACTIVE</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-[2] py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-lg shadow-blue-200">
                  {saving ? "Processing..." : isEditing ? "Update Event" : "Create & Open"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all mb-8 shadow-sm"
          >
            + Create New Event
          </button>
        )}

        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Existing Events</h3>
           <span className="text-xs text-slate-400">{events.length} Total</span>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-400">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
             <p className="text-slate-400 m-0">No events found. Start by creating one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className="group bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-blue-400 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => onSelect(ev.id)}>
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl overflow-hidden">
                    {ev.image ? (
                      <img src={ev.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "https://placehold.co/100?text=Ev" }} />
                    ) : "📅"}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 m-0">{ev.name}</h4>
                    <p className="text-xs text-slate-400 m-0">
                      ID: <span className="text-blue-500 font-mono">{ev.id}</span> • Radius: {ev.radius}m
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${ev.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {ev.status.toUpperCase()}
                  </span>
                  <button onClick={() => startEdit(ev)} title="Edit Details" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">✏️</button>
                  <button onClick={() => handleDelete(ev.id)} title="Delete Event" className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">🗑️</button>
                  <button onClick={() => onSelect(ev.id)} className="ml-2 bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Select ›</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Shell ────────────────────────────────────────────────────────────────
function AdminShell() {
  const { eventId, setEventId } = useEventId();
  const [activeTab, setActiveTab] = useState("eventarea");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  if (!eventId) {
    return <EventPicker onSelect={(id) => { setEventId(id); setActiveTab("eventarea"); }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "eventarea":      return <EventAreaAdmin />;
      case "location":       return <LocationMarkers />;
      case "qrcodemarker":   return <AdminQRMarkers />;
      case "special":        return <SpecialMarkers />;
      case "settings":       return <GameSettings />;
      case "progress":       return <ProgressBarAdmin />;
      case "stall":          return <StallMarkerAdmin />;
      case "planner":        return <LaGarauPlanner />; // <--- Added switch case
      case "quiz":           return <AdminQuiz />;
      case "prize":          return <AdminPrizePage/>;
      case "roulette":       return <RouletteAdmin />;
      case "servicemarkers": return <BoundaryMarkerAdmin />;
      default:               return <EventAreaAdmin />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <nav className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-5 border-b">
          <h1 className="font-bold text-xl text-blue-600">Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-0.5">Ghumante Yuwa Phase 2</p>
        </div>

        {/* Active event chip */}
        <div className="px-4 py-3 border-b bg-blue-50">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">
            Active Event
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-blue-700 truncate max-w-[130px]">
              {eventId}
            </p>
            <button
              onClick={() => setEventId("")}
              className="text-[10px] px-2 py-1 rounded bg-white border border-blue-200 text-blue-500 font-bold hover:bg-blue-100 transition-colors"
            >
              ← Switch
            </button>
          </div>
          <p className="text-[11px] text-green-600 font-medium mt-1">
            ✅ Live Configuration
          </p>
        </div>

        {/* Nav with Conditional Logic */}
        <ul className="flex-1 overflow-y-auto space-y-0.5 p-3">
          {tabs.map((tab) => {
            const isChild = !!tab.indent;
            
            if (tab.isHeader) {
              return (
                <li key={tab.id} className="pt-2">
                  <button 
                    onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[14px] font-bold text-black-600 uppercase tracking-widest hover:text-blue-500 transition-colors"
                  >
                    <span>{tab.label}</span>
                    <span>{openGroup === tab.id ? "−" : "+"}</span>
                  </button>
                </li>
              );
            }

            if (isChild && openGroup !== tab.parent) return null;

            return (
              <li key={tab.id}>
                <button
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.parent) setOpenGroup(tab.parent);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    tab.indent ? "ml-2 w-[calc(100%-8px)] border-l border-gray-100" : ""
                  } ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-base leading-none">{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// ... rest of the shared styles and root component
export default function AdminDashboard() {
  return (
    <EventIdProvider>
      <AdminShell />
    </EventIdProvider>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.025em"
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #e2e8f0", fontSize: "14px",
  background: "#f8fafc", transition: "all 0.2s",
};