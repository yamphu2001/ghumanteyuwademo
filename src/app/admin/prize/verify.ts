/**
 * =============================================================
 * VERIFY.TS — Prize Claim Logic
 * =============================================================
 *
 * FLOW:
 *   1. Parse QR string → extract username
 *   2. Query Firestore users collection for matching username
 *   3. Check prize_claims collection for duplicate
 *   4. If clean → write claim to prize_claims
 *
 * QR FORMAT: {username}_completed_race
 * e.g. "Hatiosi_completed_race" → { username: "Hatiosi" }
 * NOTE: username itself may contain underscores, so we strip
 *       the fixed suffix "_completed_race" from the end.
 * =============================================================
 */

import "@/lib/firebase";
import { getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

const db = getFirestore(getApp());

// ── Types ─────────────────────────────────────────────────────
export type VerifyResult =
  | { status: "success";         username: string }
  | { status: "already_claimed"; username: string; claimedAt: string }
  | { status: "not_found";       username: string }
  | { status: "invalid_qr" };

export type ClaimRecord = {
  id: string;
  username: string;
  claimedAt: string; // formatted display string
};

// ── QR Parser ─────────────────────────────────────────────────

const QR_SUFFIX = "_completed_basantapur";

/**
 * Parse QR string of format "{username}_completed_race"
 * Strips the fixed suffix to extract the username.
 * e.g. "Hatiosi_completed_race"     → { username: "Hatiosi" }
 *      "MUSTANG_KHOLE_completed_race" → { username: "MUSTANG_KHOLE" }
 */
export function parseQR(raw: string): { username: string } | null {
  const trimmed = raw.trim();

  if (!trimmed.endsWith(QR_SUFFIX)) return null;

  const username = trimmed.slice(0, trimmed.length - QR_SUFFIX.length);

  if (!username) return null;

  return { username };
}

// ── Core Verify & Claim ───────────────────────────────────────

/**
 * Main function — call this after a QR scan.
 * Parses the QR, verifies the user exists, checks for duplicates,
 * and writes the claim if everything is clean.
 */
export async function verifyAndClaim(rawQR: string): Promise<VerifyResult> {
  // 1. Parse QR
  const parsed = parseQR(rawQR);
  if (!parsed) return { status: "invalid_qr" };

  const { username } = parsed;

  // 2. Check user exists in Firestore
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("username", "==", username));
  const userSnap = await getDocs(userQuery);

  if (userSnap.empty) {
    // Fallback: try case-insensitive match by fetching all and comparing
    // (Firestore doesn't support native case-insensitive queries)
    const allUsersSnap = await getDocs(usersRef);
    const match = allUsersSnap.docs.find(
      (d) => (d.data().username ?? "").toLowerCase() === username.toLowerCase()
    );
    if (!match) return { status: "not_found", username };
  }

  // 3. Check for existing claim
  const claimsRef = collection(db, "prize_claims");
  const claimQuery = query(claimsRef, where("username", "==", username));
  const claimSnap = await getDocs(claimQuery);

  if (!claimSnap.empty) {
    const existing = claimSnap.docs[0].data();
    const claimedAt = existing.claimedAt?.toDate
      ? existing.claimedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "earlier";
    return { status: "already_claimed", username, claimedAt };
  }

  // 4. Write claim
  await addDoc(claimsRef, {
    username,
    claimedAt: serverTimestamp(),
  });

  return { status: "success", username };
}

// ── Real-time Claims Listener ─────────────────────────────────

/**
 * Subscribe to prize_claims in real time.
 * Returns an unsubscribe function — call on component unmount.
 *
 * Usage:
 *   const unsub = subscribeToClaims((claims) => setHistory(claims));
 *   useEffect(() => () => unsub(), []);
 */
export function subscribeToClaims(
  callback: (claims: ClaimRecord[]) => void
): Unsubscribe {
  const claimsRef = collection(db, "prize_claims");

  return onSnapshot(claimsRef, (snap) => {
    const records: ClaimRecord[] = snap.docs.map((doc) => {
      const data = doc.data();
      const claimedAt = data.claimedAt?.toDate
        ? data.claimedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "—";
      return {
        id: doc.id,
        username: data.username,
        claimedAt,
      };
    });

    // Most recent first
    records.sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1));
    callback(records);
  });
}