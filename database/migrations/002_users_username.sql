-- Login dengan nama pengguna.
--
-- Sebelumnya form login bertuliskan "Username" tetapi input-nya type="email"
-- dan pencocokan hanya lewat kolom email, jadi fiturnya tidak pernah ada.
--
-- Nullable: akun lama (termasuk yang dibuat lewat Google OAuth) tidak punya
-- username dan tetap masuk pakai email.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

-- Unik tanpa membedakan huruf besar-kecil, supaya "Budi" dan "budi" tidak
-- bisa jadi dua akun berbeda.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON public.users (lower(username));
