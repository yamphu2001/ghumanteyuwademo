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

  // Fetch settings directly from events/{eventId}/progressbar/config
  useEffect(() => {
    if (!eventId) return;
    setLoadingConfig(true);

    const fetchConfig = async () => {
      try {
        // 🟢 FIXED PATH: Direct sub-collection under the event (No 'settings' folder)
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

  // Save to events/{eventId}/progressbar/config
  const handleSave = async () => {
    if (!eventId) {
      alert("No Event ID selected.");
      return;
    }
    setSaving(true);
    try {
      // 🟢 FIXED PATH: Direct sub-collection under the event (No 'settings' folder)
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
      <div style={{ padding: "40px", color: "#64748b", fontWeight: "bold" }}>
        Please select an event in the sidebar to manage Progress Bar settings.
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "520px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "4px" }}>
        Progress Bar Settings
      </h1>
      
      {/* Accurate breadcrumb indicator reflecting your database structural layout */}
      <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "24px", fontFamily: "monospace" }}>
        events / {eventId} / progressbar / <strong>config</strong>
      </p>

      {loadingConfig ? (
        <div style={{ padding: "20px", color: "#94a3b8", fontWeight: "600" }}>
          Syncing configuration...
        </div>
      ) : (
        <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>

          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "20px" }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              style={{ width: "22px", height: "22px", marginRight: "12px", accentColor: "#2563eb" }}
            />
            <span style={{ fontWeight: "bold", color: "#1e293b" }}>
              Enable Progress Bar Component
            </span>
          </label>

          <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

          <p style={{ fontWeight: "800", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "12px" }}>
            Include in calculation:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  background: "white",
                  padding: "12px",
                  borderRadius: "10px",
                  border: config.activeCategories.includes(cat.id)
                    ? "1px solid #2563eb"
                    : "1px solid #f1f5f9",
                }}
              >
                <input
                  type="checkbox"
                  checked={config.activeCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  style={{ marginRight: "12px", width: "18px", height: "18px", accentColor: "#2563eb" }}
                />
                <span style={{ fontWeight: "600", color: "#475569" }}>{cat.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: "30px",
              width: "100%",
              padding: "16px",
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: "14px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "900",
              opacity: saving ? 0.7 : 1,
              transition: "0.2s",
            }}
          >
            {saving ? "SAVING..." : "SAVE CONFIGURATION"}
          </button>
        </div>
      )}
    </div>
  );
}