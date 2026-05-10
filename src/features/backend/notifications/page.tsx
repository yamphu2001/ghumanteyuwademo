"use client";

import React, { useEffect, useState } from "react";
import FullPagePopup from "./components/FullPage";
import SmallToast from "./components/SmallToast";
import TopBar from "./components/TopBar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifAction {
  label: string;
  type: "internal_route" | "external_link" | "system_action";
  value: string;
}

interface GhumNotification {
  id: string;
  type: "toast" | "topbar" | "fullpage";
  title: string;
  body: string;
  image_url: string;
  audience: "global" | "pilot" | "uids";
  target_uids: string[];
  pilot_id: string;
  status: string;
  send_now: boolean;
  scheduled_at: string | null;
  expires_at: number;
  action?: NotifAction;
  has_action?: boolean;
  created_at: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(n: GhumNotification): boolean {
  if (n.status !== "published") return false;
  if (n.expires_at && Date.now() > n.expires_at) return false;
  if (!n.send_now && n.scheduled_at && new Date(n.scheduled_at).getTime() > Date.now()) return false;
  return true;
}

const DISMISSED_KEY = "ghum_dismissed_notifs";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationRenderer() {
  const [notifications, setNotifications] = useState<GhumNotification[]>([]);
  const [dismissed, setDismissed]         = useState<Set<string>>(new Set());
  const [loaded, setLoaded]               = useState(false);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    (async () => {
      const { db, auth }                             = await import("@/lib/firebase");
      const { onAuthStateChanged }                   = await import("firebase/auth");
      const { collection, query, where, onSnapshot } = await import("firebase/firestore");
      (async () => {
        const { db, auth } = await import("@/lib/firebase");
        console.log("Firebase project:", db.app.options.projectId); // ← add this line
        const { onAuthStateChanged } = await import("firebase/auth");
        // ... rest of the code
      })();

      // Wait for Firebase auth to finish initializing before querying Firestore.
      // Without this, Firestore rejects requests that arrive before auth resolves,
      // even in test mode.
      const unsubscribeAuth = onAuthStateChanged(auth, () => {
        unsubscribeAuth(); // detach immediately — only needed for the initial resolve

        // Temporarily fetching all — no filters, to rule out composite index issue
        const q = query(
          collection(db, "notifications")
        );

        unsubscribeSnapshot = onSnapshot(q, (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GhumNotification));
          const active = docs.filter(isActive);
          active.sort((a, b) => {
            const order = { fullpage: 0, topbar: 1, toast: 2 };
            return order[a.type] - order[b.type];
          });
          setNotifications(active);
          setLoaded(true);
        });
      });
    })();

    return () => unsubscribeSnapshot?.();
  }, []);

  function dismiss(id: string) {
    const updated = new Set(dismissed).add(id);
    setDismissed(updated);
    saveDismissed(updated);
  }

  if (!loaded) return null;

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  const fullpage = visible.find((n) => n.type === "fullpage");
  const topbar   = visible.find((n) => n.type === "topbar");
  const toasts   = visible.filter((n) => n.type === "toast");

  function resolveUrl(action: NotifAction): string {
    if (action.type === "external_link") return action.value;
    if (action.type === "internal_route") return action.value;
    return "#";
  }

  return (
    <>
      {fullpage && (
        <FullPagePopup
          key={fullpage.id}
          title={fullpage.title}
          message={fullpage.body}
          buttons={
            fullpage.has_action && fullpage.action
              ? [{ label: fullpage.action.label, url: resolveUrl(fullpage.action) }]
              : []
          }
          onClose={() => dismiss(fullpage.id)}
        />
      )}

      {!fullpage && topbar && (
        <TopBar
          key={topbar.id}
          message={topbar.title}
          buttons={
            topbar.has_action && topbar.action
              ? [{ label: topbar.action.label, url: resolveUrl(topbar.action) }]
              : []
          }
          onClose={() => dismiss(topbar.id)}
        />
      )}

      {toasts.map((n) => (
        <SmallToast
          key={n.id}
          message={n.title}
          onClose={() => dismiss(n.id)}
        />
      ))}
    </>
  );
}