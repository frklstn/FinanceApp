# AI Protocols & Workflow

> [!IMPORTANT]
> **MULTI-AGENT SINKRONISASI**: Semua agent baru wajib melakukan check-in via [BRAIN_GATE.md](./BRAIN_GATE.md).


## 1. Alat & Rujukan Wajib
- **MCP Server**: Selalu gunakan `supabase` MCP untuk audit DB (jangan berasumsi skema). Gunakan `canva-dev` untuk aset UI. Gunakan `context7` untuk rujukan stack, arsitektur, dan versi dependency terbaru.
- **Visual Excellence Standards**:
  - **Aceternity UI**: Referensi utama untuk efek visual Tailwind kelas atas dan animasi latar belakang futuristik.
  - **Magic UI**: Fokus pada efek interaktif, animasi teks, dan elemen grafis modern.
  - **Framer Motion**: Standar emas animasi React. Bungkus komponen `shadcn/ui` dengan `motion` untuk transisi halus.
- **Context Impeccable**: Dilarang melakukan tindakan tanpa validasi `Get-ChildItem` atau `list_dir`. Fakta di disk > Memori.
- **Caveman Mode**: Berikan jawaban ultra-terse, langsung ke poin teknis. Hindari filler.

## 2. Flow Pekerjaan
1. **Audit**: Periksa eksistensi file/data sebelum modifikasi.
2. **Execute**: Gunakan `npx` atau context path yang tepat (Windows-friendly).
3. **Verify**: fix error first lalu jalankan count/list setelah perubahan untuk memastikan realitas sesuai harapan.

## 3. Zero Hallucination
- Jika file tidak ditemukan di disk, laporkan sebagai "Mati/Hilang", jangan berhalusinasi file tersebut ada di memori.
- Sinkronisasi `FinanceApp.md` secara berkala dengan kondisi riil commit.
