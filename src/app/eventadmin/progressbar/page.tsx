
"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEventId } from "@/app/eventadmin/Eventidcontext";

const CATEGORIES = [
  { id: "locationmarkers", label: "Location Markers" },
  { id: "QRcodeMarkers",   label: "QR Code Markers" },
  { id: "specialmarkers",  label: "Special Markers" },
];

type EventConfig = {
  enabled: boolean;
  activeCategories: string[];
};

export default function ProgressBarAdmin() {
  const { eventId } = useEventId();

  const [config, setConfig] = useState<EventConfig>({
    enabled: false,
    activeCategories: [],
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoadingConfig(true);

    const fetchConfig = async () => {
      try {
        const settingsRef = doc(db, "events", eventId, "progressbar", "config");
        const snap = await getDoc(settingsRef);

        if (snap.exists()) {
          const data = snap.data();
          setConfig({
            enabled: data.enabled ?? false,
            activeCategories: data.activeCategories ?? [],
          });
        } else {
          setConfig({ enabled: false, activeCategories: [] });
        }
      } catch (err) {
        console.error("Error fetching config:", err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [eventId]);

  const toggleCategory = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      activeCategories: prev.activeCategories.includes(id)
        ? prev.activeCategories.filter((c) => c !== id)
        : [...prev.activeCategories, id],
    }));
  };

  const handleSave = async () => {
    if (!eventId) {
      alert("No Event ID selected.");
      return;
    }
    setSaving(true);
    try {
      const settingsRef = doc(db, "events", eventId, "progressbar", "config");
      await setDoc(settingsRef, {
        enabled: config.enabled,
        activeCategories: config.activeCategories,
      });
      alert("Progress bar settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (!eventId) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace", color: "#999", fontSize: 12 }}>
        Please select an event in the sidebar to manage Progress Bar settings.
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: 28, fontFamily: "monospace" }}>

      {/* ── Page Header ── */}
      <div style={{ borderBottom: "3px solid #000", paddingBottom: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>
          FOREVENT
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#000", letterSpacing: 1 }}>
          PROGRESS BAR
        </h1>
        <div style={{ fontSize: 10, color: "#999", marginTop: 6, letterSpacing: 0.5 }}>
          events / {eventId} / progressbar / <span style={{ color: "#dc2626", fontWeight: 700 }}>config</span>
        </div>
      </div>

      {loadingConfig ? (
        <div style={{ padding: 20, fontFamily: "monospace", fontSize: 12, color: "#999", letterSpacing: 2 }}>
          SYNCING CONFIGURATION...
        </div>
      ) : (
        <div style={{ maxWidth: 480, border: "2px solid #000", padding: 24, background: "#fff" }}>

          {/* ── Enable toggle ── */}
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 14 }}>
            ● VISIBILITY
          </div>

          <label style={{
            display: "flex", alignItems: "center", cursor: "pointer",
            padding: "14px 16px",
            border: config.enabled ? "1.5px solid #dc2626" : "1.5px solid #e5e5e5",
            background: config.enabled ? "#fef2f2" : "#fafafa",
            marginBottom: 24,
            gap: 12,
          }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: "#dc2626", cursor: "pointer" }}
            />
            <span style={{ fontWeight: 700, fontSize: 12, color: "#000", letterSpacing: 0.5 }}>
              Enable Progress Bar Component
            </span>
            {config.enabled && (
              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#dc2626", background: "#fef2f2", border: "1px solid #dc2626", padding: "2px 8px" }}>
                ON
              </span>
            )}
          </label>

          <div style={{ borderTop: "1.5px solid #e5e5e5", marginBottom: 20 }} />

          {/* ── Categories ── */}
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 14 }}>
            ● INCLUDE IN CALCULATION
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const active = config.activeCategories.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  style={{
                    display: "flex", alignItems: "center", cursor: "pointer", gap: 12,
                    padding: "12px 16px",
                    border: active ? "1.5px solid #dc2626" : "1.5px solid #e5e5e5",
                    background: active ? "#fef2f2" : "#fafafa",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleCategory(cat.id)}
                    style={{ width: 16, height: 16, accentColor: "#dc2626", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: active ? 700 : 400, fontSize: 12, color: active ? "#000" : "#666" }}>
                    {cat.label}
                  </span>
                  {active && (
                    <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#dc2626" }}>
                      ✓
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* ── Save ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "13px 0",
              background: saving ? "#e5e5e5" : "#dc2626",
              color: saving ? "#999" : "#fff",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            {saving ? "SAVING..." : "SAVE CONFIGURATION"}
          </button>
        </div>
      )}
    </div>
  );
}