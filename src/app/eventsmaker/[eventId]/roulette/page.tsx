
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { Loader2, ChevronLeft, Trophy, Lock, Gift } from "lucide-react";
import { db, auth, rtdb } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, orderBy, query } from "firebase/firestore";
import { ref, get, set, update, runTransaction } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prize {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  remaining: number;  // live stock from RTDB
}

// ─── Weighted random ──────────────────────────────────────────────────────────
// Selects an index proportional to each prize's `remaining` count.
// Higher remaining = more likely to win (common prizes win more often).

function weightedRandom(prizes: Prize[]): number {
  const total = prizes.reduce((sum, p) => sum + p.remaining, 0);
  if (total === 0) return 0;
  let rand = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    rand -= prizes[i].remaining;
    if (rand <= 0) return i;
  }
  return prizes.length - 1;
}

// ─── SVG Wheel ────────────────────────────────────────────────────────────────

function RouletteWheel({
  prizes,
  controls,
}: {
  prizes: Prize[];
  controls: ReturnType<typeof useAnimation>;
}) {
  const SIZE = 320;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = SIZE / 2 - 6;
  const n = prizes.length;

  const slicePath = (i: number) => {
    const start = (i / n) * 2 * Math.PI - Math.PI / 2;
    const end = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = n === 1 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  const imagePos = (i: number) => {
    const angle = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
    const imgR = r * 0.6;
    return { x: cx + imgR * Math.cos(angle), y: cy + imgR * Math.sin(angle) };
  };

  return (
    <motion.div animate={controls} style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Outer glow ring */}
        <circle
          cx={cx} cy={cy} r={r + 5}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={10}
        />
        {/* Slices */}
        {prizes.map((prize, i) => (
          <path key={prize.id || i} d={slicePath(i)} fill={prize.color || "#6366f1"} />
        ))}
        {/* Slice dividers */}
        {prizes.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return (
            <line
              key={`div-${i}`}
              x1={cx} y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
          );
        })}
        {/* Icons */}
        {prizes.map((prize, i) => {
          const pos = imagePos(i);
          const imgSize = Math.min(36, (2 * Math.PI * r * 0.6) / n - 4);
          return (
            <image
              key={`img-${prize.id || i}`}
              href={prize.imageUrl}
              x={pos.x - imgSize / 2}
              y={pos.y - imgSize / 2}
              width={imgSize}
              height={imgSize}
              preserveAspectRatio="xMidYMid slice"
            />
          );
        })}
        {/* Center hub */}
        <circle cx={cx} cy={cy} r={18} fill="white" stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
        <circle cx={cx} cy={cy} r={6} fill="#6366f1" />
      </svg>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayerRoulettePage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = React.use(params);
  const eventId = resolvedParams.eventId;
  const router = useRouter();

  const [stage, setStage] = useState<
    "loading" | "no_prize" | "ready" | "result" | "already_spun" | "no_stock"
  >("loading");

  const [user, setUser]       = useState<any>(null);
  const [prizes, setPrizes]   = useState<Prize[]>([]); // only available (remaining > 0)
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner]   = useState<Prize | null>(null);
  const controls = useAnimation();

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/"); return; }
      if (mounted) setUser(currentUser);

      try {
        // 1. Fetch prize definitions from Firestore
        const q = query(
          collection(db, "events", eventId, "roulette"),
          orderBy("createdAt", "asc")
        );
        const snap = await getDocs(q);
        const firestorePrizes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        // 2. Fetch live stock from RTDB
        const stockSnap = await get(ref(rtdb, `rouletteStock/${eventId}`));
        const stockData: Record<string, { remaining: number; total: number }> =
          stockSnap.val() || {};

        // 3. Merge and filter — keep only prizes with remaining > 0
        const livePrizes: Prize[] = firestorePrizes
          .map(p => ({
            id:        p.id,
            name:      p.name,
            imageUrl:  p.imageUrl,
            color:     p.color || "#6366f1",
            // Fall back to Firestore quantity if RTDB entry missing
            remaining: stockData[p.id]?.remaining ?? p.quantity ?? 1,
          }))
          .filter(p => p.remaining > 0);

        if (mounted) setPrizes(livePrizes);

        // 4. Check user eligibility from RTDB
        const userInfoSnap = await get(
          ref(rtdb, `eventsProgress/${eventId}/${currentUser.uid}/userInfo`)
        );
        const userInfo = userInfoSnap.val() || {};

        // Already spun → show their prize
        if (userInfo.roulettePrize) {
          const matchedPrize = livePrizes.find(p => p.name === userInfo.roulettePrize) || {
            name:      userInfo.roulettePrize,
            imageUrl:  "",
            color:     "#6366f1",
            id:        "legacy",
            remaining: 0,
          };
          if (mounted) { setWinner(matchedPrize as Prize); setStage("already_spun"); }
          return;
        }

        // Not eligible (no claimed prize)
        if (userInfo.prize !== "claimed") {
          if (mounted) setStage("no_prize");
          return;
        }

        // No prizes with stock left
        if (livePrizes.length === 0) {
          if (mounted) setStage("no_stock");
          return;
        }

        // All good — ready to spin
        if (mounted) setStage("ready");

      } catch (e) {
        console.error("Init Error:", e);
        if (mounted) setStage("no_prize");
      }
    });

    return () => { mounted = false; unsub(); };
  }, [eventId, router]);

  // ─── Spin ─────────────────────────────────────────────────────────────────

  const spin = async () => {
  if (isSpinning || prizes.length === 0 || stage !== "ready" || !user) return;
  setIsSpinning(true);

  try {
    // 1. SELECT WINNER (Weighted)
    const winIndex = weightedRandom(prizes);
    const wonPrize = prizes[winIndex];

    // 2. ATOMIC TRANSACTION TO DECREASE STOCK
    // Ensure path matches screenshot: rouletteStock -> eventId -> prizeId
    const stockRef = ref(rtdb, `rouletteStock/${eventId}/${wonPrize.id}`);
    
    const transactionResult = await runTransaction(stockRef, (currentStock) => {
      if (currentStock === null) return currentStock; // Path doesn't exist
      if (currentStock.remaining <= 0) return undefined; // Abort: No stock left
      
      return {
        ...currentStock,
        remaining: currentStock.remaining - 1
      };
    });

    if (!transactionResult.committed) {
      alert("Prizes just ran out! Refreshing...");
      window.location.reload();
      return;
    }

    // 3. ANIMATION
    const segDeg = 360 / prizes.length;
    const sliceOffset = segDeg * (0.2 + Math.random() * 0.6);
    const targetAngle = winIndex * segDeg + sliceOffset;
    const totalRotation = 10 * 360 + targetAngle;

    await controls.start({
      rotate: totalRotation,
      transition: { duration: 5, ease: [0.12, 0, 0.02, 1] },
    });

    // 4. PERSIST TO FIREBASE (RTDB & Firestore)
    const now = new Date().toISOString();
    
    // Update RTDB: Mark prize name AND change status so they can't spin again
    const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/userInfo`);
    await update(userProgressRef, {
      roulettePrize: wonPrize.name,
      prize: "completed" // Change from "claimed" to "completed" to hide spin option
    });

    // Update Firestore for Admin logs
    await setDoc(doc(db, "events", eventId, "prize_results", user.uid), {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      prizeName: wonPrize.name,
      imageUrl: wonPrize.imageUrl,
      claimedAt: now,
    });

    setWinner(wonPrize);
    setStage("result");

  } catch (e) {
    console.error("Spin error:", e);
  } finally {
    setIsSpinning(false);
  }
};

  // ─── Screens ──────────────────────────────────────────────────────────────

  if (stage === "loading") {
    return (
      <FullScreen bg="#0d0d1a">
        <Loader2 className="text-indigo-400 animate-spin" size={44} />
        <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[9px] mt-5">
          Checking eligibility...
        </p>
      </FullScreen>
    );
  }

  if (stage === "no_prize") {
    return (
      <FullScreen bg="#0a0a14">
        <InfoCard
          icon={<Gift size={40} className="text-slate-400" />}
          iconBg="bg-slate-100"
          title="No Prize Available"
          body="You need to claim a prize first before spinning the roulette wheel."
          sub="Complete the event and claim your prize on the map to unlock the spin."
          btnLabel="Back to Map"
          btnHref={`/eventsmaker/${eventId}`}
        />
      </FullScreen>
    );
  }

  if (stage === "no_stock") {
    return (
      <FullScreen bg="#0a0a14">
        <InfoCard
          icon={<Gift size={40} className="text-orange-400" />}
          iconBg="bg-orange-50"
          title="All Prizes Claimed"
          body="All roulette prizes have been claimed for this event."
          sub="Please check back later or contact the event organizer."
          btnLabel="Back to Map"
          btnHref={`/eventsmaker/${eventId}`}
        />
      </FullScreen>
    );
  }

  if (stage === "already_spun") {
    return (
      <FullScreen bg="#0a0a14">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[44px] max-w-sm w-full p-10 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Already Spun!</h2>
          <p className="text-slate-500 text-sm font-medium mb-6">
            You already completed your roulette spin. Each player gets one spin only.
          </p>
          {winner && (
            <div
              className="rounded-2xl p-4 mb-6 flex items-center gap-4"
              style={{
                background: `${winner.color || "#6366f1"}15`,
                border:     `2px solid ${winner.color || "#6366f1"}30`,
              }}
            >
              {winner.imageUrl && (
                <img
                  src={winner.imageUrl}
                  alt={winner.name}
                  className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Your prize</p>
                <p className="text-lg font-black uppercase" style={{ color: winner.color || "#6366f1" }}>
                  {winner.name}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => window.location.href = `/eventsmaker/${eventId}`}
            className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest"
          >
            Back to Map
          </button>
        </motion.div>
      </FullScreen>
    );
  }

  if (stage === "result" && winner) {
    return (
      <FullScreen bg="#0a0a14">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[44px] max-w-sm w-full p-10 text-center shadow-2xl"
        >
          <Trophy className="text-emerald-500 mx-auto mb-4" size={52} />
          <h2 className="text-3xl font-black text-slate-900 mb-1 uppercase">You Won!</h2>
          <div
            className="rounded-3xl p-5 mb-7 flex flex-col items-center gap-3"
            style={{
              background: `${winner.color}15`,
              border:     `2px solid ${winner.color}30`,
            }}
          >
            <img
              src={winner.imageUrl}
              alt={winner.name}
              className="w-20 h-20 object-cover rounded-2xl"
            />
            <p className="text-2xl font-black uppercase" style={{ color: winner.color }}>
              {winner.name}
            </p>
          </div>
          <button
            onClick={() => window.location.href = `/eventsmaker/${eventId}`}
            className="w-full py-4 text-white rounded-[20px] font-black uppercase tracking-widest"
            style={{ background: winner.color || "#6366f1" }}
          >
            Return to Map
          </button>
        </motion.div>
      </FullScreen>
    );
  }

  // ─── Wheel Screen (stage === "ready") ─────────────────────────────────────

  return (
    <main className="fixed inset-0 z-[9999] bg-[#0d0020] flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Header */}
      <div className="relative z-10 w-full flex items-center justify-between pt-2">
        <button
          onClick={() => window.location.href = `/eventsmaker/${eventId}`}
          className="p-3 bg-white/10 rounded-2xl text-white border border-white/10"
        >
          <ChevronLeft size={22} />
        </button>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
          Bonus Reward
        </p>
        <div className="w-11" />
      </div>

      {/* Wheel */}
      <div className="relative flex flex-col items-center z-10">
        <h1 className="text-white text-3xl font-black uppercase italic mb-10 text-center">
          Spin the Wheel
        </h1>

        {/* Prize count badge */}
        <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest mb-4">
          {prizes.length} prize{prizes.length !== 1 ? "s" : ""} available
        </p>

        <div className="relative">
          {/* Pointer */}
          <div
            className="absolute -top-5 left-1/2 -translate-x-1/2 z-20"
            style={{
              width: 0, height: 0,
              borderLeft:  "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop:   "28px solid white",
            }}
          />
          {prizes.length > 0 ? (
            <RouletteWheel prizes={prizes} controls={controls} />
          ) : (
            <div className="w-80 h-80 rounded-full border border-white/10 flex items-center justify-center text-white/30 text-xs uppercase">
              No prizes with stock
            </div>
          )}
        </div>
      </div>

      {/* Spin button */}
      <div className="relative z-10 w-full pb-4">
        <button
          onClick={spin}
          disabled={isSpinning || prizes.length === 0}
          className="w-full py-6 rounded-[28px] font-black text-xl uppercase italic tracking-wide transition-all active:scale-95 disabled:opacity-40 shadow-2xl"
          style={{
            background: isSpinning ? "rgba(255,255,255,0.1)" : "white",
            color:      isSpinning ? "white" : "#4f46e5",
          }}
        >
          {isSpinning ? "Spinning..." : "SPIN NOW"}
        </button>
      </div>
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FullScreen({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
      style={{ background: bg }}
    >
      {children}
    </div>
  );
}

function InfoCard({
  icon, iconBg, title, body, sub, btnLabel, btnHref,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
  sub: string;
  btnLabel: string;
  btnHref: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[44px] max-w-sm w-full p-10 text-center shadow-2xl"
    >
      <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
        {icon}
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase">{title}</h2>
      <p className="text-slate-500 text-sm font-medium mb-2">{body}</p>
      <p className="text-slate-400 text-xs mb-8">{sub}</p>
      <button
        onClick={() => (window.location.href = btnHref)}
        className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest"
      >
        {btnLabel}
      </button>
    </motion.div>
  );
}