import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/global.css';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FinanceApp - Premium Personal Finance Platform',
  description: 'Aplikasi keuangan pribadi untuk dompet, transaksi, anggaran, tabungan, dan utang.',
  verification: {
    google: 'o-TXeHkwALXfn5qnQJSsXWWMKKyeaLecgAq7e5dfymI',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-light-bg dark:bg-dark-bg transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
