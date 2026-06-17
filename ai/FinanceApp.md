# FinanceApp - Source of Truth

## Kondisi Aktif (2026-06-18)
- **Tech Stack**: Next.js 16 (App Router / Turbopack), React 19, Supabase, Tailwind CSS 4, Lucide React, Framer Motion.
- **Deployment**: Vercel (Produksi), GitHub Actions (CI Aktif).
- **Build Status**: Sukses dikompilasi lokal. ESLint 0 errors, 0 warnings.
- **Recent Updates**:
  - Migrasi `budgets` schema untuk mendukung constraint `period` (YYYY-MM) dan `UNIQUE` constraint pada `(workspace_id, category_id, period)`.
  - Integrasi Tailwind CSS 4 & PostCSS modern stack.
  - Perbaikan branding: Penggunaan `app_name` konsisten dari `app_settings`.
- **Project Purpose**: Membantu pengguna bertahan hidup di tengah kesulitan finansial (Financial Hardship) dan jeratan Pinjaman Online (Pinjol).
- **Mission**: Dukungan psikologis melalui UI tenang (Glassmorphism) dan data suportif.
- **Database**: 17 Tabel di Supabase (Public). `budgets` table schema fixed.

## Roadmap Status
- [x] Fase 1-7: Core Infrastructure & Auth.
- [x] Fase 8: Refactor Dashboard (Radar -> Progress Bars).
- [x] Fase 9: Premium UI/UX Polish (Luxury Spacing & Radius).
- [x] Fase 10: Landing Page & ESLint Zero-Error Cleanup.
- [x] Fase 11: Multi-Currency & Seed Data Categories.
- [x] Fase 12: Multi-Currency Budgets & Projections.
---

## 📋 Audit — Fase 13 Emergency Buffer Analysis (Pending)
Kondisi Aktif (2026-06-18). Database & Service Layer 100% Type-Safe (Zero-Error Linter). Multi-Currency Support Aktif.

✅ **Sudah ada:**
- Database: Kolom `currency` & `exchange_rate` di semua tabel utama.
- Linter: Zero-Error (No `as any`).
- Arsitektur: 133 file terpeta.

❌ **Belum ada:**
- Visualisasi premium *Emergency Buffer* (Fase 13).

🚀 **Langkah Selanjutnya:**
- Implementasi visualisasi *Emergency Runway* di Insights UI.
