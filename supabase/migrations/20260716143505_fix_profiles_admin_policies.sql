-- SELECT admin sebelumnya membaca auth.jwt()->user_metadata->is_admin, yang
-- bisa diubah sendiri oleh pengguna. Alihkan ke is_superadmin() (allowlist).
drop policy if exists "Admin dapat membaca semua profil" on public.profiles;
create policy "Admin dapat membaca semua profil"
  on public.profiles for select
  using (public.is_superadmin());

-- Tidak pernah ada policy UPDATE untuk admin: satu-satunya policy UPDATE adalah
-- "Users can update own profile" (auth.uid() = id). Akibatnya panel admin
-- meng-update 0 baris tanpa error, UI menampilkan sukses palsu, data tidak
-- berubah. Policy ini yang membuat suspend / ubah plan / edit profil berfungsi.
drop policy if exists "Admin dapat mengubah semua profil" on public.profiles;
create policy "Admin dapat mengubah semua profil"
  on public.profiles for update
  using (public.is_superadmin())
  with check (public.is_superadmin());
