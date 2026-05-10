"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  
  const sections = [
    { title: "Race", subtitle: "Lobby & Start", color: "bg-[#FF5F1F]", path: "/admin/race", icon: "🏁" },
    { title: "Prize", subtitle: "QR Scanner", color: "bg-[#00D166]", path: "/admin/prize", icon: "🏆" },
    { title: "Stats", subtitle: "Leaderboard", color: "bg-[#007AFF]", path: "/admin/stats", icon: "📊" },
    { title: "Teams", subtitle: "Reassignment", color: "bg-[#7C3AED]", path: "/admin/teams", icon: "👥" }
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-wrap">
      {sections.map((item) => (
        <button
          key={item.title}
          onClick={() => router.push(item.path)}
          className={`w-1/2 h-1/2 ${item.color} flex flex-col items-center justify-center active:brightness-75 active:scale-95 transition-all`}
        >
          <span className="text-5xl md:text-7xl mb-3">{item.icon}</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white italic leading-none">
            {item.title}
          </h2>
          <p className="text-white/80 text-sm md:text-xl font-bold uppercase tracking-widest mt-2">
            {item.subtitle}
          </p>
        </button>
      ))}
    </div>
  );
}