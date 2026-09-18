/**
 * Menerbitkan tautan penggantian kata sandi untuk satu email.
 *
 * Dipakai selama belum ada layanan pengirim email. Tautannya diserahkan ke
 * pengguna lewat jalur lain (WhatsApp, dsb) — sengaja TIDAK dicetak ke log
 * server, karena token di log server adalah masalah yang sama dengan token
 * Google yang baru saja dibersihkan dari callback OAuth.
 *
 *   npm run reset-link -- orang@contoh.com
 *
 * Token berlaku 1 jam dan sekali pakai (dihapus oleh updatePassword).
 */
import { setResetToken } from '../src/lib/db/user.repo';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Pemakaian: npm run reset-link -- <email>');
    process.exit(1);
  }

  const token = await setResetToken(email);
  if (!token) {
    // Pesannya boleh gamblang: ini alat admin di server, bukan endpoint publik
    // yang bisa dipakai menebak email mana yang terdaftar.
    console.error(`Tidak ada pengguna dengan email ${email}`);
    process.exit(1);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`\nTautan untuk ${email} (berlaku 1 jam, sekali pakai):\n`);
  console.log(`${base}/reset-password?token=${token}\n`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Gagal:', e.message);
  process.exit(1);
});
