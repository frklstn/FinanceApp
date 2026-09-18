# Roadmap Migrasi: Backend Rust + Webapp React + Mobile Android

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TAHAPAN EKSEKUSI                                │
│                                                                        │
│   Phase 1: Inisialisasi Backend Rust (`backend/`)                      │
│   Phase 2: Core Domain Services & ACID Transactions di Rust            │
│   Phase 3: Dual-Auth & REST API Endpoints (`/api/v1/...`)              │
│   Phase 4: Integrasi Webapp Next.js ke Backend Rust API                │
│   Phase 5: Stabilisasi, Benchmark & Systemd Deployment                 │
│   Phase 6: Inisialisasi Project Android (`mobileapp/`)                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Detail Fase Kerja

### Phase 1: Inisialisasi Backend Rust (`backend/`)
* [ ] Scaffold project Rust di `FinanceApp/backend/` (`Cargo.toml` minimal).
* [ ] Setup database pool `sqlx::PgPool` terhubung ke PostgreSQL lokal.
* [ ] Implementasi in-memory `CurrencyCache` (`RwLock<HashMap>`) + background sync Tokio loop.
* **Gate Check:** `cargo check` & koneksi database pool sukses < 1 ms.

### Phase 2: Core Domain Services & ACID Transactions
* [ ] Porting logika mutasi saldo atomic: `transaction_service`, `wallet_service`.
* [ ] Porting algoritma Pinjol & Debt Planner: `pinjol_service` (simulasi siklus gaji, skor survival).
* [ ] Porting target tabungan & anggaran: `savings_service`, `budget_service`.
* [ ] Porting single-pass aggregation untuk dashboard & laporan keuangan.
* **Gate Check:** Unit test mutasi saldo & transfer antar dompet lolos uji rollback ACID.

### Phase 3: Dual-Auth & REST API Endpoints
* [ ] Implementasi router Axum di `/api/v1/`.
* [ ] Otentikasi ganda: Cookie signing (untuk browser web) & Bearer JWT (untuk mobile app).
* [ ] Middleware proteksi route & ekstraksi `AuthContext (user_id, workspace_id)`.
* **Gate Check:** Login via `curl` menghasilkan cookie valid dan bearer token JWT valid.

### Phase 4: Integrasi Webapp Next.js ke Backend Rust API
* [ ] Buat API client layer di `webapp/src/lib/api-client.ts`.
* [ ] Alihkan data fetching komponen (Dashboard, Wallets, Transactions, Pinjol) ke API Rust.
* [ ] Pasang Optimistic UI updates (state update instan di client sebelum response selesai).
* **Gate Check:** Semua 21 views di webapp berfungsi normal memanggil backend Rust.

### Phase 5: Stabilisasi, Benchmark & Deployment VPS
* [ ] Buat user service `~/.config/systemd/user/fin-backend.service` (port 3006).
* [ ] Konfigurasi reverse proxy / Cloudflare tunnel untuk routing `/api` dan web.
* [ ] Verifikasi konsumsi RAM gabungan: Backend Rust (<15 MB) + Webapp (<40 MB).
* **Gate Check:** `ps aux` & `curl -I https://fin.llvy.space` terverifikasi 200 OK dengan P99 latency < 2 ms.

### Phase 6: Inisialisasi Android App (`mobileapp/`)
* [ ] Inisialisasi project Android / React Native / Flutter di `mobileapp/`.
* [ ] Implementasi login screen & storage JWT token.
* [ ] Hubungkan dashboard screen & quick transaction input ke API backend yang sama.
