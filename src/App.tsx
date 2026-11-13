import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import {
  AdvisorChatMessage,
  FurnitureCatalogItem,
  PlacedFurniture,
  RoomConfig,
  StylePresetId,
  SuggestedLayoutItem,
  SystematicAdvisoryReport,
} from './types/room';
import { ROOM_TEMPLATES, STYLE_PRESETS, formatIdr } from './data/catalog';
import { auditRoomErgonomics, getEffectiveBox } from './utils/ergonomics';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { AdvisorySection } from './components/AdvisorySection';
import { CatalogRabSection } from './components/CatalogRabSection';
import { IndustryBenchmarkSection } from './components/IndustryBenchmarkSection';

const STORAGE_KEY = 'ruangkarya_active_room_v1';

export default function App() {
  const [room, setRoom] = useState<RoomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as RoomConfig;
      }
    } catch {
      // ignore invalid localStorage
    }
    return structuredClone(ROOM_TEMPLATES[0]);
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    () => ROOM_TEMPLATES[0].furniture[1]?.id || null
  );

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [report, setReport] = useState<SystematicAdvisoryReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<AdvisorChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    } catch {
      // ignore storage quota errors
    }
  }, [room]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const audit = useMemo(() => auditRoomErgonomics(room), [room]);
  const selectedItem = useMemo(
    () => room.furniture.find((f) => f.id === selectedId) || null,
    [room.furniture, selectedId]
  );

  const handleSelectTemplate = (templateId: string) => {
    const tpl = ROOM_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const cloned = structuredClone(tpl);
    setRoom(cloned);
    setSelectedId(cloned.furniture[0]?.id || null);
    setReport(null);
    setChatMessages([]);
    setAnalyzeError(null);
  };

  const handleResetRoom = () => {
    const tpl = ROOM_TEMPLATES.find((t) => t.id === room.id) || ROOM_TEMPLATES[0];
    const cloned = structuredClone(tpl);
    setRoom(cloned);
    setSelectedId(cloned.furniture[0]?.id || null);
    setToastMessage('Denah dikembalikan ke susunan awal template.');
  };

  const handleUpdateRoom = (patch: Partial<RoomConfig>) => {
    setRoom((prev) => ({ ...prev, ...patch }));
  };

  const handleSelectStyle = (styleId: StylePresetId) => {
    const preset = STYLE_PRESETS.find((s) => s.id === styleId);
    if (!preset) return;
    setRoom((prev) => ({
      ...prev,
      style: styleId,
      wallFinish: preset.wallFinish,
      floorMaterial: preset.floorMaterial,
      colors: structuredClone(preset.colors),
    }));
  };

  const handleAddFurniture = (catalogItem: FurnitureCatalogItem) => {
    const id = `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const xCm = Math.max(
      0,
      Math.round((room.widthCm - catalogItem.widthCm) / 20) * 10
    );
    const yCm = Math.max(
      0,
      Math.round((room.lengthCm - catalogItem.depthCm) / 20) * 10
    );

    const newItem: PlacedFurniture = {
      id,
      catalogId: catalogItem.catalogId,
      name: catalogItem.name,
      category: catalogItem.category,
      xCm,
      yCm,
      widthCm: catalogItem.widthCm,
      depthCm: catalogItem.depthCm,
      heightCm: catalogItem.heightCm,
      rotationDeg: 0,
      material: catalogItem.defaultMaterial,
      priceIdr: catalogItem.priceIdr,
      isFloorOverlay: catalogItem.isFloorOverlay,
      minFrontClearanceCm: catalogItem.minFrontClearanceCm,
      colorHex: catalogItem.colorHex,
    };

    setRoom((prev) => ({
      ...prev,
      furniture: [...prev.furniture, newItem],
    }));
    setSelectedId(id);
    setToastMessage(`${catalogItem.name} ditambahkan ke denah.`);
  };

  const handleUpdateFurniture = (id: string, patch: Partial<PlacedFurniture>) => {
    setRoom((prev) => ({
      ...prev,
      furniture: prev.furniture.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleRotateSelected = () => {
    if (!selectedItem) return;
    const nextRot = ((selectedItem.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270;
    const temp = { ...selectedItem, rotationDeg: nextRot };
    const box = getEffectiveBox(temp);
    const clampedX = Math.max(0, Math.min(room.widthCm - box.w, selectedItem.xCm));
    const clampedY = Math.max(0, Math.min(room.lengthCm - box.h, selectedItem.yCm));
    handleUpdateFurniture(selectedItem.id, {
      rotationDeg: nextRot,
      xCm: clampedX,
      yCm: clampedY,
    });
  };

  const handleDuplicateSelected = () => {
    if (!selectedItem) return;
    const id = `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const box = getEffectiveBox(selectedItem);
    const offsetX = Math.min(room.widthCm - box.w, selectedItem.xCm + 20);
    const offsetY = Math.min(room.lengthCm - box.h, selectedItem.yCm + 20);
    const copy: PlacedFurniture = {
      ...selectedItem,
      id,
      xCm: Math.max(0, offsetX),
      yCm: Math.max(0, offsetY),
    };
    setRoom((prev) => ({ ...prev, furniture: [...prev.furniture, copy] }));
    setSelectedId(id);
  };

  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    setRoom((prev) => ({
      ...prev,
      furniture: prev.furniture.filter((f) => f.id !== selectedItem.id),
    }));
    setSelectedId(null);
  };

  const handleAddOpening = (type: 'door' | 'window') => {
    const id = `op-${Date.now()}`;
    const widthCm = type === 'door' ? 90 : 140;
    const wall = type === 'door' ? 'bottom' : 'top';
    const offsetCm = Math.max(20, Math.round((room.widthCm - widthCm) / 20) * 10);
    setRoom((prev) => ({
      ...prev,
      openings: [...prev.openings, { id, type, wall, offsetCm, widthCm }],
    }));
    setToastMessage(
      type === 'door'
        ? 'Pintu ditambahkan pada dinding bawah (klik ganda pada denah untuk hapus).'
        : 'Jendela ditambahkan pada dinding atas (klik ganda pada denah untuk hapus).'
    );
  };

  const handleRemoveOpening = (id: string) => {
    setRoom((prev) => ({
      ...prev,
      openings: prev.openings.filter((o) => o.id !== id),
    }));
  };

  const handleUploadPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setPhotoBase64(base64);
      setPhotoMimeType(file.type || 'image/jpeg');
      setPhotoPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setPhotoBase64(null);
    setPhotoMimeType(null);
    setPhotoPreviewUrl(null);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    const el = document.getElementById('konsultan-ai');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
      const res = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          audit,
          photoBase64,
          photoMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat menganalisis ruangan.');
      }
      setReport(data.report);
      setChatMessages([]);
    } catch (err: any) {
      setAnalyzeError(err?.message || 'Gagal menghubungi layanan konsultan.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestedLayout = (items: SuggestedLayoutItem[]) => {
    if (!items || items.length === 0) return;
    const categoryColorMap: Record<string, string> = {
      seating: '#CBD5E1',
      table: '#E2E8F0',
      storage: '#D6D3D1',
      bed: '#E2E8F0',
      workspace: '#E2E8F0',
      lighting: '#FEF3C7',
      decor: '#F1F5F9',
    };

    const nextFurniture: PlacedFurniture[] = items.map((item, idx) => {
      const rot = ([0, 90, 180, 270].includes(item.rotationDeg)
        ? item.rotationDeg
        : 0) as 0 | 90 | 180 | 270;
      const isRotated = rot === 90 || rot === 270;
      const effW = isRotated ? item.depthCm : item.widthCm;
      const effH = isRotated ? item.widthCm : item.depthCm;

      return {
        id: `ai-f-${Date.now()}-${idx}`,
        catalogId: item.category === 'decor' && item.isFloorOverlay ? 'rug-200x300' : item.category,
        name: item.name,
        category: item.category,
        xCm: Math.max(0, Math.min(room.widthCm - effW, Math.round(item.xCm))),
        yCm: Math.max(0, Math.min(room.lengthCm - effH, Math.round(item.yCm))),
        widthCm: Math.max(25, item.widthCm),
        depthCm: Math.max(25, item.depthCm),
        heightCm: Math.max(2, item.heightCm),
        rotationDeg: rot,
        material: item.material,
        priceIdr: item.estimatedPriceIdr || 1500000,
        isFloorOverlay: Boolean(item.isFloorOverlay),
        colorHex: categoryColorMap[item.category] || '#E2E8F0',
      };
    });

    setRoom((prev) => ({
      ...prev,
      furniture: nextFurniture,
      colors: report
        ? {
            dominant: {
              name: report.colorPalette603010.dominant.name,
              hex: report.colorPalette603010.dominant.hex,
              surface: report.colorPalette603010.dominant.surface,
            },
            secondary: {
              name: report.colorPalette603010.secondary.name,
              hex: report.colorPalette603010.secondary.hex,
              surface: report.colorPalette603010.secondary.surface,
            },
            accent: {
              name: report.colorPalette603010.accent.name,
              hex: report.colorPalette603010.accent.hex,
              surface: report.colorPalette603010.accent.surface,
            },
          }
        : prev.colors,
    }));

    setSelectedId(nextFurniture[0]?.id || null);
    setToastMessage('Tata letak & palet rekomendasi AI diterapkan ke denah 2D.');
    const canvasEl = document.getElementById('denah-2d');
    if (canvasEl) canvasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSendChat = async (question: string) => {
    const nowLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const userMsg: AdvisorChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: nowLabel,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          audit,
          reportSummary: report?.executiveSummary,
          history: chatMessages,
          question,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendapatkan jawaban.');
      }
      const aiMsg: AdvisorChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: AdvisorChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: `Terjadi kendala: ${err?.message || 'Silakan coba kembali.'}`,
        timestamp: nowLabel,
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const lines = [
      `# Brief Desain Interior Sistematis — ${room.name}`,
      `- Dimensi: ${(room.widthCm / 100).toFixed(2)} m × ${(room.lengthCm / 100).toFixed(2)} m (${audit.areaSqM} m²) · Plafon ${(room.ceilingCm / 100).toFixed(2)} m`,
      `- Gaya: ${room.style} · Tier Anggaran: ${room.budgetTier}`,
      '',
      '## Ringkasan Arsitektural',
      report.executiveSummary,
      '',
      '## 01. Tata Letak & Sirkulasi',
      `- Zonasi: ${report.spatialAndCirculation.zoningStrategy}`,
      `- Titik Fokus: ${report.spatialAndCirculation.focalPoint}`,
      `- Sirkulasi: ${report.spatialAndCirculation.circulationAssessment}`,
      ...report.spatialAndCirculation.clearanceFixes.map((f) => `- Perbaikan: ${f}`),
      '',
      '## 02. Spesifikasi Perabotan',
      ...report.furniturePlan.map(
        (f) =>
          `- **${f.name}** (${f.quantity}x) · ${f.idealDimensionsCm.w}×${f.idealDimensionsCm.d}×${f.idealDimensionsCm.h} cm · ${f.materialSpec} · ${formatIdr(f.estimatedPriceIdr * f.quantity)}`
      ),
      '',
      '## 03. Sistem Warna 60-30-10',
      `- 60% Dominan: ${report.colorPalette603010.dominant.name} (${report.colorPalette603010.dominant.hex}) — ${report.colorPalette603010.dominant.surface}`,
      `- 30% Sekunder: ${report.colorPalette603010.secondary.name} (${report.colorPalette603010.secondary.hex}) — ${report.colorPalette603010.secondary.surface}`,
      `- 10% Aksen: ${report.colorPalette603010.accent.name} (${report.colorPalette603010.accent.hex}) — ${report.colorPalette603010.accent.surface}`,
      '',
      '## 04. Tata Cahaya 3-Lapis',
      `- Target Total: ${report.lighting3Layers.targetTotalLumens} lumens`,
      `- Ambient: ${report.lighting3Layers.ambient.fixture} (${report.lighting3Layers.ambient.lumens} lm, ${report.lighting3Layers.ambient.kelvin})`,
      `- Task: ${report.lighting3Layers.task.fixture} (${report.lighting3Layers.task.lumens} lm, ${report.lighting3Layers.task.kelvin})`,
      `- Accent: ${report.lighting3Layers.accent.fixture} (${report.lighting3Layers.accent.lumens} lm, ${report.lighting3Layers.accent.kelvin})`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-interior-${room.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#denah-2d"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            RuangKarya
          </a>

          {/* Zone 2: 4 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#denah-2d" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Denah 2D
            </a>
            <a href="#konsultan-ai" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Konsultan AI
            </a>
            <a href="#katalog-rab" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Katalog &amp; RAB
            </a>
            <a href="#standar-industri" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Standar Industri
            </a>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isAnalyzing ? 'Menganalisis…' : 'Analisis Ruangan'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-8">
        {/* Compact Room Config & Deterministic Metrics Strip */}
        <section id="denah-2d" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Template Ruang</label>
                <select
                  value={room.id}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="px-2.5 py-1.5 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                >
                  {ROOM_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Lebar (cm)</label>
                  <input
                    type="number"
                    min={200}
                    max={1200}
                    step={10}
                    value={room.widthCm}
                    onChange={(e) =>
                      handleUpdateRoom({
                        widthCm: Math.max(200, Math.min(1200, Number(e.target.value) || 200)),
                      })
                    }
                    className="w-24 px-2.5 py-1.5 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Panjang (cm)</label>
                  <input
                    type="number"
                    min={200}
                    max={1200}
                    step={10}
                    value={room.lengthCm}
                    onChange={(e) =>
                      handleUpdateRoom({
                        lengthCm: Math.max(200, Math.min(1200, Number(e.target.value) || 200)),
                      })
                    }
                    className="w-24 px-2.5 py-1.5 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Plafon (cm)</label>
                  <input
                    type="number"
                    min={220}
                    max={500}
                    step={5}
                    value={room.ceilingCm}
                    onChange={(e) =>
                      handleUpdateRoom({
                        ceilingCm: Math.max(220, Math.min(500, Number(e.target.value) || 220)),
                      })
                    }
                    className="w-20 px-2.5 py-1.5 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Unboxed Live Quantitative Summary */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>
                Luas <strong className="font-mono tabular-nums text-slate-900">{audit.areaSqM} m²</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Okupansi Lantai{' '}
                <strong className="font-mono tabular-nums text-slate-900">{audit.fillRatioPercent}%</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Target Cahaya{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {audit.lighting.recommendedLumens.toLocaleString('id-ID')} lm
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Perabot{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {formatIdr(audit.totalBudgetIdr)}
                </strong>
              </span>
            </div>
          </div>

          {toastMessage && (
            <div className="px-4 py-2 bg-slate-900 text-white text-xs rounded-md flex items-center justify-between no-print">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-300 hover:text-white ml-4"
              >
                Tutup
              </button>
            </div>
          )}

          {/* 2-Column Studio Split: 2D Blueprint + Ergonomic Audit (Left) / Inspector Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <BlueprintCanvas
                room={room}
                audit={audit}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdateFurniture={handleUpdateFurniture}
                onRotateSelected={handleRotateSelected}
                onDuplicateSelected={handleDuplicateSelected}
                onDeleteSelected={handleDeleteSelected}
                onResetRoom={handleResetRoom}
                onAddOpening={handleAddOpening}
                onRemoveOpening={handleRemoveOpening}
              />

              {/* Real-Time Ergonomic Audit Strip */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Audit Ergonomi &amp; Sirkulasi Real-Time
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                    <span className="text-emerald-700">{audit.nominalCount} Nominal</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700">{audit.warningCount} Perhatian</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-red-700">{audit.criticalCount} Kritis</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {audit.findings.length === 0 ? (
                    <div className="px-4 py-5 text-xs text-slate-500">
                      Tambahkan perabot ke denah untuk memulai verifikasi jarak sirkulasi dan standar ergonomi.
                    </div>
                  ) : (
                    audit.findings.map((finding) => {
                      const Icon =
                        finding.severity === 'critical'
                          ? XCircle
                          : finding.severity === 'warning'
                            ? AlertTriangle
                            : CheckCircle2;
                      const iconColor =
                        finding.severity === 'critical'
                          ? 'text-red-600'
                          : finding.severity === 'warning'
                            ? 'text-amber-600'
                            : 'text-emerald-600';
                      const statusLabel =
                        finding.severity === 'critical'
                          ? 'Kritis'
                          : finding.severity === 'warning'
                            ? 'Perhatian'
                            : 'Nominal';

                      return (
                        <button
                          key={finding.id}
                          type="button"
                          onClick={() => {
                            if (finding.affectedIds[0]) {
                              setSelectedId(finding.affectedIds[0]);
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-semibold text-slate-900">{finding.rule}</span>
                                <span className={iconColor}>{statusLabel}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">{finding.message}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs font-mono tabular-nums shrink-0">
                            <p className="font-medium text-slate-900">{finding.measuredLabel}</p>
                            <p className="text-slate-400">Std: {finding.standardLabel}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 no-print">
              <InspectorPanel
                room={room}
                selectedItem={selectedItem}
                photoPreviewUrl={photoPreviewUrl}
                onAddFurniture={handleAddFurniture}
                onUpdateFurniture={handleUpdateFurniture}
                onUpdateRoom={handleUpdateRoom}
                onSelectStyle={handleSelectStyle}
                onUploadPhoto={handleUploadPhoto}
                onClearPhoto={handleClearPhoto}
              />
            </div>
          </div>
        </section>

        {/* Systematic AI Interior & Furniture Advisory */}
        <AdvisorySection
          report={report}
          isLoading={isAnalyzing}
          error={analyzeError}
          onRunAnalysis={handleRunAnalysis}
          onApplySuggestedLayout={handleApplySuggestedLayout}
          chatMessages={chatMessages}
          isChatLoading={isChatLoading}
          onSendChat={handleSendChat}
          onExportMarkdown={handleExportMarkdown}
        />

        {/* Bill of Quantities / RAB */}
        <CatalogRabSection room={room} audit={audit} />

        {/* Industry Minimum Standards & Benchmarks */}
        <IndustryBenchmarkSection />
      </main>

      {/* Quiet Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8 no-print">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>RuangKarya · Perancang Denah Berskala &amp; Konsultan Interior Sistematis</span>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#denah-2d" className="hover:text-slate-900">
              Denah 2D
            </a>
            <a href="#konsultan-ai" className="hover:text-slate-900">
              Konsultan AI
            </a>
            <a href="#standar-industri" className="hover:text-slate-900">
              Standar Industri
            </a>
            <a
              href="/api/download-bundle"
              download="ruangkarya-vscode-github.zip"
              className="text-blue-700 font-medium hover:underline"
            >
              Unduh Bundle VS Code (.zip)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
