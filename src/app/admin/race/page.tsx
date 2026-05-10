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
  status?: "waiting" | "ready" | "closed" | "finished";
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  playerCount: number;
};

// ── Component ─────────────────────────────────────────────────
export default function RaceLobby() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

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
          status: data.status ?? "waiting",
          createdAt: data.createdAt ?? 0,
          startedAt: data.startedAt ?? undefined,
          finishedAt: data.finishedAt ?? undefined,
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

      await update(ref(db), {
        [`groups/${selectedGroup}/closed`]: true,
        [`groups/${selectedGroup}/status`]: "ready",
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

  // ── Handle FINISH ──────────────────────────────────────────
  const handleFinish = async () => {
    if (!selectedGroup) return;

    const confirmFinish = window.confirm(`Mark ${selectedGroup} as finished?`);
    if (!confirmFinish) return;

    setIsFinishing(true);

    try {
      const now = Date.now();

      await update(ref(db), {
        [`groups/${selectedGroup}/status`]: "finished",
        [`groups/${selectedGroup}/finishedAt`]: now,
        [`time_records/${selectedGroup}/finishedAt`]: now,
      });

    } catch (err) {
      console.error("Finish failed:", err);
      alert("Something went wrong. Try again.");
    } finally {
      setIsFinishing(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────
  const selectedGroupData = groups.find((g) => g.id === selectedGroup);
  const alreadyStarted = !!selectedGroupData?.startedAt;
  const alreadyFinished = selectedGroupData?.status === "finished";

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
          const isReady = group.status === "ready";
          const isFinished = group.status === "finished";

          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`
                w-full py-6 rounded-[28px] text-left px-8 transition-all duration-200
                flex items-center justify-between border-2
                ${isSelected && !isStarted
                  ? "bg-[#FF5F1F] border-[#FF5F1F] text-white shadow-[0_10px_30px_rgba(255,95,31,0.3)] scale-[1.02]"
                  : isFinished
                  ? "bg-zinc-900/40 border-zinc-700/30 text-zinc-500"
                  : isStarted
                  ? "bg-zinc-900/60 border-[#00ff64]/30 text-white"
                  : "bg-zinc-900 border-white/5 text-zinc-500"}
              `}
            >
              <div className="flex flex-col gap-1">
                <span className={`text-2xl font-black uppercase italic tracking-tight ${isFinished ? "line-through opacity-50" : ""}`}>
                  {group.id}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  isFinished ? "text-zinc-600" : isStarted ? "text-[#00ff64]" : isReady ? "text-yellow-400" : "text-zinc-600"
                }`}>
                  {isFinished
                    ? `Finished · ${group.finishedAt ? formatStartTime(group.finishedAt) : ""}`
                    : isStarted
                    ? `Started · ${formatStartTime(group.startedAt!)}`
                    : `${group.playerCount} players · ${
                        isReady ? "Ready" : group.closed ? "Closed" : "Waiting"
                      }`}
                </span>
              </div>

              {/* Right indicator */}
              {isFinished ? (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-wider">Done</span>
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                </div>
              ) : isStarted ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ff64] shadow-[0_0_8px_#00ff64]" />
                  <span className="text-[#00ff64] text-xs font-black uppercase tracking-wider">Live</span>
                </div>
              ) : isReady && !isSelected ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-wider">Ready</span>
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

      {/* Bottom action area */}
      <div className="px-6 pb-12 pt-6 bg-gradient-to-t from-black to-transparent flex flex-col gap-3">

        {/* Already started info */}
        {alreadyStarted && selectedGroupData?.startedAt && !alreadyFinished && (
          <div className="mb-1 bg-[#00ff64]/10 border border-[#00ff64]/20 rounded-2xl px-5 py-4 text-center">
            <p className="text-[#00ff64] font-black text-sm uppercase italic">
              {selectedGroup} is Live
            </p>
            <p className="text-[#00ff64]/50 text-[10px] font-bold uppercase tracking-widest mt-1">
              Started at {formatStartTime(selectedGroupData.startedAt)}
            </p>
          </div>
        )}

        {/* Already finished info */}
        {alreadyFinished && selectedGroupData?.finishedAt && (
          <div className="mb-1 bg-zinc-800/60 border border-zinc-700/40 rounded-2xl px-5 py-4 text-center">
            <p className="text-zinc-400 font-black text-sm uppercase italic">
              {selectedGroup} is Finished
            </p>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">
              Ended at {formatStartTime(selectedGroupData.finishedAt)}
            </p>
          </div>
        )}

        {/* FINISH button — shown when group is live and not yet finished */}
        {alreadyStarted && !alreadyFinished && (
          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className={`
              w-full py-6 rounded-[35px] text-2xl font-black uppercase italic tracking-tighter
              transition-all shadow-xl flex items-center justify-center gap-3
              ${!isFinishing
                ? "bg-zinc-800 text-white border-2 border-zinc-600 active:scale-[0.96] hover:bg-zinc-700 hover:border-zinc-500"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed border-2 border-zinc-800"}
            `}
          >
            {isFinishing ? (
              <span className="animate-pulse">Finishing...</span>
            ) : (
              <>
                <span className="text-3xl">🏆</span>
                FINISH {selectedGroup}
              </>
            )}
          </button>
        )}

        {/* START button */}
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
          ) : alreadyFinished ? (
            "Group Finished"
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

        <p className="text-center text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em] mt-3">
          Whistle will sync all players in real-time
        </p>
      </div>
    </div>
  );
}