'use client';

import React, { useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { LoanTracker } from '@/lib/debt-planner/types';

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type Marker = 'paid' | 'late' | 'today' | 'upcoming' | null;

interface PinjolCalendarProps {
  activeLoans: LoanTracker[];
  paidInstallments: string[];
  /** Bulan yang sedang dilihat. Dikendalikan halaman karena statistik ikut mengacu ke sana. */
  currentDate: Date;
  onChangeMonth: (next: Date) => void;
  /** Tanggal gajian, ditandai cincin pada kalender. */
  salaryDay: number;
  onToggleLoanPaid: (loanId: string) => void;
  lateLoanCount: number;
  lateTotal: number;
}

/**
 * Kalender agenda tagihan.
 *
 * Pembangkitan petak tanggal dan penentuan penanda (lunas / terlambat / hari
 * ini / akan datang) tinggal di sini, bukan di halaman — dulu keduanya ikut
 * menumpuk di `pinjol/page.tsx` yang panjangnya 1025 baris.
 */
export function PinjolCalendar({
  activeLoans,
  paidInstallments,
  currentDate,
  onChangeMonth,
  salaryDay,
  onToggleLoanPaid,
  lateLoanCount,
  lateTotal,
}: PinjolCalendarProps) {
  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    // Minggu dimulai Senin, jadi indeks hari digeser satu.
    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;

    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      days.push({ day: d, isCurrentMonth: false, date: new Date(calendarYear, calendarMonth - 1, d) });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(calendarYear, calendarMonth, i) });
    }

    // Selalu 6 baris supaya tinggi kartu tidak melompat antar bulan.
    for (let i = 1; i <= 42 - days.length; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(calendarYear, calendarMonth + 1, i) });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  const getDayMarker = useCallback(
    (date: Date): Marker => {
      if (date.getMonth() !== calendarMonth || date.getFullYear() !== calendarYear) return null;

      const day = date.getDate();
      const matchingLoans = activeLoans.filter((l) => l.due_day === day);
      if (matchingLoans.length === 0) return null;

      const now = new Date();
      const viewingThisMonth = now.getMonth() === calendarMonth && now.getFullYear() === calendarYear;
      const anyUnpaid = matchingLoans.some((l) => !paidInstallments.includes(l.id));

      if (!anyUnpaid) return 'paid';
      if (viewingThisMonth && now.getDate() === day) return 'today';
      if (viewingThisMonth && day < now.getDate()) return 'late';
      return 'upcoming';
    },
    [activeLoans, paidInstallments, calendarMonth, calendarYear]
  );

  const shiftMonth = (delta: number) => onChangeMonth(new Date(calendarYear, calendarMonth + delta, 1));

  const navButton =
    'p-2 rounded-xl bg-black/[0.03] dark:bg-surface hover:bg-black/[0.08] text-text-primary transition-all cursor-pointer border border-black/5 dark:border-line';

  return (
    <Card className="bg-card border border-line rounded-[32px] p-4.5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-[0.2em] text-text-primary">Agenda Tagihan</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className={navButton} aria-label="Bulan sebelumnya">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-text-primary px-2">
            {MONTH_NAMES[calendarMonth].substring(0, 3)} {calendarYear}
          </span>
          <button onClick={() => shiftMonth(1)} className={navButton} aria-label="Bulan berikutnya">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-text-muted">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, idx) => {
            const marker = getDayMarker(cell.date);
            const now = new Date();
            const isToday =
              now.getDate() === cell.day &&
              now.getMonth() === calendarMonth &&
              now.getFullYear() === calendarYear;
            // Hari gajian: pembatas siklus. Tagihan sebelum tanggal ini (di bulan
            // berjalan) harus ditutup gaji periode lalu.
            const isSalaryDay = cell.isCurrentMonth && cell.day === salaryDay;

            let bgClass = 'bg-transparent text-text-secondary hover:bg-black/[0.02] dark:hover:bg-surface';
            let borderClass = 'border-transparent';

            if (!cell.isCurrentMonth) {
              bgClass = 'bg-transparent text-text-muted/20 pointer-events-none';
            } else if (marker === 'paid') {
              bgClass = 'bg-primary-glow text-primary';
            } else if (marker === 'late') {
              bgClass = 'bg-rose-500/80 text-text-primary font-semibold animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]';
            } else if (marker === 'today') {
              bgClass = 'bg-orange-500/20 text-orange-400 font-extrabold';
              borderClass = 'border-orange-500/50 border';
            } else if (marker === 'upcoming') {
              bgClass = 'bg-primary-glow text-primary font-semibold';
              borderClass = 'border-primary-border border-dashed border';
            } else if (isToday) {
              borderClass = 'border-text-muted/40 border';
            }

            return (
              <button
                key={`${cell.day}-${idx}`}
                disabled={!cell.isCurrentMonth}
                onClick={() => {
                  const matchingLoan = activeLoans.find((l) => l.due_day === cell.day);
                  if (matchingLoan) onToggleLoanPaid(matchingLoan.id);
                }}
                className={`relative w-full aspect-square rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${bgClass} ${borderClass} ${isSalaryDay ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''} cursor-pointer`}
                title={isSalaryDay ? 'Hari gajian' : undefined}
              >
                {cell.day}
                {isSalaryDay && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[9px] font-semibold text-text-muted border-t border-line pt-3">
          {[
            ['bg-rose-500', 'Terlambat'],
            ['bg-orange-400', 'Hari ini'],
            ['bg-primary', 'Akan datang'],
          ].map(([dot, text]) => (
            <div key={text} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full inline-block ${dot}`} />
              <span>{text}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-primary inline-block" />
            <span>Gajian</span>
          </div>
        </div>
      </div>

      {lateLoanCount > 0 && (
        <div className="p-3 rounded-[20px] bg-rose-500/5 border border-rose-500/10 flex items-center justify-between group hover:bg-rose-500/10 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-rose-500 tracking-tight">
              {lateLoanCount} tagihan terlambat
            </p>
            <p className="text-[9px] font-semibold text-rose-500/50 tracking-wide">
              Total denda: Rp {lateTotal.toLocaleString('id-ID')}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      )}
    </Card>
  );
}
