import 'server-only';
import nodemailer from 'nodemailer';

/**
 * Pengirim email lewat SMTP.
 *
 * Dulu pengiriman email ditangani Supabase Auth. Setelah pindah ke Postgres
 * lokal, layanan itu ikut hilang dan tidak pernah diganti — akibatnya halaman
 * lupa kata sandi menampilkan "tautan sudah dikirim" tanpa mengirim apa pun.
 *
 * Kredensial diambil dari env, jadi tidak terikat penyedia tertentu (Gmail,
 * mail server sendiri, relay mana pun sama saja).
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 memakai TLS implisit; 587 mulai polos lalu naik ke STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('SMTP belum dikonfigurasi (butuh SMTP_HOST, SMTP_USER, SMTP_PASS).');
  }

  await getTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

/** Cek koneksi & kredensial tanpa mengirim apa pun. Dipakai skrip diagnosa. */
export async function verifyTransport(): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('SMTP belum dikonfigurasi (butuh SMTP_HOST, SMTP_USER, SMTP_PASS).');
  }
  await getTransport().verify();
}
