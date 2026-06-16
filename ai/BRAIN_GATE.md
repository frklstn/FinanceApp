# 9Router Agent Brain-Gate Protocol

MANDATORY: Semua agent/sesi yang baru masuk ke project ini WAJIB membaca file ini sebelum melakukan tindakan apapun.

## 1. Tahap Audit (Pre-Build)
Sebelum menulis kode atau menjalankan tool modifikasi:
- **Scan `/ai`**: Baca [PROTOCOLS.md](./PROTOCOLS.md) dan [FinanceApp.md](./FinanceApp.md) untuk context roadmap.
- **Graphify**: WAJIB menjalankan `/graphify` atau `graphify query` untuk memahami arsitektur dan relasi file sebelum melakukan modifikasi kode.
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
- **Sensitivitas Error**: Deteksi error sekecil apapun (warning compiler, linter, typos, unused-vars) dan sebutkan di kesimpulan.
- **FIX FIRST**: Prioritaskan fix error yang ada sebelum melanjutkan tugas.

## 4. Handover State
Setiap akhir sesi, agent wajib menulis laporan dengan format berikut:

```markdown
## 📋 Audit — [nama task]

✅ **Sudah ada:**
- item 1

❌ **Belum ada atau error terdeteksi:**
- item 1

⚠️ **Perlu perhatian:**
- catatan jika ada

🔧 **Solusi:**
- deskripsi solusi yang diterapkan

📈 **Setelah Solusi:**
- apa yang terjadi setelah solusi (dampak/efek)

🚀 **Langkah Selanjutnya:**
- apa yang harus dilakukan selanjutnya
```

Pastikan dokumentasi di `/ai/FinanceApp.md` mencerminkan status terakhir, dan Git sudah di-push ke `origin main`.

## 5. Kapan Harus Memulai Sesi Baru (New Chat)
USER & Agent WAJIB memulai chat baru jika:
1. **Fase Selesai**: Transisi fase roadmap selesai (misal: Fase 10 -> Fase 11) dan git status bersih.
2. **Error Selesai**: Masalah build, lint, atau environment sudah solved & committed.
3. **Looping**: Agent mulai mengulang perintah/perbaikan yang sama > 2 kali.
4. **Context Berat**: Respon melambat atau token history > 60k.

## 7. Status Eksekusi Agent (Session Status Markers)
Untuk menghilangkan ambiguitas apakah agent masih bekerja atau sudah selesai, agent WAJIB mencantumkan salah satu status ini di **BARIS PALING AKHIR** responnya:
- **`[STATUS: RUNNING]`**: Agent masih memproses file/perintah dan akan memanggil tool lagi. USER dilarang memberikan input baru.
- **`[STATUS: DONE]`**: Task selesai. Tidak ada pemanggilan tool lagi di turn ini. Agent menunggu instruksi/feedback baru dari USER.
- **`[STATUS: HANDOVER]`**: Seluruh rangkaian task/fase selesai. Sesi ini ditutup. USER harus memulai sesi/chat baru.
- Jika status **`DONE`** atau **`HANDOVER`** dideklarasikan, agent **DILARANG** memanggil tool apapun setelahnya di turn tersebut.


## 6. Kapan Agent Harus Membaca Ulang (Re-read) Folder `/ai`
Agent wajib melakukan `view_file` ulang pada seluruh file di `/ai` jika:
1. **Pindah Sesi / Handover**: Terjadi pergantian agent dari 9Router (Check-in awal).
2. **Git Pull/Merge**: Terjadi update code dari remote branch.
3. **Build Error / Loop**: Saat terjadi error build tak terduga untuk re-align rules.
4. **Interval Sesi**: Sesi berjalan panjang (> 15 pesan) untuk menyegarkan memori context.



