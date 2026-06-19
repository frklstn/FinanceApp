# Project Rules & Guidelines

1. **Branding & Naming**: Gunakan `appSettings` dari `useApp()` context untuk semua nama aplikasi, ikon, dan teks branding dinamis.
2. **Database & Transactions**: 
   - Semua operasi database yang mengubah status saldo dompet/wallet atau membutuhkan atomisitas wajib menggunakan PostgreSQL RPC (`(supabase as any).rpc(...)`).
   - Jangan pernah melakukan kalkulasi saldo dompet secara manual di sisi client-side JavaScript.
   - Jangan menghapus atau memodifikasi tabel tanpa melakukan audit RLS (Row Level Security) terlebih dahulu.
3. **Architecture (Ponytail Rules)**:
   - Hindari over-abstraksi. Jangan membuat service wrapper tipis yang hanya membungkus pemanggilan query dasar Supabase client.
   - Manfaatkan custom hooks untuk mengisolasi data fetching dari komponen UI.
   - Halaman pengaturan akun dan profil wajib disatukan ke dalam modal `AccountSettings` (`@/components/user/profile/Settings`) untuk meminimalkan duplikasi.
4. **Git & Code Style**:
   - Commit message harus deskriptif (format: `feat/fix/chore/...`).
   - Gunakan path alias `@/...` untuk semua module imports. Hindari import relatif berjenjang (`../../`).
   - Gunakan penanganan error yang konsisten dengan notifikasi visual (`useToast`).
5. **Type Safety (Impeccable Rules)**:
   - Selalu validasi tipe data dari Supabase. Gunakan safety-casting yang tepat saat bekerja dengan RPC dinamis.
   - Pastikan build TypeScript selalu bebas error (`tsc --noEmit`).
