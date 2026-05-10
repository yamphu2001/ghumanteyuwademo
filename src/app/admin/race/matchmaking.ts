/**
 * =============================================================
 * MATCHMAKING ENGINE — GHUMANTE YUWA
 * =============================================================
 *
 * PURPOSE:
 * Runs every 10 seconds on the admin side.
 * Reads the lobby from Firebase Realtime Database (FIFO by requestTime),
 * fills open groups (max 10 players each) in order,
 * and removes assigned players from the lobby.
 *
 * FIREBASE STRUCTURE:
 *
 * /lobby/{userId}
 *   - username    : string
 *   - requestTime : number (timestamp ms)
 *   - isActive    : boolean
 *
 * /groups/{groupName}
 *   - createdAt   : number (timestamp ms)
 *   - closed      : boolean
 *   - status      : "waiting" | "closed"
 *   - players     : {
 *       [userId]: {
 *         username    : string
 *         requestTime : number
 *         joinedAt    : number
 *         score       : null
 *       }
 *     }
 *
 * EXPORTS:
 *   startMatchmaking()  — begins the 10s interval
 *   stopMatchmaking()   — clears the interval
 *   subscribeToGroups() — real-time listener for x/10 UI updates
 * =============================================================
 */

import "@/lib/firebase"; // ensures initializeApp() runs before we access the DB
import { getApp } from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  get,
  set,
  remove,
  update,
  onValue,
  query,
  orderByChild,
} from "firebase/database";

// Lazy initialization — ensures Firebase app is ready before we grab the DB
let _database: Database | null = null;
function getDB(): Database {
  if (!_database) _database = getDatabase(getApp());
  return _database;
}

// ── Constants ────────────────────────────────────────────────
const MAX_PLAYERS = 10;
const TICK_INTERVAL_MS = 10_000;
const PAUSE_AUTO_RESUME_MS = 30_000; // auto-resume after 30 seconds

// Group name pool — extend as needed
const GROUP_NAME_POOL: string[] = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo",
  "Foxtrot", "Golf", "Hotel", "India", "Juliet",
  "Kilo", "Lima", "Mike", "November", "Oscar", "Prayer", "Quebec", "Romeo", "Sierra", "Tango", "Basantapur", "Victor", "Whiskey", "X-ray", "Yankee", "Zulu", "polo" , "hollow","terminal","summit","peak","ridge","valley","cliff","canyon","glacier","volcano","oasis","delta","bay","island","harbor", "port","marina","reef","lagoon","cove","grove","meadow","prairie","savanna","tundra","swamp","marsh","fen","bog","delta","basin","plateau","mesa","butte",];

// ── Internal State ───────────────────────────────────────────
let tickIntervalId: ReturnType<typeof setInterval> | null = null;

// ── Types ────────────────────────────────────────────────────
interface LobbyPlayer {
  userId: string;
  username: string;
  requestTime: number;
  isActive: boolean;
}

interface GroupPlayer {
  uid: string;   
  username: string;
  requestTime: number;
  joinedAt: number;
  score: null;
}

interface Group {
  createdAt: number;
  closed: boolean;
  status: "waiting" | "closed";
  players: Record<string, GroupPlayer>;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Fetch all active lobby players sorted FIFO by requestTime.
 */
async function fetchLobbyFIFO(): Promise<LobbyPlayer[]> {
  const lobbyRef = query(ref(getDB(), "lobby"), orderByChild("requestTime"));
  const snapshot = await get(lobbyRef);

  if (!snapshot.exists()) return [];

  const players: LobbyPlayer[] = [];
  snapshot.forEach((child) => {
    const data = child.val();
    // Skip inactive players
    if (data.isActive === false) return;
    players.push({
      userId: child.key as string,
      username: data.username,
      requestTime: data.requestTime,
      isActive: data.isActive,
    });
  });

  // Sorted ascending by requestTime (FIFO)
  return players.sort((a, b) => a.requestTime - b.requestTime);
}

/**
 * Fetch all open (non-closed) groups from Firebase.
 */
async function fetchOpenGroups(): Promise<Record<string, Group>> {
  const groupsRef = ref(getDB(), "groups");
  const snapshot = await get(groupsRef);

  if (!snapshot.exists()) return {};

  const openGroups: Record<string, Group> = {};
  snapshot.forEach((child) => {
    const data = child.val() as Group;
    if (!data.closed) {
      openGroups[child.key as string] = data;
    }
  });

  return openGroups;
}

/**
 * Get the next available group name not already in use.
 */
async function getNextGroupName(): Promise<string | null> {
  const groupsRef = ref(getDB(), "groups");
  const snapshot = await get(groupsRef);

  const usedNames = new Set<string>();
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      usedNames.add(child.key as string);
    });
  }

  const nextName = GROUP_NAME_POOL.find((name) => !usedNames.has(name));
  return nextName ?? null;
}

