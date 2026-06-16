# FinanceApp - Source of Truth

## Kondisi Aktif (2026-06-17)
- **Tech Stack**: Next.js 15 (App Router), Supabase, Tailwind CSS, Lucide React.
- **Deployment**: Vercel (Produksi), GitHub Actions (CI Aktif).
- **Build Status**: Sukses dikompilasi lokal setelah perbaikan & refaktorisasi terbaru:
  - Pembetulan import path `@/contexts/app-context` dan pembungkusan dengan `AppProvider` di landing page (`src/app/page.tsx`).
  - Pembetulan type error default state `quickAdd` dan import ikon `Zap`, `ShieldCheck` di `src/app/(dashboard)/dashboard/page.tsx`.
  - Sinkronisasi properti branding `.WALLET` -> `.app_name`.
  - Refaktorisasi modularitas UI: Pemisahan `ActiveDebtCard` dari `ActiveDebtList`.
  - Type Safety: Integrasi Supabase typed client dengan database schema types (`database.types.ts`).
  - Graphify: Pemasangan otomatisasi git post-commit hook untuk auto-rebuild graph.
- **Database**: 17 Tabel di Supabase (Public).
  - `app_settings` berisi branding.
  - `categories` berisi 6 data hasil seeding.
  - `transactions` berisi 4 data testing.

## Roadmap Status
- [x] Fase 1-7: Core Infrastructure & Auth.
- [x] Fase 8: Refactor Dashboard (Radar -> Progress Bars).
- [x] Fase 9: Premium UI/UX Polish (Luxury Spacing & Radius).
- [x] Fase 10: Landing Page (Modern Dark Glassmorphism).
- [ ] Fase 11: Multi-Currency & Seed Data Categories.

## Rujukan Desain
- **Warna**: Dark Theme (#0a0a0c), Indigo-600 Primary.
- **Radius**: 32px untuk Container Utama.
- **Font**: Geist (San Serif).

---

## 📋 Audit — Initial Audit

✅ **Sudah ada:**
- Solusi: Optimasi React lifecycle (state update guard replace `useEffect` in `DatePicker`/`QuickAddModal`), Strict TS types, linter fixes (`next/no-img-element`).
- Setelah Solusi: Next.js compile & build sukses lokal & remote. Performa rendering reaktif.
- Kode tersinkronisasi aman di remote branch `main`.

❌ **Belum ada atau error terdeteksi:**
- Recharts console warning: `width(-1) and height(-1) of chart should be greater than 0`.

⚠️ **Perlu perhatian:**
- Langkah Selanjutnya: Masih di Fase 10 (belum lanjut Fase 11) untuk audit dan perbaikan UI, fitur, dan tombol dashboard.
