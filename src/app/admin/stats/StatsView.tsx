"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import LiveMap from './LiveMap';

export default function StatsView() {
  const [activeTab, setActiveTab] = useState<'map' | 'leaderboard'>('map');
  const [groups, setGroups] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    const groupsRef = ref(rtdb, 'groups');
    return onValue(groupsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(id => {
        const g = data[id];
        const duration = g.finishedAt && g.startedAt ? g.finishedAt - g.startedAt : null;
        return { id, ...g, duration };
      }).sort((a, b) => (a.duration || Infinity) - (b.duration || Infinity));
      setGroups(list);
    });
  }, []);

  const stats = useMemo(() => ({
    total: groups.length,
    finished: groups.filter(g => g.status === 'finished').length,
    racing: groups.filter(g => g.status === 'racing').length,
    dnf: groups.filter(g => g.status === 'dnf').length
  }), [groups]);

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col font-sans">
      {/* SUMMARY BAR */}
      <div className="grid grid-cols-4 bg-[#1a1a1a] border-b border-white/10 p-4 gap-2">
        <StatItem label="TOTAL" val={stats.total} color="text-blue-400" />
        <StatItem label="FINISHED" val={stats.finished} color="text-green-400" />
        <StatItem label="RACING" val={stats.racing} color="text-yellow-400" />
        <StatItem label="DNF" val={stats.dnf} color="text-red-400" />
      </div>

      {/* TABS */}
      <div className="flex bg-[#1a1a1a]">
        <button onClick={() => setActiveTab('map')} className={`flex-1 p-4 text-xs font-black uppercase tracking-widest ${activeTab === 'map' ? 'border-b-2 border-blue-500 text-blue-500' : 'opacity-30'}`}>📍 Live Map</button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 p-4 text-xs font-black uppercase tracking-widest ${activeTab === 'leaderboard' ? 'border-b-2 border-blue-500 text-blue-500' : 'opacity-30'}`}>🏆 Leaderboard</button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'map' ? (
          <LiveMap groups={groups} />
        ) : (
          <div className="p-4 overflow-y-auto h-full space-y-2">
            {groups.map((g, i) => (
              <div key={g.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                <button onClick={() => setExpandedRow(expandedRow === g.id ? null : g.id)} className="w-full flex items-center p-4 text-left">
                  <span className="w-8 font-black italic text-white/20">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-black uppercase italic text-sm">{g.id}</p>
                    <p className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">Group: {g.name || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-green-400">
                      {g.duration ? new Date(g.duration).toISOString().substr(11, 8) : "--:--:--"}
                    </p>
                  </div>
                </button>
                {expandedRow === g.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-black/20 space-y-2">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Checkpoint Log</p>
                    {/* Map through g.checkpoints if they exist */}
                    <p className="text-[10px] text-white/60 italic">No checkpoints recorded yet.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StatItem = ({ label, val, color }: any) => (
  <div className="text-center">
    <p className={`text-xl font-black italic leading-none ${color}`}>{val}</p>
    <p className="text-[8px] font-black text-white/30 uppercase mt-1 tracking-widest">{label}</p>
  </div>
);