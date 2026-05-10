/**
 * =============================================================
 * MATCHMAKING TEST SIMULATOR — GHUMANTE YUWA
 * =============================================================
 *
 * PURPOSE:
 * Simulates players joining the lobby at random intervals.
 * Use this on the admin page during development to test
 * the matchmaking engine without real clients.
 *
 * USAGE:
 *   import { startSimulator, stopSimulator, clearLobby, clearGroups } from "./test";
 *
 *   startSimulator();         // starts spawning fake players
 *   stopSimulator();          // stops spawning
 *   clearLobby();             // wipe /lobby in Firebase
 *   clearGroups();            // wipe /groups in Firebase
 *   clearAll();               // wipe both
 * =============================================================
 */

import "@/lib/firebase"; // ensures initializeApp() runs before we access the DB
import { getApp } from "firebase/app";
import { getDatabase, Database, ref, set, remove } from "firebase/database";

// Lazy initialization — ensures Firebase app is ready before we grab the DB
let _database: Database | null = null;
function getDB(): Database {
  if (!_database) _database = getDatabase(getApp());
  return _database;
}

// ── Config ───────────────────────────────────────────────────
const SPAWN_INTERVAL_MS = 2000;   // New fake player every 2 seconds
const INACTIVE_CHANCE = 0.1;      // 10% chance a player spawns as inactive (edge case test)

// Fake name pool
const FAKE_USERNAMES = [
  "SundariBhanjyang", "KhagendraKhicha", "ParbatPahadi", "GauriGhale",
  "BishalBhattarai", "RameshRai", "SitaDahal", "ManishaMagar",
  "PrasannaPoudel", "NirajNepali", "KamalKhadka", "SunilShrestha",
  "AnkitaAcharya", "DeepakDhital", "PriyaPanta", "SandeshSubedi",
  "RoshaniRijal", "BijayBashyal", "MilanMaharjan", "PujaParajuli",
  "AaravAdhikari", "BinodBaniya", "ChandanChaudhary", "DurgaDangol",
  "EshanEuphoria", "FarisaFuyal", "GaganGurung", "HemantHamal",
];

// ── Internal State ───────────────────────────────────────────
let spawnIntervalId: ReturnType<typeof setInterval> | null = null;
let playerCounter = 0;
const usedNames = new Set<string>();

// ── Helpers ──────────────────────────────────────────────────

function getRandomUsername(): string {
  const available = FAKE_USERNAMES.filter((n) => !usedNames.has(n));
  if (available.length === 0) {
    // Recycle with suffix if pool exhausted
    const base = FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)];
    return `${base}_${playerCounter}`;
  }
  const name = available[Math.floor(Math.random() * available.length)];
  usedNames.add(name);
  return name;
}

function generateUserId(): string {
  return `sim_user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Core Spawn ───────────────────────────────────────────────

async function spawnFakePlayer(): Promise<void> {
  playerCounter++;
  const userId = generateUserId();
  const username = getRandomUsername();
  const isActive = Math.random() > INACTIVE_CHANCE; // 10% spawn inactive

  const playerData = {
    username,
    requestTime: Date.now(),
    isActive,
  };

  try {
    await set(ref(getDB(), `lobby/${userId}`), playerData);
    console.log(
      `[Simulator] Player #${playerCounter} joined lobby: ${username} | active: ${isActive}`
    );
  } catch (err) {
    console.error(`[Simulator] Failed to add ${username}:`, err);
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Start spawning fake players into the lobby.
 */
export function startSimulator(): void {
  if (spawnIntervalId !== null) {
    console.warn("[Simulator] Already running.");
    return;
  }

  console.log(
    `[Simulator] Started. Spawning a player every ${SPAWN_INTERVAL_MS / 1000}s.`
  );
  spawnFakePlayer(); // Spawn one immediately
  spawnIntervalId = setInterval(spawnFakePlayer, SPAWN_INTERVAL_MS);
}

/**
 * Stop spawning fake players.
 */
export function stopSimulator(): void {
  if (spawnIntervalId !== null) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = null;
    usedNames.clear();
    playerCounter = 0;
    console.log("[Simulator] Stopped.");
  }
}

/**
 * Wipe the entire /lobby node in Firebase.
 * Useful for resetting between test runs.
 */
export async function clearLobby(): Promise<void> {
  try {
    await remove(ref(getDB(), "lobby"));
    console.log("[Simulator] Lobby cleared.");
  } catch (err) {
    console.error("[Simulator] Failed to clear lobby:", err);
  }
}

/**
 * Wipe the entire /groups node in Firebase.
 */
export async function clearGroups(): Promise<void> {
  try {
    await remove(ref(getDB(), "groups"));
    console.log("[Simulator] Groups cleared.");
  } catch (err) {
    console.error("[Simulator] Failed to clear groups:", err);
  }
}

/**
 * Wipe both lobby and groups — full reset.
 */
export async function clearAll(): Promise<void> {
  await Promise.all([clearLobby(), clearGroups()]);
  console.log("[Simulator] Full reset complete.");
}

/**
 * Spawn a single player manually (useful for targeted testing).
 */
export async function spawnOne(overrides?: {
  username?: string;
  isActive?: boolean;
}): Promise<void> {
  playerCounter++;
  const userId = generateUserId();
  const username = overrides?.username ?? getRandomUsername();
  const isActive = overrides?.isActive ?? true;

  await set(ref(getDB(), `lobby/${userId}`), {
    username,
    requestTime: Date.now(),
    isActive,
  });

  console.log(`[Simulator] Manual spawn: ${username} | active: ${isActive}`);
}