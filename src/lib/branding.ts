/**
 * Identitas aplikasi. Satu sumber, tetap.
 *
 * Sebelumnya branding bisa diatur di dua tempat sekaligus: per-pengguna lewat
 * kolom app_name/app_icon_url/app_title di tabel profiles, dan global lewat
 * tabel app_settings. Keduanya dicabut — nilainya tidak pernah berubah, jadi
 * tidak perlu tabel, form admin, maupun pemuatan runtime untuk menyimpannya.
 */
export const BRAND = {
  name: 'Cuan Bitkonek',
  /** Dipakai sebagai <title> dan nama berkas ekspor. */
  documentTitle: 'Cuan Bitkonek — Kelola Keuangan Pribadi',
  /** Ukiran pada plakat di halaman masuk. */
  mark: '$',
} as const;
