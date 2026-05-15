

// "use client";

// import React, { useState, useEffect } from "react";
// import { useParams ,useRouter } from "next/navigation";
// import { motion, useAnimation } from "framer-motion";
// import { Loader2, ChevronLeft, Trophy, Lock, Gift } from "lucide-react";
// import { db, auth, rtdb } from "@/lib/firebase";
// import { collection, getDocs, doc, setDoc, orderBy, query } from "firebase/firestore";
// import { ref, get, set, update, runTransaction } from "firebase/database";
// import { onAuthStateChanged } from "firebase/auth";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Prize {
//   id: string;
//   name: string;
//   imageUrl: string;
//   color: string;
//   remaining: number;
// }

// // ─── Weighted random ──────────────────────────────────────────────────────────
// function weightedRandom(prizes: Prize[]): number {
//   const total = prizes.reduce((sum, p) => sum + p.remaining, 0);
//   if (total === 0) return 0;
//   let rand = Math.random() * total;
//   for (let i = 0; i < prizes.length; i++) {
//     rand -= prizes[i].remaining;
//     if (rand <= 0) return i;
//   }
//   return prizes.length - 1;
// }

// // ─── SVG Wheel ────────────────────────────────────────────────────────────────
// function RouletteWheel({
//   prizes,
//   controls,
// }: {
//   prizes: Prize[];
//   controls: ReturnType<typeof useAnimation>;
// }) {
//   const [size, setSize] = useState(320);
  
//   useEffect(() => {
//     const handleResize = () => {
//       const newSize = window.innerWidth < 400 ? 280 : 320;
//       setSize(newSize);
//     };
//     handleResize();
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const cx = size / 2;
//   const cy = size / 2;
//   const r = size / 2 - 4;
//   const n = prizes.length;

//   const slicePath = (i: number) => {
//     const start = (i / n) * 2 * Math.PI - Math.PI / 2;
//     const end = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
//     const x1 = cx + r * Math.cos(start);
//     const y1 = cy + r * Math.sin(start);
//     const x2 = cx + r * Math.cos(end);
//     const y2 = cy + r * Math.sin(end);
//     const large = n === 1 ? 1 : 0;
//     return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
//   };

//   const imagePos = (i: number) => {
//     const angle = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
//     const imgR = r * 0.65;
//     return { x: cx + imgR * Math.cos(angle), y: cy + imgR * Math.sin(angle) };
//   };

//   return (
//     <motion.div animate={controls} style={{ width: size, height: size }} className="relative">
//       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-xl">
//         <circle cx={cx} cy={cy} r={r} fill="white" stroke="black" strokeWidth={4} />
//         {prizes.map((prize, i) => (
//           <path 
//             key={prize.id || i} 
//             d={slicePath(i)} 
//             fill={prize.color || "#000000"} 
//             stroke="white" 
//             strokeWidth={1}
//           />
//         ))}
//         {prizes.map((prize, i) => {
//           const pos = imagePos(i);
//           const imgSize = Math.min(r * 0.55, (2 * Math.PI * r * 0.75) / n - 6);
//           return (
//             <g key={`img-group-${prize.id || i}`} transform={`rotate(${(i + 0.5) * (360/n)}, ${pos.x}, ${pos.y})`}>
//                <image
//                 href={prize.imageUrl}
//                 x={pos.x - imgSize / 2}
//                 y={pos.y - imgSize / 2}
//                 width={imgSize}
//                 height={imgSize}
//                 className="rounded-full"
//                 preserveAspectRatio="xMidYMid slice"
//               />
//             </g>
//           );
//         })}
//         <circle cx={cx} cy={cy} r={20} fill="black" stroke="white" strokeWidth={3} />
//         <circle cx={cx} cy={cy} r={6} fill="#dc2626" />
//       </svg>
//     </motion.div>
//   );
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────
// export default function PlayerRoulettePage({ params }: { params: Promise<{ eventId: string }> }) {
//   const resolvedParams = React.use(params);
//   const eventId = resolvedParams.eventId;
//   const router = useRouter();
  
//   const [stage, setStage] = useState<"loading" | "no_prize" | "ready" | "result" | "already_spin" | "no_stock">("loading");
//   const [user, setUser] = useState<any>(null);
//   const [prizes, setPrizes] = useState<Prize[]>([]);
//   const [isSpinning, setIsSpinning] = useState(false);
//   const [winner, setWinner] = useState<Prize | null>(null);
//   const controls = useAnimation();

