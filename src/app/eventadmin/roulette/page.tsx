
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { db, rtdb } from "@/lib/firebase";
// import {
//   collection, addDoc, getDocs, deleteDoc,
//   doc, orderBy, query, serverTimestamp, onSnapshot
// } from "firebase/firestore";
// import { ref, get, set, remove, update, onValue, off } from "firebase/database";
// import { Plus, Trash2, Gift, Loader2, Database, Sparkles, Package, Users, RefreshCw, AlertTriangle } from "lucide-react";
// import { useEventId } from "@/app/eventadmin/Eventidcontext";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Prize {
//   id: string;
//   name: string;
//   imageUrl: string;
//   color: string;
//   quantity: number;
//   createdAt?: any;
// }

// interface Winner {
//   userId: string;
//   username: string;
//   prizeName: string;
//   imageUrl: string;
//   claimedAt: string;
// }

// interface StockEntry {
//   remaining: number;
//   total: number;
//   name: string;
//   legacy?: boolean;
// }

// type StockMap = Record<string, StockEntry>;

// // ─── Helper Components (Defined before main to avoid reference issues) ────────

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div>
//       <label className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wide">
//         {label}
//       </label>
//       {children}
//     </div>
//   );
// }

// function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
//   return (
//     <div className={`px-3 py-1.5 rounded-xl text-center ${color}`}>
//       <p className="text-lg font-black leading-none">{value}</p>
//       <p className="text-[9px] font-bold uppercase tracking-wide opacity-70 mt-0.5">{label}</p>
//     </div>
//   );
// }

// // ─── Rarity Utils ─────────────────────────────────────────────────────────────

// function getRarity(remaining: number, totalPool: number) {
//   if (totalPool === 0) return { label: "No Stock", color: "#94a3b8", bg: "#f1f5f9", ring: "#e2e8f0" };
//   const chance = (remaining / totalPool) * 100;
//   if (chance >= 35) return { label: "Common",    color: "#16a34a", bg: "#dcfce7", ring: "#bbf7d0" };
//   if (chance >= 18) return { label: "Uncommon",  color: "#2563eb", bg: "#dbeafe", ring: "#bfdbfe" };
//   if (chance >= 7)  return { label: "Rare",      color: "#7c3aed", bg: "#ede9fe", ring: "#ddd6fe" };
//   return              { label: "Legendary",  color: "#d97706", bg: "#fef3c7", ring: "#fde68a" };
// }

// function RarityPreview({ quantity, totalPool }: { quantity: number; totalPool: number }) {
//   const projectedPool = totalPool + quantity;
//   const chance         = (quantity / projectedPool) * 100;
//   const rarity        = getRarity(quantity, projectedPool);

//   return (
//     <div
//       className="p-3 rounded-xl border text-center"
//       style={{ background: rarity.bg, borderColor: rarity.ring }}
//     >
//       <div className="flex items-center justify-center gap-2">
//         <Sparkles size={12} style={{ color: rarity.color }} />
//         <span className="text-xs font-black uppercase tracking-wide" style={{ color: rarity.color }}>
//           {rarity.label}
//         </span>
//         <span className="text-xs text-gray-400 font-medium">
//           — {chance.toFixed(1)}% win chance
//         </span>
//       </div>
//     </div>
//   );
// }

// function StockBar({ remaining, total }: { remaining: number; total: number }) {
//   const pct = total > 0 ? (remaining / total) * 100 : 0;
//   const color =
//     pct > 60 ? "#22c55e" :
//     pct > 30 ? "#3b82f6" :
//     pct > 10 ? "#a855f7" :
//                "#f59e0b";

//   return (
//     <div className="w-full">
//       <div className="flex justify-between items-center mb-1">
//         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Stock</span>
//         <span className="text-[11px] font-black" style={{ color }}>
//           {remaining} / {total}
//         </span>
//       </div>
//       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//         <div
//           className="h-full rounded-full transition-all duration-500"
//           style={{ width: `${pct}%`, background: color }}
//         />
//       </div>
//     </div>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────────────────────

// export default function RouletteAdmin() {
//   const { eventId } = useEventId();

