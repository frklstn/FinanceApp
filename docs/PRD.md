# Product Requirements Document (PRD) — FinanceApp Monorepo

**Arsitektur:** Decoupled Monorepo (Rust Axum API Backend + Next.js Web Frontend + Android Mobile)  
**Host Target:** VPS DCOZY .42 (Linux x86_64, PostgreSQL 16)  
**Live Subdomain:** `https://fin.llvy.space`  

---

## 1. Visi & Arsitektur Sistem

```
                 ┌────────────────────────────────────────┐
                 │       CLIENT APPLICATIONS              │
                 │                                        │
                 │   [ webapp/ ]         [ mobileapp/ ]   │
                 │   Next.js / React     Android Client   │
                 │   (Port 3005)         (APK / Kotlin)   │
                 └───────────┬──────────────────┬─────────┘
                             │                  │
                HTTP / JSON  │  Bearer / Cookie │  HTTP / JSON
                             ▼                  ▼
                 ┌────────────────────────────────────────┐
                 │        BACKEND API [ backend/ ]        │
                 │        Rust (Axum + SQLx)              │
                 │        (Port 3006 / Internal)          │
                 │                                        │
                 │   ┌────────────────────────────────┐   │
                 │   │ In-Memory Currency Engine      │   │
                 │   │ (std::sync::RwLock Cache)      │   │
                 │   └────────────────────────────────┘   │
                 └───────────────────┬────────────────────┘
                                     │
                        PostgreSQL Connection Pool
                                     │
                                     ▼
                 ┌────────────────────────────────────────┐
                 │         DATABASE [ database/ ]         │
                 │         PostgreSQL 16                  │
                 │         (9 Composite Indexes)          │
                 └────────────────────────────────────────┘
```

---

## 2. Spesifikasi Modul Backend (Rust Axum)

### 2.1 Auth & Session Context
* **Endpoint:**
  * `POST /api/v1/auth/login` (email/username + password)
  * `POST /api/v1/auth/register`
  * `POST /api/v1/auth/logout`
  * `GET  /api/v1/auth/me`
* **Dual Auth Support:**
  * **Web Client**: HTTP-only Signed Cookie (CSRF-safe).
  * **Mobile Client**: Header `Authorization: Bearer <JWT>`.
* **Password Hashing**: `bcrypt` (kompatibel penuh dengan data eksisting di PostgreSQL).

### 2.2 In-Memory Currency Engine
* Menyimpan tabel `exchange_rates` di memori RAM via `RwLock<HashMap<(String, String), Decimal>>`.
* Sinkronisasi background setiap 1 jam via Tokio task.
* Konversi mata uang transaksi dan saldo berjalan secara $O(1)$ instan (0 SQL query).

### 2.3 Wallets & Balance Mutations (ACID)
* **Endpoint:**
  * `GET  /api/v1/wallets`
  * `POST /api/v1/wallets`
  * `PUT  /api/v1/wallets/:id`
  * `DELETE /api/v1/wallets/:id`
* Semua mutasi saldo dompet dijalankan dalam `sqlx::Transaction` dengan rollback otomatis jika terjadi kegagalan.

### 2.4 Transactions & Batch Aggregations
* **Endpoint:**
  * `GET  /api/v1/transactions` (filter: date range, category, wallet, type, pagination).
  * `POST /api/v1/transactions` (income / expense / transfer).
  * `PUT  /api/v1/transactions/:id` (penyesuaian saldo atomic otomatis).
  * `DELETE /api/v1/transactions/:id` (rollback saldo atomic otomatis).

### 2.5 Debt Planner, Pinjol & Salary Cycle
* **Endpoint:**
  * `GET  /api/v1/debts` & `POST /api/v1/debts/payment`
  * `GET  /api/v1/pinjol/loans`
  * `GET  /api/v1/pinjol/forecast` (simulasi siklus gajian vs jatuh tempo pinjol).
  * `GET  /api/v1/pinjol/survival-score`

### 2.6 Budgets, Savings Goals & Reports
* **Endpoint:**
  * `GET /api/v1/budgets` & `POST /api/v1/budgets`
  * `GET /api/v1/savings` & `POST /api/v1/savings/contribute`
  * `GET /api/v1/reports/summary` (single-pass SQL CTE aggregation).

---

## 3. Spesifikasi Frontend Web (`webapp/`) & Mobile (`mobileapp/`)
* **Webapp**: UI React yang ada difokuskan murni sebagai view layer. Data fetching diarahkan ke endpoint Rust `/api/v1/*` menggunakan SWR / TanStack Query dengan **Optimistic UI Updates**.
* **Mobileapp**: Aplikasi Android native / hybrid yang mengonsumsi endpoint `/api/v1/*` yang sama dengan otentikasi JWT Bearer.

---

## 4. Metrik Kualitas & Performa Target
* **Backend RAM**: < 15 MB RSS pada kondisi peak.
* **API P99 Latency**: < 2 ms (DB hit lokal).
* **Currency Conversion Overhead**: < 100 ns (0 SQL round-trip).
* **Concurrency**: Mampu melayani > 2.000 req/detik tanpa degradasi CPU di VPS.
