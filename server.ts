import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createProjectZipBuffer } from './server/zipBundle.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada environment server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const advisoryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: 'Ringkasan arsitektural kondisi ruangan saat ini dan strategi desain utama dalam 2-3 kalimat.',
    },
    spatialAndCirculation: {
      type: Type.OBJECT,
      properties: {
        zoningStrategy: { type: Type.STRING, description: 'Strategi pembagian zona fungsi di dalam dimensi ruangan.' },
        focalPoint: { type: Type.STRING, description: 'Titik fokus visual utama dan orientasi perabot terhadap jendela/pintu.' },
        circulationAssessment: { type: Type.STRING, description: 'Evaluasi jalur sirkulasi utama (minimal 90 cm) dan ergonomi.' },
        clearanceFixes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Daftar perbaikan jarak spesifik untuk perabot yang terdeteksi bermasalah atau belum optimal.',
        },
      },
      required: ['zoningStrategy', 'focalPoint', 'circulationAssessment', 'clearanceFixes'],
    },
    furniturePlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          idealDimensionsCm: {
            type: Type.OBJECT,
            properties: {
              w: { type: Type.INTEGER },
              d: { type: Type.INTEGER },
              h: { type: Type.INTEGER },
            },
            required: ['w', 'd', 'h'],
          },
          quantity: { type: Type.INTEGER },
          placementRule: { type: Type.STRING },
          materialSpec: { type: Type.STRING },
          estimatedPriceIdr: { type: Type.INTEGER },
          priority: { type: Type.STRING, description: 'Harus salah satu dari: Wajib, Disarankan, Opsional' },
        },
        required: [
          'name',
          'category',
          'idealDimensionsCm',
          'quantity',
          'placementRule',
          'materialSpec',
          'estimatedPriceIdr',
          'priority',
        ],
      },
    },
    colorPalette603010: {
      type: Type.OBJECT,
      properties: {
        dominant: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hex: { type: Type.STRING },
            surface: { type: Type.STRING },
            ratio: { type: Type.STRING },
          },
          required: ['name', 'hex', 'surface', 'ratio'],
        },
        secondary: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hex: { type: Type.STRING },
            surface: { type: Type.STRING },
            ratio: { type: Type.STRING },
          },
          required: ['name', 'hex', 'surface', 'ratio'],
        },
        accent: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hex: { type: Type.STRING },
            surface: { type: Type.STRING },
            ratio: { type: Type.STRING },
          },
          required: ['name', 'hex', 'surface', 'ratio'],
        },
        materialHarmonyNote: { type: Type.STRING },
      },
      required: ['dominant', 'secondary', 'accent', 'materialHarmonyNote'],
    },
    lighting3Layers: {
      type: Type.OBJECT,
      properties: {
        targetTotalLumens: { type: Type.INTEGER },
        ambient: {
          type: Type.OBJECT,
          properties: {
            fixture: { type: Type.STRING },
            kelvin: { type: Type.STRING },
            lumens: { type: Type.INTEGER },
            placement: { type: Type.STRING },
          },
          required: ['fixture', 'kelvin', 'lumens', 'placement'],
        },
        task: {
          type: Type.OBJECT,
          properties: {
            fixture: { type: Type.STRING },
            kelvin: { type: Type.STRING },
            lumens: { type: Type.INTEGER },
            placement: { type: Type.STRING },
          },
          required: ['fixture', 'kelvin', 'lumens', 'placement'],
        },
        accent: {
          type: Type.OBJECT,
          properties: {
            fixture: { type: Type.STRING },
            kelvin: { type: Type.STRING },
            lumens: { type: Type.INTEGER },
            placement: { type: Type.STRING },
          },
          required: ['fixture', 'kelvin', 'lumens', 'placement'],
        },
        daylightStrategy: { type: Type.STRING },
      },
      required: ['targetTotalLumens', 'ambient', 'task', 'accent', 'daylightStrategy'],
    },
    acousticsVentilationDecor: {
      type: Type.OBJECT,
      properties: {
        textileAndAcoustic: { type: Type.STRING },
        greeneryRecommendation: { type: Type.STRING },
        wallArtRule: { type: Type.STRING },
        airflowNote: { type: Type.STRING },
      },
      required: ['textileAndAcoustic', 'greeneryRecommendation', 'wallArtRule', 'airflowNote'],
    },
    phasedActionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          title: { type: Type.STRING },
          actionItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          estimatedCostIdr: { type: Type.INTEGER },
        },
        required: ['phase', 'title', 'actionItems', 'estimatedCostIdr'],
      },
    },
    suggestedLayoutCoords: {
      type: Type.ARRAY,
      description: 'Koordinat denah 2D optimal dalam satuan cm yang muat di dalam ruangan (xCm, yCm) tanpa menabrak pintu atau keluar dinding.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, description: 'seating | table | storage | bed | workspace | lighting | decor' },
          widthCm: { type: Type.INTEGER },
          depthCm: { type: Type.INTEGER },
          heightCm: { type: Type.INTEGER },
          xCm: { type: Type.INTEGER },
          yCm: { type: Type.INTEGER },
          rotationDeg: { type: Type.INTEGER, description: '0, 90, 180, atau 270' },
          material: { type: Type.STRING },
          estimatedPriceIdr: { type: Type.INTEGER },
          isFloorOverlay: { type: Type.BOOLEAN },
        },
        required: [
          'name',
          'category',
          'widthCm',
          'depthCm',
          'heightCm',
          'xCm',
          'yCm',
          'rotationDeg',
          'material',
          'estimatedPriceIdr',
          'isFloorOverlay',
        ],
      },
    },
  },
  required: [
    'executiveSummary',
    'spatialAndCirculation',
    'furniturePlan',
    'colorPalette603010',
    'lighting3Layers',
    'acousticsVentilationDecor',
    'phasedActionPlan',
    'suggestedLayoutCoords',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/download-bundle', (_req, res) => {
    try {
      const zipBuffer = createProjectZipBuffer(__dirname);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="ruangkarya-vscode-github.zip"');
      res.setHeader('Content-Length', zipBuffer.length);
      return res.send(zipBuffer);
    } catch (error: any) {
      console.error('Error /api/download-bundle:', error);
      return res.status(500).json({ error: 'Gagal membuat bundle ZIP proyek.' });
    }
  });

  app.post('/api/advisor/analyze', async (req, res) => {
    try {
      const { room, audit, photoBase64, photoMimeType } = req.body;
      if (!room || !audit) {
        return res.status(400).json({ error: 'Data konfigurasi ruangan dan audit ergonomi wajib dikirim.' });
      }

      const ai = getAiClient();

      const promptText = `Anda adalah Arsitek Interior Senior dan Konsultan Tata Ruang Sistematis.
Analisislah profil ruangan, denah 2D saat ini, bukaan pintu/jendela, serta hasil audit ergonomi berikut, lalu berikan rekomendasi desain interior dan perabotan yang sangat terstruktur, terukur dalam satuan metrik (cm, m², lumen, Kelvin, IDR), dan realistis.

DATA RUANGAN:
- Nama Proyek: ${room.name}
- Fungsi Ruangan: ${room.roomType}
- Dimensi: Lebar (X) = ${room.widthCm} cm, Panjang (Y) = ${room.lengthCm} cm, Plafon = ${room.ceilingCm} cm (Luas = ${audit.areaSqM} m²)
- Gaya Target: ${room.style}
- Orientasi Jendela Utama: ${room.orientation}
- Tier Anggaran: ${room.budgetTier}
- Jumlah Penghuni/Pengguna: ${room.occupants} orang
- Material Dinding Saat Ini: ${room.wallFinish}
- Material Lantai Saat Ini: ${room.floorMaterial}
- Catatan Kebutuhan Pengguna: ${room.notes || 'Tidak ada catatan tambahan'}

BUKAAN ARSITEKTURAL (Pintu & Jendela):
${JSON.stringify(room.openings, null, 2)}

PERABOT TERPASANG DI DENAH SAAT INI:
${JSON.stringify(
  room.furniture.map((f: any) => ({
    name: f.name,
    category: f.category,
    xCm: f.xCm,
    yCm: f.yCm,
    widthCm: f.widthCm,
    depthCm: f.depthCm,
    rotationDeg: f.rotationDeg,
    material: f.material,
  })),
  null,
  2
)}

HASIL AUDIT ERGONOMI DETERMINISTIK:
- Okupansi Lantai: ${audit.fillRatioPercent}%
- Target Pencahayaan: ${audit.lighting.recommendedLumens} lumens (${audit.lighting.kelvinRange})
- Temuan Saat Ini:
${audit.findings.map((f: any) => `  * [${f.severity.toUpperCase()}] ${f.rule}: ${f.measuredLabel} (Standar: ${f.standardLabel}) -> ${f.message}`).join('\n')}

INSTRUKSI KHUSUS:
1. Berikan seluruh jawaban dalam Bahasa Indonesia profesional yang lugas dan mudah dieksekusi.
2. Tema warna interior WAJIB serba Baby Pink yang harmonis: gunakan gradasi baby pink lembut (#FCE7F3 / #FDF2F8) untuk 60% dominan (dinding/plafon/lantai), blush/pastel pink (#FBCFE8 / #FAD2E1) untuk 30% sekunder (perabot utama & tekstil), dan dusty/rose baby pink (#F9A8D4 / #F472B6) untuk 10% aksen. Pastikan materialSpec juga mencerminkan nuansa baby pink.
3. Pada bagian suggestedLayoutCoords, rancang koordinat denah 2D optimal dalam batas 0 <= xCm <= ${room.widthCm} dan 0 <= yCm <= ${room.lengthCm}, pastikan tidak ada perabot solid yang menabrak satu sama lain atau menghalangi area ayunan pintu (${JSON.stringify(room.openings.filter((o: any) => o.type === 'door'))}). Untuk karpet, set isFloorOverlay: true.
4. Pastikan estimasi harga realistis dalam Rupiah (IDR) sesuai tier anggaran ${room.budgetTier}.
5. Jika foto ruangan dilampirkan, analisis pula kondisi pencahayaan, proporsi dinding, dan tekstur aktual pada foto tersebut.`;

      const contents = photoBase64
        ? {
            parts: [
              {
                inlineData: {
                  mimeType: photoMimeType || 'image/jpeg',
                  data: photoBase64,
                },
              },
              { text: promptText },
            ],
          }
        : promptText;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction:
            'Anda adalah konsultan desain interior sistematis berbasis standar ergonomi internasional, aturan warna 60-30-10, dan tata cahaya 3-lapis. Kembalikan output JSON murni sesuai skema.',
          responseMimeType: 'application/json',
          responseSchema: advisoryResponseSchema,
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return res.json({ report: parsed });
    } catch (error: any) {
      console.error('Error /api/advisor/analyze:', error);
      const status = error?.status || 500;
      const msg =
        status === 403 || status === 400
          ? 'Konfigurasi API key Gemini bermasalah atau kuota tidak valid. Periksa panel Settings > Secrets.'
          : status === 429
            ? 'Batas permintaan API tercapai sementara. Silakan coba beberapa saat lagi.'
            : error?.message || 'Gagal menganalisis ruangan.';
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: msg });
    }
  });

  app.post('/api/advisor/chat', async (req, res) => {
    try {
      const { room, audit, reportSummary, history, question } = req.body;
      if (!question || !room) {
        return res.status(400).json({ error: 'Pertanyaan dan konteks ruangan wajib diisi.' });
      }

      const ai = getAiClient();

      const contextPreamble = `Konteks Ruangan Aktif:
- Ruangan: ${room.name} (${room.roomType}), ${room.widthCm}×${room.lengthCm} cm (${audit?.areaSqM ?? '?'} m²), Plafon ${room.ceilingCm} cm
- Gaya: ${room.style}, Anggaran: ${room.budgetTier}, Orientasi: ${room.orientation}
- Perabot di Denah: ${(room.furniture || []).map((f: any) => `${f.name} (${f.widthCm}×${f.depthCm}cm di x:${f.xCm},y:${f.yCm})`).join('; ')}
- Masalah Ergonomi Terdeteksi: ${(audit?.findings || []).filter((f: any) => f.severity !== 'nominal').map((f: any) => f.message).join(' | ') || 'Tidak ada masalah kritis'}
${reportSummary ? `- Ringkasan Konsultasi Sebelumnya: ${reportSummary}` : ''}`;

      const formattedHistory = (history || [])
        .slice(-6)
        .map((m: any) => `${m.role === 'user' ? 'Pengguna' : 'Konsultan'}: ${m.text}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `${contextPreamble}\n\nRiwayat Tanya Jawab:\n${formattedHistory}\n\nPertanyaan Baru Pengguna: ${question}`,
        config: {
          systemInstruction:
            'Anda adalah Arsitek Interior Senior RuangKarya. Jawab pertanyaan lanjutan pengguna secara sistematis, ringkas, berbasis angka ukuran (cm/meter/lumen/Kelvin/IDR), dan merujuk langsung pada kondisi denah aktif mereka. Gunakan Bahasa Indonesia yang jelas dengan poin terstruktur bila perlu.',
        },
      });

      return res.json({ answer: response.text ?? 'Maaf, tidak ada respons yang dapat dihasilkan.' });
    } catch (error: any) {
      console.error('Error /api/advisor/chat:', error);
      return res.status(500).json({ error: error?.message || 'Gagal memproses pertanyaan lanjutan.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RuangKarya server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
