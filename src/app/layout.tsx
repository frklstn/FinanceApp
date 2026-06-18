import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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
  description: 'FinanceApp is a modern, premium personal finance app built for speed and aesthetics.',
  verification: {
    google: 'o-TXeHkwALXfn5qnQJSsXWWMKKyeaLecgAq7e5dfymI',
  },
};

import { ThemeProvider } from '@/contexts/theme-context';
import { AppProvider } from '@/contexts/app-context';
import { ToastProvider } from '@/components/ui/toast';

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
        <ThemeProvider>
          <ToastProvider>
            <AppProvider>
              {children}
              <Analytics />
            </AppProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
