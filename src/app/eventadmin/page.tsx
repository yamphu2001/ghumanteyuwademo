
// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth, db, rtdb } from "@/lib/firebase";
// import { EventIdProvider, useEventId } from "@/app/eventadmin/Eventidcontext";
// import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
// import { ref, update as updateRtdb } from "firebase/database";

// import EventsAdmin from "@/app/eventadmin/events/EventsAdmin";
// import EventAreaAdmin from "@/app/eventadmin/eventarea/page";
// import AdminQRMarkersPage from "@/app/eventadmin/qrcodemarkers/page";
// import GhumanteStallAdmin from "@/app/eventadmin/ghumantestall/page";
// import AdminServiceMarker from "@/app/eventadmin/3dservicemarkers/page";
// import ProgressBarAdmin from "@/app/eventadmin/progressbar/page";
// import AdminQuiz from "@/app/eventadmin/quiz/page";
// import RouletteAdmin from "@/app/eventadmin/roulette/page";

// // Absolute path import for your custom scanner asset node
// import QRScanner from "@/app/eventadmin/qrscanner/qrscanner";

// interface ScannedPayload {
//   event: string;
//   player: string;
//   status: string;
//   progress: string;
//   time: string;
//   points: number;
//   prizeWon: string;
//   type: string;
// }

// const tabs = [
//   { id: "eventarea", label: "Event Area", icon: "🗺️" },
//   { id: "group_markers", label: "Event Markers", icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
//   { id: "qrcodemarker", label: "QR Markers", icon: "🔳", indent: true, parent: "group_markers" },
//   { id: "progress", label: "Progress Bar", icon: "📊" },
//   { id: "quiz", label: "Quiz Management", icon: "🧠" },
//   { id: "group_rewards", label: "Rewards & Games", icon: "🎁", isHeader: true, children: ["prize", "roulette", "verify_player"] },
//   { id: "roulette", label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },
//   { id: "verify_player", label: "Verify Player Prize", icon: "⚡", indent: true, parent: "group_rewards" },
//   { id: "group_stalls", label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["ghumantestall", "servicemarkers"] },
//   { id: "ghumantestall", label: "Ghumante Stall", icon: "🏪", indent: true, parent: "group_stalls" },
//   { id: "servicemarkers", label: "3D Service Markers", icon: "🏗️", indent: true, parent: "group_stalls" },
// ];

// // ── NEW AUTOMATED SCANNER SUB-VIEW WITH REAL-TIME AGGREGATE COUNT ──
// function VerifyPlayerSubView() {
//   const { eventId } = useEventId();
//   const [isScannerOpen, setIsScannerOpen] = useState(false);
//   const [lastScannedData, setLastScannedData] = useState<ScannedPayload | null>(null);
//   const [totalVerifiedCount, setTotalVerifiedCount] = useState<number>(0);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   // Real-time listener capturing live total verified counts from target event path
//   useEffect(() => {
//     if (!eventId) return;

//     const verifiedQuery = query(
//       collection(db, "events", eventId, "player_log"),
//       where("verifiedByAdmin", "==", true)
//     );

//     const unsubscribe = onSnapshot(verifiedQuery, (snapshot) => {
//       setTotalVerifiedCount(snapshot.size);
//     }, (err) => {
//       console.error("Error listening to verified count: ", err);
//     });

//     return () => unsubscribe();
//   }, [eventId]);

//   // 🌟 ADDED PERSISTENCE HOOK: Hydrate state data safely from localStorage after reload
//   useEffect(() => {
//     if (typeof window !== "undefined" && eventId) {
//       const saved = localStorage.getItem(`lastScannedData_${eventId}`);
//       if (saved) {
//         try {
//           setLastScannedData(JSON.parse(saved));
//         } catch (e) {
//           console.error("Error parsing persisted scan data:", e);
//         }
//       } else {
//         setLastScannedData(null);
//       }
//     }
//   }, [eventId]);

//   // Automated Instant pipeline execution hook handler
//   const handleScanSuccess = async (rawResult: string) => {
//     setError(null);
//     setSuccess(null);
//     setLoading(true);

