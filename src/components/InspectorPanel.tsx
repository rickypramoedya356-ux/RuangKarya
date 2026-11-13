import React, { useState } from 'react';
import { Plus, Upload, X, Check } from 'lucide-react';
import {
  BudgetTier,
  FurnitureCatalogItem,
  FurnitureCategory,
  Orientation,
  PlacedFurniture,
  RoomConfig,
  RoomType,
  StylePresetId,
} from '../types/room';
import { FURNITURE_CATALOG, STYLE_PRESETS, formatIdr } from '../data/catalog';

interface InspectorPanelProps {
  room: RoomConfig;
  selectedItem: PlacedFurniture | null;
  photoPreviewUrl: string | null;
  onAddFurniture: (item: FurnitureCatalogItem) => void;
  onUpdateFurniture: (id: string, patch: Partial<PlacedFurniture>) => void;
  onUpdateRoom: (patch: Partial<RoomConfig>) => void;
  onSelectStyle: (styleId: StylePresetId) => void;
  onUploadPhoto: (file: File) => void;
  onClearPhoto: () => void;
}

const CATEGORY_LABELS: Array<{ id: FurnitureCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'seating', label: 'Duduk' },
  { id: 'table', label: 'Meja' },
  { id: 'bed', label: 'Tidur' },
  { id: 'storage', label: 'Simpan' },
  { id: 'workspace', label: 'Kerja' },
  { id: 'lighting', label: 'Lampu' },
  { id: 'decor', label: 'Dekor' },
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  room,
  selectedItem,
  photoPreviewUrl,
  onAddFurniture,
  onUpdateFurniture,
  onUpdateRoom,
  onSelectStyle,
  onUploadPhoto,
  onClearPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'furniture' | 'style' | 'profile'>('furniture');
  const [catFilter, setCatFilter] = useState<FurnitureCategory | 'all'>('all');

  const filteredCatalog =
    catFilter === 'all'
      ? FURNITURE_CATALOG
      : FURNITURE_CATALOG.filter((item) => item.category === catFilter);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
    }
  };

  return (
    <aside className="bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
      {/* Segmented Control */}
      <div className="p-2 border-b border-slate-200 bg-slate-50/70">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-md">
          <button
            type="button"
            onClick={() => setActiveTab('furniture')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'furniture'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perabot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'style'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gaya & Warna
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profil & Foto
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-5 overflow-y-auto max-h-[620px]">
        {activeTab === 'furniture' && (
          <>
            {selectedItem && (
              <div className="pb-4 border-b border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Properti Perabot Terpilih</h3>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {formatIdr(selectedItem.priceIdr)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nama Item</label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    onChange={(e) => onUpdateFurniture(selectedItem.id, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Lebar (cm)</label>
                    <input
                      type="number"
                      min={20}
                      max={400}
                      value={selectedItem.widthCm}
                      onChange={(e) =>
                        onUpdateFurniture(selectedItem.id, {
                          widthCm: Math.max(20, Number(e.target.value) || 20),
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Dalam (cm)</label>
                    <input
                      type="number"
                      min={20}
                      max={400}
                      value={selectedItem.depthCm}
                      onChange={(e) =>
                        onUpdateFurniture(selectedItem.id, {
                          depthCm: Math.max(20, Number(e.target.value) || 20),
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tinggi (cm)</label>
                    <input
                      type="number"
                      min={2}
                      max={280}
                      value={selectedItem.heightCm}
                      onChange={(e) =>
                        onUpdateFurniture(selectedItem.id, {
                          heightCm: Math.max(2, Number(e.target.value) || 2),
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Material & Finishing</label>
                  <input
                    type="text"
                    value={selectedItem.material}
                    onChange={(e) => onUpdateFurniture(selectedItem.id, { material: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Catalog Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Katalog Perabot Standar</h3>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {filteredCatalog.length} item
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {CATEGORY_LABELS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatFilter(cat.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                      catFilter === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {filteredCatalog.map((item) => (
                  <div
                    key={item.catalogId}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        {item.widthCm}×{item.depthCm}×{item.heightCm} cm · {formatIdr(item.priceIdr)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddFurniture(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Referensi Gaya Interior</h3>
              <div className="grid grid-cols-1 gap-3">
                {STYLE_PRESETS.map((preset) => {
                  const isActive = room.style === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectStyle(preset.id)}
                      className={`text-left border rounded-md overflow-hidden transition-colors ${
                        isActive
                          ? 'border-blue-600 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                        <img
                          src={preset.imageUrl}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isActive && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-3 bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">{preset.name}</span>
                          <span className="text-xs font-mono text-slate-500">{preset.kelvinHint.split(' ')[0]}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{preset.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 60-30-10 Color Rule Editor */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Aturan Warna 60-30-10</h3>
                <span className="text-xs text-slate-500">Proporsi Visual</span>
              </div>

              {/* Visual 60-30-10 bar */}
              <div className="h-3 w-full rounded overflow-hidden flex border border-slate-200">
                <div style={{ width: '60%', backgroundColor: room.colors.dominant.hex }} title="60% Dominan" />
                <div style={{ width: '30%', backgroundColor: room.colors.secondary.hex }} title="30% Sekunder" />
                <div style={{ width: '10%', backgroundColor: room.colors.accent.hex }} title="10% Aksen" />
              </div>

              <div className="space-y-2.5 text-xs">
                {(
                  [
                    { key: 'dominant', ratio: '60% Dominan' },
                    { key: 'secondary', ratio: '30% Sekunder' },
                    { key: 'accent', ratio: '10% Aksen' },
                  ] as const
                ).map(({ key, ratio }) => {
                  const swatch = room.colors[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="color"
                          value={swatch.hex}
                          onChange={(e) =>
                            onUpdateRoom({
                              colors: {
                                ...room.colors,
                                [key]: { ...swatch, hex: e.target.value },
                              },
                            })
                          }
                          aria-label={ratio}
                          className="w-7 h-7 rounded border border-slate-200 cursor-pointer shrink-0 bg-white p-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{swatch.name}</p>
                          <p className="text-slate-500 truncate">{swatch.surface}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-600 shrink-0">{ratio}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Finishing Dinding</label>
                  <input
                    type="text"
                    value={room.wallFinish}
                    onChange={(e) => onUpdateRoom({ wallFinish: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Material Lantai</label>
                  <input
                    type="text"
                    value={room.floorMaterial}
                    onChange={(e) => onUpdateRoom({ floorMaterial: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nama Proyek Ruangan</label>
              <input
                type="text"
                value={room.name}
                onChange={(e) => onUpdateRoom({ name: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fungsi Ruang</label>
                <select
                  value={room.roomType}
                  onChange={(e) => onUpdateRoom({ roomType: e.target.value as RoomType })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="living">Ruang Tamu / Keluarga</option>
                  <option value="bedroom">Kamar Tidur</option>
                  <option value="workspace">Ruang Kerja / WFH</option>
                  <option value="dining">Ruang Makan</option>
                  <option value="studio">Apartemen Studio</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Arah Jendela Utama</label>
                <select
                  value={room.orientation}
                  onChange={(e) => onUpdateRoom({ orientation: e.target.value as Orientation })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="Utara">Utara (Cahaya Merata)</option>
                  <option value="Timur">Timur (Matahari Pagi)</option>
                  <option value="Selatan">Selatan (Teduh)</option>
                  <option value="Barat">Barat (Panas Sore)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tier Anggaran</label>
                <select
                  value={room.budgetTier}
                  onChange={(e) => onUpdateRoom({ budgetTier: e.target.value as BudgetTier })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="Ekonomis">Ekonomis</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Jumlah Pengguna</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={room.occupants}
                  onChange={(e) => onUpdateRoom({ occupants: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Kebutuhan Khusus & Aktivitas</label>
              <textarea
                rows={3}
                value={room.notes}
                onChange={(e) => onUpdateRoom({ notes: e.target.value })}
                placeholder="Misal: perlu ruang kerja lipat, ramah anak kecil, atau banyak koleksi buku..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Optional Existing Room Photo Upload */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-900 mb-1">
                Foto Kondisi Ruangan Saat Ini (Opsional)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Unggah foto ruangan agar Konsultan AI dapat mengevaluasi pencahayaan & proporsi aktual.
              </p>

              {photoPreviewUrl ? (
                <div className="relative border border-slate-200 rounded overflow-hidden">
                  <img
                    src={photoPreviewUrl}
                    alt="Pratinjau foto ruangan"
                    referrerPolicy="no-referrer"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={onClearPhoto}
                    aria-label="Hapus foto"
                    className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded hover:bg-slate-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 px-3 py-4 border border-dashed border-slate-300 rounded cursor-pointer hover:bg-slate-50 transition-colors text-xs text-slate-600">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Pilih foto ruangan (JPG / PNG)</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
