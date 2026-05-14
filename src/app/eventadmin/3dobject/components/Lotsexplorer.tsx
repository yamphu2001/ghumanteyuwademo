"use client";

import { StallCollection } from '../store';

interface Props {
  collections: StallCollection[];
  inspectingId: string | null;
  mobileTab: 'lots' | 'map' | 'props';
  onSelect: (id: string) => void;
}

export default function LotsExplorer({ collections, inspectingId, mobileTab, onSelect }: Props) {
  return (
    <div
      className={`w-64 border-r-4 border-black flex flex-col bg-neutral-50 z-20
        max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:transition-transform max-md:duration-200
        ${mobileTab === 'lots' ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
        md:flex md:static md:translate-x-0`}
    >
      <div className="p-4 bg-black text-white font-black italic border-b-4 border-black text-xs">
        LOTS_EXPLORER
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {collections.length === 0 && (
          <p className="text-[9px] opacity-40 italic normal-case mt-2">
            Draw a line on the map to create a lot.
          </p>
        )}
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => onSelect(col.id)}
            className={`w-full text-left p-3 border-2 border-black shadow-[4px_4px_0px_black]
              transition-all active:translate-y-1 active:shadow-none
              ${inspectingId === col.id ? 'bg-yellow-400' : 'bg-white'}`}
          >
            <div className="font-black truncate">{col.name}</div>
            <div className="text-[8px] mt-1 opacity-60 italic">
              {col.stalls} UNITS · {col.shapeType} · {col.side}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}