//   useEffect(() => {
//     if (!eventId) return;
//     let mounted = true;

//     const unsub = onAuthStateChanged(auth, async (currentUser) => {
//       if (!currentUser) { router.push("/"); return; }
//       if (mounted) setUser(currentUser);

//       try {
//         const q = query(collection(db, "events", eventId, "roulette"), orderBy("createdAt", "asc"));
//         const snap = await getDocs(q);
//         const firestorePrizes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

//         const stockSnap = await get(ref(rtdb, `rouletteStock/${eventId}`));
//         const stockData: Record<string, { remaining: number; total: number }> = stockSnap.val() || {};

//         const livePrizes: Prize[] = firestorePrizes
//           .map(p => ({
//             id: p.id,
//             name: p.name,
//             imageUrl: p.imageUrl,
//             color: p.color || "#000000",
//             remaining: stockData[p.id]?.remaining ?? p.quantity ?? 1,
//           }))
//           .filter(p => p.remaining > 0);

//         if (mounted) setPrizes(livePrizes);

//         const userInfoSnap = await get(ref(rtdb, `eventsProgress/${eventId}/${currentUser.uid}/userInfo`));
//         const userInfo = userInfoSnap.val() || {};

//         if (userInfo.roulettePrize) {
//           const matchedPrize = livePrizes.find(p => p.name === userInfo.roulettePrize) || {
//             name: userInfo.roulettePrize, imageUrl: "", color: "#000000", id: "legacy", remaining: 0,
//           };
//           if (mounted) { setWinner(matchedPrize as Prize); setStage("already_spin"); }
//           return;
//         }
//         if (userInfo.prize !== "claimed") { if (mounted) setStage("no_prize"); return; }
//         if (livePrizes.length === 0) { if (mounted) setStage("no_stock"); return; }
//         if (mounted) setStage("ready");

//       } catch (e) {
//         console.error("Init Error:", e);
//         if (mounted) setStage("no_prize");
//       }
//     });

//     return () => { mounted = false; unsub(); };
//   }, [eventId, router]);

//   const spin = async () => {
//     if (isSpinning || prizes.length === 0 || stage !== "ready" || !user) return;
//     setIsSpinning(true);

//     try {
//       const winIndex = weightedRandom(prizes);
//       const wonPrize = prizes[winIndex];
//       const stockRef = ref(rtdb, `rouletteStock/${eventId}/${wonPrize.id}`);
      
//       const transactionResult = await runTransaction(stockRef, (currentStock) => {
//         if (currentStock === null) return currentStock;
//         if (currentStock.remaining <= 0) return undefined;
//         return { ...currentStock, remaining: currentStock.remaining - 1 };
//       });

//       if (!transactionResult.committed) {
//         alert("Prizes just ran out! Refreshing...");
//         window.location.reload();
//         return;
//       }

//       const segDeg = 360 / prizes.length;
//       const sliceOffset = segDeg * (0.2 + Math.random() * 0.6);
//       const targetAngle = - (winIndex * segDeg + sliceOffset);
//       const totalRotation = 10 * 360 + targetAngle;

//       await controls.start({
//         rotate: totalRotation,
//         transition: { duration: 5, ease: [0.12, 0, 0.02, 1] },
//       });

//       const now = new Date().toISOString();
//       const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/userInfo`);
//       await update(userProgressRef, { roulettePrize: wonPrize.name, prize: "completed" });

//       await setDoc(doc(db, "events", eventId, "prize_results", user.uid), {
//         userId: user.uid,
//         username: user.displayName || "Anonymous",
//         prizeName: wonPrize.name,
//         imageUrl: wonPrize.imageUrl,
//         claimedAt: now,
//       });

//       setWinner(wonPrize);
//       setStage("result");
//     } catch (e) {
//       console.error("Spin error:", e);
//     } finally {
//       setIsSpinning(false);
//     }
//   };

//   // ─── Screens ──────────────────────────────────────────────────────────────

//   if (stage === "loading") {
//     return (
//       <FullScreen bg="white">
//         <Loader2 className="text-red-600 animate-spin" size={44} />
//         <p className="text-black font-black uppercase tracking-widest text-[10px] mt-5">Loading Eligibility</p>
//       </FullScreen>
//     );
//   }

