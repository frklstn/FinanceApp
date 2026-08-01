/**
 * Menetapkan nama pengguna untuk akun yang sudah ada.
 *
 *   npm run username                          -> daftar akun & username-nya
 *   npm run username -- <email> <username>    -> tetapkan
 *   npm run username -- <email> ""            -> hapus username
 *
 * Akun lama dibuat sebelum kolom username ada, jadi butuh jalan ini sekali.
 */
import { query } from '../src/lib/db/server';

async function list() {
  const { rows } = await query('SELECT email, username FROM users ORDER BY email');
  rows.forEach((r) => console.log(`  ${r.email}  ->  ${r.username || '(belum ada)'}`));
}

async function main() {
  const email = process.argv[2];
  const username = process.argv[3];

  if (!email) {
    console.log('Akun terdaftar:');
    await list();
    return;
  }

  const { rows } = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  if (rows.length === 0) {
    console.error(`Tidak ada pengguna dengan email ${email}`);
    process.exit(1);
  }

  if (username === undefined) {
    console.error('Pemakaian: npm run username -- <email> <username>');
    process.exit(1);
  }

  const value = username.trim() || null;
  if (value && !/^[a-zA-Z0-9._-]{3,30}$/.test(value)) {
    console.error('Username 3-30 karakter: huruf, angka, titik, garis bawah, atau strip.');
    process.exit(1);
  }

  if (value) {
    const { rows: taken } = await query(
      'SELECT 1 FROM users WHERE lower(username) = lower($1) AND id <> $2',
      [value, rows[0].id]
    );
    if (taken.length > 0) {
      console.error(`Username "${value}" sudah dipakai akun lain.`);
      process.exit(1);
    }
  }

  await query('UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2', [value, rows[0].id]);
  console.log(value ? `${email} sekarang bisa login sebagai "${value}".` : `Username ${email} dihapus.`);
  console.log();
  await list();
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Gagal:', e.message);
  process.exit(1);
});
