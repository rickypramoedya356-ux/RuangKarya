# UPG — Studio Perancang Ruang & Konsultan Interior Sistematis

Aplikasi web *full-stack* untuk merancang denah ruangan 2D metrik berskala, melakukan audit ergonomi & sirkulasi secara *real-time*, menghitung kebutuhan pencahayaan (Lumen/Kelvin) & warna (60-30-10), serta berkonsultasi dengan Arsitek Interior berbasis Gemini API.

## Prasyarat
- **Node.js** versi 20 atau lebih baru
- **npm** (atau bun/pnpm)
- **Gemini API Key** dari Google AI Studio

## Cara Menjalankan di VS Code (Lokal)

1. Ekstrak file `.zip` ini dan buka foldernya di **VS Code**:
   ```bash
   code .
   ```
2. Pasang seluruh dependensi:
   ```bash
   npm install
   ```
3. Salin `.env.example` menjadi `.env`, lalu isi `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY="MASUKKAN_API_KEY_ANDA"
   ```
4. Jalankan server pengembangan (*Express + Vite* pada port `3000`):
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser.

## Skrip Tersedia
- `npm run dev` — Menjalankan server pengembangan `server.ts` (Express + Vite HMR/middleware)
- `npm run lint` — Pemeriksaan tipe TypeScript (`tsc --noEmit`)
- `npm run build` — Mem-build frontend ke folder `dist/`
- `npm run start` — Menjalankan server produksi (`NODE_ENV=production tsx server.ts`)

## Push ke GitHub
File `.gitignore` sudah dikonfigurasi agar `node_modules/`, `dist/`, dan `.env` tidak ikut terunggah.
```bash
git init
git add .
git commit -m "Initial commit: UPG interior planner"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