//     try {
//       const parsed: ScannedPayload = JSON.parse(rawResult);

//       // 1. Validation checks
//       if (parsed.type !== "verification_finish") {
//         setError("Invalid QR Code payload type.");
//         setIsScannerOpen(false);
//         setLoading(false);
//         return;
//       }

//       if (eventId && parsed.event !== eventId) {
//         setError(`Event mismatch! Ticket context belongs to: ${parsed.event}`);
//         setIsScannerOpen(false);
//         setLoading(false);
//         return;
//       }

//       if (!eventId) {
//         setError('No active event selected. Please choose an event before scanning.');
//         setIsScannerOpen(false);
//         setLoading(false);
//         return;
//       }

//       // 2. Fetch User account matching identity
//       const usersRef = collection(db, "users");
//       const q = query(usersRef, where("username", "==", parsed.player));
//       const querySnapshot = await getDocs(q);

//       if (querySnapshot.empty) {
//         setError(`Parsed identity "${parsed.player}" doesn't match an existing database UID mapping.`);
//         setIsScannerOpen(false);
//         setLoading(false);
//         return;
//       }

//       const playerUid = querySnapshot.docs[0].id;

//       // 3. INSTANT AUTO-WRITE TRANSACTION PIPELINE (No confirmations required)
//       const updates = {
//         prizeStatus: "CLAIMED",
//         verifiedAt: new Date().toISOString(),
//         verifiedByAdmin: true,
//       };

//       // Atomic commit directly to individual player history collection
//       const playerLogRef = doc(db, "events", eventId, "player_log", playerUid);
//       await updateDoc(playerLogRef, updates);

//       let rtdbWarning: string | null = null;
//       try {
//         const rtdbProgressRef = ref(rtdb, `eventsProgress/${eventId}/${playerUid}`);
//         await updateRtdb(rtdbProgressRef, {
//           prize: "CLAIMED",
//           verified: true,
//         });
//       } catch (rtdbErr: any) {
//         console.warn("RTDB update failed", rtdbErr);
//         if (rtdbErr?.code === 'permission-denied') {
//           rtdbWarning = 'Realtime DB sync skipped due to permission limits.';
//         } else {
//           rtdbWarning = 'Realtime DB sync failed, but Firestore verification succeeded.';
//         }
//       }

//       // 4. Update local interface display state maps
//       setLastScannedData(parsed);

//       // 🌟 ADDED PERSISTENCE LOGIC: Cache the data string safely into localStorage
//       if (typeof window !== "undefined" && eventId) {
//         localStorage.setItem(`lastScannedData_${eventId}`, JSON.stringify(parsed));
//       }

//       setSuccess(
//         `Successfully verified and processed data for player: ${parsed.player}` +
//         (rtdbWarning ? ` ${rtdbWarning}` : "")
//       );
//       setIsScannerOpen(false);
//     } catch (err: any) {
//       console.error(err);
//       if (err instanceof SyntaxError) {
//         setError('Failed to parse QR payload. Ensure the scanned code is valid JSON and contains the expected fields.');
//       } else if (err?.code === 'permission-denied') {
//         setError('Permission denied: current user cannot update this player record. Confirm the signed-in account has admin privileges or update your Firestore/Realtime DB rules accordingly.');
//       } else {
//         setError(err?.message || 'Unexpected error processing the verification payload.');
//       }
//       setIsScannerOpen(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: "600px", margin: "0 auto", padding: "10px 0" }}>

//       {/* Real-time Metrics Tracker Block Badge */}
//       <div style={{
//         border: "2px solid #000",
//         background: "#000",
//         color: "#fff",
//         padding: "16px",
//         marginBottom: "24px",
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         boxShadow: "4px 4px 0px 0px rgba(220,38,38,1)"
//       }}>
//         <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: "black", letterSpacing: "1px" }}>
//           TOTAL VERIFIED & CLAIMED PLAYERS
//         </span>
//         <span style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 900, color: "#fca5a5" }}>
//           {totalVerifiedCount}
//         </span>
//       </div>

