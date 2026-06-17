# Skema Algoritma & Insight Finansial (FinanceApp)

Dokumen ini mendokumentasikan seluruh aturan evaluasi keuangan (insights & warnings) yang digunakan di dalam sistem FinanceApp untuk memandu keputusan finansial pengguna.

---

## 1. Skema Analisis Kesehatan Finansial (Financial Health Score)
* **Sumber:** `src/lib/services/insights.service.ts`
* **Metrik Utama:** Rasio Pengeluaran terhadap Pendapatan (*Expense Rate*) = `(Pengeluaran / Pendapatan) * 100`
* **Skor Dasar:** `75` (Neutral baseline)

| Batas Rasio Pengeluaran | Kategori/Tingkat | Skor Penyesuaian | Judul Insight | Deskripsi Tampilan |
| :--- | :--- | :--- | :--- | :--- |
| **≤ 40%** | **Superb** (Sangat Baik) | Diatur ke `92` | `Superb Budgeting` | *"You are living well within your means. Expenses consume only X% of your monthly income."* |
| **41% - 65%** | **Healthy** (Sehat) | Diatur ke `82` | `Healthy Savings` | *"You are saving a healthy X% of your income. Keep building your wealth!"* |
| **66% - 89%** | **Warning** (Peringatan) | Diatur ke `65` | `Tight Margins` | *"Monthly expenses absorb X% of earnings. Try optimizing discretionary categories."* |
| **≥ 90%** | **Danger** (Kritis) | Diatur ke `45` | `Unhealthy Deficit Warning` | *"Critical cash drain: Expenses absorb X% of income. Risk of overspending this cycle."* |
| **0 Pendapatan & Pengeluaran > 0** | **Warning** (Pembakaran Modal) | Diatur ke `50` | `No Active Income Recorded` | *"You are currently burning liquid capital with zero logged income for the current billing cycle."* |
| **0 Pendapatan & 0 Pengeluaran** | **Info** (Akun Baru) | Diatur ke `100` | `Fresh Slate Workspace` | *"Log your first income transaction to initialize your dynamic financial health scoring."* |

---

## 2. Skema Runway Dana Darurat (Emergency Fund Runway)
* **Sumber:** `src/lib/services/insights.service.ts`
* **Metrik Utama:** Jumlah bulan bertahan hidup (*Runway Months*) = `Total Saldo Dompet / Rata-rata Pengeluaran`

| Rasio Runway | Kategori | Skor Dampak | Judul Insight | Deskripsi Tampilan |
| :--- | :--- | :--- | :--- | :--- |
| **≥ 6 Bulan** | **Success** (Kuat) | `+8` (Max 100) | `Fortress Reserve` | *"Excellent liquidity! Aggregate wallets can support current expenses for X months."* |
| **3 - 5 Bulan** | **Info** (Cukup) | `+4` (Max 100) | `Adequate Emergency Buffer` | *"Healthy emergency liquidity covering X months of average expenses."* |
| **< 3 Bulan** | **Danger** (Lemah) | `-6` (Min 20) | `Low Liquidity Alarm` | *"Liquid assets cover less than 3 months of expenses. Avoid locking cash in illiquid pools."* |

---

## 3. Skema Konsentrasi Pengeluaran Kategori (Category Concentration)
* **Sumber:** `src/lib/services/insights.service.ts`
* **Metrik Utama:** Rasio belanja satu kategori terhadap total belanja = `(Belanja Kategori Terbesar / Total Pengeluaran) * 100`

| Batas Rasio | Tingkat | Skor Dampak | Judul Insight | Deskripsi Tampilan |
| :--- | :--- | :--- | :--- | :--- |
| **> 40%** | **Warning** | `-4` (Min 10) | `Extreme Spending Cluster: [Kategori]` | *"Concentration alert: X% of all expenses flow into [Category]. Consider splitting budgets."* |

---