//   if (stage === "no_prize" || stage === "no_stock" || stage === "already_spin" || (stage === "result" && winner)) {
//     // ROUTE CHANGED HERE: Updated btnHref to /finish
//     const config = {
//       no_prize: { icon: <Gift size={40} />, title: "No Access", body: "Claim your map prize first.", btnLabel: "Back to Results", btnHref: `/eventsmaker/${eventId}/finish` },
//       no_stock: { icon: <Gift size={40} className="text-red-600" />, title: "Empty Pool", body: "All prizes have been claimed.", btnLabel: "Back to Results", btnHref: `/eventsmaker/${eventId}/finish` },
//       already_spin: { icon: <Lock size={40} />, title: "Completed", body: "You have already used your spin.", btnLabel: "Back to Results", btnHref: `/eventsmaker/${eventId}/finish` },
//       result: { icon: <Trophy size={40} className="text-red-600" />, title: "You Won!", body: winner?.name || "", btnLabel: "Done", btnHref: `/eventsmaker/${eventId}/finish` }
//     };
    
//     const current = config[stage === "result" ? "result" : (stage as keyof typeof config)];

//     return (
//       <FullScreen bg="white">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-black p-8 text-center max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
//           <div className="flex justify-center mb-4">{current.icon}</div>
//           <h2 className="text-3xl font-black uppercase mb-2">{current.title}</h2>
//           <p className="font-bold text-gray-600 mb-6 uppercase text-sm">{current.body}</p>
//           {winner && stage === "already_spin" && (
//             <div className="border-2 border-black p-3 mb-6 flex items-center gap-3">
//               <img src={winner.imageUrl} className="w-10 h-10 object-cover border border-black" />
//               <span className="font-black uppercase text-xs">{winner.name}</span>
//             </div>
//           )}
//           {/* ROUTE CHANGED HERE */}
//           <button onClick={() => window.location.href = current.btnHref} className="w-full py-4 bg-black text-white font-black uppercase tracking-tighter hover:bg-red-600 transition-colors">
//             {current.btnLabel}
//           </button>
//         </motion.div>
//       </FullScreen>
//     );
//   }

//   return (
//     <main className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between p-6">
//       {/* Header */}
//       <div className="w-full flex items-center justify-between">
//         {/* ROUTE CHANGED HERE: Updated back button to /finish */}
//         <button onClick={() => window.location.href = `/eventsmaker/${eventId}/finish`} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
//           <ChevronLeft size={24} />
//         </button>
//         <h2 className="font-black uppercase tracking-tighter text-xl">Roulette</h2>
//         <div className="w-10" />
//       </div>

//       <div className="flex flex-col items-center w-full">
//         <h1 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Spin & Win</h1>
//         <div className="h-1 w-20 bg-red-600 mb-8" />

//         <div className="relative">
//           <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-md">
//             <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600" />
//           </div>
          
//           <div className="border-8 border-black rounded-full p-1 bg-white shadow-2xl">
//             {prizes.length > 0 ? (
//               <RouletteWheel prizes={prizes} controls={controls} />
//             ) : (
//               <div className="w-80 h-80 rounded-full border-4 border-dashed border-black flex items-center justify-center font-black uppercase text-gray-400">
//                 Out of Stock
//               </div>
//             )}
//           </div>
//         </div>
        
//         <p className="mt-8 font-black uppercase text-[10px] tracking-widest text-gray-400">
//           {prizes.length} Slices Available
//         </p>
//       </div>

//       <div className="w-full max-w-md pb-4">
//         <button
//           onClick={spin}
//           disabled={isSpinning || prizes.length === 0}
//           className="w-full py-5 border-4 border-black bg-black text-white font-black text-2xl uppercase tracking-tighter hover:bg-red-600 active:translate-y-1 transition-all disabled:opacity-30 disabled:hover:bg-black shadow-[6px_6px_0px_0px_rgba(220,38,38,1)]"
//         >
//           {isSpinning ? "Good Luck..." : "Spin Now"}
//         </button>
//       </div>
//     </main>
//   );
// }

// function FullScreen({ children, bg }: { children: React.ReactNode; bg: string }) {
//   return (
//     <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6" style={{ background: bg }}>
//       {children}
//     </div>
//   );
// }



