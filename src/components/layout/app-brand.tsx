'use client';

import React from 'react';
import { useApp } from '@/contexts/app-context';

interface AppBrandProps {
  collapsed?: boolean;
  showSubtitle?: boolean;
}

export function AppBrand({ collapsed = false, showSubtitle = false }: AppBrandProps) {
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
