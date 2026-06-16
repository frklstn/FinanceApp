'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useApp } from '@/contexts/app-context';
import '@/styles/components/layout/navbar.css';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Overview',
  transactions: 'Transaksi',
  wallets: 'Dompet',
  budgets: 'Anggaran',
  savings: 'Tabungan',
  debts: 'Pinjam & Utang',
  pinjol: 'Debt Survival',
  reports: 'Laporan',
  settings: 'Pengaturan',
  admin: 'Superadmin',
};

export default function Navbar() {
  const pathname = usePathname();
  const { profile, appSettings } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const pathKey = pathname.split('/')[1] || 'dashboard';
  const pageTitle = PAGE_TITLES[pathKey] ?? appSettings.app_name;

  const userName = profile?.full_name || 'User';
  const avatarUrl = profile?.avatar_url || '';

  return (
    <header className="navbar">
      <div className="flex-1" />

      <div className="navbar-right-area">
        <div className="navbar-quick-actions">
          <div className="navbar-notification-wrapper">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="navbar-notification-btn"
              title="Notifications"
            >
              <Bell className="navbar-notification-icon" />
              <span className="navbar-notification-badge" />
            </button>

            {showNotifications && (
              <div className="navbar-popover">
                <div className="navbar-popover-header">
                  <span className="navbar-popover-title">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    Notifikasi
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="navbar-popover-clear"
                  >
                    Tutup
                  </button>
                </div>
                <div className="navbar-popover-body">
                  Semua sudah dibaca.
                  <p className="navbar-popover-subtext">Tidak ada alert baru saat ini.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-divider" />

        <div className="navbar-user-card">
          <div className="navbar-user-details">
            <span className="navbar-user-name">{userName}</span>
          </div>
          {avatarUrl ? (
            <div className="navbar-avatar-image">
              <img src={avatarUrl} alt={userName} />
            </div>
          ) : (
            <div className="navbar-avatar-fallback">{userName.substring(0, 1).toUpperCase()}</div>
          )}
        </div>
      </div>
    </header>
  );
}