//       {error && (
//         <div style={{ border: "2px solid #dc2626", background: "#fef2f2", color: "#dc2626", fontWeight: "bold", padding: "12px", fontSize: "12px", marginBottom: "20px", fontFamily: "monospace" }}>
//           ✕ ERROR: {error}
//         </div>
//       )}

//       {success && (
//         <div style={{ border: "2px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontWeight: "bold", padding: "12px", fontSize: "12px", marginBottom: "20px", fontFamily: "monospace" }}>
//           ✓ AUTO-PROCESSED: {success}
//         </div>
//       )}

//       {/* Primary Trigger Interface Controls */}
//       <div style={{ textAlign: "center", marginBottom: "24px" }}>
//         <button
//           type="button"
//           onClick={() => setIsScannerOpen(true)}
//           disabled={loading}
//           style={{
//             width: "100%",
//             background: "#dc2626",
//             color: "#fff",
//             border: "2px solid #000",
//             padding: "16px",
//             cursor: "pointer",
//             fontWeight: 900,
//             fontFamily: "monospace",
//             fontSize: "14px",
//             letterSpacing: "0.5px",
//             boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
//             opacity: loading ? 0.6 : 1
//           }}
//         >
//           {loading ? "SAVING INTO RECORD STREAMS..." : "LAUNCH CAMERA INSTANT-SCANNER"}
//         </button>
//       </div>

//       {/* Real-time Display Block: Last successfully captured record on this terminal session */}
//       {lastScannedData && (
//         <div style={{ border: "2px solid #000", background: "#fff", padding: "20px", boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.05)" }}>
//           <div style={{ fontSize: "10px", fontWeight: "black", color: "#999", fontFamily: "monospace", marginBottom: "12px", letterSpacing: "1px" }}>
//             LAST VERIFIED TARGET MANIFEST DATA
//           </div>

//           <div style={{ fontFamily: "monospace", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
//             <div style={{ borderBottom: "1px dashed #eee", paddingBottom: "6px" }}>
//               <span style={{ color: "#666" }}>PLAYER NAME:</span> <strong style={{ fontSize: "14px", color: "#000" }}>{lastScannedData.player}</strong>
//             </div>
//             <div style={{ borderBottom: "1px dashed #eee", paddingBottom: "6px" }}>
//               <span style={{ color: "#666" }}>PRIZE COMMITTED:</span> <strong style={{ color: "#dc2626" }}>{lastScannedData.prizeWon}</strong>
//             </div>
//             <div style={{ borderBottom: "1px dashed #eee", paddingBottom: "6px" }}>
//               <span style={{ color: "#666" }}>COMPLETION TIME:</span> <strong style={{ color: "black" }}>{lastScannedData.time}</strong>
//             </div>
//             <div style={{ borderBottom: "1px dashed #eee", paddingBottom: "6px" }}>
//               <span style={{ color: "#666" }}>ACCUMULATED SCORE:</span> <strong style={{ color: "black" }}>{lastScannedData.points} PTS</strong>
//             </div>
//             <div>
//               <span style={{ color: "#666" }}>GAME CHECKPOINT:</span> <span style={{ color: "black" }}>{lastScannedData.progress} ({lastScannedData.status})</span>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Overlay Port Rendering Mount Point */}
//       {isScannerOpen && (
//         <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#000" }}>
//           <QRScanner
//             onScanSuccess={handleScanSuccess}
//             onClose={() => setIsScannerOpen(false)}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// function AdminShell() {
//   const { eventId, setEventId } = useEventId();
//   const [activeTab, setActiveTab] = useState("eventarea");
//   const [openGroup, setOpenGroup] = useState<string | null>(null);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   if (!eventId) {
//     return <EventsAdmin onSelect={(id: string) => { setEventId(id); setActiveTab("eventarea"); }} />;
//   }

