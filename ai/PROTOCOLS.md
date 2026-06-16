# AI Protocols & Workflow

> [!IMPORTANT]
> **MULTI-AGENT SINKRONISASI**: Semua agent baru wajib melakukan check-in via [BRAIN_GATE.md](./BRAIN_GATE.md).


## 1. Alat & Rujukan Wajib
- **MCP Server**: Selalu gunakan `supabase` MCP untuk audit DB (jangan berasumsi skema). Gunakan `canva-dev` untuk aset UI. Gunakan `context7` untuk rujukan stack, arsitektur, dan versi dependency terbaru.
- **Visual Excellence Standards**:
  - **Aceternity UI**: Referensi utama untuk efek visual Tailwind kelas atas dan animasi latar belakang futuristik.
  - **Magic UI**: Fokus pada efek interaktif, animasi teks, dan elemen grafis modern.
  - **Framer Motion**: Standar emas animasi React. Bungkus komponen `shadcn/ui` dengan `motion` untuk transisi halus.
- **Context Impeccable**: Dilarang melakukan tindakan tanpa validasi `Get-ChildItem` atau `list_dir`. Fakta di disk > Memori.
- **Caveman Mode**: Berikan jawaban ultra-terse, langsung ke poin teknis. Hindari filler.

## 2. Flow Pekerjaan
1. **Audit**: Periksa eksistensi file/data sebelum modifikasi.
2. **Execute**: Gunakan `npx` atau context path yang tepat (Windows-friendly).
3. **Verify**: fix error first lalu jalankan count/list setelah perubahan untuk memastikan realitas sesuai harapan.

## 3. Zero Hallucination
- Jika file tidak ditemukan di disk, laporkan sebagai "Mati/Hilang", jangan berhalusinasi file tersebut ada di memori.
- Sinkronisasi `FinanceApp.md` secara berkala dengan kondisi riil commit.

## 4. UI/UX Stack & Component Requirements
### 1. Design System & Core Framework
- **Base Framework**: Tailwind CSS
- **Component Library**: shadcn/ui (Radix UI based)
- **Core Components Priority**:
  - **Charts**: Integrasi Recharts (tooltip & legenda).
  - **Data Table**: Server-side filtering, sorting, search.
  - **Input OTP**: 4-6 digit untuk verifikasi & 2FA.
  - **Cards**: Modular untuk saldo (virtual cards), tabungan, limit kredit.

### 2. Modern Aesthetics & "Anti-Template" Stack
- **Analytical Engine**: **Tremor** (KPI, Dashboard, Bar Charts finansial presisi).
- **Visual High-End**: **Aceternity UI** (Glare Cards & Background Beams).
- **Micro-Interactions**: **Magic UI** (Number Ticker & Fade-in List).
- **Iconography**: **Lucide React** (Minimalis).

### 3. Essential Finance UI Features
- **Dashboard Shell**: Sidebar responsif, collapsible.
- **Interactive Analysis**: Filter rentang waktu (daily, weekly, monthly).
- **Security UI**: PIN input, biometric prompt, manajemen sesi.
- **Theming**: Dark Mode & Glassmorphism (Backdrop blur).

### 4. Technical Reference
- **Shadcn Fintech**: Pola alur kerja finansial profesional.
- **Crypgo**: Interface manajemen aset & kripto.
- **Horizon UI (Shadcn Edition)**: Manajemen data besar/admin panel.
