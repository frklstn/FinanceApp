# Ponytail Audit — FinanceApp — 1 Agustus 2026

Codegraph: indexed 115 files (7 gagal baca — ENOENT, referensi file dihapus).
`npx tsc --noEmit`: **0 error** setelah fix.

## 🔴 Fixed (bug produksi)

**1. `monthNames` undefined → crash halaman `/finance/pinjol`**
- `src/app/(dashboard)/finance/pinjol/page.tsx:452` pakai `monthNames[calendarMonth]` — variabel **tidak pernah didefinisikan**.
- Runtime error saat halaman render (TS2304 + crash JS). Halaman ada di menu (config/navigation.ts:42).
- Fix: `MONTH_NAMES` di-export dari `pinjol-calendar.tsx` (sudah ada di sana, private), import di page.
- Verified: `tsc --noEmit` exit 0.

## 🟡 Duplikasi (YAGNI — jangan tambah, konsolidasi kapan-kapan)

**2. Array bulan Indonesia ×2 (3 setelah fix gw)**
- `pinjol-calendar.tsx` `MONTH_NAMES` (sekarang export)
- `date-picker.tsx` `INDO_MONTHS` — duplikat persis
- Fix future: satu shared const (mis. `src/lib/constants.ts`), import di kedua. **Skip sekarang** — 2 pemakaian, beda file UI, refactor ga mendesak.

**3. Format Rupiah inline ×7**
- `toLocaleString('id-ID')` di 7 tempat, tanpa helper.
- Fix future: `formatRupiah()` di `lib/utils.ts`. Skip — 7 tempat, konsisten, ga ada bug.

## 🟢 Peninggalan (bisa hapus)

**4. `supabase-schema-kortbujyuafwdiqxsiok.svg`** — ga direferensikan di src/ (migrasi Supabase selesai).

**5. `docs/read.html`, `docs/read.md`, `docs/migration_manual.sql`** — ga dipakai (peninggalan migrasi). `docs/arsip/` = arsip lama.

## ✅ Sudah bagus (ponytail-approved)

- **Auth**: JWT HS256 via jose, `SESSION_SECRET` wajib (no fallback dev-secret), cookie httpOnly+secure+sameSite=lax, Google OAuth pakai `state` CSRF + `timingSafeEqual` + `verified_email` check + placeholder password randomBytes. Solid.
- **Deps**: 22 prod + 13 dev — masuk akal, ga ada bloat. shadcn/ui standar.
- **Komponen**: semua terpakai (0 unused).
- **Services**: semua terpakai (0 unused).
- **Hook**: `use-user` dipakai 1x (bisa inline, tapi fine).
- **DB layer**: repo pattern (`user.repo`, `profile.repo`) — bersih, konsisten.
- **Migrations**: 4 file numbered, rapi.

## Tidak perlu diapa-apain (YAGNI)

- `skills-lock.json` — brandkit skill lock, bukan sampah.
- `ai/` folder — BRAIN_GATE/PROTOCOLS/RULES, dokumen kerja, kecil.
- `mobile/assets` — aset, kecil.
- `tsconfig.tsbuildinfo` — cache build, normal.

## Rekomendasi prioritas

1. ~~Fix monthNames~~ ✅ DONE
2. (opsional) Hapus `supabase-schema-*.svg` + `docs/read.*` + `docs/migration_manual.sql` — peninggalan migrasi
3. (future) Konsolidasi bulan Indonesia + formatRupiah — hanya kalau lagi edit file itu

## Verifikasi

```bash
cd /home/frklstn/FinanceApp && npx tsc --noEmit  # exit 0
```
