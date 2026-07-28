# Arsip

Isi folder ini **tidak dipakai aplikasi**. Disimpan sebagai rujukan sejarah saja.

## `supabase/`

Definisi database dari masa aplikasi ini masih berjalan di Supabase, diarsipkan
28 Juli 2026 saat migrasi ke PostgreSQL lokal dirapikan.

**Jangan dijalankan.** Berkas-berkas ini mendeskripsikan database yang sudah tidak
ada, dan sebagian bergantung pada hal yang tidak berlaku di PostgreSQL biasa:

- `auth.uid()` dan tabel `auth.users` — milik Supabase Auth, sudah diganti
  sesi JWT sendiri (`src/lib/auth/`)
- kebijakan Row Level Security — tidak ada RLS di database lokal; batas akses
  ditegakkan di `requireAccount()` (`src/lib/auth/account.ts`)
- fungsi `create_transaction` / `delete_transaction` / `update_transaction` —
  tidak pernah dibuat di database lokal, logikanya sekarang ada di
  `transactionService` memakai `withTransaction`

**Sumber kebenaran schema sekarang: `sql/init.sql`** (20 tabel, tanpa RLS).
Sudah diverifikasi mereproduksi database yang berjalan.

Satu hal yang masih berguna dibaca dari sini: `migrations/20260619_atomic_transactions.sql`
memuat semantik penyesuaian saldo dompet yang jadi acuan implementasi TypeScript-nya.

## Skrip Supabase yang dihapus

Lima skrip di `scripts/` ikut dibuang pada tanggal yang sama karena semuanya sudah
tidak bisa jalan — `@supabase/supabase-js` tidak lagi terpasang, dan salah satunya
membaca berkas migrasi yang tidak ada:

`apply-remote-migrations.js`, `create-superadmin.js`, `get-admin-email.js`,
`run-migration.js`, `seed-categories.js`

Penggantinya yang berjalan di PostgreSQL lokal: `scripts/make-superadmin.ts`.

> **Peringatan:** `create-superadmin.js` dan `get-admin-email.js` memuat kata sandi
> akun dalam bentuk teks polos. Berkasnya sudah dihapus, tetapi **riwayat git masih
> menyimpannya** (commit `84a7418`). Menghapus berkas tidak menghapus isi dari
> riwayat. Kata sandi tersebut harus dianggap bocor dan diganti.
