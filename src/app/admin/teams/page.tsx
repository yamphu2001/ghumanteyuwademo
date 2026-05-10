"use client";

import "@/lib/firebase";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { pauseMatchmaking, resumeMatchmaking, subscribeToPauseState } from "@/app/admin/race/matchmaking";
import styles from "./teams.module.css";

const db = getDatabase(getApp());

const MAX_PLAYERS = 10;
const TEAM_COLORS = ["#FF5F1F", "#00D166", "#007AFF", "#7C3AED", "#F59E0B", "#EC4899"];

type Player = {
  id: string;
  username: string;
  requestTime: number;
  joinedAt: number;
  score: null | number;
};

type Group = {
  id: string;
  closed: boolean;
  createdAt: number;
  startedAt?: number;
  players: Player[];
};

type LobbyPlayer = {
  id: string;
  username: string;
  requestTime: number;
};

type ActionState = "none" | "actions" | "move-picker";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function colorForIdx(idx: number) {
  return TEAM_COLORS[idx % TEAM_COLORS.length];
}

export default function TeamsReassignPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [lobby, setLobby] = useState<LobbyPlayer[]>([]);
  const [blocked, setBlocked] = useState<LobbyPlayer[]>([]); // New State
  const [teamsLocked, setTeamsLocked] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [pauseSecondsLeft, setPauseSecondsLeft] = useState(0);

  // Drawers & Selected States
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [actionState, setActionState] = useState<ActionState>("none");

  const [lobbyDrawerOpen, setLobbyDrawerOpen] = useState(false);
  const [selectedLobbyPlayer, setSelectedLobbyPlayer] = useState<LobbyPlayer | null>(null);
  const [lobbyActionState, setLobbyActionState] = useState<ActionState>("none");

  const [blockedDrawerOpen, setBlockedDrawerOpen] = useState(false); // New Drawer
  const [selectedBlockedPlayer, setSelectedBlockedPlayer] = useState<LobbyPlayer | null>(null);
  const [blockedActionState, setBlockedActionState] = useState<ActionState>("none");

  useEffect(() => {
    const unsubGroups = onValue(ref(db, "groups"), (snap) => {
      if (!snap.exists()) { setGroups([]); return; }
      const result: Group[] = [];
      snap.forEach((child) => {
        const data = child.val();
        const players: Player[] = data.players
          ? Object.entries(data.players).map(([pid, pval]: [string, any]) => ({
              id: pid,
              username: pval.username,
              requestTime: pval.requestTime,
              joinedAt: pval.joinedAt ?? pval.requestTime,
              score: pval.score ?? null,
            }))
          : [];
        players.sort((a, b) => a.joinedAt - b.joinedAt);
        result.push({
          id: child.key as string,
          closed: data.closed ?? false,
          createdAt: data.createdAt,
          startedAt: data.startedAt ?? undefined,
          players,
        });
      });
      result.sort((a, b) => a.createdAt - b.createdAt);
      setGroups(result);
      setOpenGroup((prev) => prev ? result.find((g) => g.id === prev.id) ?? null : null);
    });

    const unsubLobby = onValue(ref(db, "lobby"), (snap) => {
      if (!snap.exists()) { setLobby([]); return; }
      const result: LobbyPlayer[] = [];
      snap.forEach((child) => {
        const data = child.val();
        if (data.isActive !== false) {
          result.push({ id: child.key as string, username: data.username, requestTime: data.requestTime });
        }
      });
      result.sort((a, b) => a.requestTime - b.requestTime);
      setLobby(result);
    });

    const unsubBlocked = onValue(ref(db, "blocked"), (snap) => {
      if (!snap.exists()) { setBlocked([]); return; }
      const result: LobbyPlayer[] = [];
      snap.forEach((child) => {
        const data = child.val();
        result.push({ id: child.key as string, username: data.username, requestTime: data.requestTime });
      });
      result.sort((a, b) => a.requestTime - b.requestTime);
      setBlocked(result);
    });

    const unsubPause = subscribeToPauseState((paused, secondsLeft) => {
      setIsPaused(paused);
      setPauseSecondsLeft(secondsLeft);
    });

    return () => { unsubGroups(); unsubLobby(); unsubBlocked(); unsubPause(); };
  }, []);

  // --- ACTIONS ---

  const sendToLobby = useCallback(async (player: Player | LobbyPlayer, source: 'group' | 'blocked') => {
    const updates: Record<string, any> = {};
    if (source === 'group' && openGroup) updates[`groups/${openGroup.id}/players/${player.id}`] = null;
    if (source === 'blocked') updates[`blocked/${player.id}`] = null;
    
    updates[`lobby/${player.id}`] = {
      username: player.username,
      requestTime: player.requestTime,
      isActive: true,
    };
    await update(ref(db), updates);
    setSelectedPlayer(null);
    setSelectedBlockedPlayer(null);
    setActionState("none");
    setBlockedActionState("none");
  }, [openGroup]);

  const sendToBlocked = useCallback(async (player: Player | LobbyPlayer, source: 'group' | 'lobby') => {
    const updates: Record<string, any> = {};
    if (source === 'group' && openGroup) updates[`groups/${openGroup.id}/players/${player.id}`] = null;
    if (source === 'lobby') updates[`lobby/${player.id}`] = null;
    
    updates[`blocked/${player.id}`] = {
      username: player.username,
      requestTime: player.requestTime,
    };
    await update(ref(db), updates);
    setSelectedPlayer(null);
    setSelectedLobbyPlayer(null);
    setActionState("none");
    setLobbyActionState("none");
  }, [openGroup]);

  const moveToGroup = useCallback(async (targetGroupId: string, player: Player | LobbyPlayer, source: 'group' | 'lobby' | 'blocked') => {
    const updates: Record<string, any> = {};
    if (source === 'group' && openGroup) updates[`groups/${openGroup.id}/players/${player.id}`] = null;
    if (source === 'lobby') updates[`lobby/${player.id}`] = null;
    if (source === 'blocked') updates[`blocked/${player.id}`] = null;

    updates[`groups/${targetGroupId}/players/${player.id}`] = {
      username: player.username,
      requestTime: player.requestTime,
      joinedAt: Date.now(),
      score: null,
    };
    
    await update(ref(db), updates);
    setSelectedPlayer(null);
    setSelectedLobbyPlayer(null);
    setSelectedBlockedPlayer(null);
    setActionState("none");
    setLobbyActionState("none");
    setBlockedActionState("none");
  }, [openGroup]);

  // --- UI HANDLERS ---

  const handlePauseToggle = async () => {
    isPaused ? await resumeMatchmaking() : await pauseMatchmaking();
  };

  const closeAllDrawers = () => {
    setOpenGroup(null);
    setLobbyDrawerOpen(false);
    setBlockedDrawerOpen(false);
    setSelectedPlayer(null);
    setSelectedLobbyPlayer(null);
    setSelectedBlockedPlayer(null);
    setActionState("none");
    setLobbyActionState("none");
    setBlockedActionState("none");
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>←</button>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>Teams</h1>
          <p className={styles.headerSub}>
            {groups.length} groups · {lobby.length} lobby · {blocked.length} blocked
          </p>
        </div>
        <button className={`${styles.pauseBtn} ${isPaused ? styles.pauseBtnActive : ""}`} onClick={handlePauseToggle}>
          {isPaused ? `▶ ${pauseSecondsLeft}s` : "⏸ Pause"}
        </button>
        <button className={`${styles.lockBtn} ${teamsLocked ? styles.lockBtnActive : ""}`} onClick={() => setTeamsLocked((v) => !v)}>
          {teamsLocked ? "🔒 Locked" : "Lock"}
        </button>
      </div>

      <div className={styles.body}>
        {/* Groups Grid */}
        <p className={styles.sectionLabel}>Groups</p>
        <div className={styles.groupsGrid}>
          {groups.map((group, idx) => (
            <div key={group.id} className={`${styles.groupModule} ${group.closed ? styles.groupModuleClosed : ""}`} style={{ "--c": colorForIdx(idx) } as any} onClick={() => setOpenGroup(group)}>
              <div className={styles.groupModuleTop}>
                <span>{group.id}</span>
                <span className={`${styles.badge} ${!!group.startedAt ? styles.badgeStarted : group.closed ? styles.badgeClosed : styles.badgeOpen}`}>
                  {group.startedAt ? "🏁 Live" : group.closed ? "Full" : "Open"}
                </span>
              </div>
              <div className={styles.pipTrack}>
                {Array.from({ length: MAX_PLAYERS }).map((_, i) => (
                  <div key={i} className={styles.pip} style={{ background: i < group.players.length ? colorForIdx(idx) : "#1c1c1c" }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lobby Card */}
        <p className={styles.sectionLabel}>Lobby Queue</p>
        <div className={styles.lobbyCard} onClick={() => setLobbyDrawerOpen(true)}>
          <div className={styles.lobbyHeader}>
            <span className={styles.lobbyTitle}>⏳ Waiting</span>
            <span className={styles.lobbyCount}>{lobby.length} players</span>
          </div>
        </div>

        {/* Blocked Card */}
        <p className={styles.sectionLabel}>Blocked List</p>
        <div className={`${styles.lobbyCard} ${styles.blockedCard}`} onClick={() => setBlockedDrawerOpen(true)} style={{ borderLeft: "4px solid #ff4444" }}>
          <div className={styles.lobbyHeader}>
            <span className={styles.lobbyTitle} style={{ color: "#ff4444" }}>🚫 Blocked</span>
            <span className={styles.lobbyCount}>{blocked.length} players</span>
          </div>
        </div>
      </div>

      {/* --- GROUP DRAWER --- */}
      {openGroup && (
        <div className={styles.overlay} onClick={closeAllDrawers}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHandle} />
            <div className={styles.drawerHeader}>
              <span className={styles.drawerName}>{openGroup.id}</span>
              <button className={styles.drawerClose} onClick={closeAllDrawers}>×</button>
            </div>
            <div className={styles.drawerScroll}>
              {openGroup.players.map(p => (
                <div key={p.id} className={styles.playerRow} onClick={() => { setSelectedPlayer(p); setActionState("actions"); }}>
                  <div className={styles.playerName}>{p.username}</div>
                  <span className={styles.playerArrow}>›</span>
                </div>
              ))}
            </div>
            {actionState === "actions" && selectedPlayer && !openGroup.startedAt && (
              <div className={styles.actionSheet}>
                <button className={styles.actionBtn} onClick={() => sendToLobby(selectedPlayer, 'group')}>↩ Send to Lobby</button>
                <button className={styles.actionBtn} onClick={() => setActionState("move-picker")}>⇄ Move Group</button>
                <button className={styles.actionBtn} style={{ color: "#ff4444" }} onClick={() => sendToBlocked(selectedPlayer, 'group')}>🚫 Block Player</button>
              </div>
            )}
            {actionState === "move-picker" && selectedPlayer && (
              <div className={styles.movePicker}>
                {groups.filter(g => g.id !== openGroup.id).map(g => (
                  <button key={g.id} className={styles.moveTarget} onClick={() => moveToGroup(g.id, selectedPlayer, 'group')}>{g.id}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- LOBBY DRAWER --- */}
      {lobbyDrawerOpen && (
        <div className={styles.overlay} onClick={closeAllDrawers}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHandle} />
            <div className={styles.drawerHeader}><span className={styles.drawerName}>Lobby</span></div>
            <div className={styles.drawerScroll}>
              {lobby.map(p => (
                <div key={p.id} className={styles.playerRow} onClick={() => { setSelectedLobbyPlayer(p); setLobbyActionState("actions"); }}>
                  <div className={styles.playerName}>{p.username}</div>
                  <span className={styles.playerArrow}>›</span>
                </div>
              ))}
            </div>
            {lobbyActionState === "actions" && selectedLobbyPlayer && (
              <div className={styles.actionSheet}>
                <button className={styles.actionBtn} onClick={() => setLobbyActionState("move-picker")}>➕ Assign to Group</button>
                <button className={styles.actionBtn} style={{ color: "#ff4444" }} onClick={() => sendToBlocked(selectedLobbyPlayer, 'lobby')}>🚫 Block Player</button>
              </div>
            )}
            {lobbyActionState === "move-picker" && selectedLobbyPlayer && (
              <div className={styles.movePicker}>
                {groups.map(g => (
                  <button key={g.id} className={styles.moveTarget} onClick={() => moveToGroup(g.id, selectedLobbyPlayer, 'lobby')}>{g.id}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- BLOCKED DRAWER --- */}
      {blockedDrawerOpen && (
        <div className={styles.overlay} onClick={closeAllDrawers}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHandle} />
            <div className={styles.drawerHeader}><span className={styles.drawerName} style={{ color: "#ff4444" }}>Blocked Players</span></div>
            <div className={styles.drawerScroll}>
              {blocked.length === 0 ? <p className={styles.emptyMsg}>No blocked players</p> : blocked.map(p => (
                <div key={p.id} className={styles.playerRow} onClick={() => { setSelectedBlockedPlayer(p); setBlockedActionState("actions"); }}>
                  <div className={styles.playerName}>{p.username}</div>
                  <span className={styles.playerArrow}>›</span>
                </div>
              ))}
            </div>
            {blockedActionState === "actions" && selectedBlockedPlayer && (
              <div className={styles.actionSheet}>
                <button className={styles.actionBtn} onClick={() => sendToLobby(selectedBlockedPlayer, 'blocked')}>🔓 Unblock to Lobby</button>
                <button className={styles.actionBtn} onClick={() => setBlockedActionState("move-picker")}>⚡ Force Assign to Group</button>
              </div>
            )}
            {blockedActionState === "move-picker" && selectedBlockedPlayer && (
              <div className={styles.movePicker}>
                {groups.map(g => (
                  <button key={g.id} className={styles.moveTarget} onClick={() => moveToGroup(g.id, selectedBlockedPlayer, 'blocked')}>{g.id}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}