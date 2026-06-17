'use client';

import React, { useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { ThemeProvider } from '@/contexts/theme-context';
import { AppProvider, useApp } from '@/contexts/app-context';
import { ToastProvider } from '@/components/ui/toast';
import { usePathname } from 'next/navigation';

function DocumentTitle() {
  const pathname = usePathname();
  const { appSettings } = useApp();

  useEffect(() => {
    const segment = pathname.split('/')[1] || 'dashboard';
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const page = label === 'Dashboard' ? 'Overview' : label;
    document.title = `${page} | ${appSettings.document_title}`;
  }, [pathname, appSettings.document_title]);

  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppProvider>
          <DocumentTitle />
          <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] transition-all duration-300">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
              <main className="flex-1 overflow-y-auto no-scrollbar focus:outline-none p-6">
                <div className="max-w-[1440px] mx-auto min-h-full rounded-[var(--radius)] bg-[var(--card)] backdrop-blur-3xl border border-[var(--border)] shadow-2xl px-8 py-6">
                  {children}
                </div>
              </main>
              <MobileNav />
            </div>
          </div>
        </AppProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
