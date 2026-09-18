import type { Metadata } from 'next';
import '@/styles/global.css';

import { BRAND } from '@/lib/branding';
import { ThemeProvider } from '@/contexts/theme-context';
import { AppProvider } from '@/contexts/app-context';
import { ToastProvider } from '@/components/ui/toast';

// Statis. Sebelumnya judul dibaca dari tabel app_settings lewat
// generateMetadata(), yang berarti satu query database untuk nilai yang tidak
// pernah berubah — dan membuat setiap halaman jadi dinamis.
export const metadata: Metadata = {
  title: BRAND.documentTitle,
  description: `${BRAND.name} — aplikasi keuangan pribadi: catat transaksi, atur anggaran, pantau cicilan.`,
  verification: {
    google: 'o-TXeHkwALXfn5qnQJSsXWWMKKyeaLecgAq7e5dfymI',
  },
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-light-bg dark:bg-dark-bg transition-colors duration-300">
        <ThemeProvider>
          <ToastProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