//   const renderContent = (): React.ReactNode => {
//     const components: Record<string, React.ReactNode> = {
//       eventarea: <EventAreaAdmin />,
//       qrcodemarker: <AdminQRMarkersPage />,
//       ghumantestall: <GhumanteStallAdmin />,
//       servicemarkers: <AdminServiceMarker />,
//       progress: <ProgressBarAdmin />,
//       quiz: <AdminQuiz />,
//       roulette: <RouletteAdmin />,
//       verify_player: <VerifyPlayerSubView />,
//     };
//     return components[activeTab] ?? (
//       <div style={{ padding: 20, color: "#999", fontFamily: "monospace" }}>
//         Component for <strong>{activeTab}</strong> not implemented yet.
//       </div>
//     );
//   };

//   return (
//     <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#fff", overflow: "hidden" }}>
//       {/* Dynamic Responsive Styles Injection */}
//       <style>{`
//         @media (max-width: 767px) {
//           .responsive-sidebar {
//             position: fixed !important;
//             top: 50px !important;
//             left: 0 !important;
//             height: calc(100vh - 50px) !important;
//             z-index: 40 !important;
//             transform: translateX(-100%);
//             transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
//             box-shadow: 10px 0 0px rgba(0,0,0,0.05);
//           }
//           .sidebar-open {
//             transform: translateX(0) !important;
//           }
//           .mobile-topbar {
//             display: flex !important;
//             height: 50px !important;
//           }
//           .breadcrumb-bar {
//             padding: 10px 16px !important;
//           }
//         }
//         @media (min-width: 768px) {
//           .mobile-topbar {
//             display: none !important;
//           }
//         }
//       `}</style>

//       {/* ── Mobile Top Bar ── */}
//       <div
//         className="mobile-topbar"
//         style={{
//           display: "none", alignItems: "center", justifyContent: "space-between",
//           background: "#fff", borderBottom: "2px solid #000",
//           padding: "12px 16px", zIndex: 50, boxSizing: "border-box"
//         }}
//       >
//         <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, letterSpacing: 2, color: "#dc2626" }}>
//           ADMIN
//         </span>
//         <button
//           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//           style={{ background: "none", border: "2px solid #000", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 16 }}
//         >
//           {isMobileMenuOpen ? "✕" : "☰"}
//         </button>
//       </div>

//       <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
//         {/* ── Sidebar ── */}
//         <nav
//           className={`responsive-sidebar ${isMobileMenuOpen ? "sidebar-open" : ""}`}
//           style={{
//             width: 240,
//             background: "#fff",
//             borderRight: "2px solid #000",
//             display: "flex",
//             flexDirection: "column",
//             flexShrink: 0,
//             overflowY: "auto",
//           }}
//         >
//           {/* Logo */}
//           <div style={{ padding: "20px 20px 16px", borderBottom: "2px solid #000" }}>
//             <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 18, letterSpacing: 3, color: "#dc2626" }}>
//               ADMIN
//             </div>
//             <div style={{ fontFamily: "monospace", fontSize: 10, color: "#999", marginTop: 2, letterSpacing: 1 }}>
//               PANEL
//             </div>
//           </div>

//           {/* Event ID strip */}
//           <div style={{
//             padding: "10px 16px",
//             borderBottom: "2px solid #000",
//             background: "#fef2f2",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 8,
//           }}>
//             <code style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
//               {eventId}
//             </code>
//             <button
//               onClick={() => { setEventId(""); setIsMobileMenuOpen(false); }}
//               style={{
//                 fontFamily: "monospace", fontSize: 10, fontWeight: 700,
//                 background: "#fff", border: "1.5px solid #dc2626",
//                 color: "#dc2626", padding: "3px 8px", cursor: "pointer",
//                 flexShrink: 0,
//               }}
//             >
//               SWITCH
//             </button>
//           </div>

//           {/* Nav items */}
//           <ul style={{ flex: 1, overflowY: "auto", padding: "12px 10px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
//             {tabs.map((tab) => {
//               if (tab.isHeader) return (
//                 <li key={tab.id} style={{ paddingTop: 12 }}>
//                   <button
//                     onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)}
//                     style={{
//                       width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
//                       padding: "6px 8px", background: "none", border: "none", cursor: "pointer",
//                       fontFamily: "monospace", fontSize: 10, fontWeight: 900,
//                       letterSpacing: 1.5, color: "#999", textTransform: "uppercase",
//                     }}
//                   >
//                     <span>{tab.icon} {tab.label}</span>
//                     <span style={{ color: "#dc2626", fontWeight: 900, fontSize: 14 }}>
//                       {openGroup === tab.id ? "−" : "+"}
//                     </span>
//                   </button>
//                 </li>
//               );

