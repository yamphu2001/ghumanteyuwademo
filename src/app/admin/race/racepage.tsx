"use client";

import "@/lib/firebase";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";

const db = getDatabase(getApp());

// ── Types ─────────────────────────────────────────────────────
type Group = {
  id: string;
  closed: boolean;
  createdAt: number;
  startedAt?: number;
  playerCount: number;
};

// ── Component ─────────────────────────────────────────────────
export default function RaceLobby() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // ── Live groups from Firebase ──────────────────────────────
  useEffect(() => {
    const groupsRef = ref(db, "groups");
    const unsub = onValue(groupsRef, (snap) => {
      if (!snap.exists()) { setGroups([]); return; }
      const result: Group[] = [];
      snap.forEach((child) => {
        const data = child.val();
        const playerCount = data.players ? Object.keys(data.players).length : 0;
        result.push({
          id: child.key as string,
          closed: data.closed ?? false,
          createdAt: data.createdAt ?? 0,
          startedAt: data.startedAt ?? undefined,
          playerCount,
        });
      });
      result.sort((a, b) => a.createdAt - b.createdAt);
      setGroups(result);
    });
    return () => unsub();
  }, []);

  // ── Handle START ───────────────────────────────────────────
  const handleStart = async () => {
    if (!selectedGroup) return;

    const confirmStart = window.confirm(`Blow the whistle for ${selectedGroup}?`);
    if (!confirmStart) return;

    setIsTriggering(true);

    try {
      const now = Date.now();

      // 1. Close the group + record startedAt on the group node
      // 2. Write to time_records/{groupName}
      await update(ref(db), {
        [`groups/${selectedGroup}/closed`]: true,
        [`groups/${selectedGroup}/startedAt`]: now,
        [`time_records/${selectedGroup}`]: {
          groupName: selectedGroup,
          startedAt: now,
        },
      });

    } catch (err) {
      console.error("Start failed:", err);
      alert("Something went wrong. Try again.");
    } finally {
      setIsTriggering(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────
  const selectedGroupData = groups.find((g) => g.id === selectedGroup);
  const alreadyStarted = !!selectedGroupData?.startedAt;

  function formatStartTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#111] flex flex-col font-sans select-none">

      {/* Header */}
      <div className="bg-[#FF5F1F] px-6 py-8 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-white/80 hover:text-white text-3xl font-bold transition-transform active:scale-75"
        >
          ←
        </button>
        <div>
          <h1 className="text-white font-black text-3xl uppercase italic tracking-tighter leading-none">
            Race Lobby
          </h1>
          <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-black mt-1">
            Matchmaking & Ignition
          </p>
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-4">
        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">
          Select Active Heat
        </p>

        {groups.length === 0 && (
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest text-center py-10 italic">
            No groups yet — run matchmaking first
          </p>
        )}

        {groups.map((group) => {
          const isSelected = selectedGroup === group.id;
          const isStarted = !!group.startedAt;

          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`
                w-full py-6 rounded-[28px] text-left px-8 transition-all duration-200
                flex items-center justify-between border-2
                ${isSelected && !isStarted
                  ? "bg-[#FF5F1F] border-[#FF5F1F] text-white shadow-[0_10px_30px_rgba(255,95,31,0.3)] scale-[1.02]"
                  : isStarted
                  ? "bg-zinc-900/60 border-[#00ff64]/30 text-white"
                  : "bg-zinc-900 border-white/5 text-zinc-500"}
              `}
            >
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black uppercase italic tracking-tight">
                  {group.id}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isStarted ? "text-[#00ff64]" : "text-zinc-600"}`}>
                  {isStarted
                    ? `Started · ${formatStartTime(group.startedAt!)}`
                    : `${group.playerCount} players · ${group.closed ? "Closed" : "Open"}`}
                </span>
              </div>

              {/* Right indicator */}
              {isStarted ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ff64] shadow-[0_0_8px_#00ff64]" />
                  <span className="text-[#00ff64] text-xs font-black uppercase tracking-wider">Live</span>
                </div>
              ) : isSelected ? (
                <div className="bg-white text-[#FF5F1F] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
              ) : (
                <div className="w-3 h-3 rounded-full border-2 border-zinc-700" />
              )}
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <div className="px-6 pb-12 pt-6 bg-gradient-to-t from-black to-transparent">

        {/* Already started info */}
        {alreadyStarted && selectedGroupData?.startedAt && (
          <div className="mb-4 bg-[#00ff64]/10 border border-[#00ff64]/20 rounded-2xl px-5 py-4 text-center">
            <p className="text-[#00ff64] font-black text-sm uppercase italic">
              {selectedGroup} is Live
            </p>
            <p className="text-[#00ff64]/50 text-[10px] font-bold uppercase tracking-widest mt-1">
              Started at {formatStartTime(selectedGroupData.startedAt)}
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!selectedGroup || isTriggering || alreadyStarted}
          className={`
            w-full py-8 rounded-[35px] text-3xl font-black uppercase italic tracking-tighter
            transition-all shadow-2xl flex items-center justify-center gap-3
            ${selectedGroup && !isTriggering && !alreadyStarted
              ? "bg-white text-black active:scale-[0.96] active:brightness-90 hover:bg-[#FF5F1F] hover:text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}
          `}
        >
          {isTriggering ? (
            <span className="animate-pulse">Starting...</span>
          ) : alreadyStarted ? (
            "Already Started"
          ) : selectedGroup ? (
            <>
              <span className="text-4xl">🏁</span>
              START {selectedGroup}
            </>
          ) : (
            "Select a Group"
          )}
        </button>

        <p className="text-center text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em] mt-6">
          Whistle will sync all players in real-time
        </p>
      </div>
    </div>
  );
}