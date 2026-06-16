'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { accountService } from '@/lib/services/account.service';
import {
  appSettingsService,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from '@/lib/services/app-settings.service';
import { isSuperAdmin } from '@/lib/auth/admin';
import { idTranslations } from '@/locales/id';
import { enTranslations } from '@/locales/en';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_suspended?: boolean | null;
  language?: string | null;
}

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  /** Internal scope id (maps to workspace_id in DB). */
  accountId: string | null;
  appSettings: AppSettings;
  isLoading: boolean;
  isSuperAdmin: boolean;
  userPlan: 'free' | 'pro';
  userBranding: {
    app_name: string | null;
    app_icon_url: string | null;
    app_title: string | null;
  } | null;
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
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [userBranding, setUserBranding] = useState<{
    app_name: string | null;
    app_icon_url: string | null;
    app_title: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAppSettings = useCallback(async () => {
    const settings = await appSettingsService.getSettings();
    setAppSettings(settings);
  }, []);

  const loadSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setProfile(null);
      setAccountId(null);
      setUserPlan('free');
      setUserBranding(null);
      return;
    }

    setUser(authUser);

    const [{ data: profileRow }, scopeId] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_suspended, plan, app_name, app_icon_url, app_title, language')
        .eq('id', authUser.id)
        .maybeSingle(),
      accountService.getAccountIdForUser(authUser.id),
    ]);

    if (profileRow) {
      setProfile({
        id: profileRow.id,
        email: profileRow.email ?? authUser.email ?? '',
        full_name: profileRow.full_name,
        avatar_url: profileRow.avatar_url,
        is_suspended: profileRow.is_suspended,
        language: profileRow.language ?? 'id',
      });
      setUserPlan((profileRow.plan as 'free' | 'pro') ?? 'free');
      setUserBranding({
        app_name: profileRow.app_name ?? null,
        app_icon_url: profileRow.app_icon_url ?? null,
        app_title: profileRow.app_title ?? null,
      });
    } else {
      setProfile({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: (authUser.user_metadata?.full_name as string) ?? null,
        avatar_url: (authUser.user_metadata?.avatar_url as string) ?? null,
        language: 'id',
      });
      setUserPlan('free');
      setUserBranding(null);
    }
    setAccountId(scopeId);
  }, []);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadSession(), loadAppSettings()]);
    } catch (err) {
      console.error('App bootstrap failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadSession, loadAppSettings]);

  useEffect(() => {
    Promise.resolve().then(bootstrap);
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        Promise.resolve().then(bootstrap);
      }
    });
    return () => subscription.unsubscribe();
  }, [bootstrap]);

  const superAdmin = useMemo(() => isSuperAdmin(user), [user]);
  const isPro = useCallback(() => userPlan === 'pro', [userPlan]);
  const isProUser = isPro();

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
      const activeTitle = (isProUser && userBranding?.app_title)
        ? userBranding.app_title
        : (appSettings.document_title || 'FinanceApp');
      document.title = activeTitle;
    }
  }, [isProUser, userBranding, appSettings]);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        accountId,
        appSettings,
        isLoading,
        isSuperAdmin: superAdmin,
        userPlan,
        userBranding,
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

/** @deprecated Use useApp().accountId */
export function useAccountId(): string | null {
  return useApp().accountId;
}
