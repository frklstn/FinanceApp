/**
 * Menguji konfigurasi SMTP.
 *
 *   npm run check-smtp              -> hanya cek koneksi & kredensial
 *   npm run check-smtp -- <email>   -> plus kirim satu email percobaan
 *
 * Dipisah dari UI supaya salah kredensial ketahuan di sini, bukan lewat
 * halaman lupa kata sandi yang pesan errornya sengaja dibuat samar.
 */
import { verifyTransport, sendMail, isEmailConfigured } from '../src/lib/email';

async function main() {
  if (!isEmailConfigured()) {
    console.error('SMTP belum dikonfigurasi.');
    console.error('Isi di .env.local: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
    process.exit(1);
  }

  console.log(`host   : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
  console.log(`user   : ${process.env.SMTP_USER}`);
  console.log(`from   : ${process.env.SMTP_FROM || process.env.SMTP_USER}`);

  await verifyTransport();
  console.log('\nKoneksi & kredensial OK.');

  const to = process.argv[2];
  if (to) {
    await sendMail(
      to,
      'Tes SMTP FinanceApp',
      'Kalau email ini sampai, konfigurasi SMTP sudah benar.'
    );
    console.log(`Email percobaan terkirim ke ${to}.`);
  } else {
    console.log('Tambahkan alamat email sebagai argumen untuk mengirim email percobaan.');
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('\nGAGAL:', e.message);
  process.exit(1);
});
