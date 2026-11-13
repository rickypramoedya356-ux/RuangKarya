import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Layers,
  Printer,
  Send,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';
import {
  AdvisorChatMessage,
  SuggestedLayoutItem,
  SystematicAdvisoryReport,
} from '../types/room';
import { formatIdr } from '../data/catalog';

interface AdvisorySectionProps {
  report: SystematicAdvisoryReport | null;
  isLoading: boolean;
  error: string | null;
  onRunAnalysis: () => void;
  onApplySuggestedLayout: (items: SuggestedLayoutItem[]) => void;
  chatMessages: AdvisorChatMessage[];
  isChatLoading: boolean;
  onSendChat: (question: string) => void;
  onExportMarkdown: () => void;
}

export const AdvisorySection: React.FC<AdvisorySectionProps> = ({
  report,
  isLoading,
  error,
  onRunAnalysis,
  onApplySuggestedLayout,
  chatMessages,
  isChatLoading,
  onSendChat,
  onExportMarkdown,
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isChatLoading) return;
    onSendChat(trimmed);
    setQuestion('');
  };

  return (
    <section id="konsultan-ai" className="bg-white border border-pink-200/80 rounded-lg overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-pink-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Konsultan Interior &amp; Perabotan Sistematis
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Rekomendasi terstruktur mencakup tata letak, dimensi perabot, palet 60-30-10, tata cahaya 3-lapis, dan rencana anggaran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {report && (
            <>
              <button
                type="button"
                onClick={() => onApplySuggestedLayout(report.suggestedLayoutCoords)}
                disabled={!report.suggestedLayoutCoords?.length}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors whitespace-nowrap shrink-0"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Terapkan Tata Letak AI ke Denah</span>
              </button>
              <button
                type="button"
                onClick={onExportMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Brief (.md)</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-pink-700 rounded-md hover:bg-pink-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Menyusun Analisis…' : report ? 'Analisis Ulang Ruangan' : 'Mulai Analisis Sistematis'}</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-6 mt-5 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="font-medium">Analisis tidak dapat diselesaikan</p>
            <p className="text-xs mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-6 space-y-6 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="h-28 bg-slate-100 rounded" />
            <div className="h-28 bg-slate-100 rounded" />
            <div className="h-28 bg-slate-100 rounded" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!report && !isLoading && (
        <div className="px-6 py-12 text-center max-w-xl mx-auto">
          <p className="text-base font-medium text-slate-900">
            Siap Menyusun Rekomendasi Interior Sistematis
          </p>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Atur ukuran ruangan, letakkan perabot pada denah 2D di atas, pilih gaya yang diinginkan, lalu tekan{' '}
            <strong className="font-medium text-slate-900">Analisis Ruangan</strong> untuk mendapatkan panduan arsitektural lengkap beserta koordinat tata letak optimal.
          </p>
          <button
            type="button"
            onClick={onRunAnalysis}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-700 rounded-md hover:bg-pink-800 transition-colors"
          >
            Mulai Analisis Sistematis
          </button>
        </div>
      )}

      {/* Populated Systematic Advisory Report */}
      {report && !isLoading && (
        <div className="divide-y divide-slate-200">
          {/* Executive Summary */}
          <div className="p-6 bg-slate-50/60">
            <p className="text-xs font-medium text-slate-500 mb-1.5">Ringkasan Arsitektural</p>
            <p className="text-sm md:text-base text-slate-800 leading-relaxed max-w-4xl">
              {report.executiveSummary}
            </p>
          </div>

          {/* 01. Tata Letak & Sirkulasi */}
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              01. Analisis Tata Letak, Zonasi &amp; Sirkulasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Strategi Zonasi</p>
                <p className="text-slate-700 leading-relaxed">{report.spatialAndCirculation.zoningStrategy}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Titik Fokus &amp; Orientasi</p>
                <p className="text-slate-700 leading-relaxed">{report.spatialAndCirculation.focalPoint}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Evaluasi Jalur Gerak</p>
                <p className="text-slate-700 leading-relaxed">{report.spatialAndCirculation.circulationAssessment}</p>
              </div>
            </div>

            {report.spatialAndCirculation.clearanceFixes?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-slate-500 mb-2">Koreksi Jarak &amp; Penempatan</p>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {report.spatialAndCirculation.clearanceFixes.map((fix, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-pink-700 mt-0.5 shrink-0" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 02. Spesifikasi Perabotan Ideal */}
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                02. Rekomendasi Perabotan, Dimensi &amp; Estimasi Harga
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                Total Estimasi Perabot: {formatIdr(report.furniturePlan.reduce((s, i) => s + i.estimatedPriceIdr * i.quantity, 0))}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    <th className="py-2.5 px-3 font-medium">Perabot</th>
                    <th className="py-2.5 px-3 font-medium">Dimensi Ideal (P×L×T)</th>
                    <th className="py-2.5 px-3 font-medium">Material &amp; Aturan Letak</th>
                    <th className="py-2.5 px-3 font-medium">Prioritas</th>
                    <th className="py-2.5 px-3 font-medium text-right">Estimasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.furniturePlan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 align-top">
                        <p className="font-medium text-slate-900">
                          {item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}
                        </p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </td>
                      <td className="py-3 px-3 align-top font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                        {item.idealDimensionsCm.w} × {item.idealDimensionsCm.d} × {item.idealDimensionsCm.h} cm
                      </td>
                      <td className="py-3 px-3 align-top text-xs text-slate-700 max-w-md">
                        <p className="font-medium text-slate-800">{item.materialSpec}</p>
                        <p className="text-slate-600 mt-0.5">{item.placementRule}</p>
                      </td>
                      <td className="py-3 px-3 align-top text-xs whitespace-nowrap">
                        <span
                          className={
                            item.priority === 'Wajib'
                              ? 'text-pink-700 font-semibold'
                              : item.priority === 'Disarankan'
                                ? 'text-slate-700 font-medium'
                                : 'text-slate-500'
                          }
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top text-right font-mono tabular-nums text-xs text-slate-900 whitespace-nowrap">
                        {formatIdr(item.estimatedPriceIdr * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 03. Palet Warna 60-30-10 & 04. Tata Cahaya 3-Lapis */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                03. Sistem Warna 60-30-10 &amp; Harmoni Material
              </h3>
              <div className="h-3.5 w-full rounded overflow-hidden flex border border-slate-200">
                <div style={{ width: '60%', backgroundColor: report.colorPalette603010.dominant.hex }} />
                <div style={{ width: '30%', backgroundColor: report.colorPalette603010.secondary.hex }} />
                <div style={{ width: '10%', backgroundColor: report.colorPalette603010.accent.hex }} />
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {[
                  report.colorPalette603010.dominant,
                  report.colorPalette603010.secondary,
                  report.colorPalette603010.accent,
                ].map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded border border-slate-200 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div>
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-slate-500">{c.surface}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums text-slate-600">
                      <p>{c.ratio}</p>
                      <p className="text-slate-400">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {report.colorPalette603010.materialHarmonyNote}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  04. Rekayasa Tata Cahaya 3-Lapis
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-600">
                  Target: {report.lighting3Layers.targetTotalLumens.toLocaleString('id-ID')} lm
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md text-xs">
                {[
                  { label: 'Lapis 1 · Ambient (Umum)', data: report.lighting3Layers.ambient },
                  { label: 'Lapis 2 · Task (Aktivitas)', data: report.lighting3Layers.task },
                  { label: 'Lapis 3 · Accent (Fokus)', data: report.lighting3Layers.accent },
                ].map((layer, idx) => (
                  <div key={idx} className="px-3 py-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{layer.label}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {layer.data.lumens.toLocaleString('id-ID')} lm · {layer.data.kelvin}
                      </span>
                    </div>
                    <p className="text-slate-700">{layer.data.fixture}</p>
                    <p className="text-slate-500">Penempatan: {layer.data.placement}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-medium text-slate-800">Pencahayaan Alami:</strong>{' '}
                {report.lighting3Layers.daylightStrategy}
              </p>
            </div>
          </div>

          {/* 05. Akustik, Ventilasi & Dekorasi */}
          <div className="p-6 space-y-3">
            <h3 className="text-base font-semibold text-slate-900">
              05. Akustik, Penghawaan &amp; Elemen Dekoratif
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs leading-relaxed">
              <div>
                <p className="font-medium text-slate-900 mb-1">Tekstil &amp; Akustik</p>
                <p className="text-slate-600">{report.acousticsVentilationDecor.textileAndAcoustic}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-1">Tanaman Indoor</p>
                <p className="text-slate-600">{report.acousticsVentilationDecor.greeneryRecommendation}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-1">Aturan Karya Dinding</p>
                <p className="text-slate-600">{report.acousticsVentilationDecor.wallArtRule}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-1">Sirkulasi Udara</p>
                <p className="text-slate-600">{report.acousticsVentilationDecor.airflowNote}</p>
              </div>
            </div>
          </div>

          {/* 06. Rencana Aksi Bertahap */}
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              06. Rencana Eksekusi Bertahap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {report.phasedActionPlan.map((phase, idx) => (
                <div key={idx} className="border border-slate-200 rounded-md p-4 bg-slate-50/40">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-pink-700">{phase.phase}</span>
                    <span className="text-xs font-mono tabular-nums text-slate-700">
                      {formatIdr(phase.estimatedCostIdr)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">{phase.title}</p>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {phase.actionItems.map((act, aIdx) => (
                      <li key={aIdx}>{act}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Follow-Up Architect Chat */}
          <div className="p-6 bg-slate-50/60 no-print">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Diskusi Lanjutan dengan Arsitek Interior
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tanyakan alternatif ukuran sofa, penyesuaian anggaran, jenis tirai, atau solusi penyimpanan khusus untuk denah di atas.
            </p>

            {chatMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-md text-sm max-w-3xl ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white ml-auto'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-1">
                      {msg.role === 'user' ? 'Anda' : 'Konsultan Interior'} · {msg.timestamp}
                    </p>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmitChat} className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Contoh: Bagaimana jika saya ingin menambah meja kerja lipat tanpa mempersempit akses pintu?"
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-pink-600"
              />
              <button
                type="submit"
                disabled={isChatLoading || !question.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isChatLoading ? 'Mengirim…' : 'Tanya'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
