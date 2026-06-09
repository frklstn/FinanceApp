'use client';

import React from 'react';
import { useApp } from '@/contexts/app-context';

interface AppBrandProps {
  collapsed?: boolean;
  showSubtitle?: boolean;
}

export function AppBrand({ collapsed = false, showSubtitle = false }: AppBrandProps) {
  const { appSettings } = useApp();
  const { app_name, app_logo_url } = appSettings;

  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
      {app_logo_url ? (
        <div className="w-9 h-9 rounded-xl border border-light-border/40 dark:border-dark-border/40 overflow-hidden flex items-center justify-center shrink-0 bg-white dark:bg-transparent">
          <img src={app_logo_url} alt={app_name} className="w-full h-full object-contain p-1" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-info flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4.5 h-4.5 text-white"
          >
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
          </svg>
        </div>
      )}
      {!collapsed && (
        <div className="min-w-0">
          <span className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary tracking-tight block truncate">
            {app_name === 'FinanceApp' ? (
              <>
                Finance<span className="text-primary font-extrabold">App</span>
              </>
            ) : (
              app_name
            )}
          </span>
          {showSubtitle && (
            <span className="text-[10px] font-semibold text-light-text-secondary dark:text-dark-text-secondary">
              Personal Finance
            </span>
          )}
        </div>
      )}
    </div>
  );
}
