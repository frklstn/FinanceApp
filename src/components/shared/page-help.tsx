'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface PageHelpProps {
  /** Poin-poin instruksi singkat. */
  items: React.ReactNode[];
  title?: string;
}

/**
 * Panduan singkat per halaman. Collapsible dan default tertutup supaya tidak
 * mengganggu. Bukan modal -- hanya panel bantuan ringan di bawah judul halaman.
 */
export function PageHelp({ items, title = 'Cara pakai halaman ini' }: PageHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)]/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--nexus-text-secondary)] hover:text-[var(--nexus-text-primary)] transition-colors cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-[var(--nexus-emerald)] shrink-0" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="px-4 pb-4 pl-11 space-y-1.5 text-sm text-[var(--nexus-text-secondary)] list-disc marker:text-[var(--nexus-emerald)]">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
