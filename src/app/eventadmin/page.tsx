
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { EventIdProvider, useEventId } from "@/app/eventadmin/Eventidcontext";

import EventsAdmin from "@/app/eventadmin/events/page";
import EventAreaAdmin from "@/app/eventadmin/eventarea/page";
import AdminQRMarkersPage from "@/app/eventadmin/qrcodemarkers/page";
import GhumanteStallAdmin from "@/app/eventadmin/ghumantestall/page";
import AdminServiceMarker from "@/app/eventadmin/3dservicemarkers/page";
import ProgressBarAdmin from "@/app/eventadmin/progressbar/page";
import AdminQuiz from "@/app/eventadmin/quiz/page";
import RouletteAdmin from "@/app/eventadmin/roulette/page";

const tabs = [
  { id: "eventarea",      label: "Event Area",        icon: "🗺️" },
  { id: "group_markers",  label: "Event Markers",     icon: "📍", isHeader: true, children: ["location", "qrcodemarker", "special"] },
  
  { id: "qrcodemarker",   label: "QR Markers",        icon: "🔳", indent: true, parent: "group_markers" },
  
  { id: "progress",       label: "Progress Bar",      icon: "📊" },
  { id: "quiz",           label: "Quiz Management",   icon: "🧠" },
  { id: "group_rewards",  label: "Rewards & Games",   icon: "🎁", isHeader: true, children: ["prize", "roulette"] },
  
  { id: "roulette",       label: "Roulette Management", icon: "🎡", indent: true, parent: "group_rewards" },
  // FIXED: Consolidated children array to match exactly what is rendered below
  { id: "group_stalls",   label: "Stalls & Services", icon: "🏪", isHeader: true, children: ["ghumantestall", "servicemarkers"] },
  { id: "ghumantestall",  label: "Ghumante Stall",    icon: "🏪", indent: true, parent: "group_stalls" },
  // FIXED: Simplified down to a single clean, lowercase ID item matching your components dictionary
  { id: "servicemarkers", label: "3D Service Markers", icon: "🏗️", indent: true, parent: "group_stalls" },
  
];

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
    };
    return components[activeTab] ?? <div className="p-10 text-gray-500">Component for {activeTab} not implemented yet.</div>;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm z-50">
        <h1 className="font-bold text-blue-600">Admin Panel</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl p-1">
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b hidden md:block">
            <h1 className="font-bold text-xl text-blue-600">Admin Panel</h1>
          </div>

          <div className="px-4 py-3 border-b bg-blue-50">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-blue-700 truncate">{eventId}</p>
              <button
                onClick={() => { setEventId(""); setIsMobileMenuOpen(false); }}
                className="text-[10px] px-2 py-1 bg-white border rounded hover:bg-red-50"
              >
                Switch
              </button>
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto p-3 space-y-1">
            {tabs.map((tab) => {
              if (tab.isHeader) return (
                <li key={tab.id} className="pt-2">
                  <button
                    onClick={() => setOpenGroup(openGroup === tab.id ? null : tab.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
                  >
                    <span>{tab.icon} {tab.label}</span>
                    <span>{openGroup === tab.id ? "−" : "+"}</span>
                  </button>
                </li>
              );
              if (tab.indent && openGroup !== tab.parent) return null;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} ${tab.indent ? "pl-6" : ""}`}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-full overflow-x-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthed(true);
      } else {
        router.replace("/login");
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500 font-semibold">Checking authentication...</p>
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