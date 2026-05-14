"use client";

import { useEffect, useState } from 'react';
import { StallItem, ColorMode } from '../store';

// ── Single stall card with local state ────────────────────────────────────────
// Keeping name/description in local state prevents the store re-render from
// resetting the input on every keystroke. We flush to store on blur.

interface StallCardProps {
  item: StallItem;
  idx: number;
  colorMode: ColorMode;
  onCommit: (updated: Partial<StallItem>) => void;
}

function StallCard({ item, idx, colorMode, onCommit }: StallCardProps) {
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.description);

  // Keep in sync if item is replaced externally (e.g. stall count changes)
  useEffect(() => setName(item.name), [item.id, item.name]);
  useEffect(() => setDesc(item.description), [item.id, item.description]);

  return (
    <div className="p-4 border-2 border-black bg-white shadow-[6px_6px_0px_black] space-y-3">
      {/* Header row */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <span className="font-black text-xl italic opacity-20">STALL_{idx + 1}</span>
        {colorMode === 'individual' && (
          <input
            type="color"
            value={item.color}
            onChange={(e) => onCommit({ color: e.target.value })}
            className="w-8 h-8 border-2 border-black cursor-pointer"
          />
        )}
      </div>

      {/* Name — local state, flush on blur */}
      <div className="space-y-1">
        <label className="block text-[8px] font-black opacity-40">NAME</label>
        <input
          className="w-full border-b-2 border-black outline-none font-bold italic py-1 bg-transparent text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onCommit({ name })}
        />
      </div>

      {/* Description — local state, flush on blur */}
      <div className="space-y-1">
        <label className="block text-[8px] font-black opacity-40">DESCRIPTION</label>
        <textarea
          className="w-full border-2 border-black outline-none font-medium p-2 h-16 resize-none text-xs"
          placeholder="Add notes..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => onCommit({ description: desc })}
        />
      </div>
    </div>
  );
}

// ── Registry list ──────────────────────────────────────────────────────────────

interface Props {
  collectionId: string;
  items: StallItem[];
  colorMode: ColorMode;
  onUpdateItem: (collectionId: string, itemId: string, fields: Partial<StallItem>) => void;
  onDeleteCollection: () => void;
}

export default function UnitRegistry({
  collectionId,
  items,
  colorMode,
  onUpdateItem,
  onDeleteCollection,
}: Props) {
  return (
    <section className="space-y-4 pb-20">
      <div className="bg-black text-white px-2 py-1 inline-block font-black italic">
        05_UNIT_REGISTRY
      </div>

      {items.map((item, idx) => (
        <StallCard
          key={item.id}
          item={item}
          idx={idx}
          colorMode={colorMode}
          onCommit={(fields) => onUpdateItem(collectionId, item.id, fields)}
        />
      ))}

      <button
        onClick={onDeleteCollection}
        className="w-full p-4 bg-red-600 text-white font-black hover:bg-black transition-all border-4 border-black"
      >
        DELETE_COLLECTION
      </button>
    </section>
  );
}