//   const [prizes, setPrizes]       = useState<Prize[]>([]);
//   const [stockMap, setStockMap]   = useState<StockMap>({});
//   const [winners, setWinners]     = useState<Winner[]>([]);
//   const [loading, setLoading]     = useState(false);
//   const [initializing, setInitializing] = useState<string | null>(null);

//   const [newName,     setNewName]     = useState("");
//   const [newImage,    setNewImage]    = useState("");
//   const [newColor,    setNewColor]    = useState("#6366f1");
//   const [newQuantity, setNewQuantity] = useState<number>(5);
//   const [adding,      setAdding]      = useState(false);

//   const fetchPrizes = useCallback(async () => {
//     if (!eventId) return;
//     setLoading(true);
//     try {
//       const q = query(
//         collection(db, "events", eventId, "roulette"),
//         orderBy("createdAt", "asc")
//       );
//       const snap = await getDocs(q);
//       setPrizes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prize)));
//     } catch (e) {
//       console.error("Error loading prizes:", e);
//     } finally {
//       setLoading(false);
//     }
//   }, [eventId]);

//   useEffect(() => {
//     if (!eventId) {
//       setPrizes([]);
//       setStockMap({});
//       setWinners([]);
//       return;
//     }

//     fetchPrizes();

//     const stockRef = ref(rtdb, `rouletteStock/${eventId}`);
//     const unsubStock = onValue(stockRef, (snap) => {
//       setStockMap(snap.val() || {});
//     });

//     const winnersQ = query(
//       collection(db, "events", eventId, "prize_results"),
//       orderBy("claimedAt", "desc")
//     );
//     const unsubWinners = onSnapshot(winnersQ, (snap) => {
//       setWinners(snap.docs.map(d => d.data() as Winner));
//     });

//     return () => {
//       off(stockRef, "value", unsubStock);
//       unsubWinners();
//     };
//   }, [eventId, fetchPrizes]);

//   const addPrize = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newName.trim() || !newImage.trim() || !eventId || newQuantity < 1) return;
//     setAdding(true);

//     try {
//       const docRef = await addDoc(collection(db, "events", eventId, "roulette"), {
//         name:      newName.trim(),
//         imageUrl:  newImage.trim(),
//         color:     newColor,
//         quantity:  newQuantity,
//         createdAt: serverTimestamp(),
//       });

//       await set(ref(rtdb, `rouletteStock/${eventId}/${docRef.id}`), {
//         remaining: newQuantity,
//         total:     newQuantity,
//         name:      newName.trim(),
//       });

//       setNewName("");
//       setNewImage("");
//       setNewColor("#6366f1");
//       setNewQuantity(5);
//       await fetchPrizes();
//     } catch (err) {
//       console.error("Error adding prize:", err);
//     } finally {
//       setAdding(false);
//     }
//   };

//   const deletePrize = async (prizeId: string) => {
//     if (!eventId || !confirm("Delete this prize? This cannot be undone.")) return;
//     try {
//       await deleteDoc(doc(db, "events", eventId, "roulette", prizeId));
//       await remove(ref(rtdb, `rouletteStock/${eventId}/${prizeId}`));
//       await fetchPrizes();
//     } catch (err) {
//       console.error("Error deleting prize:", err);
//     }
//   };

//   const restock = async (prizeId: string, delta: number) => {
//     if (!eventId) return;
//     const current = stockMap[prizeId]?.remaining ?? 0;
//     const total   = stockMap[prizeId]?.total ?? 0;
//     const next    = Math.max(0, current + delta);
//     const nextTotal = delta > 0 ? total + delta : total;

//     await update(ref(rtdb, `rouletteStock/${eventId}/${prizeId}`), {
//       remaining: next,
//       total:     nextTotal,
//     });
//   };

//   const initStock = async (prize: Prize) => {
//     if (!eventId) return;
//     setInitializing(prize.id);
//     try {
//       const qty = prize.quantity ?? 1;
//       await set(ref(rtdb, `rouletteStock/${eventId}/${prize.id}`), {
//         remaining: qty,
//         total:     qty,
//         name:      prize.name,
//       });
//     } catch (err) {
//       console.error("Error initializing stock:", err);
//     } finally {
//       setInitializing(null);
//     }
//   };

//   const totalPool = prizes.reduce((sum, p) => {
//     const remaining = stockMap[p.id]?.remaining ?? p.quantity ?? 0;
//     return sum + remaining;
//   }, 0);

