
'use client';

import React, { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import stallImg from "./stall.png";

interface StallConfig {
  id: string;
  lng: number;
  lat: number;
  eventarea: string;
  status: "active" | "inactive";
}

// Single pin — unchanged logic, just made reusable
function SingleStall({ map, config }: { map: any; config: StallConfig }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [showCloud, setShowCloud] = useState(false);

  const updatePosition = useCallback(() => {
    const inst = map?.current || map;
    if (!inst) return;
    requestAnimationFrame(() => {
      try {
        const point = inst.project([config.lng, config.lat]);
        if (point) setPos({ x: point.x, y: point.y });
      } catch {}
    });
  }, [map, config.lng, config.lat]);

  useEffect(() => {
    const inst = map?.current || map;
    if (!inst) return;
    updatePosition();
    const evs = ["move", "zoom", "resize", "moveend", "render"];
    evs.forEach((e) => inst.on(e, updatePosition));
    return () => evs.forEach((e) => inst.off(e, updatePosition));
  }, [map, updatePosition]);

  if (pos.x === 0 && pos.y === 0) return null;

  const finalSrc = typeof stallImg === "string" ? stallImg : (stallImg as any).src;

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -100%)`,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        willChange: "transform",
      }}
    >
      {showCloud && (
        <div style={{
          background: "white", padding: "5px 10px", borderRadius: "10px",
          marginBottom: "5px", fontSize: "12px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)", pointerEvents: "auto",
        }}>
          {config.eventarea}
        </div>
      )}
      <img
        src={finalSrc}
        alt="stall"
        style={{ width: "40px", cursor: "pointer", pointerEvents: "auto" }}
        onClick={(e) => { e.stopPropagation(); setShowCloud(!showCloud); }}
      />
    </div>
  );
}

// Parent: fetches the array, renders one <SingleStall> per active entry
export default function StallMarker({ map, eventId }: { map: any; eventId: string }) {
  const [stalls, setStalls] = useState<StallConfig[]>([]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.stallMarkers)) {
        setStalls(data.stallMarkers.filter((s: StallConfig) => s.status === "active"));
      } else if (data.stallMarker?.status === "active") {
        // Backwards-compat with old single-stall docs
        setStalls([{ ...data.stallMarker, id: "legacy" }]);
      }
    });
    return () => unsub();
  }, [eventId]);

  return (
    <>
      {stalls.map((stall) => (
        <SingleStall key={stall.id} map={map} config={stall} />
      ))}
    </>
  );
}