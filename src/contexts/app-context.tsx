'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { getMe } from '@/app/actions/session';
import type { UserProfile } from '@/lib/services/server/user.service';
import { idTranslations } from '@/locales/id';
import { enTranslations } from '@/locales/en';

export type { UserProfile };


interface AppContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  accountId: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  language: string;
  t: (key: string, defaultValue?: string) => string;
  isPro: () => boolean;
  refreshSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [superAdmin, setSuperAdmin] = useState(false);

  const bootstrapInProgress = useRef(false);

  const loadSession = useCallback(async () => {
    const me = await getMe();

    if (!me) {
      setProfile(null);
      setAccountId(null);
      setSuperAdmin(false);
      return;
    }

    setProfile(me.profile);
    setAccountId(me.accountId);
    setSuperAdmin(me.isSuperAdmin);
  }, []);

  const bootstrap = useCallback(async () => {
    if (bootstrapInProgress.current) return;
    bootstrapInProgress.current = true;
    setIsLoading(true);
    try {
      await loadSession();
    } catch (err) {
      console.error('App bootstrap failed:', err);
    } finally {
      setIsLoading(false);
      bootstrapInProgress.current = false;
    }
  }, [loadSession]);

  useEffect(() => {
    Promise.resolve().then(bootstrap);
  }, [bootstrap]);

  // Superadmin selalu dianggap PRO. Tanpa ini pemilik aplikasi ikut terbentur
  // paywall di halaman Insight dan Pinjol — dan satu-satunya jalan membukanya
  // adalah menaikkan paketnya sendiri lewat panel admin, yang menempatkan status
  // langganan palsu di data.
  const isPro = useCallback(
    () => profile?.plan === 'pro' || superAdmin,
    [profile?.plan, superAdmin]
  );
  const activeLanguage = profile?.language || 'id';

  const t = useCallback(
    (key: string, defaultValue?: string) => {
      const dict = activeLanguage === 'en' ? enTranslations : idTranslations;
      return dict[key as keyof typeof dict] || defaultValue || key;
    },
    [activeLanguage]
  );

  return (
    <AppContext.Provider
      value={{
        user: profile ? { id: profile.id, email: profile.email } : null,
        profile,
        accountId,
        isLoading,
        isSuperAdmin: superAdmin,
        language: activeLanguage,
        t,
        isPro,
        refreshSession: loadSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
