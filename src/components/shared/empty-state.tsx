'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Tombol aksi utama. Tanpa ini hanya pesan yang tampil. */
  actionLabel?: string;
  onAction?: () => void;
  /** Kelas tambahan, dipakai untuk merentang penuh di dalam grid. */
  className?: string;
}

/**
 * Keadaan kosong standar untuk daftar.
 *
 * Sebelumnya tiap halaman menulis sendiri: anggaran memakai py-20 + border
 * dashed + radius 40px, pinjol memakai p-12 tanpa border dan radius 24px, dan
 * tabungan tidak punya sama sekali -- daftar kosong hanya menyisakan ruang
 * hampa tanpa penjelasan.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-card)] text-[var(--nexus-text-muted)]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="font-heading text-base font-semibold tracking-tight text-[var(--nexus-text-primary)]">
          {title}
        </h4>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-[var(--nexus-text-secondary)]">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <Button variant="nexus-emerald" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
