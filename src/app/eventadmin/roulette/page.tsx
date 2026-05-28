
"use client";

import { useState, useEffect, useCallback } from "react";
import { db, rtdb } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, orderBy, query, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { ref, get, set, remove, update, onValue, off } from "firebase/database";
import { Plus, Trash2, Gift, Loader2, Database, Sparkles, Package, RefreshCw, AlertTriangle, Trophy } from "lucide-react";
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

// 🌟 UPDATED: Matches your exact player_log field schema layout
interface Winner {
  userId: string;
  roulettePrize: string;
  prizeClaim: string;
  qrPoints?: number;
  quizPoints?: number;
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
  if (chance >= 35) return { label: "Common", color: "#000000", bg: "#ffffff" };
  return { label: "Premium", color: "#dc2626", bg: "#ffffff" };
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
  const [newColor, setNewColor] = useState("#ff0000");
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
      setWinners([]);
      return;
    }

    fetchPrizes();

    // 1. Sync Stock Realtime DB
    const stockRef = ref(rtdb, `rouletteStock/${eventId}`);
    const unsubStock = onValue(stockRef, (snap) => {
      setStockMap(snap.val() || {});
    });

    // 🌟 UPDATED: Real-time Listener reading claims straight from player_log
    const playerLogRef = collection(db, "events", eventId, "player_log");
    const unsubWinners = onSnapshot(playerLogRef, (snap) => {
      const logData = snap.docs
        .map(d => ({ userId: d.id, ...d.data() } as any))
        // Show only players containing the roulette validation fields
        .filter(player => player.roulettePrize && player.prizeClaim)
        // Sort chronologically using date strings parsed to Unix space
        .sort((a, b) => new Date(b.prizeClaim).getTime() - new Date(a.prizeClaim).getTime());

      setWinners(logData);
    });

    return () => {
      off(stockRef, "value", unsubStock);
      unsubWinners();
    };
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
            <StatPill label="Total Claims" value={winners.length} color="" />
            <StatPill label="Available Stock" value={totalPool} color="" />
          </div>
        )}
      </header>

      {!eventId ? (
        <div className="border-2 border-black p-12 text-center">
          <Database className="mx-auto mb-4" size={48} />
          <p className="font-black uppercase">Select an event to proceed</p>
        </div>
      ) : (
        <div className="space-y-10">
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
                    className="w-full bg-white border-2 border-black hover:bg-red-600 text-white py-4 rounded-none font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
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

          {/* 🌟 NEW ADDITION: Live Claim Logs Ledger View */}
          {/* <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-xl mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
              <Trophy className="text-red-600" size={22} /> Realtime Claims Ledger
            </h3>
            
            {winners.length === 0 ? (
              <p className="text-center py-8 font-bold uppercase text-gray-400 text-xs tracking-wider">
                No roulette prize claims recorded yet for this event
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-50">
                      <th className="p-3 text-[10px] font-black uppercase tracking-wider">User ID</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-wider">Won Prize</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-wider">Claim Timestamp</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-wider text-right">Activity Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((winner) => (
                      <tr key={winner.userId} className="border-b border-gray-200 hover:bg-red-50/50 transition-colors">
                        <td className="p-3 font-mono text-xs font-bold text-gray-600 truncate max-w-[150px]">
                          {winner.userId}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-black text-white text-xs font-black uppercase tracking-tight">
                            {winner.roulettePrize}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-xs text-gray-700">
                          {winner.prizeClaim}
                        </td>
                        <td className="p-3 text-right text-xs font-black">
                          <span className="text-gray-400 font-normal mr-2">QR: {winner.qrPoints ?? 0}</span>
                          <span className="text-red-600">Quiz: {winner.quizPoints ?? 0}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}