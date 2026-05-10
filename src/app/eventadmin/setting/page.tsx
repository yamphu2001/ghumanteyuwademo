
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEventId } from "@/app/eventadmin/Eventidcontext"; // Adjust path as needed
import {
  saveProximityDistances,
  clearDistanceCache,
  FALLBACK_DISTANCES
} from "@/lib/EventMarkerProgress";
import type { MarkerCategory } from "@/lib/EventMarkerProgress";

type DistanceConfig = Record<MarkerCategory, number>;

const LABELS: Record<MarkerCategory, { label: string; emoji: string; hint: string }> = {
  mapPrizes:       { label: "Map Prizes",        emoji: "🗺️", hint: "How close (metres) to unlock map prizes" },
  qrcodemarkers:   { label: "QR Code Markers",   emoji: "🔍", hint: "How close (metres) to scan a QR code" },
  locationMarkers: { label: "Location Markers",  emoji: "📍", hint: "How close (metres) to unlock by holding" },
  specialMarkers:  { label: "Special Markers",   emoji: "⭐", hint: "How close (metres) to unlock special games" },
};

const PRESETS = [5,10, 15,50000];

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)}km`;
  return `${m}m`;
}

export default function GameSettings() {
  // ✅ Get eventId from your Global Context
  const { eventId } = useEventId();

  const [config, setConfig]   = useState<DistanceConfig>(FALLBACK_DISTANCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // 1. Load settings whenever the eventId changes
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        clearDistanceCache();

        const snap = await getDoc(doc(db, "events", eventId, "settings", "proximityDistances"));
        
        if (snap.exists()) {
          const data = snap.data() as Partial<DistanceConfig>;
          setConfig({
            qrcodemarkers:   data.qrcodemarkers   ?? FALLBACK_DISTANCES.qrcodemarkers,
            locationMarkers: data.locationMarkers ?? FALLBACK_DISTANCES.locationMarkers,
            specialMarkers:  data.specialMarkers  ?? FALLBACK_DISTANCES.specialMarkers,
            mapPrizes:       data.mapPrizes       ?? FALLBACK_DISTANCES.mapPrizes,
          });
        } else {
          // If no specific settings exist for this event yet, use fallbacks
          setConfig(FALLBACK_DISTANCES);
        }
      } catch (err) {
        setError("Failed to load settings for this event.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const handleSave = async () => {
    if (!eventId) {
      setError("Please select an Event ID first.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);
    
    try {
      await saveProximityDistances(eventId, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: MarkerCategory, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 50000) {
      setConfig(prev => ({ ...prev, [key]: num }));
    }
  };

  // UI for when no event is selected in the context
  if (!eventId) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800">
        <p className="font-bold">No Event Selected</p>
        <p className="text-sm">Please select an event from the admin sidebar or dropdown to manage its distances.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-gray-400 font-medium">Loading {eventId} settings…</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Proximity Settings</h2>
        <p className="text-sm text-gray-500 italic">
          Editing distances for Event ID: <span className="text-blue-600 font-mono font-bold">{eventId}</span>
        </p>
      </div>

      <div className="space-y-5">
        {(Object.keys(LABELS) as MarkerCategory[]).map(key => {
          const { label, emoji, hint } = LABELS[key];
          return (
            <div key={key} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" role="img" aria-label={label}>{emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{label}</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
                <span className="text-lg font-black text-blue-600">
                  {formatDistance(config[key])}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={2000} // Capped at 2km for better UI feel, but manual input allows more
                step={5}
                value={config[key]}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full accent-blue-500 mb-3 cursor-pointer"
              />

              <div className="flex gap-1.5 flex-wrap">
                {PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setConfig(prev => ({ ...prev, [key]: preset }))}
                    className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wider transition-all ${
                      config[key] === preset
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {formatDistance(preset)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Event Settings"}
        </button>

        {saved && <span className="text-sm font-bold text-green-600 animate-pulse">✅ Saved to {eventId}</span>}
        {error && <span className="text-sm font-bold text-red-500">⚠️ {error}</span>}
      </div>
    </div>
  );
}