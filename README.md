# 🪙 FinanceApp — Modern Personal Finance & Debt Survival Planner

FinanceApp adalah platform manajemen keuangan pribadi modern berkinerja tinggi yang dirancang dengan arsitektur **Decoupled Monorepo** (Rust REST API Backend + Next.js Web Frontend + Android Mobile Client) yang terhubung ke PostgreSQL 16.

Platform ini dilengkapi dengan modul unggulan **Debt Survival Planner** (Pinjol Tracker) untuk membantu pengguna keluar dari jeratan pinjaman online melalui simulasi siklus gajian, kalkulasi skor kelayakan hidup (*survival score*), dan proyeksi arus kas 12 periode.

---

## 🏛️ Arsitektur Sistem (Monorepo)

```
FinanceApp/
├── webapp/       → Next.js 16.3.5 (Turbopack), React 19.3, Tailwind CSS v4 (Port 3005)
├── backend/      → Rust Axum 0.8 REST API, SQLx, In-Memory Currency Engine (Port 3006)
├── database/     → PostgreSQL 16 Schema DDL & 9 Composite Index Migrations
├── mobileapp/    → Android Application Workspace (Expo / React Native)
└── docs/         → Product Requirements Document (PRD), Roadmap & Audit Logs
```

---

## 🛠️ Tech Stack & Spesifikasi

| Lapisan / Komponen | Teknologi Utama | Versi / Spesifikasi |
|---|---|---|
| **Backend REST API** | Rust (`Axum`, `SQLx`, `Tokio`, `rust_decimal`, `bcrypt`, `jsonwebtoken`) | Binary ~2.8 MB, RAM **~776 KB**, Latency **< 0.5 ms** |
| **Frontend Webapp** | Next.js (`App Router`, `Turbopack`), React, Tailwind CSS | Node.js `v26.9.0`, React `19.3.0`, Next `16.3.5` |
| **Database** | PostgreSQL 16 Lokal | 9 Composite Indexes aktif untuk query instan |
| **Mobile Client** | Android App Workspace | Dukungan Bearer JWT Auth |
| **Keamanan & Auth** | Dual-Auth Architecture | **Web**: HTTP-Only Cookie \| **Mobile**: Bearer Token |

---

## 🌟 Fitur Utama

| Modul | Deskripsi |
| :--- | :--- |
| **📈 Dashboard Utama** | Ringkasan saldo bersih (*net worth*), grafik batang arus kas dinamis, saldo dompet aktif, dan log aktivitas transaksi terbaru dalam 1 single-pass SQL aggregation. |
| **💳 Manajemen Dompet (ACID)** | Mendukung multi-dompet (Kas, Bank BCA/Mandiri, E-Wallet GoPay/OVO) dengan mutasi saldo atomic. |
| **💸 Transaksi Instan** | Catat pengeluaran, pemasukan, dan transfer antar dompet dengan rollback otomatis jika terjadi kegagalan. |
| **🎯 Anggaran Bulanan** | Pembatasan anggaran per kategori pengeluaran dengan indikator *progress bar* real-time. |
| **🔒 Target Tabungan** | Target tabungan dengan deadline waktu, persentase ketercapaian, dan pemotongan saldo dompet otomatis. |
| **⚠️ Pinjol Tracker** | Deteksi beban pinjaman online dengan visualisasi kalender jatuh tempo terhadap hari gajian. |
| **📊 Laporan & Ekspor** | Diagram lingkaran pengeluaran bulanan dan tombol **Ekspor ke Excel (.xlsx)** instan. |
| **🔐 Smart Login** | Dukungan Google OAuth 1-klik (tanpa popup persetujuan berulang) dan Card Akun Tersimpan ala Cloudflare. |

---

## 🚀 Menjalankan Proyek Secara Lokal

### 1. Prasyarat
* Node.js `>= 26.x` & NPM `>= 12.x`
* Rust Toolchain `>= 1.98` (`cargo`)
* PostgreSQL 16 aktif

### 2. Jalankan Backend Rust (Port 3006)
```bash
cd backend
cargo run --release
```

### 3. Jalankan Webapp Next.js (Port 3005)
```bash
cd webapp
npm install
npm run dev
```

### 4. Menjalankan Test Suite
```bash
# Webapp Tests (Money math & JWT auth)
cd webapp && npm test

# Backend Rust Tests (Currency cache, JWT claims, Bcrypt)
cd backend && cargo test
```

---

## 📄 Lisensi
Hak Cipta © 2026 **LLVY Space**. Seluruh hak cipta dilindungi undang-undang.
