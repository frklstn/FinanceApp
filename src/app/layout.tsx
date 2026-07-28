import type { Metadata } from 'next';
import '@/styles/global.css';

import { appSettingsService } from '@/lib/services/server/app-settings.service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await appSettingsService.getSettings();
  const appName = settings.app_name || 'FinanceApp';
  const docTitle = settings.document_title || 'FinanceApp - Premium Personal Finance Platform';
  return {
    title: docTitle,
    description: `${appName} is a modern, premium personal finance app built for speed and aesthetics.`,
    verification: {
      google: 'o-TXeHkwALXfn5qnQJSsXWWMKKyeaLecgAq7e5dfymI',
    },
    icons: {
      icon: '/icon.png',
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
