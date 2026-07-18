'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  /** Teks judul utama. */
  title: React.ReactNode;
  /** Bagian judul yang diberi warna aksen, dirender setelah title. */
  accent?: React.ReactNode;
  /** Kalimat pendek di bawah judul. */
  subtitle?: string;
  /** Tombol aksi di sisi kanan. */
  actions?: React.ReactNode;
}

/**
 * Header standar semua halaman dashboard.
 *
 * Sebelumnya tiap halaman menulis header sendiri sehingga skala judul terpecah
 * (text-2xl/text-3xl/text-4xl/text-5xl), sebagian memakai serif dan sebagian
 * tidak, subtitle punya lima varian tracking, dan dua halaman bahkan tidak
 * punya <h1>. Semua halaman kini memakai komponen ini.
 */
export function PageHeader({ title, accent, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-heading text-2xl md:text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tight"
        >
          {title}
          {accent ? <span className="text-[var(--nexus-emerald)]"> {accent}</span> : null}
        </motion.h1>
        {subtitle ? (
          <p className="text-xs text-[var(--nexus-text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {/* flex-wrap: tanpa ini deretan aksi yang lebih lebar dari layar hp
          meluber keluar, bukan turun ke baris berikutnya. */}
      {actions ? <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">{actions}</div> : null}
    </header>
  );
}
