/**
 * Cek alur pemulihan kata sandi terhadap database sungguhan.
 *
 *   npm run test:auth
 *
 * Kata sandi user uji dikembalikan ke hash semula di blok finally.
 */
import assert from 'node:assert';
import {
  setResetToken, getUserByResetToken, updatePassword, getUserByEmail, createUser,
  getUserByUsername, getUserByIdentifier,
} from '../src/lib/db/user.repo';
import { createWorkspaceForUser } from '../src/lib/db/profile.repo';
import { workspaceService } from '../src/lib/services/server/workspace';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import { query } from '../src/lib/db/server';

const EMAIL = 'ifalfahlevi4@gmail.com';
const NEW_EMAIL = '__uji_daftar@contoh.invalid';

/**
 * Daftar akun baru persis seperti yang dilakukan server action register():
 * buat user, buat workspace + profil + keanggotaan. Yang diuji integrasinya,
 * bukan validasi zod-nya (itu murni dan sepele).
 */
async function ujiPendaftaran() {
  await query('DELETE FROM users WHERE email = $1', [NEW_EMAIL]);

  const user = await createUser(NEW_EMAIL, await hashPassword('sandi-daftar-123'));
  const workspaceId = await createWorkspaceForUser(user.id, NEW_EMAIL, 'Uji Daftar');
  assert.ok(workspaceId, 'pendaftaran harus menghasilkan workspace');

  // Akun baru langsung punya scope yang bisa dipakai requireAccount().
  assert.strictEqual(
    await workspaceService.getActiveAccountForUser(user.id), workspaceId,
    'akun baru harus langsung punya scope aktif'
  );

  // Masuk dengan kata sandi yang benar & yang salah.
  const found = await getUserByEmail(NEW_EMAIL);
  assert.ok(await verifyPassword('sandi-daftar-123', found!.password_hash), 'kata sandi benar harus diterima');
  assert.ok(!(await verifyPassword('salah', found!.password_hash)), 'kata sandi salah harus ditolak');

  // Email ganda terdeteksi (dipakai register() untuk pesan yang jelas).
  assert.ok(await getUserByEmail(NEW_EMAIL), 'email terdaftar harus terdeteksi sebagai duplikat');

  await query('DELETE FROM users WHERE email = $1', [NEW_EMAIL]);
  assert.strictEqual(await getUserByEmail(NEW_EMAIL), null, 'user uji harus terhapus');
}

/** Login boleh pakai email ATAU username, keduanya tidak peduli huruf besar-kecil. */
async function ujiLoginUsername() {
  await query('DELETE FROM users WHERE email = $1', [NEW_EMAIL]);

  const user = await createUser(NEW_EMAIL, await hashPassword('sandi-uji-12345'), 'UjiBudi');
  try {
    assert.strictEqual((await getUserByIdentifier(NEW_EMAIL))?.id, user.id, 'login pakai email');
    assert.strictEqual((await getUserByIdentifier('UjiBudi'))?.id, user.id, 'login pakai username');
    assert.strictEqual((await getUserByIdentifier('ujibudi'))?.id, user.id, 'username tidak peduli huruf besar-kecil');
    assert.strictEqual((await getUserByIdentifier(NEW_EMAIL.toUpperCase()))?.id, user.id, 'email tidak peduli huruf besar-kecil');
    assert.strictEqual(await getUserByIdentifier('tidak-ada-sama-sekali'), null, 'identitas asing harus null');
    assert.strictEqual((await getUserByUsername('UJIBUDI'))?.id, user.id, 'getUserByUsername case-insensitive');

    // Username ganda ditolak indeks unik.
    await assert.rejects(
      () => createUser('lain@contoh.invalid', 'x', 'ujibudi'),
      /duplicate|unique/i,
      'username ganda harus ditolak database'
    );
  } finally {
    await query('DELETE FROM users WHERE email = ANY($1)', [[NEW_EMAIL, 'lain@contoh.invalid']]);
  }
}

async function main() {
  const before = await getUserByEmail(EMAIL);
  assert.ok(before, 'user uji harus ada');
  const originalHash = before.password_hash;

  try {
    // Email yang tidak terdaftar tidak menghasilkan token.
    assert.strictEqual(
      await setResetToken('tidak-ada@contoh.invalid'), null,
      'email asing tidak boleh dapat token'
    );

    // Token asal-asalan ditolak.
    assert.strictEqual(
      await getUserByResetToken('token-ngawur'), null,
      'token ngawur harus ditolak'
    );

    // Alur normal: terbitkan token, tukar jadi user.
    const token = await setResetToken(EMAIL);
    assert.ok(token, 'email terdaftar harus dapat token');
    const found = await getUserByResetToken(token!);
    assert.strictEqual(found?.id, before.id, 'token harus mengarah ke user yang benar');

    // Ganti kata sandi, lalu token harus mati (sekali pakai).
    await updatePassword(before.id, await hashPassword('sandi-baru-uji-123'));
    assert.strictEqual(
      await getUserByResetToken(token!), null,
      'token harus hangus setelah dipakai'
    );

    // Kata sandi baru benar-benar berlaku.
    const after = await getUserByEmail(EMAIL);
    assert.ok(await verifyPassword('sandi-baru-uji-123', after!.password_hash), 'kata sandi baru harus cocok');
    assert.ok(!(await verifyPassword('sandi-lama-salah', after!.password_hash)), 'kata sandi salah harus ditolak');

    // Token kedaluwarsa ditolak.
    const t2 = await setResetToken(EMAIL);
    await query(
      "UPDATE users SET reset_token_expires = NOW() - INTERVAL '1 minute' WHERE email = $1",
      [EMAIL]
    );
    assert.strictEqual(
      await getUserByResetToken(t2!), null,
      'token kedaluwarsa harus ditolak'
    );

    await ujiPendaftaran();
    await ujiLoginUsername();

    console.log('SEMUA CEK AUTH LULUS');
  } finally {
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE email = $2',
      [originalHash, EMAIL]
    );
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error('GAGAL:', e.message); process.exit(1); });
