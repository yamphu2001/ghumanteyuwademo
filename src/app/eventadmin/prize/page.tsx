
// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { db } from "@/lib/firebase";
// import { doc, getDoc, collection, addDoc, onSnapshot, deleteDoc, setDoc } from "firebase/firestore";
// import { useEventId } from "@/app/eventadmin/Eventidcontext";
// import MapPicker from "@/app/eventadmin/MapPicker"; // Import MapPicker

// interface Prize {
//   id: string;
//   name: string;
//   description: string;
//   lat: number;
//   lng: number;
//   image: string;
//   claimTime: number;
//   claimRadius: number;
// }

// export default function AdminPrizePage() {
//   const { eventId } = useEventId();

//   // ── Global Config ──
//   const [waitTime, setWaitTime] = useState(10);

//   // ── Prize Form ──
//   const [prizeName, setPrizeName] = useState('');
//   const [description, setDescription] = useState('');
//   const [lat, setLat] = useState('');
//   const [lng, setLng] = useState('');
//   const [imageUrl, setImageUrl] = useState('/prizes/box.png');
//   const [claimDuration, setClaimDuration] = useState(15);
//   const [claimRadius, setClaimRadius] = useState(10);

//   // ── Data & UI State ──
//   const [prizes, setPrizes] = useState<Prize[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
  
//   // ── Full Screen Map State ──
//   const [isMapFullScreen, setIsMapFullScreen] = useState(false);
//   const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

//   // ── Sync when eventId changes ──
//   useEffect(() => {
//     if (!eventId) { setPrizes([]); return; }

//     getDoc(doc(db, 'events', eventId)).then((snap) => {
//       if (snap.exists()) setWaitTime(snap.data().prizeWaitTime || 10);
//     });

//     const unsub = onSnapshot(
//       collection(db, 'events', eventId, 'mapPrizes'),
//       (snap) => setPrizes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prize)))
//     );
//     return () => unsub();
//   }, [eventId]);

//   // ✅ Fetch Event Boundary for the MapPicker
//   const fetchEventBoundary = useCallback(async () => {
//     if (!eventId) return;
//     try {
//       const eventSnap = await getDoc(doc(db, "events", eventId));
//       if (eventSnap.exists()) {
//         const rawCoords = eventSnap.data().boundaryCoords;
//         if (rawCoords && Array.isArray(rawCoords)) {
//           const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
//           if (formatted.length > 0) {
//             const first = formatted[0];
//             const last = formatted[formatted.length - 1];
//             if (first[0] !== last[0] || first[1] !== last[1]) formatted.push(first);
//           }
//           setEventAreaBoundary([formatted]);
//         }
//       }
//     } catch (e) { console.error("Error fetching boundary:", e); }
//   }, [eventId]);

//   useEffect(() => { fetchEventBoundary(); }, [fetchEventBoundary]);

//   // Handle Location Selection from Map
//   const handleMapSelect = (data: any) => {
//     if (data.geometry?.coordinates) {
//       setLng(data.geometry.coordinates[0].toString());
//       setLat(data.geometry.coordinates[1].toString());
//       setIsMapFullScreen(false); // Close map after picking
//     }
//   };

//   const resetForm = () => {
//     setPrizeName(''); setDescription(''); setLat(''); setLng('');
//     setImageUrl('/prizes/box.png'); setClaimDuration(15); setClaimRadius(10);
//     setEditingId(null);
//   };

//   const startEdit = (p: Prize) => {
//     setEditingId(p.id);
//     setPrizeName(p.name);
//     setDescription(p.description || '');
//     setLat(String(p.lat));
//     setLng(String(p.lng));
//     setImageUrl(p.image || '/prizes/box.png');
//     setClaimDuration(Math.round((p.claimTime || 900) / 60));
//     setClaimRadius(p.claimRadius || 10);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const updateGlobalWait = async () => {
//     if (!eventId) return;
//     try {
//       await setDoc(doc(db, 'events', eventId), 
//         { prizeWaitTime: Number(waitTime), activeCategories: ['mapPrizes'] }, 
//         { merge: true }
//       );
//       alert(`✅ Spawn timer saved: ${waitTime} min`);
//     } catch { alert('❌ Failed to save config.'); }
//   };

//   const savePrize = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!eventId) return;

