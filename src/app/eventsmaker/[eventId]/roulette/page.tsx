"use client";

// Thin Next.js page wrapper — no props allowed on page exports.
// The actual component lives in RoulettePage.tsx and accepts
// optional eventId + onClose for use inside MapContainer.
import PlayerRoulettePage from "./RoulettePage";

export default function RoulettePage() {
  return <PlayerRoulettePage />;
}