## 4. Skema Peringatan Perencanaan Hutang & Cicilan (Debt Planner Warnings)
* **Sumber:** `src/lib/debt-planner/warnings.ts`
* **Metrik Utama:** Rasio Hutang Bulanan (*Debt Ratio*) = `Total Cicilan Bulanan / Pendapatan`

| Kondisi Pemicu | Tingkat Keparahan | Teks Pesan Warning | Penjelasan |
| :--- | :--- | :--- | :--- |
| `Total Cicilan Bulanan > Pendapatan` | **Danger** | *"Cashflow deficit risk detected."* | Pengeluaran cicilan bulanan melebihi pendapatan total. |
| `Jumlah Cicilan Aktif ≥ 3` | **Warning** | *"[X] active debts detected."* | Memiliki terlalu banyak jenis cicilan/aplikasi pinjol aktif. |
| `Debt Ratio > 50%` | **Danger** | *"Debt ratio exceeds 50%. Cashflow may be critically tight this period."* | Setengah dari pendapatan habis hanya untuk bayar cicilan. |
| `Debt Ratio 30% - 50%` | **Warning** | *"Cashflow may be tight this period. Avoid new debt if possible."* | Batas aman psikologis rasio hutang terlampaui. |
| `Sisa Uang (Pendapatan - Cicilan) < Rp 500.000` | **Danger** | *"Remaining cash is dangerously low."* | Sisa dana bebas setelah cicilan terlalu mepet untuk kebutuhan primer. |
| Tanggal Jatuh Tempo Berdekatan (*Clustered Due Dates*) | **Warning** | *"High due-date clustering this period."* | Risiko likuiditas karena beberapa cicilan jatuh tempo hampir bersamaan. |
| Ada cicilan jatuh tempo dalam ≤ 3 hari | **Danger** | *"[Nama Pinjol] — due within 3 days."* | Peringatan jatuh tempo sangat dekat untuk menghindari denda. |

---

## 5. Skema Deskripsi Finansial Dashboard (Dynamic Header Subtitle)
* **Sumber:** `src/app/(dashboard)/dashboard/page.tsx`
* **Metrik Utama:** Selisih persentase tabungan dari periode lalu = `diffPercent` & deteksi `activeLoans`

```
Apakah ada hutang aktif?
├── YA (Jumlah cicilan aktif > 0)
│   ├── Tabungan menurun atau minus (diffPercent < 0 ATAU currentSavings < 0)
│   │   └── "Waspada, gaji kamu sudah 'kemakan' pinjol sebesar [Nominal]. Bulan ini ada tagihan [Nominal] yang harus dibayar. Tetap tenang, fokus lunasi yang terkecil dulu ya!" (🚨 DANGER)
│   ├── Rasio hutang > 50%
│   │   └── "Hati-hati, lebih dari 50% pendapatan kamu habis buat bayar hutang. Sisa uang kamu tinggal [Nominal]. Jangan impulsif belanja dulu ya!" (⚠️ WARNING)
│   └── Tabungan surplus
│       └── "Ada tagihan aktif [Nominal] bulan ini. Tabungan kamu masih surplus [Nominal], yuk jaga disiplin biar cepat bebas hutang!" (ℹ️ INFO)
└── TIDAK (Tidak ada hutang aktif)
    ├── Tabungan surplus (currentSavings >= 0)
    │   ├── Tren tabungan meningkat (diffPercent >= 0)
    │   │   └── "Keren! Keuangan kamu lagi sehat banget dan ada kenaikan tabungan [X]%. Pertahankan pola hidup hematnya ya!" (❇️ SUCCESS)
    │   └── Tren tabungan menurun
    │       └── "Tabungan kamu bulan ini aman, tapi sedikit turun [X]% dibanding periode lalu. Cek lagi pengeluaran kecil yang nggak perlu ya." (ℹ️ INFO)
    └── Tabungan defisit (currentSavings < 0)
        └── "Duh, bulan ini kamu minus [Nominal]. Coba cek riwayat transaksi buat cari tahu bocor halusnya di mana." (🚨 DANGER)
```
