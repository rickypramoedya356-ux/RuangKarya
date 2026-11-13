import React, { useRef, useState } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  RotateCcw,
  Plus,
  DoorOpen,
  Sun,
} from 'lucide-react';
import {
  ArchitecturalOpening,
  ErgonomicAuditResult,
  PlacedFurniture,
  RoomConfig,
} from '../types/room';
import { getDoorSwingBox, getEffectiveBox } from '../utils/ergonomics';

interface BlueprintCanvasProps {
  room: RoomConfig;
  audit: ErgonomicAuditResult;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateFurniture: (id: string, patch: Partial<PlacedFurniture>) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onResetRoom: () => void;
  onAddOpening: (type: 'door' | 'window') => void;
  onRemoveOpening: (id: string) => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  room,
  audit,
  selectedId,
  onSelect,
  onUpdateFurniture,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onResetRoom,
  onAddOpening,
  onRemoveOpening,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);

  const margin = 48; // SVG units around room for rulers & dimension lines
  const vbWidth = room.widthCm + margin * 2;
  const vbHeight = room.lengthCm + margin * 2;

  const selectedItem = room.furniture.find((f) => f.id === selectedId) || null;

  // Map affected furniture IDs to highest severity
  const itemSeverityMap = new Map<string, 'critical' | 'warning'>();
  for (const finding of audit.findings) {
    if (finding.severity === 'nominal') continue;
    for (const id of finding.affectedIds) {
      const prev = itemSeverityMap.get(id);
      if (finding.severity === 'critical' || !prev) {
        itemSeverityMap.set(id, finding.severity);
      }
    }
  }

  const clientToSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = vbWidth / rect.width;
    const scaleY = vbHeight / rect.height;
    return {
      x: clientX * scaleX,
      y: clientY * scaleY,
    };
  };

  const handlePointerDownItem = (e: React.PointerEvent, item: PlacedFurniture) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelect(item.id);
    setDragState({
      id: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: item.xCm,
      origY: item.yCm,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = vbWidth / rect.width;
    const scaleY = vbHeight / rect.height;
    const dxCm = (e.clientX - dragState.startClientX) * scaleX;
    const dyCm = (e.clientY - dragState.startClientY) * scaleY;

    const item = room.furniture.find((f) => f.id === dragState.id);
    if (!item) return;
    const box = getEffectiveBox(item);

    let nextX = dragState.origX + dxCm;
    let nextY = dragState.origY + dyCm;

    if (snapEnabled) {
      nextX = Math.round(nextX / 10) * 10;
      nextY = Math.round(nextY / 10) * 10;
    } else {
      nextX = Math.round(nextX);
      nextY = Math.round(nextY);
    }

    // Clamp cleanly inside room walls
    nextX = Math.max(0, Math.min(room.widthCm - box.w, nextX));
    nextY = Math.max(0, Math.min(room.lengthCm - box.h, nextY));

    onUpdateFurniture(item.id, { xCm: nextX, yCm: nextY });
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  // Sort items so floor overlays (rugs) render first beneath solid furniture
  const sortedFurniture = [...room.furniture].sort((a, b) => {
    if (a.isFloorOverlay && !b.isFloorOverlay) return -1;
    if (!a.isFloorOverlay && b.isFloorOverlay) return 1;
    return 0;
  });

  // Grid ticks every 50 cm
  const xTicks: number[] = [];
  for (let x = 0; x <= room.widthCm; x += 50) xTicks.push(x);
  const yTicks: number[] = [];
  for (let y = 0; y <= room.lengthCm; y += 50) yTicks.push(y);

  const renderOpening = (op: ArchitecturalOpening) => {
    const swing = getDoorSwingBox(op, room.widthCm, room.lengthCm);

    if (op.type === 'window') {
      const isHoriz = op.wall === 'top' || op.wall === 'bottom';
      const x = isHoriz ? op.offsetCm : op.wall === 'left' ? -4 : room.widthCm - 4;
      const y = isHoriz ? (op.wall === 'top' ? -4 : room.lengthCm - 4) : op.offsetCm;
      const w = isHoriz ? op.widthCm : 8;
      const h = isHoriz ? 8 : op.widthCm;

      return (
        <g
          key={op.id}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onRemoveOpening(op.id);
          }}
          className="cursor-pointer"
        >
          <title>Jendela ({op.widthCm} cm) — klik ganda untuk hapus</title>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill="#E0F2FE"
            stroke="#0284C7"
            strokeWidth={2}
          />
          {isHoriz ? (
            <line
              x1={x}
              y1={y + h / 2}
              x2={x + w}
              y2={y + h / 2}
              stroke="#0284C7"
              strokeWidth={1.5}
            />
          ) : (
            <line
              x1={x + w / 2}
              y1={y}
              x2={x + w / 2}
              y2={y + h}
              stroke="#0284C7"
              strokeWidth={1.5}
            />
          )}
        </g>
      );
    }

    // Door with 90-deg swing arc
    let hingeX = 0;
    let hingeY = 0;
    let leafEndX = 0;
    let leafEndY = 0;
    let arcPath = '';

    if (op.wall === 'top') {
      hingeX = op.offsetCm;
      hingeY = 0;
      leafEndX = hingeX;
      leafEndY = op.widthCm;
      arcPath = `M ${hingeX + op.widthCm} ${hingeY} A ${op.widthCm} ${op.widthCm} 0 0 1 ${leafEndX} ${leafEndY}`;
    } else if (op.wall === 'bottom') {
      hingeX = op.offsetCm;
      hingeY = room.lengthCm;
      leafEndX = hingeX;
      leafEndY = room.lengthCm - op.widthCm;
      arcPath = `M ${hingeX + op.widthCm} ${hingeY} A ${op.widthCm} ${op.widthCm} 0 0 0 ${leafEndX} ${leafEndY}`;
    } else if (op.wall === 'left') {
      hingeX = 0;
      hingeY = op.offsetCm;
      leafEndX = op.widthCm;
      leafEndY = hingeY;
      arcPath = `M ${hingeX} ${hingeY + op.widthCm} A ${op.widthCm} ${op.widthCm} 0 0 0 ${leafEndX} ${leafEndY}`;
    } else {
      hingeX = room.widthCm;
      hingeY = op.offsetCm;
      leafEndX = room.widthCm - op.widthCm;
      leafEndY = hingeY;
      arcPath = `M ${hingeX} ${hingeY + op.widthCm} A ${op.widthCm} ${op.widthCm} 0 0 1 ${leafEndX} ${leafEndY}`;
    }

    return (
      <g
        key={op.id}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onRemoveOpening(op.id);
        }}
        className="cursor-pointer"
      >
        <title>Pintu ({op.widthCm} cm) — klik ganda untuk hapus</title>
        <rect
          x={swing.x}
          y={swing.y}
          width={swing.w}
          height={swing.h}
          fill="rgba(29, 78, 216, 0.03)"
        />
        <path
          d={arcPath}
          fill="none"
          stroke="#64748B"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <line
          x1={hingeX}
          y1={hingeY}
          x2={leafEndX}
          y2={leafEndY}
          stroke="#0F172A"
          strokeWidth={3}
        />
      </g>
    );
  };

  // Clearance helper lines for selected item
  const renderSelectedClearances = () => {
    if (!selectedItem) return null;
    const box = getEffectiveBox(selectedItem);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;

    const leftGap = Math.round(box.x);
    const rightGap = Math.round(room.widthCm - (box.x + box.w));
    const topGap = Math.round(box.y);
    const bottomGap = Math.round(room.lengthCm - (box.y + box.h));

    return (
      <g className="pointer-events-none">
        {leftGap > 8 && (
          <>
            <line x1={0} y1={cy} x2={box.x} y2={cy} stroke="#2563EB" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={box.x / 2} y={cy - 4} textAnchor="middle" fontSize={10} fill="#1D4ED8" fontFamily="JetBrains Mono, monospace">
              {leftGap}
            </text>
          </>
        )}
        {rightGap > 8 && (
          <>
            <line x1={box.x + box.w} y1={cy} x2={room.widthCm} y2={cy} stroke="#2563EB" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={box.x + box.w + rightGap / 2} y={cy - 4} textAnchor="middle" fontSize={10} fill="#1D4ED8" fontFamily="JetBrains Mono, monospace">
              {rightGap}
            </text>
          </>
        )}
        {topGap > 8 && (
          <>
            <line x1={cx} y1={0} x2={cx} y2={box.y} stroke="#2563EB" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={cx + 5} y={box.y / 2 + 3} fontSize={10} fill="#1D4ED8" fontFamily="JetBrains Mono, monospace">
              {topGap}
            </text>
          </>
        )}
        {bottomGap > 8 && (
          <>
            <line x1={cx} y1={box.y + box.h} x2={cx} y2={room.lengthCm} stroke="#2563EB" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={cx + 5} y={box.y + box.h + bottomGap / 2 + 3} fontSize={10} fill="#1D4ED8" fontFamily="JetBrains Mono, monospace">
              {bottomGap}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Canvas Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-900">Denah Skala 2D</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {(room.widthCm / 100).toFixed(1)} × {(room.lengthCm / 100).toFixed(1)} m
          </span>
          <span aria-hidden="true">·</span>
          <span>Geser perabot untuk uji jarak</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSnapEnabled((s) => !s)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              snapEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            Grid 10 cm: {snapEnabled ? 'Aktif' : 'Bebas'}
          </button>

          <button
            type="button"
            onClick={() => onAddOpening('door')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>+ Pintu</span>
          </button>

          <button
            type="button"
            onClick={() => onAddOpening('window')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>+ Jendela</span>
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:inline-block" />

          <button
            type="button"
            onClick={onRotateSelected}
            disabled={!selectedItem}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Putar 90°</span>
          </button>

          <button
            type="button"
            onClick={onDuplicateSelected}
            disabled={!selectedItem}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplikat</span>
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!selectedItem}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-white border border-slate-200 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>

          <button
            type="button"
            onClick={onResetRoom}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            title="Kembalikan denah awal template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Drafting Canvas */}
      <div className="bg-[#F8FAFC] p-4 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`${-margin} ${-margin} ${vbWidth} ${vbHeight}`}
          className="w-full max-h-[540px] select-none touch-none"
          onClick={() => onSelect(null)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Room Floor Surface */}
          <rect
            x={0}
            y={0}
            width={room.widthCm}
            height={room.lengthCm}
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth={5}
          />

          {/* 50 cm Architectural Grid */}
          {xTicks.map((x) => (
            <g key={`gx-${x}`}>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={room.lengthCm}
                stroke={x % 100 === 0 ? '#E2E8F0' : '#F1F5F9'}
                strokeWidth={1}
              />
              {x % 100 === 0 && (
                <text
                  x={x}
                  y={-12}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {(x / 100).toFixed(0)}m
                </text>
              )}
            </g>
          ))}

          {yTicks.map((y) => (
            <g key={`gy-${y}`}>
              <line
                x1={0}
                y1={y}
                x2={room.widthCm}
                y2={y}
                stroke={y % 100 === 0 ? '#E2E8F0' : '#F1F5F9'}
                strokeWidth={1}
              />
              {y % 100 === 0 && (
                <text
                  x={-12}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {(y / 100).toFixed(0)}m
                </text>
              )}
            </g>
          ))}

          {/* Overall Dimension Callouts */}
          <text
            x={room.widthCm / 2}
            y={-28}
            textAnchor="middle"
            fontSize={11}
            fontWeight="600"
            fill="#334155"
            fontFamily="JetBrains Mono, monospace"
          >
            Lebar: {room.widthCm} cm
          </text>
          <text
            x={room.widthCm + 22}
            y={room.lengthCm / 2}
            textAnchor="middle"
            fontSize={11}
            fontWeight="600"
            fill="#334155"
            fontFamily="JetBrains Mono, monospace"
            transform={`rotate(90, ${room.widthCm + 22}, ${room.lengthCm / 2})`}
          >
            Panjang: {room.lengthCm} cm
          </text>

          {/* Architectural Openings */}
          {room.openings.map(renderOpening)}

          {/* Furniture Items */}
          {sortedFurniture.map((item) => {
            const box = getEffectiveBox(item);
            const isSelected = item.id === selectedId;
            const severity = itemSeverityMap.get(item.id);

            let strokeColor = '#475569';
            let strokeWidth = 1.5;
            if (severity === 'critical') {
              strokeColor = '#DC2626';
              strokeWidth = 2.2;
            } else if (severity === 'warning') {
              strokeColor = '#D97706';
              strokeWidth = 2;
            }
            if (isSelected) {
              strokeColor = '#1D4ED8';
              strokeWidth = 2.5;
            }

            const fillOpacity = item.isFloorOverlay ? 0.55 : 0.92;

            return (
              <g
                key={item.id}
                onPointerDown={(e) => handlePointerDownItem(e, item)}
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing"
              >
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={item.category === 'lighting' || item.catalogId === 'indoor-plant' ? Math.min(box.w, box.h) / 2 : 3}
                  fill={item.colorHex || '#E2E8F0'}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={item.isFloorOverlay ? '4 3' : undefined}
                />

                {/* Subtle architectural plan detail lines */}
                {item.category === 'seating' && box.w >= 120 && (
                  <line
                    x1={box.x + 6}
                    y1={box.y + box.h - 14}
                    x2={box.x + box.w - 6}
                    y2={box.y + box.h - 14}
                    stroke="#64748B"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                )}
                {item.category === 'bed' && (
                  <>
                    <rect
                      x={box.x + 12}
                      y={box.y + 10}
                      width={Math.max(24, box.w / 2 - 18)}
                      height={26}
                      rx={3}
                      fill="#FFFFFF"
                      stroke="#94A3B8"
                      strokeWidth={1}
                    />
                    {box.w > 140 && (
                      <rect
                        x={box.x + box.w / 2 + 6}
                        y={box.y + 10}
                        width={Math.max(24, box.w / 2 - 18)}
                        height={26}
                        rx={3}
                        fill="#FFFFFF"
                        stroke="#94A3B8"
                        strokeWidth={1}
                      />
                    )}
                  </>
                )}

                {/* Item Name & Size Label */}
                <text
                  x={box.x + box.w / 2}
                  y={box.y + box.h / 2 - (box.h > 50 ? 3 : -3)}
                  textAnchor="middle"
                  fontSize={Math.min(11, Math.max(8, box.w / 10))}
                  fontWeight="600"
                  fill="#0F172A"
                  className="pointer-events-none"
                >
                  {item.name.length > 18 && box.w < 130 ? `${item.name.slice(0, 15)}…` : item.name}
                </text>
                {box.h >= 42 && (
                  <text
                    x={box.x + box.w / 2}
                    y={box.y + box.h / 2 + 10}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#475569"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none"
                  >
                    {box.w}×{box.h}
                  </text>
                )}
              </g>
            );
          })}

          {renderSelectedClearances()}
        </svg>
      </div>

      {/* Canvas Footer Legend */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 inline-block border border-slate-600 bg-slate-200 rounded-xs" />
            Perabot
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 inline-block border border-dashed border-slate-500 bg-slate-100 rounded-xs" />
            Karpet / Zona Lantai
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block bg-sky-600" />
            Jendela (klik ganda untuk hapus)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 inline-block border border-dashed border-slate-500 rounded-tl-full" />
            Ayunan Pintu
          </span>
        </div>
        {selectedItem ? (
          <span className="font-mono tabular-nums text-slate-700">
            Terpilih: {selectedItem.name} · X:{selectedItem.xCm} cm · Y:{selectedItem.yCm} cm · {selectedItem.rotationDeg}°
          </span>
        ) : (
          <span>Klik perabot pada denah untuk melihat jarak ke dinding</span>
        )}
      </div>
    </div>
  );
};