//   const activeCount  = prizes.filter(p => (stockMap[p.id]?.remaining ?? p.quantity ?? 0) > 0).length;
//   const depleted     = prizes.filter(p => (stockMap[p.id]?.remaining ?? p.quantity ?? 0) === 0).length;

//   return (
//     <div className="space-y-6 p-4">
//       <header className="flex flex-wrap justify-between items-start gap-4 bg-white p-5 rounded-2xl shadow-sm border">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//             <Gift className="text-blue-500" /> Roulette Management
//           </h2>
//           <p className="text-xs text-gray-500 font-medium mt-0.5">
//             Active Event:{" "}
//             <span className="text-blue-600 font-bold">{eventId || "None Selected"}</span>
//           </p>
//         </div>
//         {eventId && (
//           <div className="flex gap-3">
//             <StatPill label="Active Prizes" value={activeCount} color="text-emerald-600 bg-emerald-50" />
//             <StatPill label="Total Pool"     value={totalPool}   color="text-blue-600 bg-blue-50" />
//             <StatPill label="Depleted"       value={depleted}    color={depleted > 0 ? "text-red-600 bg-red-50" : "text-gray-400 bg-gray-50"} />
//           </div>
//         )}
//       </header>

//       {!eventId ? (
//         <div className="bg-yellow-50 border border-yellow-200 p-10 rounded-2xl text-center">
//           <Database className="mx-auto text-yellow-400 mb-2" size={40} />
//           <p className="text-yellow-700 font-medium">Please select an Event from the sidebar to manage prizes.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl shadow-sm border h-fit">
//             <h3 className="font-bold mb-5 flex items-center gap-2 text-gray-700">
//               <Plus size={16} className="text-blue-500" /> Add New Prize Slice
//             </h3>
//             <form onSubmit={addPrize} className="space-y-4">
//               <Field label="Prize Name">
//                 <input
//                   placeholder="e.g. Free Coffee"
//                   className="w-full border p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-sm"
//                   value={newName}
//                   onChange={e => setNewName(e.target.value)}
//                   required
//                 />
//               </Field>
//               <Field label="Icon URL">
//                 <input
//                   placeholder="https://..."
//                   className="w-full border p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-sm"
//                   value={newImage}
//                   onChange={e => setNewImage(e.target.value)}
//                   required
//                 />
//               </Field>
//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Quantity">
//                   <input
//                     type="number"
//                     min={1}
//                     className="w-full border p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-sm font-bold"
//                     value={newQuantity}
//                     onChange={e => setNewQuantity(Math.max(1, Number(e.target.value)))}
//                     required
//                   />
//                 </Field>
//                 <Field label="Slice Color">
//                   <div className="flex items-center gap-2 border p-2 rounded-xl bg-gray-50 h-[42px]">
//                     <input
//                       type="color"
//                       value={newColor}
//                       onChange={e => setNewColor(e.target.value)}
//                       className="w-8 h-6 rounded cursor-pointer border-none bg-transparent flex-shrink-0"
//                     />
//                     <span className="text-[10px] font-mono text-gray-400 uppercase">{newColor}</span>
//                   </div>
//                 </Field>
//               </div>
//               {newQuantity > 0 && totalPool >= 0 && (
//                 <RarityPreview quantity={newQuantity} totalPool={totalPool} />
//               )}
//               <button
//                 type="submit"
//                 disabled={adding}
//                 className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
//               >
//                 {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
//                 {adding ? "Adding..." : "Add to Wheel"}
//               </button>
//             </form>
//           </div>

//           <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border min-h-[400px]">
//             <div className="flex items-center justify-between mb-5">
//               <h3 className="font-bold text-gray-700">Wheel Slices ({prizes.length})</h3>
//               <span className="text-xs text-gray-400 font-medium">Pool: {totalPool} total prizes</span>
//             </div>
//             {loading ? (
//               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
//                 <Loader2 className="animate-spin mb-2" />
//                 <p className="text-sm">Loading prizes...</p>
//               </div>
//             ) : prizes.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-2xl text-gray-300">
//                 <Package size={36} className="mb-2" />
//                 <p className="text-sm">No prizes yet for this event</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {prizes.map(p => {
//                   const stock = stockMap[p.id];
//                   const hasStock = !!stock;
//                   const remaining = stock?.remaining ?? p.quantity ?? 0;
//                   const total = stock?.total ?? p.quantity ?? 0;
//                   const rarity = getRarity(remaining, totalPool);
//                   const isDepleted = hasStock && remaining === 0;

