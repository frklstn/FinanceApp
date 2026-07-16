# 🪙 FinanceApp - Personal Finance & Debt Survival Planner

FinanceApp adalah platform manajemen keuangan pribadi modern berkinerja tinggi yang dirancang untuk membantu pengguna melacak, menganalisis, dan memproyeksikan arus kas secara real-time. Platform ini dilengkapi dengan modul unggulan **Debt Survival Planner** (Pinjol Tracker) untuk membantu pengguna keluar dari perangkap pinjaman online dengan analisis siklus gajian dan kalkulasi skor kelayakan hidup (*survival score*).

---

## 🛠️ Tech Stack
*   **Frontend**: Next.js 16 (App Router / Turbopack), React 19, Tailwind CSS 4.
*   **Database & Auth**: Supabase (Multi-Currency Schema Enabled).
*   **Charts**: Recharts & Tremor (Visual Analytics).
*   **Animations**: Framer Motion, Aceternity UI, Magic UI.
*   **Type Safety**: TypeScript (Strict mode, Zero-Error Linter).
*   **Icons**: Lucide React.
*   **Exports**: XLSX (Excel Spreadsheet export).

---

## 🌟 Fitur Utama

Berikut adalah modul-modul utama yang tersedia di FinanceApp:

| Modul | Deskripsi | Status |
| :--- | :--- | :--- |
| **📈 Dashboard Utama** | Ringkasan saldo bersih (*net worth*), grafik batang arus kas dinamis, saldo dompet aktif, dan log aktivitas transaksi terbaru. | Tersedia |
| **💳 Manajemen Dompet** | Mendukung banyak dompet sekaligus (Tunai, Bank BCA/Mandiri, E-Wallet GoPay/OVO) dengan penyesuaian saldo awal. | Tersedia |
| **💸 Transaksi Cepat** | Catat pengeluaran dan pemasukan berdasarkan kategori, dompet asal/tujuan, tanggal, serta catatan tambahan. | Tersedia |
| **🎯 Anggaran Bulanan** | Pembatasan anggaran per kategori pengeluaran dengan indikator *progress bar* real-time dan peringatan *overbudget*. | Tersedia |
| **🔒 Rencana Tabungan** | Target tabungan impian dengan tenggat waktu (*due date*), kalkulator persentase, dan log menabung yang aman. | Tersedia |
| **🤝 Utang & Piutang** | Pencatatan dana keluar/masuk dari kerabat atau pihak ketiga secara tradisional dengan pelacakan pelunasan. | Tersedia |
| **⚠️ Pinjol Tracker** | Modul khusus pendeteksi beban pinjaman online dengan visualisasi kalender jatuh tempo terhadap hari gajian. | Unggulan |
| **📊 Laporan & Ekspor** | Visualisasi diagram lingkaran (*pie chart*) pengeluaran bulanan dan tombol **Ekspor ke Excel (.xlsx)** instan. | Tersedia |
| **🛡️ Admin Portal** | Panel pengaturan plan (Free/Pro), kustomisasi branding (nama app, logo) per-user untuk Pro Plan, serta setting WhatsApp admin dan fallback branding global. | Khusus Admin |

---

## ⭐ Debt Survival Planner (Fitur Unggulan)

Modul ini dirancang khusus untuk menghadapi tantangan finansial dari pinjaman online (Pinjol):

*   **Siklus Hari Gajian (*Salary Cycle*):** Atur tanggal gajian rutin Anda untuk membagi rentang waktu pembayaran yang rasional.
*   **Proyeksi Pemasukan (*Income Projections*):** Daftarkan proyeksi nominal gaji pokok atau pemasukan sampingan per periode gaji.
*   **Proyeksi Arus Kas 12 Periode:** Menampilkan simulasi saldo sisa uang kas setelah dikurangi total cicilan jatuh tempo selama 12 periode gaji ke depan.
*   **Visualisasi Kalender:** Penempatan tanggal jatuh tempo cicilan relatif terhadap tanggal gajian untuk mempermudah identifikasi penumpukan tanggal bayar (*due-date clustering*).

