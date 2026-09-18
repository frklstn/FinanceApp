-- Jumlah yang diajukan saat pinjam. Yang diterima = diajukan - biaya admin,
-- jadi keduanya perlu disimpan terpisah.
--
-- Kolom ini sudah ditulis DebtForm.tsx dan dibaca pinjol/page.tsx sejak lama,
-- tetapi tidak pernah ada di database lokal — hilang saat migrasi dari Supabase.
ALTER TABLE public.loan_trackers ADD COLUMN IF NOT EXISTS amount_applied NUMERIC;
