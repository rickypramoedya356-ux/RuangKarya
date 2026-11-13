import React from 'react';
import { ErgonomicAuditResult, RoomConfig } from '../types/room';
import { formatIdr } from '../data/catalog';

interface CatalogRabSectionProps {
  room: RoomConfig;
  audit: ErgonomicAuditResult;
}

export const CatalogRabSection: React.FC<CatalogRabSectionProps> = ({ room, audit }) => {
  const estimatedLightingBudget = Math.round(audit.lighting.recommendedLumens * 380);
  const paintAreaSqM = Number(
    ((((room.widthCm + room.lengthCm) * 2) / 100) * (room.ceilingCm / 100) * 0.85).toFixed(1)
  );
  const estimatedPaintBudget = Math.round(paintAreaSqM * 48000);
  const grandTotal = audit.totalBudgetIdr + estimatedLightingBudget + estimatedPaintBudget;

  return (
    <section id="katalog-rab" className="bg-white border border-pink-200/80 rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-pink-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Rencana Anggaran Biaya (RAB) &amp; Spesifikasi Teknis
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Rekapitulasi otomatis berdasarkan perabot terpasang di denah 2D, kebutuhan pengecatan dinding, dan titik lampu.
          </p>
        </div>
        <div className="text-right font-mono tabular-nums">
          <p className="text-xs text-slate-500">Estimasi Total Proyek</p>
          <p className="text-lg font-semibold text-slate-900">{formatIdr(grandTotal)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
              <th className="py-2.5 px-6 font-medium">Komponen / Perabot</th>
              <th className="py-2.5 px-4 font-medium">Dimensi / Volume</th>
              <th className="py-2.5 px-4 font-medium">Material &amp; Catatan Teknis</th>
              <th className="py-2.5 px-6 font-medium text-right">Estimasi Biaya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {room.furniture.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-6 font-medium text-slate-900">{item.name}</td>
                <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                  {item.widthCm} × {item.depthCm} × {item.heightCm} cm
                </td>
                <td className="py-3 px-4 text-xs text-slate-600">{item.material}</td>
                <td className="py-3 px-6 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                  {formatIdr(item.priceIdr)}
                </td>
              </tr>
            ))}

            {room.furniture.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 px-6 text-center text-sm text-slate-500">
                  Belum ada perabot terpasang pada denah 2D. Tambahkan item dari tab Perabot untuk menghitung RAB.
                </td>
              </tr>
            )}

            <tr className="bg-slate-50/50">
              <td className="py-3 px-6 font-medium text-slate-900">Paket Tata Cahaya 3-Lapis</td>
              <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                {audit.lighting.recommendedLumens.toLocaleString('id-ID')} lm (~{audit.lighting.estimatedWattLed}W LED)
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">
                Ambient {audit.lighting.ambientLumens} lm · Task {audit.lighting.taskLumens} lm · Accent {audit.lighting.accentLumens} lm ({audit.lighting.kelvinRange})
              </td>
              <td className="py-3 px-6 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                {formatIdr(estimatedLightingBudget)}
              </td>
            </tr>

            <tr className="bg-slate-50/50">
              <td className="py-3 px-6 font-medium text-slate-900">Pengecatan &amp; Finishing Dinding</td>
              <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                ±{paintAreaSqM} m² bidang dinding
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{room.wallFinish}</td>
              <td className="py-3 px-6 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                {formatIdr(estimatedPaintBudget)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