//               if (tab.indent && openGroup !== tab.parent) return null;

//               const isActive = activeTab === tab.id;
//               return (
//                 <li key={tab.id}>
//                   <button
//                     onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
//                     style={{
//                       width: "100%", textAlign: "left",
//                       padding: tab.indent ? "8px 8px 8px 22px" : "8px",
//                       fontFamily: "monospace", fontSize: 12, fontWeight: isActive ? 700 : 400,
//                       background: isActive ? "#dc2626" : "transparent",
//                       color: isActive ? "#fff" : "#000",
//                       border: "none",
//                       cursor: "pointer",
//                       display: "flex", alignItems: "center", gap: 8,
//                       borderLeft: isActive ? "none" : tab.indent ? "2px solid #e5e5e5" : "none",
//                       transition: "background 0.15s",
//                     }}
//                     onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
//                     onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
//                   >
//                     <span>{tab.icon}</span>
//                     {tab.label}
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>

//           {/* Footer */}
//           <div style={{ padding: "12px 16px", borderTop: "2px solid #000" }}>
//             <div style={{ fontFamily: "monospace", fontSize: 9, color: "#ccc", letterSpacing: 1 }}>
//               FOREVENT ADMIN v1
//             </div>
//           </div>
//         </nav>

//         {/* Mobile overlay background dim */}
//         {isMobileMenuOpen && (
//           <div
//             style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 30 }}
//             onClick={() => setIsMobileMenuOpen(false)}
//           />
//         )}

//         {/* ── Main Content ── */}
//         <main style={{ flex: 1, overflowY: "auto", background: "#fafafa", minWidth: 0 }}>
//           {/* Breadcrumb bar */}
//           <div
//             className="breadcrumb-bar"
//             style={{
//               padding: "10px 24px",
//               borderBottom: "1.5px solid #e5e5e5",
//               background: "#fff",
//               fontFamily: "monospace",
//               fontSize: 11,
//               color: "#999",
//               letterSpacing: 1,
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//             }}
//           >
//             <span style={{ color: "#dc2626", fontWeight: 700 }}>ADMIN</span>
//             <span>/</span>
//             <span style={{ color: "#000", fontWeight: 700, textTransform: "uppercase" }}>
//               {tabs.find(t => t.id === activeTab)?.label ?? activeTab}
//             </span>
//           </div>

//           <div style={{ padding: "16px", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
//             {renderContent()}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default function AdminDashboard() {
//   const router = useRouter();
//   const [authChecked, setAuthChecked] = useState(true);
//   const [isAuthed, setIsAuthed] = useState(true);


//   if (!authChecked) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fff" }}>
//         <div style={{ fontFamily: "monospace", fontSize: 13, color: "#999", letterSpacing: 2 }}>
//           CHECKING AUTH...
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthed) return null;

//   return (
//     <EventIdProvider>
//       <AdminShell />
//     </EventIdProvider>
//   );
// }




"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { EventIdProvider, useEventId } from "@/app/eventadmin/Eventidcontext";
// FIX: Removed 'updateDoc' and added 'setDoc' to the imports below
import { collection, query, where, doc, setDoc, onSnapshot } from "firebase/firestore";

import EventsAdmin from "@/app/eventadmin/events/EventsAdmin";
import EventAreaAdmin from "@/app/eventadmin/eventarea/page";
import AdminQRMarkersPage from "@/app/eventadmin/qrcodemarkers/page";
import GhumanteStallAdmin from "@/app/eventadmin/ghumantestall/page";
import AdminServiceMarker from "@/app/eventadmin/3dservicemarkers/page";
import ProgressBarAdmin from "@/app/eventadmin/progressbar/page";
import AdminQuiz from "@/app/eventadmin/quiz/page";
import RouletteAdmin from "@/app/eventadmin/roulette/page";
import QRScanner from "@/app/eventadmin/qrscanner/qrscanner";

