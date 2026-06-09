<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🤖 Agent Workspace Handbook & Checkpoint

Dokumen ini ditulis khusus untuk AI Coding Agent berikutnya yang akan memelihara atau mengembangkan repositori **FinanceApp**. Berisi ikhtisar arsitektur, peta file, spesifikasi database, dan aturan pengembangan penting.

---

## 🗺️ Peta Struktur Folder (Directory Map)

*   `src/app/` : Menggunakan **Next.js App Router**.
    *   `(auth)/` : Login, Register, Forgot Password, Reset Password.
    *   `(dashboard)/` : Halaman dashboard utama (`dashboard/`), transaksi (`transactions/`), dompet (`wallets/`), anggaran (`budgets/`), tabungan (`savings/`), utang (`debts/`), pinjol tracker (`pinjol/`), laporan (`reports/`), pengaturan (`settings/`), dan admin portal (`admin/`).
*   `src/components/` : Modul UI modular.
    *   `charts/` : `spending-chart.tsx` (Tren area) dan `category-pie-chart.tsx` (Pie chart interaktif responsif).
    *   `debt/` : UI dashboard pinjol, kalender jatuh tempo, timeline, dan modal input.
    *   `forecast/` : Panel proyeksi pendapatan dan sisa uang kas per siklus gaji.
    *   `layout/` : Sidebar navigasi desktop, bottom navbar drawer responsif mobile (`mobile-nav.tsx`), navbar atas, dan branding (`app-brand.tsx`).
    *   `ui/` : Komponen generik (Card, Input, Button, Modal, Badge, Toast).
*   `src/contexts/` : `app-context.tsx` menyediakan global session user, data profile, account/workspace scope, dan **appSettings** (branding logo/nama dinamis).
*   `src/lib/services/` : Layer service API yang terhubung ke Supabase.
*   `supabase/migrations/` : Kumpulan script SQL migrasi skema database.
*   `public/` : Aset statis termasuk dokumentasi resmi `read.html`.

---

## 🗄️ Spesifikasi Database & Supabase Migrations

Database menggunakan **PostgreSQL** (Supabase) dengan aturan Row Level Security (RLS) di setiap tabel berdasarkan `workspace_id`. Skema migrasi terdiri dari:

1.  `001_initial_schema.sql` : Skema tabel utama (`profiles`, `workspaces`, `wallets`, `transactions`, `budgets`, `savings_goals`, `debts`).
2.  `002_loan_tracker.sql` : Menambahkan tabel `loan_trackers` untuk mencatat detail utang pinjol aktif.
3.  `003_debt_survival_planner.sql` : Menambahkan tabel `income_projections` dan `salary_settings` untuk menyelaraskan hari gajian.
4.  `004_app_settings.sql` : Menambahkan tabel `app_settings` untuk memfasilitasi kustomisasi logo dan nama aplikasi secara global oleh SuperAdmin.

---

## 🛠️ Perintah & Script Pengembangan Penting

*   **Menjalankan Mode Dev**:
    ```bash
    npm run dev
    ```
*   **Membuat Akun SuperAdmin**:
    Gunakan script `create-superadmin.js`. Sesuaikan email/password di dalamnya, lalu eksekusi:
    ```bash
    node create-superadmin.js
    ```
*   **Verifikasi Format Kode & Typecheck**:
    ```bash
    npm run build
    ```

---

## ⚠️ Pedoman Penting untuk AI Agent Berikutnya

1.  **Dinamis Branding (Branding App)**:
    Hindari melakukan hardcode pada kata "FinanceApp" di header, judul, atau sidebar. Gunakan properti `appSettings.app_name`, `appSettings.app_logo_url`, dan `appSettings.document_title` yang bersumber dari `useApp()` context.
2.  **Responsivitas Grafik (Charts)**:
    Jika memodifikasi atau merender grafik Recharts di area kolom terbatas (seperti kolom 1/3 di Dashboard), **selalu gunakan orientasi vertikal (`flex-col`)** dengan rasio aspek kontainer yang relatif. Penggunaan layout baris (`flex-row`) pada area sempit akan merusak kelengkungan lingkaran grafik Pie Chart.
3.  **Animasi Hover & Detail Modal**:
    Setiap grafik di dashboard harus memiliki tombol ekspansi modal (`Maximize2` icon) agar pengguna dapat melihat grafik resolusi tinggi beserta tabel datanya. Komponen grafik Pie Chart harus mempertahankan efek scale-up hover pada sel (`Cell`) agar interaktif.
4.  **Integritas Supabase**:
    Pastikan query API selalu memetakan filter `workspace_id` (diakses via `accountId`) agar data antar pengguna tidak tercampur (menghormati arsitektur multi-tenancy RLS).

---

## 📱 Flutter Mobile Wrapper (Production-Ready)

Folder `mobile/` berisi proyek Flutter yang membungkus web app Next.js (deploy di Vercel) menggunakan **WebView**. Arsitekturnya:

*   `mobile/lib/main.dart` : Entry point + WebView wrapper dengan:
    - Splash screen premium dengan fade animation
    - Progress bar loading
    - Pull-to-refresh
    - Back navigation (riwayat WebView)
    - Offline fallback dengan pesan error kontekstual
    - **Timeout handling** (30 detik)
    - **Retry strategy** (3x retry → fresh load)
    - **Domain whitelist** (FinanceApp, Supabase, Vercel)
    - **External URL** dibuka via system browser (`url_launcher`)
    - **Security**: blokir javascript: scheme & redirect berbahaya
*   `mobile/android/app/src/main/AndroidManifest.xml` : Izin `INTERNET`, `usesCleartextTraffic`, query intents untuk `url_launcher`.
*   `mobile/android/app/build.gradle.kts` : `minSdk = 23`, R8 + ProGuard aktif (`isMinifyEnabled`, `isShrinkResources`).
*   `mobile/android/app/proguard-rules.pro` : ProGuard rules untuk WebView dan url_launcher.
*   `mobile/pubspec.yaml` : Dependensi `webview_flutter: ^4.13.1` + `url_launcher: ^6.3.1`.

**URL Target:** `https://financeapp-projects.vercel.app` — ubah di `kAppUrl` dan `kAppDomain` di `main.dart`.

**Build APK:**
```bash
cd mobile
flutter pub get
flutter build apk --release
```

**Build AAB (Google Play Store):**
```bash
flutter build appbundle --release
```

---

## 🔄 CI/CD (GitHub Actions)

File `.github/workflows/android-release.yml` menyediakan:
*   Build APK + AAB otomatis pada push ke `main`.
*   Auto-create GitHub Release dengan APK/AAB saat push tag `v*`.
*   Validasi kode via `flutter analyze` pada setiap PR.

---

## 📄 Dokumentasi Proyek

*   `read.html` (root) dan `public/read.html` : Halaman dokumentasi HTML interaktif bergaya GitHub dengan dark mode toggle, sidebar navigasi, tabel fitur, diagram Mermaid, dan formula KaTeX.
*   `read.md` dan `README.md` : Versi Markdown dari dokumentasi yang sama.
*   `mobile/README.md` : Dokumentasi lengkap Flutter mobile termasuk panduan signing, CI/CD, dan troubleshooting.

