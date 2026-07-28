'use server';

import { deleteSession } from '@/lib/auth/session';
import { getUserByResetToken, updatePassword, setResetToken } from '@/lib/db/user.repo';
import { hashPassword } from '@/lib/auth/password';
import { sendMail, isEmailConfigured } from '@/lib/email';

/**
 * Menghapus cookie sesi.
 *
 * Sebelumnya tombol keluar hanya memanggil router.push('/login') dan menampilkan
 * toast "Berhasil keluar!" — panggilan signOut Supabase-nya dikomentari saat
 * migrasi dan tidak pernah diganti. Cookie tetap valid tujuh hari, jadi cukup
 * membuka kembali situsnya untuk masuk lagi.
 */
export async function logoutAction(): Promise<void> {
  await deleteSession();
}

/**
 * Menerbitkan token pemulihan lalu mengirimkan tautannya lewat email.
 *
 * Jawabannya sengaja sama persis baik emailnya terdaftar maupun tidak. Kalau
 * dibedakan, halaman ini jadi alat untuk menebak email mana yang punya akun.
 */
export async function requestPasswordResetAction(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return { ok: false, error: 'Email wajib diisi.' };

  // Ini kondisi salah konfigurasi server, bukan soal email pengguna — jadi boleh
  // dan memang harus dibedakan, supaya tidak kembali menampilkan sukses palsu.
  if (!isEmailConfigured()) {
    return { ok: false, error: 'Pengiriman email belum dikonfigurasi di server.' };
  }

  const token = await setResetToken(clean);

  if (token) {
    const base = process.env.NEXT_PUBLIC_APP_URL || '';
    const link = `${base}/reset-password?token=${token}`;

    try {
      await sendMail(
        clean,
        'Pemulihan kata sandi FinanceApp',
        `Buka tautan berikut untuk mengganti kata sandimu (berlaku 1 jam, sekali pakai):\n\n${link}\n\nKalau kamu tidak meminta ini, abaikan saja email ini.`,
        `<p>Buka tautan berikut untuk mengganti kata sandimu. Berlaku 1 jam dan hanya bisa dipakai sekali.</p>
         <p><a href="${link}">${link}</a></p>
         <p>Kalau kamu tidak meminta ini, abaikan saja email ini.</p>`
      );
    } catch (err) {
      // Jangan bocorkan detail SMTP ke pengguna, tapi jangan pula mengaku sukses.
      console.error('Gagal mengirim email pemulihan:', err instanceof Error ? err.message : 'unknown');
      return { ok: false, error: 'Gagal mengirim email. Coba lagi nanti.' };
    }
  }

  return { ok: true };
}

/**
 * Mengganti kata sandi memakai token pemulihan.
 *
 * Sebelumnya halaman reset menerima kata sandi baru, menampilkan "Password
 * berhasil diperbarui!", lalu mengalihkan ke dashboard — tanpa token, tanpa sesi,
 * dan tanpa menyentuh database sama sekali.
 *
 * Token diverifikasi di `getUserByResetToken` (sekaligus mengecek kedaluwarsa),
 * dan `updatePassword` menghapus tokennya sehingga sekali pakai.
 *
 * Catatan: sesi yang sudah terbit tidak ikut dibatalkan. Sesi berupa JWT tanpa
 * penyimpanan di server, jadi pembatalan butuh daftar-cabut atau nomor versi di
 * profil. Belum dikerjakan.
 */
export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) return { ok: false, error: 'Tautan pemulihan tidak sah.' };

  // Divalidasi ulang di server: aturan panjang di client cuma bantuan pengisian,
  // bukan penjaga.
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { ok: false, error: 'Kata sandi minimal 8 karakter.' };
  }

  const user = await getUserByResetToken(token);
  if (!user) {
    return { ok: false, error: 'Tautan pemulihan sudah kedaluwarsa atau tidak berlaku.' };
  }

  await updatePassword(user.id, await hashPassword(newPassword));
  return { ok: true };
}
