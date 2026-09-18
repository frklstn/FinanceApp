-- Masa berlaku paket PRO.
--
-- Kolom ini dipakai adminService.setUserPlan, listUsersAction, dan
-- SubscriptionStatus sejak awal, tetapi tidak pernah ikut terbawa saat migrasi
-- dari Supabase — akibatnya daftar pengguna di panel admin gagal dimuat dan
-- tombol naik/turun paket melempar error.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
