"use client";
import { useEffect, useState } from "react";
import { startMatchmaking, stopMatchmaking, subscribeToGroups } from "../matchmaking";
import { startSimulator, stopSimulator, clearAll, spawnOne } from "../test";

interface GroupData {
  groupName: string;
  playerCount: number;
  closed: boolean;
}

export default function TestPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [matchmakingActive, setMatchmakingActive] = useState(false);
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const unsub = subscribeToGroups((g) => {
      setGroups(g);
      setTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  // Countdown ticker for next matchmaking tick
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    if (!matchmakingActive) { setCountdown(10); return; }
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 10;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [matchmakingActive, tick]);

  const handleStartMatchmaking = () => {
    startMatchmaking();
    setMatchmakingActive(true);
    addLog("Matchmaking engine started");
  };

  const handleStopMatchmaking = () => {
    stopMatchmaking();
    setMatchmakingActive(false);
    addLog("Matchmaking engine stopped");
  };

  const handleStartSimulator = () => {
    startSimulator();
    setSimulatorActive(true);
    addLog("Player simulator started — spawning every 2s");
  };

  const handleStopSimulator = () => {
    stopSimulator();
    setSimulatorActive(false);
    addLog("Player simulator stopped");
  };

  const handleSpawnOne = () => {
    spawnOne();
    addLog("Manual player spawned");
  };

  const handleClearAll = () => {
    clearAll();
    setGroups([]);
    addLog("⚠ All lobby & group data cleared");
  };

  const totalPlayers = groups.reduce((sum, g) => sum + g.playerCount, 0);
  const openGroups = groups.filter((g) => !g.closed).length;
  const closedGroups = groups.filter((g) => g.closed).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "'Courier New', Courier, monospace",
      padding: "0",
      overflowX: "hidden",
    }}>

      {/* Header */}
      <div style={{
        background: "#FF5F1F",
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 4,
          }}>
            GHUMANTE YUWA — ADMIN
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            textTransform: "uppercase",
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            color: "#fff",
          }}>
            Matchmaking Engine
          </h1>
        </div>

        {/* Engine Status Badge */}
        <div style={{
          background: matchmakingActive ? "rgba(0,255,100,0.15)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${matchmakingActive ? "#00ff64" : "rgba(255,255,255,0.2)"}`,
          borderRadius: 999,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: matchmakingActive ? "#00ff64" : "rgba(255,255,255,0.5)",
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: matchmakingActive ? "#00ff64" : "rgba(255,255,255,0.3)",
            boxShadow: matchmakingActive ? "0 0 8px #00ff64" : "none",
            animation: matchmakingActive ? "pulse 1.5s infinite" : "none",
          }} />
          {matchmakingActive ? `NEXT TICK: ${countdown}s` : "ENGINE OFF"}
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { label: "Total Players Grouped", value: totalPlayers, color: "#FF5F1F" },
            { label: "Open Groups", value: openGroups, color: "#00ff64" },
            { label: "Closed Groups", value: closedGroups, color: "#888" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#111",
              border: "1px solid #1f1f1f",
              borderRadius: 16,
              padding: "20px 24px",
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color, fontStyle: "italic" }}>
                {value}
              </div>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#555",
                marginTop: 4,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          background: "#111",
          border: "1px solid #1f1f1f",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#444",
            marginBottom: 16,
          }}>
            Engine Controls
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Matchmaking Toggle */}
            <button
              onClick={matchmakingActive ? handleStopMatchmaking : handleStartMatchmaking}
              style={{
                background: matchmakingActive ? "#1a1a1a" : "#FF5F1F",
                color: matchmakingActive ? "#FF5F1F" : "#fff",
                border: `2px solid ${matchmakingActive ? "#FF5F1F" : "transparent"}`,
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {matchmakingActive ? "⏹ Stop Matchmaking" : "▶ Start Matchmaking"}
            </button>

            {/* Simulator Toggle */}
            <button
              onClick={simulatorActive ? handleStopSimulator : handleStartSimulator}
              style={{
                background: simulatorActive ? "#1a1a1a" : "#1a3a1a",
                color: simulatorActive ? "#00ff64" : "#00ff64",
                border: `2px solid #00ff64`,
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {simulatorActive ? "⏹ Stop Simulator" : "▶ Start Simulator"}
            </button>

            {/* Spawn One */}
            <button
              onClick={handleSpawnOne}
              style={{
                background: "#1a1a2a",
                color: "#8888ff",
                border: "2px solid #8888ff",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ➕ Spawn One
            </button>

            {/* Clear All */}
            <button
              onClick={handleClearAll}
              style={{
                background: "#1a0a0a",
                color: "#ff4444",
                border: "2px solid #ff4444",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontFamily: "inherit",
                marginLeft: "auto",
              }}
            >
              🗑 Clear All
            </button>
          </div>
        </div>

        {/* Groups + Log */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Groups Panel */}
          <div style={{
            background: "#111",
            border: "1px solid #1f1f1f",
            borderRadius: 16,
            padding: "20px 24px",
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#444",
              marginBottom: 16,
            }}>
              Live Groups
            </div>

            {groups.length === 0 ? (
              <div style={{
                color: "#333",
                fontSize: 13,
                textAlign: "center",
                padding: "40px 0",
                fontStyle: "italic",
              }}>
                No groups yet — start matchmaking
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groups.map(({ groupName, playerCount, closed }) => {
                  const pct = (playerCount / 10) * 100;
                  return (
                    <div key={groupName} style={{
                      background: "#0d0d0d",
                      border: `1px solid ${closed ? "#222" : "#2a2a2a"}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      opacity: closed ? 0.6 : 1,
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}>
                        <span style={{
                          fontWeight: 900,
                          fontStyle: "italic",
                          fontSize: 15,
                          textTransform: "uppercase",
                          color: closed ? "#555" : "#fff",
                        }}>
                          {groupName}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: closed ? "#555" : "#FF5F1F",
                          }}>
                            {playerCount}/10
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 900,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: closed ? "#444" : "#00ff64",
                            background: closed ? "#1a1a1a" : "#0a2a0a",
                            border: `1px solid ${closed ? "#333" : "#00ff64"}`,
                            borderRadius: 999,
                            padding: "3px 8px",
                          }}>
                            {closed ? "CLOSED" : "OPEN"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{
                        height: 6,
                        background: "#1a1a1a",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: closed
                            ? "#333"
                            : playerCount >= 8
                            ? "#FF5F1F"
                            : "#00ff64",
                          borderRadius: 999,
                          transition: "width 0.4s ease",
                        }} />
                      </div>

                      {/* Player pip indicators */}
                      <div style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 8,
                      }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: i < playerCount
                              ? (closed ? "#444" : "#FF5F1F")
                              : "#1a1a1a",
                            transition: "background 0.3s ease",
                          }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div style={{
            background: "#111",
            border: "1px solid #1f1f1f",
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#444",
              marginBottom: 16,
            }}>
              Activity Log
            </div>

            <div style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: 400,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              {log.length === 0 ? (
                <div style={{
                  color: "#333",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "40px 0",
                  fontStyle: "italic",
                }}>
                  No activity yet
                </div>
              ) : (
                log.map((entry, i) => (
                  <div key={i} style={{
                    fontSize: 11,
                    color: i === 0 ? "#ccc" : "#444",
                    borderLeft: `2px solid ${i === 0 ? "#FF5F1F" : "#222"}`,
                    paddingLeft: 10,
                    lineHeight: 1.5,
                    transition: "color 0.5s",
                  }}>
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}