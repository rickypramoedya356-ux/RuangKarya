import React from 'react';
import { Check } from 'lucide-react';

const BENCHMARK_APPS = [
  {
    app: 'Planner 5D',
    focus: 'Denah 2D/3D berskala & pengenalan tata letak',
    adoptedStandard:
      'Kanvas denah metrik berskala tepat (cm/m), rotasi 90°, snap grid presisi 10 cm, serta bukaan pintu dan jendela.',
  },
  {
    app: 'Homestyler',
    focus: 'Katalog perabot berdimensi riil & materi tekstur',
    adoptedStandard:
      'Katalog perabot standar industri lengkap dengan dimensi P×L×T, spesifikasi material, dan kalkulasi RAB otomatis.',
  },
  {
    app: 'RoomGPT',
    focus: 'Transformasi gaya visual cepat dari foto ruangan',
    adoptedStandard:
      'Dukungan unggah foto ruangan aktual untuk dievaluasi AI beserta referensi gaya visual Japandi, Modern, Skandinavia, dan Tropis.',
  },
  {
    app: 'IKEA Kreativ',
    focus: 'Kesesuaian skala belanja nyata & tata letak fungsional',
    adoptedStandard:
      'Estimasi anggaran per item dalam Rupiah, prioritas belanja bertahap (Wajib/Disarankan/Opsional), dan daftar spesifikasi siap beli.',
  },
];

const MINIMUM_STANDARDS = [
  {
    category: 'Sirkulasi & Pintu',
    spec: 'Jalur utama 90–120 cm · Jalur sekunder min. 60 cm · Radius ayunan pintu bebas hambatan',
  },
  {
    category: 'Ergonomi Ruang Tamu',
    spec: 'Jarak sofa–meja kopi 35–45 cm · Panjang meja kopi ±2/3 sofa · Jarak pandang TV 1.5–2.5× diagonal layar',
  },
  {
    category: 'Ergonomi Tidur & Makan',
    spec: 'Sisi ranjang min. 60 cm · Ujung kaki min. 75 cm · Ruang tarik kursi makan min. 90 cm · Bukaan lemari 80 cm',
  },
  {
    category: 'Aturan Warna & Cahaya',
    spec: 'Distribusi warna 60% Dominan / 30% Sekunder / 10% Aksen · Pencahayaan 3-Lapis (Ambient, Task, Accent) berbasis lumen/m²',
  },
];

export const IndustryBenchmarkSection: React.FC = () => {
  return (
    <section id="standar-industri" className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">
          Standar Minimum Aplikasi Room Design &amp; Ergonomi Interior
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Sintesis fitur wajib dari aplikasi desain interior terkemuka dan standar ergonomi arsitektural internasional yang diterapkan pada RuangKarya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Comparative App Standards */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Tolok Ukur Aplikasi Sejenis di Industri
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
            {BENCHMARK_APPS.map((item) => (
              <div key={item.app} className="p-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{item.app}</span>
                  <span className="text-xs text-slate-500">{item.focus}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
                  <span>{item.adoptedStandard}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quantitative Minimum Ergonomic Rules */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Parameter Verifikasi Ergonomi &amp; Tata Cahaya Aktif
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
            {MINIMUM_STANDARDS.map((std) => (
              <div key={std.category} className="p-3.5 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{std.category}</p>
                <p className="text-xs text-slate-600 font-mono leading-relaxed">{std.spec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