//     const data = {
//       name: prizeName.trim(),
//       description: description.trim(),
//       lat: parseFloat(lat),
//       lng: parseFloat(lng),
//       image: imageUrl.trim(),
//       claimTime: Number(claimDuration) * 60,
//       claimRadius: Number(claimRadius),
//       updatedAt: new Date().toISOString(),
//     };

//     setLoading(true);
//     try {
//       if (editingId) {
//         await setDoc(doc(db, 'events', eventId, 'mapPrizes', editingId), data, { merge: true });
//         alert('✅ Prize updated!');
//       } else {
//         await addDoc(collection(db, 'events', eventId, 'mapPrizes'), {
//           ...data,
//           createdAt: new Date().toISOString(),
//         });
//         alert('✅ Prize added!');
//       }
//       resetForm();
//     } catch { alert('❌ Error saving prize.'); } finally { setLoading(false); }
//   };

//   const deletePrize = async (id: string) => {
//     if (!confirm('Delete this prize?')) return;
//     await deleteDoc(doc(db, 'events', eventId, 'mapPrizes', id));
//   };

//   return (
//     <div style={s.page}>
//       <header style={s.header}>
//         <div>
//           <h1 style={s.title}>🎁 Mystery Prize Admin</h1>
//           <p style={s.subtitle}>
//             Manage distance &amp; timing for prizes
//             {eventId && <span style={{ marginLeft: 8, color: '#3b82f6', fontWeight: 700 }}>— {eventId}</span>}
//           </p>
//         </div>
//       </header>

//       {!eventId ? (
//         <div style={s.empty}>⚠️ Select an Event ID from the sidebar to start.</div>
//       ) : (
//         <div style={s.body}>
//           <section style={s.card}>
//             <h3 style={s.cardTitle}>⏱️ Global Spawn Timer</h3>
//             <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
//               <div style={{ flex: 1 }}>
//                 <label style={s.label}>Delay (Minutes)</label>
//                 <input type="number" value={waitTime} onChange={(e) => setWaitTime(Number(e.target.value))} style={s.input} />
//               </div>
//               <button onClick={updateGlobalWait} style={s.saveBtn}>💾 Save</button>
//             </div>
//           </section>

//           <div style={s.grid}>
//             <form onSubmit={savePrize} style={s.card}>
//               <h3 style={s.cardTitle}>{editingId ? '✏️ Edit Prize' : '📍 Add New Prize'}</h3>

//               <label style={s.label}>Prize Name *</label>
//               <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} style={s.input} required />

//               <label style={s.label}>Description *</label>
//               <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={s.input} required />

//               {/* --- COORDINATES WITH MAP BUTTON --- */}
//               <div style={s.coordBox}>
//                 <div style={s.coordHeader}>
//                   <span style={s.label}>📍 Coordinates</span>
//                   <button type="button" onClick={() => setIsMapFullScreen(true)} style={s.fullScreenBtn}>
//                     🎯 Pick on Map
//                   </button>
//                 </div>
//                 <div style={s.twoCol}>
//                   <div>
//                     <label style={s.label}>Latitude</label>
//                     <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} style={{...s.input, marginBottom: 0}} required />
//                   </div>
//                   <div>
//                     <label style={s.label}>Longitude</label>
//                     <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} style={{...s.input, marginBottom: 0}} required />
//                   </div>
//                 </div>
//               </div>

//               <label style={s.label}>Marker Image URL</label>
//               <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={s.input} />

//               <div style={s.twoCol}>
//                 <div>
//                   <label style={s.label}>Claim Duration (Min)</label>
//                   <input type="number" value={claimDuration} onChange={(e) => setClaimDuration(Number(e.target.value))} style={s.input} />
//                 </div>
//                 <div>
//                   <label style={s.label}>Claim Radius (Metres)</label>
//                   <input type="number" min={1} value={claimRadius} onChange={(e) => setClaimRadius(Number(e.target.value))} style={{ ...s.input, borderColor: '#3b82f6', borderWidth: '2px' }} />
//                 </div>
//               </div>
//               <p style={{ ...s.hint, marginTop: -10 }}>Distance player must be from coordinates to see "Claim" popup.</p>

//               <div style={{ display: 'flex', gap: 10 }}>
//                 <button type="submit" disabled={loading} style={s.addBtn}>
//                   {loading ? 'Saving...' : editingId ? 'Update' : 'Add Prize'}
//                 </button>
//                 {editingId && <button type="button" onClick={resetForm} style={s.cancelBtn}>Cancel</button>}
//               </div>
//             </form>

