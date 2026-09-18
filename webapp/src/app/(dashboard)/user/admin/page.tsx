import { redirect } from 'next/navigation';

/**
 * Panel admin sudah pindah ke halaman Pengaturan.
 *
 * Route ini dipertahankan supaya tautan lama, bookmark, dan riwayat peramban
 * tidak berakhir 404 — cukup diarahkan ke tempat barunya.
 */
export default function AdminPageRedirect() {
  redirect('/finance/settings');
}
