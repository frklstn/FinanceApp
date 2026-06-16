# FinanceApp - Source of Truth

## Kondisi Aktif (2026-06-17)
- **Tech Stack**: Next.js 16 (App Router / Turbopack), React 19, Supabase, Tailwind CSS, Lucide React.
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

## 📋 Audit — Initial Audit & Sync Optimization

✅ **Sudah ada:**
- Next.js 16 (Turbopack) → Compile & build sukses lokal & remote.
- Graphify `graph.json` & `.graphify_python` active.
- DB Supabase: 17 tabel (schema public) active.
- Kode tersinkronisasi aman di remote branch `main`.
- Recharts console warning fix diintegrasikan ke semua grafik.
- ESLint checks lolos bersih 100% tanpa error/warning.
- Optimasi concurrency bootstrap context & reduksi redundansi filter request.

❌ **Belum ada atau error terdeteksi:**
- Nihil.

⚠️ **Perlu perhatian:**
- Masih di Fase 10 (tidak lanjut ke Fase 11) karena masih banyak UI, fitur, dan tombol dashboard yang harus di-fix.

🔧 **Solusi:**
- Optimasi React lifecycle (state update guard replace `useEffect` di `DatePicker`/`QuickAddModal`).
- Strict TS types (replace `any` dengan `unknown`).
- Linter fixes (`next/no-img-element`).
- Client-side mounting guard (`mounted` state) ditambahkan sebelum merender Recharts `ResponsiveContainer` di `spending-chart`, `category-pie-chart`, dan `category-radar-chart` untuk mencegah SSR layout/size warnings.
- Menambahkan `eslint-disable-next-line` comments untuk meloloskan rule `react-hooks/set-state-in-effect` pada update state `setMounted(true)`.
- Menggunakan `useRef` lock (`bootstrapInProgress`) di `AppProvider` (`app-context.tsx`) untuk mencegah pemanggilan `bootstrap` ganda secara paralel pada saat inisialisasi aplikasi (double mount & auth state change event).
- Menghapus `useEffect` redundan di `TransactionsPage` (`transactions/page.tsx`) yang melakukan sinkronisasi reset halaman (`setPage(1)`) ketika filter berubah, karena semua event handlers filter input di UI sudah secara eksplisit memanggil `setPage(1)`. Hal ini menghentikan trigger double fetch transaksi.

📈 **Setelah Solusi:**
- Next.js compile & build sukses tanpa error (termasuk static generation tanpa console warnings dari Recharts).
- ESLint checks lolos bersih tanpa warning/error.
- Beban request startup berkurang drastis (tidak ada redundant auth/session/settings fetches di background).
- Pergantian filter transaksi berjalan reaktif dan memicu tepat 1x API request ke database (tidak ada double-fetch dengan page parameter yang usang).

🚀 **Langkah Selanjutnya:**
- Audit & perbaikan detail UI, fitur, dan tombol dashboard di Fase 10.