"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { Loader2, ChevronLeft, Trophy, Lock, Gift } from "lucide-react";
import { db, auth, rtdb } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, orderBy, query } from "firebase/firestore";
import { ref, get, update, runTransaction } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prize {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  remaining: number;
}

// ─── Weighted random ──────────────────────────────────────────────────────────
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
  const [size, setSize] = useState(320);
  
  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 400 ? 280 : 320;
      setSize(newSize);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
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
    const imgR = r * 0.65;
    return { x: cx + imgR * Math.cos(angle), y: cy + imgR * Math.sin(angle) };
  };

  return (
    <motion.div animate={controls} style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-xl">
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="black" strokeWidth={4} />
        {prizes.map((prize, i) => (
          <path 
            key={prize.id || i} 
            d={slicePath(i)} 
            fill={prize.color || "#000000"} 
            stroke="white" 
            strokeWidth={1}
          />
        ))}
        {prizes.map((prize, i) => {
          const pos = imagePos(i);
          const imgSize = Math.min(r * 0.55, (2 * Math.PI * r * 0.75) / n - 6);
          return (
            <g key={`img-group-${prize.id || i}`} transform={`rotate(${(i + 0.5) * (360/n)}, ${pos.x}, ${pos.y})`}>
               <image
                href={prize.imageUrl}
                x={pos.x - imgSize / 2}
                y={pos.y - imgSize / 2}
                width={imgSize}
                height={imgSize}
                className="rounded-full"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={20} fill="black" stroke="white" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={6} fill="#dc2626" />
      </svg>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlayerRoulettePage() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  
  const [stage, setStage] = useState<"loading" | "no_prize" | "ready" | "result" | "already_spin" | "no_stock">("loading");
  const [user, setUser] = useState<any>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Prize | null>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/"); return; }
      if (mounted) setUser(currentUser);

      try {
        const q = query(collection(db, "events", eventId, "roulette"), orderBy("createdAt", "asc"));
        const snap = await getDocs(q);
        const firestorePrizes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        const stockSnap = await get(ref(rtdb, `rouletteStock/${eventId}`));
        const stockData: Record<string, { remaining: number; total: number }> = stockSnap.val() || {};

        const livePrizes: Prize[] = firestorePrizes
          .map(p => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            color: p.color || "#000000",
            remaining: stockData[p.id]?.remaining ?? p.quantity ?? 1,
          }))
          .filter(p => p.remaining > 0);

        if (mounted) setPrizes(livePrizes);

        const userInfoSnap = await get(ref(rtdb, `eventsProgress/${eventId}/${currentUser.uid}/userInfo`));
        const userInfo = userInfoSnap.val() || {};

        if (userInfo.roulettePrize) {
          const matchedPrize = livePrizes.find(p => p.name === userInfo.roulettePrize) || {
            name: userInfo.roulettePrize, imageUrl: "", color: "#000000", id: "legacy", remaining: 0,
          };
          if (mounted) { setWinner(matchedPrize as Prize); setStage("already_spin"); }
          return;
        }
        if (userInfo.prize !== "claimed") { if (mounted) setStage("no_prize"); return; }
        if (livePrizes.length === 0) { if (mounted) setStage("no_stock"); return; }
        if (mounted) setStage("ready");

      } catch (e) {
        console.error("Init Error:", e);
        if (mounted) setStage("no_prize");
      }
    });

    return () => { mounted = false; unsub(); };
  }, [eventId, router]);

  const spin = async () => {
    if (isSpinning || prizes.length === 0 || stage !== "ready" || !user) return;
    setIsSpinning(true);

    try {
      const winIndex = weightedRandom(prizes);
      const wonPrize = prizes[winIndex];
      const stockRef = ref(rtdb, `rouletteStock/${eventId}/${wonPrize.id}`);
      
      const transactionResult = await runTransaction(stockRef, (currentStock) => {
        if (currentStock === null) return currentStock;
        if (currentStock.remaining <= 0) return undefined;
        return { ...currentStock, remaining: currentStock.remaining - 1 };
      });

      if (!transactionResult.committed) {
        alert("Prizes just ran out! Refreshing...");
        window.location.reload();
        return;
      }

      const segDeg = 360 / prizes.length;
      const sliceOffset = segDeg * (0.2 + Math.random() * 0.6);
      const targetAngle = - (winIndex * segDeg + sliceOffset);
      const totalRotation = 10 * 360 + targetAngle;

      await controls.start({
        rotate: totalRotation,
        transition: { duration: 5, ease: [0.12, 0, 0.02, 1] },
      });

      const now = new Date().toISOString();
      const userProgressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/userInfo`);
      await update(userProgressRef, { roulettePrize: wonPrize.name, prize: "completed" });

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
      <FullScreen bg="white">
        <Loader2 className="text-red-600 animate-spin" size={44} />
        <p className="text-black font-black uppercase tracking-widest text-[10px] mt-5">Loading Eligibility</p>
      </FullScreen>
    );
  }

  if (stage === "no_prize" || stage === "no_stock" || stage === "already_spin" || (stage === "result" && winner)) {
    const config = {
      no_prize: { icon: <Gift size={40} />, title: "No Access", body: "Claim your map prize first.", btnLabel: "Back to Results", btnHref: `/eventsmaker/${eventId}/finish` },
      no_stock: { icon: <Gift size={40} className="text-red-600" />, title: "Empty Pool", body: "All prizes have been claimed.", btnLabel: "Back to Results", btnHref: `/eventsmaker/${eventId}/finish` },
      already_spin: { icon: <Lock size={40} />, title: "Completed", body: "You have already used your spin.", btnLabel: "Back to Results", btnHref: `/eventsmaker/${eventId}/finish` },
      result: { icon: <Trophy size={40} className="text-red-600" />, title: "You Won!", body: winner?.name || "", btnLabel: "Done", btnHref: `/eventsmaker/${eventId}/finish` }
    };
    
    const current = config[stage === "result" ? "result" : (stage as keyof typeof config)];

    return (
      <FullScreen bg="white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-black p-8 text-center max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-center mb-4">{current.icon}</div>
          <h2 className="text-3xl font-black uppercase mb-2">{current.title}</h2>
          <p className="font-bold text-gray-600 mb-6 uppercase text-sm">{current.body}</p>
          
          {winner && (stage === "already_spin" || stage === "result") && (
            <div className="border-2 border-black p-3 mb-6 flex items-center gap-3">
              {/* FIX: Conditional rendering to prevent empty string src error */}
              {winner.imageUrl && (
                <img 
                  src={winner.imageUrl} 
                  className="w-10 h-10 object-cover border border-black" 
                  alt={winner.name}
                />
              )}
              <span className="font-black uppercase text-xs">{winner.name}</span>
            </div>
          )}

          <button onClick={() => window.location.href = current.btnHref} className="w-full py-4 bg-black text-white font-black uppercase tracking-tighter hover:bg-red-600 transition-colors">
            {current.btnLabel}
          </button>
        </motion.div>
      </FullScreen>
    );
  }

  return (
    <main className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between p-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button onClick={() => window.location.href = `/eventsmaker/${eventId}/finish`} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-black uppercase tracking-tighter text-xl">Roulette</h2>
        <div className="w-10" />
      </div>

      {/* Spinner Area */}
      <div className="flex flex-col items-center w-full">
        <h1 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Spin & Win</h1>
        <div className="h-1 w-20 bg-red-600 mb-8" />

        <div className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-md">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600" />
          </div>
          
          <div className="border-8 border-black rounded-full p-1 bg-white shadow-2xl">
            {prizes.length > 0 ? (
              <RouletteWheel prizes={prizes} controls={controls} />
            ) : (
              <div className="w-80 h-80 rounded-full border-4 border-dashed border-black flex items-center justify-center font-black uppercase text-gray-400">
                Out of Stock
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-8 font-black uppercase text-[10px] tracking-widest text-gray-400">
          {prizes.length} Slices Available
        </p>
      </div>

      {/* Action Button */}
      <div className="w-full max-w-md pb-4">
        <button
          onClick={spin}
          disabled={isSpinning || prizes.length === 0}
          className="w-full py-5 border-4 border-black bg-black text-white font-black text-2xl uppercase tracking-tighter hover:bg-red-600 active:translate-y-1 transition-all disabled:opacity-30 disabled:hover:bg-black shadow-[6px_6px_0px_0px_rgba(220,38,38,1)]"
        >
          {isSpinning ? "Good Luck..." : "Spin Now"}
        </button>
      </div>
    </main>
  );
}

function FullScreen({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6" style={{ background: bg }}>
      {children}
    </div>
  );
}