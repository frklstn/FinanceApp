'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Wallet,
  HandCoins,
  AlertTriangle,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isSuperAdmin: showAdmin } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Anggaran', path: '/budgets', icon: PieChart },
    { name: 'Tabungan', path: '/savings', icon: Target },
  ];

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-light-card/90 dark:bg-dark-card/90 backdrop-blur-lg border-t border-light-border dark:border-dark-border px-2 py-1.5 flex items-center justify-around shadow-2xl safe-bottom">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path) && !isMoreOpen;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-primary font-bold scale-105'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
              }`}
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
              ? 'text-primary font-bold scale-105'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
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
        className={`fixed bottom-0 left-0 right-0 z-50 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl border-t border-light-border dark:border-dark-border rounded-t-3xl p-6 shadow-2xl transition-all duration-300 ease-out transform ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-full'
        } max-h-[80vh] overflow-y-auto pb-28`}
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
          <Link
            href="/wallets"
            onClick={() => setIsMoreOpen(false)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-light-bg/40 dark:bg-dark-bg/35 border border-light-border dark:border-dark-border/40 hover:bg-light-bg dark:hover:bg-dark-bg/65 transition-all duration-150 group"
          >
            <Wallet className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-150" />
            <span className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary mt-2 text-center">
              Dompet
            </span>
          </Link>

          <Link
            href="/debts"
            onClick={() => setIsMoreOpen(false)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-light-bg/40 dark:bg-dark-bg/35 border border-light-border dark:border-dark-border/40 hover:bg-light-bg dark:hover:bg-dark-bg/65 transition-all duration-150 group"
          >
            <HandCoins className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-150" />
            <span className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary mt-2 text-center leading-tight">
              Utang & Piutang
            </span>
          </Link>

          <Link
            href="/pinjol"
            onClick={() => setIsMoreOpen(false)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-light-bg/40 dark:bg-dark-bg/35 border border-light-border dark:border-dark-border/40 hover:bg-light-bg dark:hover:bg-dark-bg/65 transition-all duration-150 group"
          >
            <AlertTriangle className="w-6 h-6 text-warning group-hover:scale-110 transition-transform duration-150" />
            <span className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary mt-2 text-center leading-tight">
              Pinjol Tracker
            </span>
          </Link>

          <Link
            href="/reports"
            onClick={() => setIsMoreOpen(false)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-light-bg/40 dark:bg-dark-bg/35 border border-light-border dark:border-dark-border/40 hover:bg-light-bg dark:hover:bg-dark-bg/65 transition-all duration-150 group"
          >
            <BarChart3 className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-150" />
            <span className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary mt-2 text-center">
              Laporan
            </span>
          </Link>

          <Link
            href="/settings"
            onClick={() => setIsMoreOpen(false)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-light-bg/40 dark:bg-dark-bg/35 border border-light-border dark:border-dark-border/40 hover:bg-light-bg dark:hover:bg-dark-bg/65 transition-all duration-150 group"
          >
            <Settings className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-150" />
            <span className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary mt-2 text-center">
              Pengaturan
            </span>
          </Link>

          {showAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsMoreOpen(false)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-danger/5 dark:bg-danger/10 border border-danger/20 hover:bg-danger/10 transition-all duration-150 group"
            >
              <ShieldAlert className="w-6 h-6 text-danger group-hover:scale-110 transition-transform duration-150" />
              <span className="text-xs font-bold text-danger mt-2 text-center">
                Admin
              </span>
            </Link>
          )}
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
