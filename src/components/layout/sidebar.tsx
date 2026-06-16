'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';
import { AppBrand } from '@/components/layout/app-brand';
import styles from './sidebar.module.css';
import { navigationItems } from '@/config/navigation';
import { profileService } from '@/lib/services/profile.service';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isSuperAdmin: showAdmin, profile, user, isPro } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);

  const isProPlan = isPro();

  useEffect(() => {
    profileService.getWhatsappContact().then(setWaLink).catch(console.error);
  }, []);

  const menuItems = navigationItems.filter(
    (item) => (!item.isAdmin || showAdmin) && !item.hideFromSidebar
  );

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast('Berhasil keluar!', 'info');
      router.push('/login');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal keluar';
      toast(msg, 'danger');
    }
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : styles.expanded} ${collapsed ? 'w-20' : 'w-64'}`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={styles.toggleBtn}
        type="button"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className={`p-5 ${collapsed ? 'flex justify-center' : ''}`}>
        <AppBrand collapsed={collapsed} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>

        {/* Upgrade to Pro Banner */}
        {!collapsed && !isProPlan && (
          <div className={styles.upgradeCard}>
            <p className={styles.upgradeTitle}>Upgrade ke Pro</p>
            <p className={styles.upgradeDesc}>
              Buka insight lebih dalam dan fitur premium lainnya.
            </p>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.upgradeBtn}>
                Upgrade Sekarang
              </a>
            ) : (
              <button
                type="button"
                className={styles.upgradeBtn}
                onClick={() => toast('Hubungi admin untuk upgrade ke Pro.', 'info')}
              >
                Upgrade Sekarang
              </button>
            )}
          </div>
        )}

        {/* User Info & Quick Logout */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" />
            ) : (
              <span>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className={styles.userMeta}>
                <span className={styles.userName}>{profile?.full_name || user?.email || 'Pengguna'}</span>
                <span className={styles.userPlan}>{isProPlan ? 'Premium Plan' : 'Free Plan'}</span>
              </div>
              {showAdmin && (
                <Link 
                  href="/admin" 
                  className="mt-1 flex items-center gap-1 text-[9px] font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-wider"
                >
                  <ShieldAlert className="w-2.5 h-2.5" />
                  Portal Admin
                </Link>
              )}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 text-text-secondary hover:text-danger transition-colors cursor-pointer"
              title="Keluar"
              type="button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