interface ScannedPayload {
  event: string;
  uid: string;
  player: string;
  status: string;
  progress: string;
  time: string;
  points: number;
  prizeWon: string;
  type: string;
}

const tabs = [
  { id: "eventarea", label: "Event Area", icon: "🗺️" },
  { id: "group_markers", label: "Event Markers", icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
  { id: "qrcodemarker", label: "QR Markers", icon: "🔳", indent: true, parent: "group_markers" },
  { id: "progress", label: "Progress Bar", icon: "📊" },
  { id: "quiz", label: "Quiz Management", icon: "🧠" },
  { id: "group_rewards", label: "Rewards & Games", icon: "🎁", isHeader: true, children: ["prize", "roulette", "verify_player"] },
  { id: "roulette", label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },
  { id: "verify_player", label: "Verify Player Prize", icon: "⚡", indent: true, parent: "group_rewards" },
  { id: "group_stalls", label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["ghumantestall", "servicemarkers"] },
  { id: "ghumantestall", label: "Ghumante Stall", icon: "🏪", indent: true, parent: "group_stalls" },
  { id: "servicemarkers", label: "3D Service Markers", icon: "🏗️", indent: true, parent: "group_stalls" },
];

// ── VERIFY PLAYER SUB-VIEW (ROOT COLLECTION VERSION) ──
function VerifyPlayerSubView() {
  const { eventId } = useEventId();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [claimedCount, setClaimedCount] = useState(0);
  const [claimedPlayers, setClaimedPlayers] = useState<{
    uid: string; player: string; prizeWon: string; claimedAt: string;
    points: number; time: string; progress: string; status: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Read from the ROOT collection 'finalqrscanned', filtered by current eventId
  useEffect(() => {
    if (!eventId) return;

    const claimedQuery = query(
      collection(db, "finalqrscanned"),
      where("event", "==", eventId)
    );

    const unsubscribe = onSnapshot(claimedQuery, (snapshot) => {
      setClaimedCount(snapshot.size);
      const players = snapshot.docs.map(d => {
        const data = d.data();
        return {
          uid: data.uid || d.id,
          player: data.scannedPlayer || "Unknown",
          prizeWon: data.scannedPrize || "—",
          claimedAt: data.claimedAt || "",
          points: data.scannedPoints ?? 0,
          time: data.scannedTime || "—",
          progress: data.scannedProgress || "—",
          status: data.scannedStatus || "FINISHED",
        };
      });
      players.sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));
      setClaimedPlayers(players);
    });

    return () => unsubscribe();
  }, [eventId]);

  const handleScanSuccess = async (rawResult: string) => {
    setIsScannerOpen(false);
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const parsed: ScannedPayload = JSON.parse(rawResult);

      if (!parsed?.uid || !parsed?.event || parsed?.type !== "verification_finish") {
        setError("Invalid QR code. Not a valid player verification code.");
        return;
      }

      if (eventId && parsed.event !== eventId) {
        setError(`Event mismatch. This code belongs to event: ${parsed.event}`);
        return;
      }

      // TARGET ROOT COLLECTION: finalqrscanned/{eventId}_{uid}
      const customDocId = `${parsed.event}_${parsed.uid}`;
      const finalQrRef = doc(db, "finalqrscanned", customDocId);

      await setDoc(finalQrRef, {
        event: parsed.event,
        uid: parsed.uid,
        prizeStatus: "CLAIMED",
        claimedAt: new Date().toISOString(),
        scannedPlayer: parsed.player,
        scannedPrize: parsed.prizeWon,
        scannedPoints: parsed.points,
        scannedTime: parsed.time,
        scannedProgress: parsed.progress,
        scannedStatus: parsed.status,
      });

      // ← NEW: mirror status into player_log so finish page onSnapshot fires
      const playerLogRef = doc(db, "events", parsed.event, "player_log", parsed.uid);
      await setDoc(
        playerLogRef,
        { prizeStatus: "CLAIMED" },
        { merge: true }
      );

      setSuccess(`Prize claimed for ${parsed.player} in root finalqrscanned table!`);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("Could not read QR code. Invalid format.");
      } else if (err?.code === "permission-denied") {
        setError("Permission denied. Ensure Firestore rules allow root writes to finalqrscanned.");
      } else {
        setError(err?.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 0" }}>
      {/* Claimed Count Badge */}
      <div style={{
        border: "2px solid #000", background: "#000", color: "#fff",
        padding: "16px 20px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "4px 4px 0px 0px rgba(220,38,38,1)"
      }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>
          Total Scans
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#fca5a5" }}>
          {claimedCount}
        </span>
      </div>

      {/* Alerts */}
      {error && <div style={{ border: "2px solid #dc2626", background: "#fef2f2", color: "#dc2626", fontWeight: 700, padding: 12, fontSize: 12, marginBottom: 20, fontFamily: "monospace" }}>✕ {error}</div>}
      {success && <div style={{ border: "2px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontWeight: 700, padding: 12, fontSize: 12, marginBottom: 20, fontFamily: "monospace" }}>✓ {success}</div>}

      {/* Scan Button */}
      <button
        type="button"
        onClick={() => setIsScannerOpen(true)}
        disabled={loading || !eventId}
        style={{
          width: "100%", background: "#dc2626", color: "#fff",
          border: "2px solid #000", padding: 16, cursor: "pointer",
          fontWeight: 900, fontFamily: "monospace", fontSize: 14,
          letterSpacing: 0.5, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          marginBottom: 24, opacity: (loading || !eventId) ? 0.6 : 1
        }}
      >
        {loading ? "Saving..." : !eventId ? "Select an Event First" : "Scan Player QR Code"}
      </button>

      {/* Claimed Players List */}
      {claimedPlayers.length > 0 && (
        <div style={{ border: "2px solid #000", background: "#fff" }}>
          <div style={{ background: "#000", color: "#fff", padding: "8px 16px", fontFamily: "monospace", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>
            Final Scanned Log
          </div>
          {claimedPlayers.map((p, i) => (
            <div key={p.uid} style={{ padding: "14px 16px", fontFamily: "monospace", borderBottom: i < claimedPlayers.length - 1 ? "1px dashed #e5e5e5" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <strong style={{ color: "#000", fontSize: 14 }}>{p.player}</strong>
                <span style={{ color: "black", fontSize: 10 }}>{p.claimedAt ? new Date(p.claimedAt).toLocaleTimeString() : ""}</span>
              </div>
              <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🎁 {p.prizeWon}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                <div style={{ background: "#f5f5f5", padding: "4px 8px" }}>
                  <div style={{ color: "#000", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Points</div>
                  <div style={{ color: "#000", fontSize: 12, fontWeight: 700 }}>{p.points} pts</div>
                </div>
                <div style={{ background: "#f5f5f5", padding: "4px 8px" }}>
                  <div style={{ color: "#000", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Time</div>
                  <div style={{ color: "#000", fontSize: 12, fontWeight: 700 }}>{p.time}</div>
                </div>
                <div style={{ background: "#f5f5f5", padding: "4px 8px" }}>
                  <div style={{ color: "#000", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Progress</div>
                  <div style={{ color: "#000", fontSize: 12, fontWeight: 700 }}>{p.progress}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Scanner Overlay */}
      {isScannerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#000" }}>
          <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ── MAIN SHELL & DASHBOARD WRAPPER ──
function AdminShell() {
  const { eventId, setEventId } = useEventId();
  const [activeTab, setActiveTab] = useState("eventarea");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!eventId) {
    return <EventsAdmin onSelect={(id: string) => { setEventId(id); setActiveTab("eventarea"); }} />;
  }

  const renderContent = (): React.ReactNode => {
    const components: Record<string, React.ReactNode> = {
      eventarea: <EventAreaAdmin />,
      qrcodemarker: <AdminQRMarkersPage />,
      ghumantestall: <GhumanteStallAdmin />,
      servicemarkers: <AdminServiceMarker />,
      progress: <ProgressBarAdmin />,
      quiz: <AdminQuiz />,
      roulette: <RouletteAdmin />,
      verify_player: <VerifyPlayerSubView />,
    };
    return components[activeTab] ?? (
      <div style={{ padding: 20, color: "#999", fontFamily: "monospace" }}>
        Component for <strong>{activeTab}</strong> not implemented yet.
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#fff", overflow: "hidden" }}>
      <style>{`
        @media (max-width: 767px) {
          .responsive-sidebar {
            position: fixed !important;
            top: 50px !important;
            left: 0 !important;
            height: calc(100vh - 50px) !important;
            z-index: 40 !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .sidebar-open { transform: translateX(0) !important; }
          .mobile-topbar { display: flex !important; height: 50px !important; }
          .breadcrumb-bar { padding: 10px 16px !important; }
        }
        @media (min-width: 768px) {
          .mobile-topbar { display: none !important; }
        }
      `}</style>

      {/* Mobile Top Bar */}
      <div className="mobile-topbar" style={{
        display: "none", alignItems: "center", justifyContent: "space-between",
        background: "#fff", borderBottom: "2px solid #000",
        padding: "12px 16px", zIndex: 50, boxSizing: "border-box"
      }}>
        <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, letterSpacing: 2, color: "#dc2626" }}>ADMIN</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ background: "none", border: "2px solid #000", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 16 }}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Sidebar */}
        <nav className={`responsive-sidebar ${isMobileMenuOpen ? "sidebar-open" : ""}`}
          style={{ width: 240, background: "#fff", borderRight: "2px solid #000", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "2px solid #000" }}>
            <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 18, letterSpacing: 3, color: "#dc2626" }}>ADMIN</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#999", marginTop: 2, letterSpacing: 1 }}>PANEL</div>
          </div>

          <div style={{ padding: "10px 16px", borderBottom: "2px solid #000", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <code style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{eventId}</code>
            <button onClick={() => { setEventId(""); setIsMobileMenuOpen(false); }}
              style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, background: "#fff", border: "1.5px solid #dc2626", color: "#dc2626", padding: "3px 8px", cursor: "pointer", flexShrink: 0 }}>
              SWITCH
            </button>
          </div>

          <ul style={{ flex: 1, overflowY: "auto", padding: "12px 10px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map((tab) => {
              if (tab.isHeader) return (
                <li key={tab.id} style={{ paddingTop: 12 }}>
                  <button onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: "#999", textTransform: "uppercase" }}>
                    <span>{tab.icon} {tab.label}</span>
                    <span style={{ color: "#dc2626", fontWeight: 900, fontSize: 14 }}>{openGroup === tab.id ? "−" : "+"}</span>
                  </button>
                </li>
              );
              if (tab.indent && openGroup !== tab.parent) return null;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: tab.indent ? "8px 8px 8px 22px" : "8px",
                      fontFamily: "monospace", fontSize: 12, fontWeight: isActive ? 700 : 400,
                      background: isActive ? "#dc2626" : "transparent",
                      color: isActive ? "#fff" : "#000",
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                      borderLeft: isActive ? "none" : tab.indent ? "2px solid #e5e5e5" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span>{tab.icon}</span>{tab.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div style={{ padding: "12px 16px", borderTop: "2px solid #000" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#ccc", letterSpacing: 1 }}>FOREVENT ADMIN v1</div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 30 }}
            onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", background: "#fafafa", minWidth: 0 }}>
          <div className="breadcrumb-bar" style={{
            padding: "10px 24px", borderBottom: "1.5px solid #e5e5e5", background: "#fff",
            fontFamily: "monospace", fontSize: 11, color: "#999", letterSpacing: 1,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span style={{ color: "#dc2626", fontWeight: 700 }}>ADMIN</span>
            <span>/</span>
            <span style={{ color: "#000", fontWeight: 700, textTransform: "uppercase" }}>
              {tabs.find(t => t.id === activeTab)?.label ?? activeTab}
            </span>
          </div>
          <div style={{ padding: 16, maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked] = useState(true);
  const [isAuthed] = useState(true);

  if (!authChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fff" }}>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#999", letterSpacing: 2 }}>CHECKING AUTH...</div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <EventIdProvider>
      <AdminShell />
    </EventIdProvider>
  );
}