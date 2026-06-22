'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/shared/layout/sidebar';

const MobileNav = dynamic(() => import('@/components/shared/layout/mobile-nav'), { ssr: false });

import { useApp } from '@/contexts/app-context';
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
    <>
      <DocumentTitle />
      <div className="flex h-screen overflow-hidden bg-[var(--nexus-bg-main)] text-[var(--nexus-text-primary)] transition-all duration-300">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative md:pl-[84px]">
          <main className="flex-1 overflow-y-auto no-scrollbar focus:outline-none py-10 px-6 md:px-12 bg-[var(--nexus-bg-main)]">
            <div className="max-w-[1600px] mx-auto min-h-full pb-24 md:pb-0">
              {children}
            </div>
          </main>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </>
  );
}