//             <div style={s.card}>
//               <h3 style={s.cardTitle}>📋 Prize Pool <span style={s.badge}>{prizes.length}</span></h3>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                 {prizes.map((p) => (
//                   <div key={p.id} style={s.listItem}>
//                     <div style={{ flex: 1 }}>
//                       <div style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</div>
//                       <div style={{ fontSize: 10, color: '#64748b' }}>
//                         📏 Radius: <strong>{p.claimRadius}m</strong> | ⏱ {Math.round(p.claimTime / 60)}m window
//                       </div>
//                     </div>
//                     <div style={{ display: 'flex', gap: 6 }}>
//                       <button onClick={() => startEdit(p)} style={s.editBtn}>✏️</button>
//                       <button onClick={() => deletePrize(p.id)} style={s.deleteBtn}>🗑️</button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* --- FULL SCREEN MAP OVERLAY --- */}
//       {isMapFullScreen && (
//         <div style={s.fullScreenOverlay}>
//           <div style={s.fullScreenHeader}>
//              <div style={{color: 'white', fontWeight: 700}}>Select Location for "{prizeName || 'New Prize'}"</div>
//              <button onClick={() => setIsMapFullScreen(false)} style={s.closeFullBtn}>Close Map</button>
//           </div>
//           <div style={{ flex: 1, position: 'relative' }}>
//             <MapPicker 
//                 mode="draw_point" 
//                 onLocationSelect={handleMapSelect} 
//                 boundary={eventAreaBoundary} 
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// const s: Record<string, React.CSSProperties> = {
//   page: { padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
//   header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
//   title: { fontSize: 22, fontWeight: 900, color: '#1e293b', margin: 0 },
//   subtitle: { fontSize: 12, color: '#64748b' },
//   body: { maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 },
//   grid: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 },
//   card: { background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0' },
//   cardTitle: { fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 },
//   badge: { background: '#f1f5f9', color: '#475569', borderRadius: 20, padding: '1px 8px' },
//   label: { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, display: 'block' },
//   input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 14, fontSize: 13, boxSizing: 'border-box' },
//   hint: { fontSize: 11, color: '#94a3b8' },
//   twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
//   saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
//   addBtn: { flex: 1, background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
//   cancelBtn: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
//   listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc' },
//   editBtn: { background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '5px', borderRadius: 6, cursor: 'pointer' },
//   deleteBtn: { background: '#fff5f5', color: '#ef4444', border: '1px solid #fecaca', padding: '5px', borderRadius: 6, cursor: 'pointer' },
//   empty: { background: '#fff', padding: 48, borderRadius: 14, textAlign: 'center', border: '2px dashed #e2e8f0', color: '#94a3b8' },
  
//   // New Styles for Fullscreen Map Support
//   coordBox: { background: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 14, border: "1px solid #e2e8f0" },
//   coordHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
//   fullScreenBtn: { background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700 },
//   fullScreenOverlay: { position: "fixed", inset: 0, background: "#000", zIndex: 2000, display: "flex", flexDirection: "column" },
//   fullScreenHeader: { padding: "10px 20px", background: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" },
//   closeFullBtn: { background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }
// };



'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, onSnapshot, deleteDoc, setDoc } from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";
import MapPicker from "@/app/eventadmin/MapPicker"; 

interface Prize {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  image: string;
  claimTime: number;
  claimRadius: number;
}