> [!TIP]
> **Mengapa siklus gaji itu penting?** 
> Sebagian besar kegagalan bayar pinjol terjadi karena ketidakcocokan antara tanggal jatuh tempo pinjaman dengan tanggal penerimaan gaji utama. Modul ini menyelaraskan kedua parameter tersebut secara otomatis.

---

## 📊 Alur Kerja Aplikasi (App Flow)

Bagan berikut menjelaskan bagaimana data diproses di dalam platform FinanceApp:

```mermaid
graph TD
    A[Pengguna Baru / Lama] --> B{Punya Akun?}
    B -- Tidak --> C[Daftar Akun / Register]
    B -- Ya --> D[Masuk Akun / Login]
    C --> D
    D --> E[Dashboard Utama]
    
    %% Alur Fitur Finansial
    E --> F[Kelola Dompet / Wallets]
    E --> G[Catat Transaksi / Transactions]
    E --> H[Rencanakan Anggaran & Tabungan]
    E --> I[Laporan Keuangan / Ekspor Excel]
    
    %% Alur Pinjol Planner
    E --> J[Debt Survival Planner / Pinjol Tracker]
    J --> K[Atur Hari Gajian & Proyeksi Pendapatan]
    J --> L[Input Data Pinjaman Online]
    L --> M[Kalkulasi Sistem: Survival Score, Forecast & Timeline]
    M --> N[Tampilan Kalender & Rekomendasi Peringatan Finansial]
    
    %% Alur Admin
    E --> O{Apakah Akun Admin?}
    O -- Ya --> P[Admin Portal]
    P --> Q[Set Plan & Branding Per-User / Global Fallback & WA Link]
    Q --> R[Update Tabel profiles & app_settings di Supabase]
    R --> S[Perubahan Tampil Instan di Client]
    O -- Tidak --> E
```

---

## 🧮 Formula Perhitungan Debt Survival Score

Sistem menggunakan algoritma skor kelayakan hidup finansial (*Survival Score*) dengan skala **0 - 100** yang dihitung dari 5 parameter utama berikut:

### 1. Rasio Utang terhadap Pendapatan (*Debt-to-Income Ratio*)
Dihitung berdasarkan persentase cicilan bulanan dari total pemasukan:
$$\text{Debt Ratio} = \left( \frac{\text{Total Cicilan Pinjol Bulanan}}{\text{Total Proyeksi Pendapatan Bulanan}} \right) \times 100$$

*   **Rasio < 10%:** Sangat Aman (Skor Optimal)
*   **Rasio 10% - 30%:** Waspada / Manageable
*   **Rasio 30% - 50%:** Berat (Pengurangan skor signifikan)
*   **Rasio > 50%:** Bahaya (Skor berkurang drastis)

### 2. Likuiditas Kas Sisa (*Remaining Cash*)
Jika sisa uang kas setelah dipotong cicilan berada di bawah batas aman minimum (**Rp 500.000**), sistem mengenakan penalti likuiditas berat karena risiko kegagalan membayar kebutuhan pokok harian.

### 3. Jumlah Pinjol Aktif (*Active Debt Count*)
Memiliki banyak aplikasi pinjol aktif menurunkan fokus manajemen keuangan:
*   Jika jumlah pinjaman aktif **$\ge$ 3**, skor dikurangi **15 poin** secara otomatis karena tingginya bunga akumulatif dan biaya administrasi tersembunyi.

### 4. Penumpukan Tanggal Jatuh Tempo (*Clustered Due Dates*)
*   Jika terdeteksi ada lebih dari 2 pinjaman dengan rentang tanggal jatuh tempo kurang dari **3 hari**, sistem mendeteksi risiko penumpukan tanggal bayar (*default risk*) dan mengurangi skor sebesar **10 poin**.

### 5. Risiko Defisit Mendatang (*Future Deficit Period*)
*   Jika ada satu saja periode dalam 12 bulan ke depan yang diproyeksikan memiliki sisa saldo minus (pengeluaran cicilan > pendapatan), skor survival global secara otomatis dikunci maksimal pada nilai **30 (Danger Zone)**.

---
