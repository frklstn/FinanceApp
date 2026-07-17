-- Allowlist admin eksplisit. Sebelumnya is_superadmin() memercayai
-- email ILIKE '%admin%' dan raw_user_meta_data->>'is_admin', keduanya bisa
-- dikendalikan pengguna sendiri (daftar pakai email beraroma "admin", atau
-- panggil auth.updateUser({data:{is_admin:true}})) sehingga siapa pun bisa
-- mengangkat dirinya jadi superadmin.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Hanya admin yang boleh melihat daftar admin. Tidak ada policy INSERT/UPDATE/
-- DELETE: penambahan admin sengaja hanya lewat SQL/service role, bukan API.
drop policy if exists "Admin dapat melihat daftar admin" on public.admins;
create policy "Admin dapat melihat daftar admin"
  on public.admins for select
  using (public.is_superadmin());

-- Seed admin yang sah SEBELUM fungsi diganti, supaya akses tidak terputus.
insert into public.admins (user_id)
select u.id from auth.users u
where coalesce((u.raw_user_meta_data->>'is_admin')::boolean, false) = true
on conflict (user_id) do nothing;

-- is_superadmin() sekarang hanya membaca allowlist. SECURITY DEFINER membuat
-- fungsi ini melewati RLS tabel admins, jadi tidak ada rekursi policy.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