//                   return (
//                     <div
//                       key={p.id}
//                       className={`group flex flex-col gap-3 border-2 p-4 rounded-2xl transition-all ${
//                         !hasStock ? "border-orange-200 bg-orange-50/30" : isDepleted ? "border-red-100 bg-red-50/30 opacity-60" : "border-gray-100 hover:border-blue-200 hover:shadow-md bg-white"
//                       }`}
//                     >
//                       {!hasStock && (
//                         <div className="flex items-center justify-between gap-2 bg-orange-100 rounded-xl px-3 py-2">
//                           <div className="flex items-center gap-1.5">
//                             <AlertTriangle size={12} className="text-orange-500" />
//                             <span className="text-[10px] font-bold text-orange-600 uppercase">No stock tracking</span>
//                           </div>
//                           <button
//                             onClick={() => initStock(p)}
//                             disabled={initializing === p.id}
//                             className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] px-2 py-1 rounded-lg"
//                           >
//                             {initializing === p.id ? "..." : `Init (${p.quantity ?? 1})`}
//                           </button>
//                         </div>
//                       )}
//                       <div className="flex items-center justify-between gap-3">
//                         <div className="flex items-center gap-3">
//                           <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover border" alt={p.name} />
//                           <div>
//                             <p className="font-bold text-gray-800 text-sm">{p.name}</p>
//                             <div className="flex items-center gap-1.5">
//                                 <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
//                                 <span className="text-[10px] text-gray-400 font-mono">{p.color}</span>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: rarity.color, background: rarity.bg }}>
//                             {!hasStock ? "UNTRACKED" : isDepleted ? "DEPLETED" : rarity.label}
//                           </span>
//                           <button onClick={() => deletePrize(p.id)} className="text-gray-300 hover:text-red-500 p-1.5"><Trash2 size={15} /></button>
//                         </div>
//                       </div>
//                       {hasStock && <StockBar remaining={remaining} total={total} />}
//                       {hasStock && (
//                         <div className="flex items-center justify-between">
//                           <span className="text-[11px] text-gray-400">
//                              Win: <span className="font-black" style={{ color: rarity.color }}>{totalPool > 0 ? ((remaining / totalPool) * 100).toFixed(1) : 0}%</span>
//                           </span>
//                           <div className="flex items-center gap-1">
//                             <button onClick={() => restock(p.id, -1)} disabled={remaining === 0} className="w-6 h-6 rounded bg-gray-100 text-xs">-</button>
//                             <span className="text-xs font-black w-6 text-center">{remaining}</span>
//                             <button onClick={() => restock(p.id, 1)} className="w-6 h-6 rounded bg-gray-100 text-xs">+</button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useCallback } from "react";
import { db, rtdb } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, orderBy, query, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { ref, get, set, remove, update, onValue, off } from "firebase/database";
import { Plus, Trash2, Gift, Loader2, Database, Sparkles, Package, RefreshCw, AlertTriangle } from "lucide-react";
import { useEventId } from "@/app/eventadmin/Eventidcontext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prize {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  quantity: number;
  createdAt?: any;
}

interface Winner {
  userId: string;
  username: string;
  prizeName: string;
  imageUrl: string;
  claimedAt: string;
}

interface StockEntry {
  remaining: number;
  total: number;
  name: string;
  legacy?: boolean;
}

type StockMap = Record<string, StockEntry>;

// ─── Helper Components ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-bold text-black block mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex-1 min-w-[100px] px-3 py-3 rounded-none border border-black text-center bg-white`}>
      <p className="text-xl font-black leading-none text-black">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mt-1">{label}</p>
    </div>
  );
}

// ─── Rarity Utils ─────────────────────────────────────────────────────────────

function getRarity(remaining: number, totalPool: number) {
  if (totalPool === 0) return { label: "No Stock", color: "#000000", bg: "#ffffff" };
  const chance = (remaining / totalPool) * 100;
  // Standardizing all backgrounds to white, using red/black for accents
  if (chance >= 35) return { label: "Common", color: "#000000", bg: "#ffffff" };
  return { label: "Premium", color: "#dc2626", bg: "#ffffff" }; // Red for rarer items
}

