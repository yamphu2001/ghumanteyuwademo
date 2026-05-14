"use client";

import maplibregl from 'maplibre-gl';
import { StallCollection, StallItem, ShapeType, SidePlacement, ColorMode } from '../store';
import UnitRegistry from './Unitregistry';

interface Props {
  activeCol: StallCollection;
  mobileTab: 'lots' | 'map' | 'props';
  isEditingNodes: boolean;
  map: maplibregl.Map | null;
  // callbacks
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<StallCollection>) => void;
  onUpdateItem: (collectionId: string, itemId: string, fields: Partial<StallItem>) => void;
  onDelete: () => void;
  onStartReEdit: () => void;
  onEnterNodeEdit: () => void;
  onExitNodeEdit: () => void;
  onUpdateNodeCoord: (i: number, axis: 0 | 1, val: number) => void;
  onAddNode: () => void;
  onRemoveNode: (i: number) => void;
}

const GEOMETRY_FIELDS = [
  { label: 'UNIT_COUNT',         key: 'stalls',  step: '1'   },
  { label: 'SPACING_GAP (M)',    key: 'gap',     step: '0.1' },
  { label: 'FRONT_WIDTH (M)',    key: 'width',   step: '0.1' },
  { label: 'DEPTH_LENGTH (M)',   key: 'length',  step: '0.1' },
  { label: 'EXTRUSION_HT (M)',   key: 'height',  step: '0.1' },
  { label: 'SIDE_OFFSET (M)',    key: 'offset',  step: '0.1' },
] as const;