export default function AdminPrizePage() {
  const { eventId } = useEventId();

  // ── Global Config ──
  const [waitTime, setWaitTime] = useState(10);
  const [taskCount, setTaskCount] = useState(1); // NEW: State for task count requirement

  // ── Prize Form ──
  const [prizeName, setPrizeName] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [imageUrl, setImageUrl] = useState('/prizes/box.png');
  const [claimDuration, setClaimDuration] = useState(15);
  const [claimRadius, setClaimRadius] = useState(10);

  // ── Data & UI State ──
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [eventAreaBoundary, setEventAreaBoundary] = useState<number[][][] | undefined>(undefined);

  // ── Sync when eventId changes ──
  useEffect(() => {
    if (!eventId) { setPrizes([]); return; }

    getDoc(doc(db, 'events', eventId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWaitTime(data.prizeWaitTime || 10);
        setTaskCount(data.taskCountForPrize || 1); // Load existing task count
      }
    });

    const unsub = onSnapshot(
      collection(db, 'events', eventId, 'mapPrizes'),
      (snap) => setPrizes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prize)))
    );
    return () => unsub();
  }, [eventId]);

  const fetchEventBoundary = useCallback(async () => {
    if (!eventId) return;
    try {
      const eventSnap = await getDoc(doc(db, "events", eventId));
      if (eventSnap.exists()) {
        const rawCoords = eventSnap.data().boundaryCoords;
        if (rawCoords && Array.isArray(rawCoords)) {
          const formatted = rawCoords.map((pt: any) => [pt.lng, pt.lat]);
          if (formatted.length > 0) {
            const first = formatted[0];
            const last = formatted[formatted.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) formatted.push(first);
          }
          setEventAreaBoundary([formatted]);
        }
      }
    } catch (e) { console.error("Error fetching boundary:", e); }
  }, [eventId]);

  useEffect(() => { fetchEventBoundary(); }, [fetchEventBoundary]);

  const handleMapSelect = (data: any) => {
    if (data.geometry?.coordinates) {
      setLng(data.geometry.coordinates[0].toString());
      setLat(data.geometry.coordinates[1].toString());
      setIsMapFullScreen(false); 
    }
  };

  const resetForm = () => {
    setPrizeName(''); setDescription(''); setLat(''); setLng('');
    setImageUrl('/prizes/box.png'); setClaimDuration(15); setClaimRadius(10);
    setEditingId(null);
  };

  const startEdit = (p: Prize) => {
    setEditingId(p.id);
    setPrizeName(p.name);
    setDescription(p.description || '');
    setLat(String(p.lat));
    setLng(String(p.lng));
    setImageUrl(p.image || '/prizes/box.png');
    setClaimDuration(Math.round((p.claimTime || 900) / 60));
    setClaimRadius(p.claimRadius || 10);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UPDATED: Saves both Wait Time AND Task Count
  const updateGlobalConfig = async () => {
    if (!eventId) return;
    try {
      await setDoc(doc(db, 'events', eventId), 
        { 
          prizeWaitTime: Number(waitTime), 
          taskCountForPrize: Number(taskCount), // Saving the task count
          activeCategories: ['mapPrizes'] 
        }, 
        { merge: true }
      );
      alert(`✅ Config saved: ${taskCount} tasks required, then ${waitTime} min delay.`);
    } catch { alert('❌ Failed to save config.'); }
  };

  const savePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const data = {
      name: prizeName.trim(),
      description: description.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      image: imageUrl.trim(),
      claimTime: Number(claimDuration) * 60,
      claimRadius: Number(claimRadius),
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'events', eventId, 'mapPrizes', editingId), data, { merge: true });
        alert('✅ Prize updated!');
      } else {
        await addDoc(collection(db, 'events', eventId, 'mapPrizes'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
        alert('✅ Prize added!');
      }
      resetForm();
    } catch { alert('❌ Error saving prize.'); } finally { setLoading(false); }
  };

  const deletePrize = async (id: string) => {
    if (!confirm('Delete this prize?')) return;
    await deleteDoc(doc(db, 'events', eventId, 'mapPrizes', id));
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.title}>🎁 Mystery Prize Admin</h1>
          <p style={s.subtitle}>
            Manage distance &amp; timing for prizes
            {eventId && <span style={{ marginLeft: 8, color: '#3b82f6', fontWeight: 700 }}>— {eventId}</span>}
          </p>
        </div>
      </header>

      {!eventId ? (
        <div style={s.empty}>⚠️ Select an Event ID from the sidebar to start.</div>
      ) : (
        <div style={s.body}>
          {/* UPDATED CONFIG SECTION */}
          <section style={s.card}>
            <h3 style={s.cardTitle}>⚙️ Global Prize Trigger Rules</h3>
            <div style={{ display: 'flex', gap: 15, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>1. Tasks Required to Start Timer</label>
                <input 
                  type="number" 
                  min={1}
                  value={taskCount} 
                  onChange={(e) => setTaskCount(Number(e.target.value))} 
                  style={s.input} 
                  placeholder="e.g. 5"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>2. Spawn Delay (Minutes)</label>
                <input 
                  type="number" 
                  value={waitTime} 
                  onChange={(e) => setWaitTime(Number(e.target.value))} 
                  style={s.input} 
                />
              </div>
              <button onClick={updateGlobalConfig} style={{...s.saveBtn, marginBottom: 14}}>💾 Save Config</button>
            </div>
            <p style={s.hint}>The prize will appear on the map {waitTime} minutes after the player completes {taskCount} tasks.</p>
          </section>

          <div style={s.grid}>
            <form onSubmit={savePrize} style={s.card}>
              <h3 style={s.cardTitle}>{editingId ? '✏️ Edit Prize' : '📍 Add New Prize'}</h3>

              <label style={s.label}>Prize Name *</label>
              <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} style={s.input} required />

              <label style={s.label}>Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={s.input} required />

              <div style={s.coordBox}>
                <div style={s.coordHeader}>
                  <span style={s.label}>📍 Coordinates</span>
                  <button type="button" onClick={() => setIsMapFullScreen(true)} style={s.fullScreenBtn}>
                    🎯 Pick on Map
                  </button>
                </div>
                <div style={s.twoCol}>
                  <div>
                    <label style={s.label}>Latitude</label>
                    <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} style={{...s.input, marginBottom: 0}} required />
                  </div>
                  <div>
                    <label style={s.label}>Longitude</label>
                    <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} style={{...s.input, marginBottom: 0}} required />
                  </div>
                </div>
              </div>

              <label style={s.label}>Marker Image URL</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={s.input} />

              <div style={s.twoCol}>
                <div>
                  <label style={s.label}>Claim Duration (Min)</label>
                  <input type="number" value={claimDuration} onChange={(e) => setClaimDuration(Number(e.target.value))} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Claim Radius (Metres)</label>
                  <input type="number" min={1} value={claimRadius} onChange={(e) => setClaimRadius(Number(e.target.value))} style={{ ...s.input, borderColor: '#3b82f6', borderWidth: '2px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={loading} style={s.addBtn}>
                  {loading ? 'Saving...' : editingId ? 'Update' : 'Add Prize'}
                </button>
                {editingId && <button type="button" onClick={resetForm} style={s.cancelBtn}>Cancel</button>}
              </div>
            </form>

            <div style={s.card}>
              <h3 style={s.cardTitle}>📋 Prize Pool <span style={s.badge}>{prizes.length}</span></h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prizes.map((p) => (
                  <div key={p.id} style={s.listItem}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        📏 Radius: <strong>{p.claimRadius}m</strong> | ⏱ {Math.round(p.claimTime / 60)}m window
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(p)} style={s.editBtn}>✏️</button>
                      <button onClick={() => deletePrize(p.id)} style={s.deleteBtn}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMapFullScreen && (
        <div style={s.fullScreenOverlay}>
          <div style={s.fullScreenHeader}>
              <div style={{color: 'white', fontWeight: 700}}>Select Location for "{prizeName || 'New Prize'}"</div>
              <button onClick={() => setIsMapFullScreen(false)} style={s.closeFullBtn}>Close Map</button>
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
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 900, color: '#1e293b', margin: 0 },
  subtitle: { fontSize: 12, color: '#64748b' },
  body: { maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 },
  grid: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 },
  card: { background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 },
  badge: { background: '#f1f5f9', color: '#475569', borderRadius: 20, padding: '1px 8px' },
  label: { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 14, fontSize: 13, boxSizing: 'border-box' },
  hint: { fontSize: 11, color: '#94a3b8' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  addBtn: { flex: 1, background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc' },
  editBtn: { background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '5px', borderRadius: 6, cursor: 'pointer' },
  deleteBtn: { background: '#fff5f5', color: '#ef4444', border: '1px solid #fecaca', padding: '5px', borderRadius: 6, cursor: 'pointer' },
  empty: { background: '#fff', padding: 48, borderRadius: 14, textAlign: 'center', border: '2px dashed #e2e8f0', color: '#94a3b8' },
  coordBox: { background: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 14, border: "1px solid #e2e8f0" },
  coordHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  fullScreenBtn: { background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700 },
  fullScreenOverlay: { position: "fixed", inset: 0, background: "#000", zIndex: 2000, display: "flex", flexDirection: "column" },
  fullScreenHeader: { padding: "10px 20px", background: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeFullBtn: { background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }
};