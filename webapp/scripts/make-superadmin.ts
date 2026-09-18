/**
 * Menjadikan satu akun sebagai superadmin, atau mencabutnya.
 *
 *   npm run superadmin                          -> daftar superadmin saat ini
 *   npm run superadmin -- orang@contoh.com      -> angkat jadi superadmin
 *   npm run superadmin -- orang@contoh.com off  -> cabut
 *
 * Pengganti scripts/create-superadmin.js yang lama: skrip itu memakai
 * @supabase/supabase-js (sudah tidak terpasang), mendaftarkan akun lewat
 * Supabase Auth, dan memuat kata sandi dalam teks polos di dalam berkasnya.
 *
 * Keanggotaan admin sengaja hanya bisa diubah lewat skrip di server, tidak lewat
 * API — sama seperti niat migrasi allowlist aslinya.
 */
import { query } from '../src/lib/db/server';

async function list() {
  const { rows } = await query(
    `SELECT u.email FROM admins a JOIN users u ON u.id = a.user_id ORDER BY u.email`
  );
  if (rows.length === 0) {
    console.log('Belum ada superadmin. Halaman /user/admin tidak bisa diakses siapa pun.');
  } else {
    console.log('Superadmin saat ini:');
    rows.forEach((r) => console.log('  -', r.email));
  }
}

async function main() {
  const email = process.argv[2];
  const off = process.argv[3] === 'off';

  if (!email) {
    await list();
    return;
  }

  const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user) {
    console.error(`Tidak ada pengguna dengan email ${email}`);
    process.exit(1);
  }

  if (off) {
    await query('DELETE FROM admins WHERE user_id = $1', [user.id]);
    console.log(`${email} bukan lagi superadmin.`);
  } else {
    await query(
      'INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [user.id]
    );
    console.log(`${email} sekarang superadmin.`);
  }

  console.log();
  await list();
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Gagal:', e.message);
  process.exit(1);
});
