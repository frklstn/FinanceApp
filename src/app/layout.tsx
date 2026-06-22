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

import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

const getCachedMetadata = unstable_cache(
  async () => {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
      return data;
    } catch {
      return null;
    }
  },
  ['app-settings-metadata'],
  { revalidate: 3600 } // cache 1 jam
);

export async function generateMetadata(): Promise<Metadata> {
  const data = await getCachedMetadata();
  const appName = data?.app_name || 'FinanceApp';
  const docTitle = data?.document_title || `${appName} - Premium Personal Finance Platform`;
  const appLogo = data?.app_logo_url || '/icon.png';
  
  return {
    title: docTitle,
    description: `${appName} is a modern, premium personal finance app built for speed and aesthetics.`,
    verification: {
      google: 'o-TXeHkwALXfn5qnQJSsXWWMKKyeaLecgAq7e5dfymI',
    },
    icons: {
      icon: appLogo,
    },
  };
}

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
      <body className="min-h-full flex flex-col bg-[var(--nexus-bg-main)] text-[var(--nexus-text-primary)] transition-colors duration-300">
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
