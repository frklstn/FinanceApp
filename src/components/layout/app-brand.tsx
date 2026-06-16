'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/app-context';

interface AppBrandProps {
  collapsed?: boolean;
  showSubtitle?: boolean;
}

export function AppBrand({ collapsed = false, showSubtitle = false }: AppBrandProps) {
  const { appSettings, isPro, userBranding } = useApp();
  const isProUser = isPro();
  const [imgError, setImgError] = useState(false);

  const app_name = (isProUser && userBranding?.app_name)
    ? userBranding.app_name
    : (appSettings.app_name || 'FinanceApp');

  const app_logo_url = (isProUser && userBranding?.app_icon_url)
    ? userBranding.app_icon_url
    : appSettings.app_logo_url;

  const [prevLogoUrl, setPrevLogoUrl] = useState(app_logo_url);

  if (app_logo_url !== prevLogoUrl) {
    setPrevLogoUrl(app_logo_url);
    setImgError(false);
  }

  // AppBrand now only returns subtitle or nothing as requested for sidebar
  if (collapsed) return null;

  return (
    <div className="flex items-center gap-2.5">
      {showSubtitle && (
        <div className="min-w-0">
          <span className="text-[10px] font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-widest opacity-50">
            Personal Finance
          </span>
        </div>
      )}
    </div>
  );
}
