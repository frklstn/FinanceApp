import { Landing } from '@/components/landing/landing';

export const dynamic = 'force-dynamic';

/**
 * /login memakai halaman yang sama dengan '/', hanya saja form login langsung
 * terbuka. Sebelumnya ini halaman terpisah dengan desain berbeda dan handler
 * login yang diduplikasi. Route-nya dipertahankan karena middleware, tombol
 * keluar, serta /auth/callback masih mengarah ke sini.
 */
export default function LoginPage() {
  return <Landing openLogin />;
}
