-- Branding kustom dicabut: nilainya tidak pernah berubah, jadi tidak perlu
-- kolom, tabel, form admin, maupun pemuatan runtime untuk menyimpannya.
-- Identitas aplikasi sekarang tetap di src/lib/branding.ts.
--
-- Data yang ada saat migrasi ini dijalankan hanya berisi nilai bawaan
-- ('FinanceApp'), bukan branding yang benar-benar disetel pengguna.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS app_name,
  DROP COLUMN IF EXISTS app_icon_url,
  DROP COLUMN IF EXISTS app_title,
  DROP COLUMN IF EXISTS app_logo_url,
  DROP COLUMN IF EXISTS app_document_title;

DROP TABLE IF EXISTS public.app_settings;