export default function PropertyConfig({
  activeCol,
  mobileTab,
  isEditingNodes,
  onClose,
  onUpdate,
  onUpdateItem,
  onDelete,
  onStartReEdit,
  onEnterNodeEdit,
  onExitNodeEdit,
  onUpdateNodeCoord,
  onAddNode,
  onRemoveNode,
}: Props) {
  return (
    <div
      className={`w-[480px] bg-white border-l-4 border-black z-20 flex flex-col
        max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:w-full
        max-md:transition-transform max-md:duration-200
        ${mobileTab === 'props' ? 'max-md:translate-x-0' : 'max-md:translate-x-full'}
        md:flex md:static md:translate-x-0`}
    >
      {/* Sticky header */}
      <div className="p-4 border-b-4 border-black sticky top-0 bg-white z-30 flex justify-between items-center">
        <span className="font-black italic underline">PROPERTY_CONFIG</span>
        <button
          onClick={onClose}
          className="font-black border-2 border-black px-4 py-1 hover:bg-black hover:text-white transition-colors"
        >
          CLOSE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10">

        {/* ── 00 SPATIAL TOOLS ── */}
        <section className="space-y-4">
          <SectionHeader label="00_SPATIAL_TOOLS" />

          <WideButton onClick={onStartReEdit}>
            MODIFY_DRAWN_PATH [REDRAW]
          </WideButton>

          {!isEditingNodes ? (
            <WideButton onClick={onEnterNodeEdit}>
              EDIT_LINE_POINTS [{activeCol.coordinates.length} PTS]
            </WideButton>
          ) : (
            <div className="border-4 border-black p-4 space-y-2 bg-neutral-50">
              <div className="font-black text-[9px] mb-3 border-b-2 border-black pb-2">
                LINE_POINTS — drag markers on map or type coords
              </div>
              {activeCol.coordinates.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[8px] opacity-40 w-4 shrink-0">{i + 1}</span>
                  <input
                    type="number" step="0.000001"
                    value={c[0].toFixed(6)}
                    onChange={e => onUpdateNodeCoord(i, 0, Number(e.target.value))}
                    className="flex-1 min-w-0 border-2 border-black text-[9px] font-mono px-1 py-0.5 outline-none bg-white"
                    title="Lng"
                  />
                  <input
                    type="number" step="0.000001"
                    value={c[1].toFixed(6)}
                    onChange={e => onUpdateNodeCoord(i, 1, Number(e.target.value))}
                    className="flex-1 min-w-0 border-2 border-black text-[9px] font-mono px-1 py-0.5 outline-none bg-white"
                    title="Lat"
                  />
                  {activeCol.coordinates.length > 2 && (
                    <button
                      onClick={() => onRemoveNode(i)}
                      className="shrink-0 font-black text-xs hover:text-red-600 px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={onAddNode}
                className="w-full py-2 border-2 border-dashed border-black text-[9px] font-black hover:bg-yellow-400 transition-all mt-1"
              >
                + ADD_POINT
              </button>
              <button
                onClick={onExitNodeEdit}
                className="w-full py-3 border-4 border-black bg-yellow-400 font-black text-xs hover:bg-black hover:text-white transition-all"
              >
                ✓ DONE_EDITING_NODES
              </button>
            </div>
          )}
        </section>

        {/* ── 01 LOT GEOMETRY ── */}
        <section className="space-y-4">
          <SectionHeader label="01_LOT_GEOMETRY" />

          <input
            className="w-full text-2xl font-black bg-transparent border-b-4 border-black outline-none italic mb-4"
            value={activeCol.name}
            onChange={e => onUpdate(activeCol.id, { name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            {GEOMETRY_FIELDS.map(field => (
              <div
                key={field.key}
                className="border-2 border-black p-2 bg-neutral-50 shadow-[2px_2px_0px_black]"
              >
                <label className="block text-[8px] font-black opacity-50 mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  step={field.step}
                  className="w-full text-lg font-black outline-none bg-transparent"
                  value={(activeCol as any)[field.key] ?? 0}
                  onChange={e =>
                    onUpdate(activeCol.id, { [field.key]: Number(e.target.value) })
                  }
                />
              </div>
            ))}

            <button
              onClick={() => onUpdate(activeCol.id, { isCurved: !activeCol.isCurved })}
              className={`border-2 border-black font-black p-2 shadow-[2px_2px_0px_black]
                ${activeCol.isCurved ? 'bg-black text-white' : 'bg-white'}`}
            >
              {activeCol.isCurved ? 'CURVE: ON' : 'CURVE: OFF'}
            </button>
          </div>
        </section>

        {/* ── 02 SHAPE TYPE ── */}
        <section className="space-y-4">
          <SectionHeader label="02_SHAPE_TYPE" />
          <div className="grid grid-cols-3 border-2 border-black">
            {(['rect', 'circle', 'hexagon'] as ShapeType[]).map(s => (
              <button
                key={s}
                onClick={() => onUpdate(activeCol.id, { shapeType: s })}
                className={`py-3 font-black border-r-2 last:border-0 border-black
                  ${activeCol.shapeType === s ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'}`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* ── 03 SHAPE PLACEMENT ── */}
        <section className="space-y-4">
          <SectionHeader label="03_SHAPE_PLACEMENT" />
          <div className="grid grid-cols-3 border-2 border-black">
            {(['left', 'on', 'right'] as SidePlacement[]).map(s => (
              <button
                key={s}
                onClick={() => onUpdate(activeCol.id, { side: s })}
                className={`py-3 font-black border-r-2 last:border-0 border-black
                  ${activeCol.side === s ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'}`}
              >
                {s === 'left' ? '◀ LEFT' : s === 'right' ? 'RIGHT ▶' : '— ON —'}
              </button>
            ))}
          </div>
          <p className="text-[8px] opacity-40 italic normal-case">
            Left/right = shape touches the line on that side. On = shape straddles the line.
            Use SIDE_OFFSET to add extra gap.
          </p>
        </section>

        {/* ── 04 VISUAL LOGIC ── */}
        <section className="space-y-3">
          <SectionHeader label="04_VISUAL_LOGIC" />
          <div className="grid grid-cols-3 border-2 border-black">
            {(['uniform', 'random', 'individual'] as ColorMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => onUpdate(activeCol.id, { colorMode: mode })}
                className={`py-2 font-black border-r-2 last:border-0 border-black
                  ${activeCol.colorMode === mode ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          {activeCol.colorMode === 'uniform' && (
            <div className="flex items-center gap-4 border-2 border-black p-2">
              <span className="font-black">HEX_BASE:</span>
              <input
                type="color"
                className="flex-1 h-8 cursor-pointer border-2 border-black"
                value={activeCol.baseColor}
                onChange={e => onUpdate(activeCol.id, { baseColor: e.target.value })}
              />
            </div>
          )}
        </section>

        {/* ── 05 UNIT REGISTRY ── */}
        <UnitRegistry
          collectionId={activeCol.id}
          items={activeCol.items}
          colorMode={activeCol.colorMode}
          onUpdateItem={onUpdateItem}
          onDeleteCollection={onDelete}
        />

      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-black text-white px-2 py-1 inline-block font-black mb-2 italic">
      {label}
    </div>
  );
}

function WideButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 border-4 border-black bg-white font-black text-xs
        shadow-[4px_4px_0px_black] hover:bg-yellow-400
        active:shadow-none active:translate-y-1 transition-all"
    >
      {children}
    </button>
  );
}