'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { getMe, getAppSettings } from '@/app/actions/session';
import type { UserProfile } from '@/lib/services/server/user.service';
import type { AppSettings } from '@/lib/services/server/app-settings.service';
import { idTranslations } from '@/locales/id';
import { enTranslations } from '@/locales/en';

export type { UserProfile };

// Duplikat kecil dari nilai default di app-settings.service.ts (bukan diimpor):
// service itu 'server-only' dan mengimpor 'pg', jadi import value darinya ke
// context client ini akan menyeret 'pg' ke bundle browser.
const DEFAULT_APP_SETTINGS: AppSettings = {
  app_name: 'FinanceApp',
  app_logo_url: null,
  document_title: 'FinanceApp - Premium Personal Finance Platform',
};

interface AppContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  accountId: string | null;
  appSettings: AppSettings;
  isLoading: boolean;
  isSuperAdmin: boolean;
  language: string;
  t: (key: string, defaultValue?: string) => string;
  isPro: () => boolean;
  refreshAppSettings: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [superAdmin, setSuperAdmin] = useState(false);

  const bootstrapInProgress = useRef(false);

  const loadAppSettings = useCallback(async () => {
    const settings = await getAppSettings();
    setAppSettings(settings);
  }, []);

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
      await Promise.all([loadSession(), loadAppSettings()]);
    } catch (err) {
      console.error('App bootstrap failed:', err);
    } finally {
      setIsLoading(false);
      bootstrapInProgress.current = false;
    }
  }, [loadSession, loadAppSettings]);

  useEffect(() => {
    Promise.resolve().then(bootstrap);
  }, [bootstrap]);

  const isPro = useCallback(() => profile?.plan === 'pro', [profile?.plan]);
  const activeLanguage = profile?.language || 'id';

  const t = useCallback(
    (key: string, defaultValue?: string) => {
      const dict = activeLanguage === 'en' ? enTranslations : idTranslations;
      return dict[key as keyof typeof dict] || defaultValue || key;
    },
    [activeLanguage]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeTitle = (isPro() && profile?.app_title)
        ? profile.app_title
        : (appSettings.document_title || 'FinanceApp');
      document.title = activeTitle;
    }
  }, [isPro, profile, appSettings]);

  return (
    <AppContext.Provider
      value={{
        user: profile ? { id: profile.id, email: profile.email } : null,
        profile,
        accountId,
        appSettings,
        isLoading,
        isSuperAdmin: superAdmin,
        language: activeLanguage,
        t,
        isPro,
        refreshAppSettings: loadAppSettings,
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