/**
 * Count how many players are currently in a group.
 */
function getPlayerCount(group: Group): number {
  return group.players ? Object.keys(group.players).length : 0;
}

// ── Core Matchmaking Tick ────────────────────────────────────

async function matchmakingTick(): Promise<void> {
  console.log("[Matchmaking] Tick started —", new Date().toLocaleTimeString());

  try {
    // ── Check pause preference ───────────────────────────────
    const prefSnap = await get(ref(getDB(), "preferences/matchmaking"));
    if (prefSnap.exists()) {
      const pref = prefSnap.val();
      if (pref.paused === true) {
        const pausedAt: number = pref.pausedAt ?? 0;
        const elapsed = Date.now() - pausedAt;
        if (elapsed < PAUSE_AUTO_RESUME_MS) {
          console.log(`[Matchmaking] Paused — ${Math.round((PAUSE_AUTO_RESUME_MS - elapsed) / 1000)}s until auto-resume.`);
          return;
        }
        // Auto-resume — 30s elapsed
        await update(ref(getDB(), "preferences/matchmaking"), { paused: false, pausedAt: null });
        console.log("[Matchmaking] Auto-resumed after 30s.");
      }
    }

    const lobbyPlayers = await fetchLobbyFIFO();

    if (lobbyPlayers.length === 0) {
      console.log("[Matchmaking] Lobby is empty, nothing to do.");
      return;
    }

    console.log(`[Matchmaking] ${lobbyPlayers.length} active player(s) in lobby.`);

    // Work through lobby players one by one (FIFO)
    const playersToAssign = [...lobbyPlayers];
    const openGroups = await fetchOpenGroups();

    // Sort open groups by createdAt so we fill oldest first
    const sortedOpenGroups = Object.entries(openGroups).sort(
      ([, a], [, b]) => a.createdAt - b.createdAt
    );

    // Fill existing open groups first
    for (const [groupName, group] of sortedOpenGroups) {
      if (playersToAssign.length === 0) break;

      const currentCount = getPlayerCount(group);
      const spotsAvailable = MAX_PLAYERS - currentCount;

      if (spotsAvailable <= 0) continue;

      const batch = playersToAssign.splice(0, spotsAvailable);
      await assignPlayersToGroup(groupName, batch, group);

      const newCount = currentCount + batch.length;
      if (newCount >= MAX_PLAYERS) {
        // Close the group
        await update(ref(getDB(), `groups/${groupName}`), { closed: true, status: "closed" });
        console.log(`[Matchmaking] Group "${groupName}" is FULL and CLOSED.`);
      }
    }

    // If players still remain, open new groups
    while (playersToAssign.length > 0) {
      const newGroupName = await getNextGroupName();

      if (!newGroupName) {
        console.warn("[Matchmaking] No group names left in pool! Extend GROUP_NAME_POOL.");
        break;
      }

      const batch = playersToAssign.splice(0, MAX_PLAYERS);
      const now = Date.now();

      const newGroup: Group = {
        createdAt: now,
        closed: false,
        status: "waiting",
        players: {},
      };

      await assignPlayersToGroup(newGroupName, batch, newGroup, true);

      if (batch.length >= MAX_PLAYERS) {
        await update(ref(getDB(), `groups/${newGroupName}`), { closed: true, status: "closed" });
        console.log(`[Matchmaking] New group "${newGroupName}" FULL and CLOSED immediately.`);
      } else {
        console.log(`[Matchmaking] New group "${newGroupName}" created with ${batch.length}/${MAX_PLAYERS} players — status: waiting.`);
      }
    }

    console.log("[Matchmaking] Tick complete.");
  } catch (err) {
    console.error("[Matchmaking] Error during tick:", err);
  }
}

/**
 * Assign a batch of players to a group and remove them from lobby.
 */
