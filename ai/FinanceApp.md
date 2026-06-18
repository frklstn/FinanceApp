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
- [x] Fase 13: Emergency Buffer Analysis (Survival Score).
---

## 📋 Audit — Fase 14: Personalization & Budget Optimization (Next)
Kondisi Aktif (2026-06-18). Visualisasi Emergency Runway Sukses (Glassmorphism + Framer Motion). Build Stabil.

✅ **Sudah ada:**
- UI: `EmergencyRunwayCard` premium component.
- Insights: Survival Score visualization (0-12+ months).
- Plugin: Ponytail installed & active (anti-over-engineering).

❌ **Belum ada:**
- Optimasi Anggaran Otomatis (AI Suggestion based on habits).

🚀 **Langkah Selanjutnya:**
- Implementasi `BudgetOptimizer` service untuk memberikan saran pemotongan biaya spesifik.
