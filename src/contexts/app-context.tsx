'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { workspaceService } from '@/lib/services/workspace/workspace';
import {
  appSettingsService,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from '@/lib/services/user/app-settings.service';
import { idTranslations } from '@/locales/id';
import { enTranslations } from '@/locales/en';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_suspended?: boolean | null;
  language?: string | null;
  plan_expires_at?: string | null;
  plan?: 'free' | 'pro' | null;
  app_name?: string | null;
  app_icon_url?: string | null;
  app_title?: string | null;
  tax_rate?: number | null;
}

interface AppContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [superAdmin, setSuperAdmin] = useState(false);
  
  const bootstrapInProgress = useRef(false);

  const loadAppSettings = useCallback(async () => {
    const settings = await appSettingsService.getSettings();
    setAppSettings(settings);
  }, []);

  const loadSession = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setProfile(null);
      setAccountId(null);
      setSuperAdmin(false);
      return;
    }

    setUser(authUser);

    // Status admin ditanyakan ke DB (RPC is_superadmin -> tabel allowlist admins)
    // supaya sumbernya sama dengan RLS. Sebelumnya ditebak dari pola email di
    // client sehingga UI dan izin sebenarnya bisa berbeda.
    const [{ data: profileRow }, scopeId, { data: isAdmin }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle(),
      workspaceService.getAccountIdForUser(authUser.id),
      supabase.rpc('is_superadmin'),
    ]);

    setSuperAdmin(isAdmin === true);

    if (profileRow) {
      setProfile({
        id: profileRow.id,
        email: profileRow.email ?? authUser.email ?? '',
        full_name: profileRow.full_name,
        avatar_url: profileRow.avatar_url,
        is_suspended: profileRow.is_suspended,
        language: profileRow.language ?? 'id',
        plan_expires_at: (profileRow as { plan_expires_at?: string | null }).plan_expires_at || null,
        plan: (profileRow.plan as 'free' | 'pro') || 'free',
        app_name: profileRow.app_name,
        app_icon_url: profileRow.app_icon_url,
        app_title: profileRow.app_title,
        tax_rate: profileRow.tax_rate,
      });
    } else {
      setProfile({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: (authUser.user_metadata?.full_name as string) ?? null,
        avatar_url: (authUser.user_metadata?.avatar_url as string) ?? null,
        language: 'id',
        plan: 'free',
      });
    }
    setAccountId(scopeId);
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
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        Promise.resolve().then(bootstrap);
      }
    });
    return () => subscription.unsubscribe();
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
        user,
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
