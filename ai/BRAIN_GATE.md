# 9Router Agent Brain-Gate Protocol

MANDATORY: Semua agent/sesi yang baru masuk ke project ini WAJIB membaca file ini sebelum melakukan tindakan apapun.

## 1. Tahap Audit (Pre-Build)
Sebelum menulis kode atau menjalankan tool modifikasi:
- **Scan `/ai`**: Baca [PROTOCOLS.md](./PROTOCOLS.md) dan [FinanceApp.md](./FinanceApp.md) untuk context roadmap.
- **MCP Validation**: Jalankan `mcp_supabase_list_tables` untuk sinkronisasi state database.
- **Disk Reality**: Gunakan `ls` atau `dir` untuk memverifikasi struktur file. DILARANG berasumsi file ada berdasarkan memori sesi sebelumnya.

## 2. Penggunaan Tool & MCP
- **MCP Supabase**: Rujukan tunggal skema DB. Dilarang hardcode query tanpa verifikasi skema.
- **Design MD**: Gunakan untuk download design kit jika melakukan UI refactor.
- **Impeccable Context**: Selalu sertakan `Cwd` yang tepat. Gunakan `npx` jika menjalankan script di Windows environment.

## 3. Komunikasi & Gaya (Caveman)
- Terse, teknis, pattern-based.
- Laporkan fakta (X -> Y), bukan narasi.
- Jika menemukan inkonsistensi antara dokumentasi dan disk, prioritaskan DISK dan update dokumentasi segera.

## 4. Handover State
Setiap akhir sesi, agent harus memastikan:
- Dokumentasi di `/ai/FinanceApp.md` mencerminkan status terakhir.
- Git sudah di-push ke `origin main`.