async function assignPlayersToGroup(
  groupName: string,
  players: LobbyPlayer[],
  existingGroup: Group,
  isNewGroup = false
): Promise<void> {
  const now = Date.now();
  const updates: Record<string, unknown> = {};

  // Build player entries
  const newPlayers: Record<string, GroupPlayer> = {};
  for (const player of players) {
    newPlayers[player.userId] = {
      uid: player.userId,
      username: player.username,
      requestTime: player.requestTime,
      joinedAt: now,
      score: null,
    };
    // Remove from lobby
    updates[`lobby/${player.userId}`] = null;
  }

  if (isNewGroup) {
    // Write full new group
    updates[`groups/${groupName}`] = {
      createdAt: existingGroup.createdAt,
      closed: existingGroup.closed,
      status: "waiting",
      players: newPlayers,
    };
  } else {
    // Merge into existing group players
    for (const [userId, playerData] of Object.entries(newPlayers)) {
      updates[`groups/${groupName}/players/${userId}`] = playerData;
    }
  }

  // Single atomic write
  await update(ref(getDB()), updates);

  const names = players.map((p) => p.username).join(", ");
  console.log(`[Matchmaking] Assigned to "${groupName}": ${names}`);
}

// ── Public API ───────────────────────────────────────────────

/**
 * Start the matchmaking engine.
 * Call this once on the admin page mount.
 */
export function startMatchmaking(): void {
  if (tickIntervalId !== null) {
    console.warn("[Matchmaking] Already running.");
    return;
  }

  console.log("[Matchmaking] Engine started. Ticking every 10s.");
  matchmakingTick(); // Run immediately on start
  tickIntervalId = setInterval(matchmakingTick, TICK_INTERVAL_MS);
}

/**
 * Stop the matchmaking engine.
 * Call this on admin page unmount.
 */
export function stopMatchmaking(): void {
  if (tickIntervalId !== null) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
    console.log("[Matchmaking] Engine stopped.");
  }
}

/**
 * Pause matchmaking for 30 seconds.
 * Call from the Teams page pause button.
 */
export async function pauseMatchmaking(): Promise<void> {
  await update(ref(getDB(), "preferences/matchmaking"), {
    paused: true,
    pausedAt: Date.now(),
  });
  console.log("[Matchmaking] Paused by admin.");
}

/**
 * Manually resume matchmaking before the 30s auto-resume.
 */
export async function resumeMatchmaking(): Promise<void> {
  await update(ref(getDB(), "preferences/matchmaking"), {
    paused: false,
    pausedAt: null,
  });
  console.log("[Matchmaking] Manually resumed.");
}

/**
 * Subscribe to pause state for live UI indicator.
 * Returns unsubscribe function.
 */
export function subscribeToPauseState(
  callback: (paused: boolean, secondsLeft: number) => void
): () => void {
  const prefRef = ref(getDB(), "preferences/matchmaking");
  return onValue(prefRef, (snap) => {
    if (!snap.exists()) { callback(false, 0); return; }
    const data = snap.val();
    if (!data.paused) { callback(false, 0); return; }
    const elapsed = Date.now() - (data.pausedAt ?? 0);
    const secondsLeft = Math.max(0, Math.round((PAUSE_AUTO_RESUME_MS - elapsed) / 1000));
    callback(true, secondsLeft);
  });
}

/**
 * Subscribe to real-time group updates for the x/10 UI indicator.
 * Returns an unsubscribe function — call it on component unmount.
 *
 * @param callback — receives array of { groupName, playerCount, closed, status }
 *
 * Usage in your component:
 *   const unsub = subscribeToGroups((groups) => setGroupData(groups));
 *   useEffect(() => () => unsub(), []);
 */
export function subscribeToGroups(
  callback: (groups: {
    groupName: string;
    playerCount: number;
    closed: boolean;
    status: "waiting" | "closed";
  }[]) => void
): () => void {
  const groupsRef = ref(getDB(), "groups");

  const unsubscribe = onValue(groupsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const result: {
      groupName: string;
      playerCount: number;
      closed: boolean;
      status: "waiting" | "closed";
    }[] = [];

    snapshot.forEach((child) => {
      const data = child.val() as Group;
      const playerCount = data.players ? Object.keys(data.players).length : 0;
      result.push({
        groupName: child.key as string,
        playerCount,
        closed: data.closed ?? false,
        status: data.status ?? "waiting",
      });
    });

    callback(result);
  });

  return unsubscribe;
}