function RarityPreview({ quantity, totalPool }: { quantity: number; totalPool: number }) {
  const projectedPool = totalPool + quantity;
  const chance = (quantity / projectedPool) * 100;

  return (
    <div className="p-3 rounded-none border border-black border-dashed text-center bg-white">
      <div className="flex items-center justify-center gap-2">
        <Sparkles size={12} className="text-red-600" />
        <span className="text-xs font-black uppercase tracking-widest text-black">
          {chance.toFixed(1)}% Win Chance
        </span>
      </div>
    </div>
  );
}

function StockBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-black uppercase">Stock Level</span>
        <span className="text-[11px] font-black text-red-600">
          {remaining} / {total}
        </span>
      </div>
      <div className="h-2 bg-gray-100 border border-black rounded-none overflow-hidden">
        <div
          className="h-full transition-all duration-500 bg-red-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RouletteAdmin() {
  const { eventId } = useEventId();

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [stockMap, setStockMap] = useState<StockMap>({});
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newColor, setNewColor] = useState("#ff0000"); // Defaulting to Red
  const [newQuantity, setNewQuantity] = useState<number>(5);
  const [adding, setAdding] = useState(false);

  const fetchPrizes = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "events", eventId, "roulette"),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      setPrizes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prize)));
    } catch (e) {
      console.error("Error loading prizes:", e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setPrizes([]);
      setStockMap({});
      return;
    }

    fetchPrizes();

    const stockRef = ref(rtdb, `rouletteStock/${eventId}`);
    const unsubStock = onValue(stockRef, (snap) => {
      setStockMap(snap.val() || {});
    });

    return () => off(stockRef, "value", unsubStock);
  }, [eventId, fetchPrizes]);

  const addPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newImage.trim() || !eventId || newQuantity < 1) return;
    setAdding(true);

    try {
      const docRef = await addDoc(collection(db, "events", eventId, "roulette"), {
        name: newName.trim(),
        imageUrl: newImage.trim(),
        color: newColor,
        quantity: newQuantity,
        createdAt: serverTimestamp(),
      });

      await set(ref(rtdb, `rouletteStock/${eventId}/${docRef.id}`), {
        remaining: newQuantity,
        total: newQuantity,
        name: newName.trim(),
      });

      setNewName("");
      setNewImage("");
      setNewColor("#ff0000");
      setNewQuantity(5);
      await fetchPrizes();
    } catch (err) {
      console.error("Error adding prize:", err);
    } finally {
      setAdding(false);
    }
  };

  const deletePrize = async (prizeId: string) => {
    if (!eventId || !confirm("Delete this prize?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId, "roulette", prizeId));
      await remove(ref(rtdb, `rouletteStock/${eventId}/${prizeId}`));
      await fetchPrizes();
    } catch (err) {
      console.error("Error deleting prize:", err);
    }
  };

  const restock = async (prizeId: string, delta: number) => {
    if (!eventId) return;
    const current = stockMap[prizeId]?.remaining ?? 0;
    const total = stockMap[prizeId]?.total ?? 0;
    const next = Math.max(0, current + delta);
    const nextTotal = delta > 0 ? total + delta : total;

    await update(ref(rtdb, `rouletteStock/${eventId}/${prizeId}`), {
      remaining: next,
      total: nextTotal,
    });
  };

  const initStock = async (prize: Prize) => {
    if (!eventId) return;
    setInitializing(prize.id);
    try {
      const qty = prize.quantity ?? 1;
      await set(ref(rtdb, `rouletteStock/${eventId}/${prize.id}`), {
        remaining: qty,
        total: qty,
        name: prize.name,
      });
    } catch (err) {
      console.error("Error initializing stock:", err);
    } finally {
      setInitializing(null);
    }
  };

  const totalPool = prizes.reduce((sum, p) => {
    const remaining = stockMap[p.id]?.remaining ?? p.quantity ?? 0;
    return sum + remaining;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 bg-white min-h-screen text-black">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-black pb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Gift className="text-red-600" /> Roulette Admin
          </h2>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
            ID: <span className="text-black">{eventId || "Not Selected"}</span>
          </p>
        </div>

        {eventId && (
          <div className="flex flex-wrap w-full md:w-auto gap-2">
            <StatPill label="Total Slices" value={prizes.length} color="" />
            <StatPill label="Prize Pool" value={totalPool} color="" />
          </div>
        )}
      </header>

      {!eventId ? (
        <div className="border-2 border-black p-12 text-center">
          <Database className="mx-auto mb-4" size={48} />
          <p className="font-black uppercase">Select an event to proceed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add Prize Section */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="border-2 border-black p-6 bg-white sticky top-6">
              <h3 className="font-black uppercase mb-6 flex items-center gap-2 border-b border-black pb-2">
                <Plus size={18} className="text-red-600" /> New Slice
              </h3>
              <form onSubmit={addPrize} className="space-y-5">
                <Field label="Prize Name">
                  <input
                    placeholder="E.g. GOLD VOUCHER"
                    className="w-full border-2 border-black p-3 rounded-none focus:outline-none focus:bg-red-50 transition-all font-bold"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Image URL">
                  <input
                    placeholder="https://..."
                    className="w-full border-2 border-black p-3 rounded-none focus:outline-none focus:bg-red-50 transition-all text-sm"
                    value={newImage}
                    onChange={e => setNewImage(e.target.value)}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Quantity">
                    <input
                      type="number"
                      min={1}
                      className="w-full border-2 border-black p-3 rounded-none font-black"
                      value={newQuantity}
                      onChange={e => setNewQuantity(Math.max(1, Number(e.target.value)))}
                      required
                    />
                  </Field>
                  <Field label="Color">
                    <div className="flex items-center gap-2 border-2 border-black p-1.5 h-[52px]">
                      <input
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        className="w-full h-full cursor-pointer border-none bg-transparent"
                      />
                    </div>
                  </Field>
                </div>
                {newQuantity > 0 && <RarityPreview quantity={newQuantity} totalPool={totalPool} />}
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-black hover:bg-red-600 text-white py-4 rounded-none font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 className="animate-spin" /> : "Add to Wheel"}
                </button>
              </form>
            </div>
          </div>

          {/* Slices List Section */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black uppercase text-xl tracking-tight">Active Slices</h3>
              <div className="h-1 flex-grow mx-4 border-b-2 border-black hidden sm:block"></div>
            </div>

            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
            ) : prizes.length === 0 ? (
              <div className="border-2 border-dashed border-black py-20 text-center text-gray-400 font-bold uppercase">
                Empty Wheel
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prizes.map(p => {
                  const stock = stockMap[p.id];
                  const hasStock = !!stock;
                  const remaining = stock?.remaining ?? p.quantity ?? 0;
                  const total = stock?.total ?? p.quantity ?? 0;

                  return (
                    <div key={p.id} className="border-2 border-black p-4 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      {!hasStock && (
                        <button 
                          onClick={() => initStock(p)}
                          className="w-full mb-3 bg-red-600 text-white text-[10px] font-black py-1 uppercase"
                        >
                          {initializing === p.id ? "Initializing..." : "Sync Stock Data"}
                        </button>
                      )}
                      
                      <div className="flex gap-4 items-start mb-4">
                        <img src={p.imageUrl} className="w-16 h-16 border-2 border-black object-cover" alt={p.name} />
                        <div className="flex-grow">
                          <h4 className="font-black uppercase text-sm truncate w-40">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-3 h-3 border border-black" style={{ background: p.color }} />
                            <span className="text-[10px] font-mono font-bold">{p.color}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deletePrize(p.id)}
                          className="text-black hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {hasStock && (
                        <div className="space-y-4">
                          <StockBar remaining={remaining} total={total} />
                          <div className="flex items-center justify-between bg-gray-50 p-2 border border-black">
                             <div className="flex items-center gap-1">
                              <button onClick={() => restock(p.id, -1)} className="w-8 h-8 border border-black bg-white font-bold hover:bg-red-50">-</button>
                              <span className="px-3 font-black">{remaining}</span>
                              <button onClick={() => restock(p.id, 1)} className="w-8 h-8 border border-black bg-white font-bold hover:bg-red-50">+</button>
                            </div>
                            <span className="text-[10px] font-black uppercase">
                              Chance: {totalPool > 0 ? ((remaining / totalPool) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}