'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  LogOut,
} from 'lucide-react';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import styles from './mobile-nav.module.css';
import { navigationItems, mobileBottomBarPaths } from '@/config/navigation';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isSuperAdmin: showAdmin } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = navigationItems.filter((item) => mobileBottomBarPaths.includes(item.path));
  const drawerItems = navigationItems.filter(
    (item) =>
      !mobileBottomBarPaths.includes(item.path) &&
      (!item.isAdmin || showAdmin) &&
      item.path !== '/wallets'
  );

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast('Berhasil keluar!', 'info');
      setIsMoreOpen(false);
      router.push('/login');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal keluar';
      toast(msg, 'danger');
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path) && !isMoreOpen;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <Icon className="w-5.5 h-5.5 shrink-0 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium uppercase">{item.name}</span>
            </Link>
          );
        })}

        {/* "More" Trigger Tab */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
            isMoreOpen
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-white/30 hover:text-white'
          }`}
        >
          <Menu className="w-5.5 h-5.5 shrink-0 mb-0.5" />
          <span className="text-[10px] tracking-tight font-medium uppercase">Lainnya</span>
        </button>
      </nav>

      {/* Backdrop overlay */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-45 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* Premium Glassmorphic Bottom-sheet Drawer */}
      <div
        className={`${styles.drawer} ${isMoreOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-light-text-primary dark:text-dark-text-primary">
              Menu Utama
            </h3>
            <p className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
              Akses cepat ke fitur tambahan lainnya
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMoreOpen(false)}
            className="text-xs font-bold text-light-text-secondary hover:text-light-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary px-3 py-1.5 bg-light-bg dark:bg-dark-bg/60 rounded-xl cursor-pointer transition-all duration-150"
          >
            Tutup
          </button>
        </div>

        {/* Features Navigation Grid */}
        <div className="grid grid-cols-3 gap-3.5 mb-8">
          {drawerItems.map((item) => {
            const Icon = item.icon;
            const isPinjol = item.path === '/pinjol';
            const isAdminItem = item.isAdmin;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMoreOpen(false)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-150 group ${
                  isAdminItem
                    ? 'bg-danger/5 dark:bg-danger/10 border-danger/20 hover:bg-danger/10'
                    : 'bg-light-bg/40 dark:bg-dark-bg/35 border-light-border dark:border-dark-border/40 hover:bg-light-bg dark:hover:bg-dark-bg/65'
                }`}
              >
                <Icon
                  className={`w-6 h-6 group-hover:scale-110 transition-transform duration-150 ${
                    isPinjol ? 'text-warning' : isAdminItem ? 'text-danger' : 'text-primary'
                  }`}
                />
                <span
                  className={`text-xs font-bold mt-2 text-center leading-tight ${
                    isAdminItem ? 'text-danger' : 'text-light-text-primary dark:text-dark-text-primary'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Log Out CTA */}
        <div className="pt-4 border-t border-light-border/40 dark:border-dark-border/40">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl text-sm font-bold text-danger bg-danger/10 hover:bg-danger/25 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </div>
    </>
  );
}
