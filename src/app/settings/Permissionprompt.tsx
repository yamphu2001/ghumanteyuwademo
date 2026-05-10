"use client";
import React, { useState } from "react";
import { X, MapPin, Camera, AlertTriangle, ExternalLink } from "lucide-react";

type PermissionType = "location" | "camera";

interface PermissionPromptProps {
  type: PermissionType;
  isOpen: boolean;
  onClose: () => void;
}

const CONTENT = {
  location: {
    icon: MapPin,
    title: "Location Access Needed",
    accentColor: "#E63946",
    body: "Ghumante Yuwa needs your location to place you on the map, track your exploration, and unlock nearby heritage sites.",
    steps: [
      "Open your phone Settings",
      'Find "Ghumante Yuwa" in Website list',
      'Set Location to "Always" or "While Using"',
    ],
    ctaLabel: "Open Settings",
    note: "Without location, the map cannot show your position or detect nearby landmarks.",
  },
  camera: {
    icon: Camera,
    title: "Camera Access Needed",
    accentColor: "#E63946",
    body: "Camera access lets you scan QR codes at heritage sites and capture moments during your exploration.",
    steps: [
      "Open your phone Settings",
      'Find "Ghumante Yuwa" in Website list',
      'Set Camera to "Allow"',
    ],
    ctaLabel: "Open Settings",
    note: "Without camera access, QR scanning and photo capture will be unavailable.",
  },
};

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({ type, isOpen, onClose }) => {
  if (!isOpen) return null;

  const c = CONTENT[type];
  const Icon = c.icon;

  const handleRequestPermission = async () => {
    if (type === "location") {
      try {
        // Attempt to re-trigger the browser permission prompt
        await navigator.geolocation.getCurrentPosition(
          () => onClose(),
          () => {
            // Already denied — can only direct to settings on native
            // On web, we can't open OS settings, so we just close
            onClose();
          }
        );
      } catch {
        onClose();
      }
    } else if (type === "camera") {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        onClose();
      } catch {
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon size={18} />
            <span className="font-black uppercase tracking-widest text-xs">{c.title}</span>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Body */}
          <p className="text-sm font-mono text-zinc-700 leading-relaxed">{c.body}</p>

          {/* Steps */}
          <div className="border-2 border-black p-3 space-y-2 bg-zinc-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">How to Enable</p>
            {c.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs font-mono text-zinc-700">{step}</span>
              </div>
            ))}
          </div>

          {/* Warning note */}
          <div className="flex gap-2 items-start border-l-4 border-[#E63946] pl-3">
            <AlertTriangle size={14} className="text-[#E63946] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-zinc-500">{c.note}</p>
          </div>

          {/* CTA */}
          <button
            onClick={handleRequestPermission}
            className="w-full bg-black text-white font-black py-3 flex items-center justify-center gap-2 hover:bg-zinc-800 uppercase tracking-widest text-xs active:translate-y-0.5 transition-transform"
          >
            <ExternalLink size={14} />
            {c.ctaLabel}
          </button>

          <button
            onClick={onClose}
            className="w-full border-2 border-black text-black font-black py-2 uppercase tracking-widest text-xs hover:bg-zinc-50"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionPrompt;