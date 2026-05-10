"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { rtdb } from "@/lib/firebase"; 
import { ref, onValue } from "firebase/database";

// Interface matching your screenshot
interface PlayerData {
  heading: number;
  lat: number;
  lng: number;
  speed: number;
  updatedAt: number;
}

interface Group {
  closed: boolean;
  createdAt: number;
  livePlayers?: Record<string, PlayerData>;
  status: string;
}

export default function LiveMapTracker() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});

  const [groups, setGroups] = useState<Record<string, Group>>({});
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [85.3077, 27.7049], // Centered near Alpha's data
      zoom: 15,
    });
    return () => map.current?.remove();
  }, []);

  // Listen to 'groups' node
  useEffect(() => {
    const groupsRef = ref(rtdb, 'groups');
    return onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGroups(data);
    });
  }, []);

  // Sync Markers
  useEffect(() => {
    if (!map.current) return;

    const currentKeys = new Set<string>();

    Object.entries(groups).forEach(([groupName, groupData]) => {
      if (!groupData.livePlayers) return;

      Object.entries(groupData.livePlayers).forEach(([playerId, p]) => {
        const key = `${groupName}-${playerId}`;
        if (selectedPlayers.has(key)) {
          currentKeys.add(key);

          if (markers.current[key]) {
            markers.current[key].setLngLat([p.lng, p.lat]);
            const el = markers.current[key].getElement();
            const arrow = el.querySelector('.arrow') as HTMLElement;
            if (arrow) arrow.style.transform = `rotate(${p.heading}deg)`;
          } else {
            const el = document.createElement('div');
            el.className = 'marker-box';
            el.innerHTML = `<div class="label">${playerId}</div><div class="arrow">➤</div>`;
            
            markers.current[key] = new maplibregl.Marker({ element: el })
              .setLngLat([p.lng, p.lat])
              .addTo(map.current!);
          }
        }
      });
    });

    // Cleanup unselected
    Object.keys(markers.current).forEach(k => {
      if (!currentKeys.has(k)) {
        markers.current[k].remove();
        delete markers.current[k];
      }
    });
  }, [groups, selectedPlayers]);

  const togglePlayer = (key: string) => {
    const next = new Set(selectedPlayers);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelectedPlayers(next);
  };

  return (
    <div className="flex h-screen w-full bg-[#111] text-white overflow-hidden">
      <aside className="w-64 bg-[#1a1a1a] p-4 border-r border-white/10 overflow-y-auto z-10">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Groups</h2>
        {Object.entries(groups).map(([name, data]) => (
          <div key={name} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-blue-400">{name}</span>
              <span className="text-[10px] text-gray-500">{data.status}</span>
            </div>
            <div className="space-y-1">
              {Object.keys(data.livePlayers || {}).map(pId => {
                const key = `${name}-${pId}`;
                const isSelected = selectedPlayers.has(key);
                return (
                  <button
                    key={pId}
                    onClick={() => togglePlayer(key)}
                    className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {pId}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <div ref={mapContainer} className="flex-1 h-full" />

      <style jsx global>{`
        .marker-box { display: flex; flex-direction: column; align-items: center; }
        .label { background: black; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-bottom: 2px; }
        .arrow { font-size: 20px; color: #3b82f6; text-shadow: 0 0 3px white; transition: transform 0.2s linear; }
      `}</style>
    </div>
  );
}