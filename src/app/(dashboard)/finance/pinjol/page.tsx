'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { useDebts } from '@/hooks/useDebts';
import { useDebtForecast } from '@/hooks/useDebtForecast';
import { debtService } from '@/lib/services/finance/debt.service';
import type { LoanTracker, LoanCategory } from '@/lib/debt-planner/types';
import { Button } from '@/components/ui/button';
import { DebtFormModal } from '@/components/finance/debt/DebtForm';
import { useToast } from '@/components/ui/toast';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Wallet as WalletIcon,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';

// Provider avatar color map based on first letter
const PROVIDER_COLOR_MAP: Record<string, { bg: string, text: string }> = {
  E: { bg: 'bg-[var(--nexus-emerald-glow)] dark:bg-[var(--nexus-emerald-glow)]', text: 'text-[var(--nexus-emerald)] dark:text-[var(--nexus-emerald)]' },
  K: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  S: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-500 dark:text-orange-400' },
  A: { bg: 'bg-[var(--nexus-emerald-glow)] dark:bg-[var(--nexus-emerald-glow)]', text: 'text-[var(--nexus-emerald)] dark:text-[var(--nexus-emerald)]' },
  I: { bg: 'bg-stone-500/10 dark:bg-stone-500/20', text: 'text-stone-600 dark:text-stone-300' },
  F: { bg: 'bg-[var(--nexus-emerald-glow)] dark:bg-[var(--nexus-emerald-glow)]', text: 'text-[var(--nexus-emerald)] dark:text-[var(--nexus-emerald)]' },
  H: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-500 dark:text-rose-400' },
};

function getProviderAvatarStyle(name: string) {
  const char = name.trim().charAt(0).toUpperCase();
  return PROVIDER_COLOR_MAP[char] || { bg: 'bg-[var(--nexus-bg-panel)]', text: 'text-[var(--nexus-text-muted)]' };
}

export default function PinjolPage() {
  const { accountId } = useApp();
  const { toast } = useToast();
  const { loans, loading, refresh } = useDebts(accountId ?? undefined);
  const forecast = useDebtForecast(accountId ?? undefined, loans);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanTracker | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form states
  const [editAppName, setEditAppName] = useState('');
  const [editCategory, setEditCategory] = useState<LoanCategory>('pinjol');
  const [editAmountReceived, setEditAmountReceived] = useState('');
  const [editTotalRepayment, setEditTotalRepayment] = useState('');
  const [editMonthlyPayment, setEditMonthlyPayment] = useState('');
  const [editTenureMonths, setEditTenureMonths] = useState('');
  const [editDueDay, setEditDueDay] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'paid_off'>('active');

  // Calendar states
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();

  // Local storage check-off keys
  const [paidInstallments, setPaidInstallments] = useState<string[]>([]);

  // Load paid installments from local storage
  useEffect(() => {
    const key = `pinjol_paid_${calendarYear}_${String(calendarMonth + 1).padStart(2, '0')}`;
    const stored = localStorage.getItem(key);
    let parsed: string[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        parsed = [];
      }
    }
    Promise.resolve().then(() => {
      setPaidInstallments(parsed);
    });
  }, [calendarYear, calendarMonth]);

  // Save paid installments
  const toggleInstallmentPaid = (loanId: string) => {
    const key = `pinjol_paid_${calendarYear}_${String(calendarMonth + 1).padStart(2, '0')}`;
    setPaidInstallments((prev) => {
      const updated = prev.includes(loanId)
        ? prev.filter((id) => id !== loanId)
        : [...prev, loanId];
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
    toast('Status pembayaran berhasil diperbarui!', 'success');
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(calendarYear, calendarMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  // Create loan handler
  const handleCreate = async (data: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
    if (!accountId) return;
    setSubmitting(true);
    try {
      await debtService.createLoanTracker(accountId, data);
      toast('Pinjaman berhasil disimpan', 'success');
      setIsModalOpen(false);
      await refresh();
    } catch {
      toast('Gagal menyimpan pinjaman', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (loan: LoanTracker) => {
    setEditingLoan(loan);
    setEditAppName(loan.app_name);
    setEditCategory(loan.category);
    setEditAmountReceived(String(loan.amount_received));
    setEditTotalRepayment(String(loan.total_repayment));
    setEditMonthlyPayment(String(loan.monthly_payment));
    setEditTenureMonths(String(loan.tenure_months));
    setEditDueDay(String(loan.due_day));
    setEditStartDate(loan.start_date);
    setEditNotes(loan.notes || '');
    setEditStatus(loan.status);
    setIsEditModalOpen(true);
  };

  // Edit submit handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan || !editAppName || !editStartDate) return;
    setSubmitting(true);
    try {
      await debtService.updateLoanTracker(editingLoan.id, {
        app_name: editAppName.trim(),
        category: editCategory,
        amount_received: Number(editAmountReceived),
        total_repayment: Number(editTotalRepayment),
        monthly_payment: Number(editMonthlyPayment),
        tenure_months: Number(editTenureMonths),
        due_day: Number(editDueDay),
        start_date: editStartDate,
        notes: editNotes.trim() || null,
        status: editStatus,
      });
      toast('Pinjaman berhasil diperbarui!', 'success');
      setIsEditModalOpen(false);
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await debtService.deleteLoanTracker(id);
      toast(`${name} berhasil dihapus.`, 'success');
      setIsEditModalOpen(false);
      await refresh();
    } catch {
      toast('Gagal menghapus catatan', 'danger');
    }
  };

  // Calculate dynamic stats
  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);
  const activeCount = activeLoans.length;

  const totalPinjamanSum = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + Number(l.total_repayment), 0);
  }, [activeLoans]);

  const totalTagihanBulanIni = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + Number(l.monthly_payment), 0);
  }, [activeLoans]);

  const sudahDibayarSum = useMemo(() => {
    return activeLoans
      .filter((l) => paidInstallments.includes(l.id))
      .reduce((sum, l) => sum + Number(l.monthly_payment), 0);
  }, [activeLoans, paidInstallments]);

  // Overdue calculation
  const terlambatLoans = useMemo(() => {
    const todayDay = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;
    
    return activeLoans.filter((l) => {
      // Overdue if unpaid and due date has passed in calendar month
      const isPaid = paidInstallments.includes(l.id);
      if (isPaid) return false;
      
      if (isCurrentMonth) {
        return l.due_day < todayDay;
      }
      // If viewed month is in the past, all unpaid loans are late
      const viewedDate = new Date(calendarYear, calendarMonth, 1);
      const currentDateNoTime = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      return viewedDate < currentDateNoTime;
    });
  }, [activeLoans, paidInstallments, calendarMonth, calendarYear]);

  const terlambatSum = useMemo(() => {
    return terlambatLoans.reduce((sum, l) => sum + Number(l.monthly_payment), 0);
  }, [terlambatLoans]);

  const paidPercentage = totalTagihanBulanIni > 0 
    ? Math.round((sudahDibayarSum / totalTagihanBulanIni) * 100) 
    : 0;

  // Monthly average remaining balance
  const rataRataSisa = useMemo(() => {
    if (activeCount === 0) return 0;
    const totalRemaining = activeLoans.reduce((sum, l) => {
      if (l.total_remaining_balance != null && l.total_remaining_balance > 0) {
        return sum + Number(l.total_remaining_balance);
      }
      // fallback calculation
      const start = new Date(l.start_date);
      const elapsed = Math.max(0, (calendarYear - start.getFullYear()) * 12 + (calendarMonth - start.getMonth()));
      const remaining = Math.max(0, l.tenure_months - elapsed);
      return sum + (remaining * Number(l.monthly_payment));
    }, 0);
    return totalRemaining / activeCount;
  }, [activeLoans, activeCount, calendarMonth, calendarYear]);

  // Income ratio calculation
  const rasioIncome = useMemo(() => {
    if (totalTagihanBulanIni === 0 || forecast.incomeTimeline.length === 0) return 0;
    const latestIncome = forecast.incomeTimeline[0]?.monthly_income || 0;
    if (latestIncome <= 0) return 0;
    return Math.round((totalTagihanBulanIni / latestIncome) * 100);
  }, [totalTagihanBulanIni, forecast.incomeTimeline]);

  // Nearest upcoming payment
  const nearestPaymentDate = useMemo(() => {
    if (activeCount === 0) return null;
    const sorted = [...activeLoans].sort((a, b) => a.due_day - b.due_day);
    const todayDay = new Date().getDate();
    // Find next closest due day
    const upcoming = sorted.find((l) => l.due_day >= todayDay);
    const closest = upcoming || sorted[0]; // wraps to next month if none left this month
    
    let month = calendarMonth;
    let year = calendarYear;
    if (!upcoming) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return new Date(year, month, closest.due_day);
  }, [activeLoans, activeCount, calendarMonth, calendarYear]);

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7; // Monday starting
    
    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
    
    // Previous month padding
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      days.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(calendarYear, calendarMonth - 1, d),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(calendarYear, calendarMonth, i),
      });
    }

    // Next month padding
    const totalCells = 42; // 6 rows
    const nextPadding = totalCells - days.length;
    for (let i = 1; i <= nextPadding; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(calendarYear, calendarMonth + 1, i),
      });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  // Determine date marker status
  const getDayMarker = useCallback((date: Date) => {
    if (date.getMonth() !== calendarMonth || date.getFullYear() !== calendarYear) return null;
    
    const day = date.getDate();
    const matchingLoans = activeLoans.filter((l) => l.due_day === day);
    if (matchingLoans.length === 0) return null;

    const isToday = new Date().getDate() === day && new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;
    const anyUnpaid = matchingLoans.some((l) => !paidInstallments.includes(l.id));

    if (!anyUnpaid) return 'paid'; // All paid

    if (isToday) return 'today';
    
    const todayDay = new Date().getDate();
    const isPast = day < todayDay && new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;
    
    if (isPast) return 'late';
    return 'upcoming';
  }, [activeLoans, paidInstallments, calendarMonth, calendarYear]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-4 -mt-6">
      <UpgradeGate>
        {/* Header Section */}
        <PageHeader
          title="Pinjol"
          subtitle="Kelola semua pinjaman online kamu dalam satu tempat"
        />

        {/* Dynamic Summary Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pinjaman */}
          <Card className="p-4 bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[24px] group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-extrabold text-[var(--nexus-text-muted)]   block">
                  Total Pinjaman
                </span>
                <h3 className="text-base md:text-lg font-semibold text-[var(--nexus-text-primary)] tracking-tight truncate leading-none">
                  Rp {totalPinjamanSum.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] text-[var(--nexus-text-muted)] font-semibold  leading-none mt-1">
                  {activeCount} pinjaman aktif
                </p>
              </div>
              <div className="w-9 h-9 rounded-[12px] bg-[var(--nexus-emerald-glow)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
                <WalletIcon className="w-4 h-4" />
              </div>
            </div>
          </Card>

          {/* Card 2: Total Tagihan Bulan Ini */}
          <Card className="p-4 bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[24px] group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-extrabold text-[var(--nexus-text-muted)]   block">
                  Total Tagihan Bulan Ini
                </span>
                <h3 className="text-base md:text-lg font-semibold text-[var(--nexus-text-primary)] tracking-tight truncate leading-none">
                  Rp {totalTagihanBulanIni.toLocaleString('id-ID')}
                </h3>
                <div className="flex items-center gap-1 text-[var(--nexus-emerald)] text-[10px] font-bold  leading-none mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>12% dari bulan lalu</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-[12px] bg-[var(--nexus-emerald-glow)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </Card>

          {/* Card 3: Sudah Dibayar */}
          <Card className="p-4 bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[24px] group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-extrabold text-[var(--nexus-text-muted)]   block">
                  Sudah Dibayar
                </span>
                <h3 className="text-base md:text-lg font-semibold text-[var(--nexus-text-emerald)] tracking-tight truncate leading-none">
                  Rp {sudahDibayarSum.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] text-[var(--nexus-text-muted)] font-semibold  leading-none mt-1">
                  {paidPercentage}% dari total tagihan
                </p>
              </div>
              <div className="w-9 h-9 rounded-[12px] bg-[var(--nexus-emerald-glow)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
          </Card>

          {/* Card 4: Terlambat */}
          <Card className="p-4 bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[24px] group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-extrabold text-[var(--nexus-text-muted)]   block">
                  Terlambat
                </span>
                <h3 className="text-base md:text-lg font-semibold text-rose-500 tracking-tight truncate leading-none animate-pulse">
                  Rp {terlambatSum.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] text-rose-500 font-bold  leading-none mt-1">
                  {terlambatLoans.length} tagihan terlambat
                </p>
              </div>
              <div className="w-9 h-9 rounded-[12px] bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </section>

        {/* Main Grid: Left (Table + Ringkasan), Right (Calendar + Info) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left Column: Loan Table & Ringkasan */}
          <div className="xl:col-span-8 space-y-4">
            {/* Daftar Pinjaman Table */}
            <Card className="bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[32px] overflow-hidden shadow-2xl">
              <div className="px-6 py-4 flex justify-between items-center border-b border-[var(--nexus-glass-border)]">
                <h3 className="text-sm font-extrabold  tracking-tight text-[var(--nexus-text-primary)]">
                  Daftar Pinjaman
                </h3>
              </div>

              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-black/[0.02] dark:bg-[var(--nexus-bg-panel)] rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : loans.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-[24px] bg-black/[0.03] dark:bg-[var(--nexus-bg-panel)] flex items-center justify-center text-[var(--nexus-text-muted)] mb-4">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold  tracking-tight text-[var(--nexus-text-primary)] text-sm mb-1">
                    Daftar masih kosong
                  </h4>
                  <p className="text-xs text-[var(--nexus-text-secondary)] max-w-sm leading-relaxed mb-6">
                    Belum ada pinjaman online yang dicatat dalam tracker ini.
                  </p>
                  <Button variant="nexus-emerald" size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" /> Tambah Pinjaman
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--nexus-glass-border)] text-[9px] font-semibold  tracking-[0.2em] text-[var(--nexus-text-muted)]">
                        <th className="px-6 py-2.5">Pinjaman</th>
                        <th className="px-6 py-2.5 hidden sm:table-cell">Total Pinjaman</th>
                        <th className="px-6 py-2.5">Sisa Tagihan</th>
                        <th className="px-6 py-2.5 hidden md:table-cell">Tagihan Berikutnya</th>
                        <th className="px-6 py-2.5">Status</th>
                        <th className="px-6 py-2.5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--nexus-glass-border)]">
                      {loans.map((loan) => {
                        const avatarStyle = getProviderAvatarStyle(loan.app_name);
                        const isPaidThisMonth = paidInstallments.includes(loan.id);

                        // Calculate status
                        let statusText = 'Akan datang';
                        let statusClass = 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)] border border-[var(--nexus-emerald-border)]';

                        if (isPaidThisMonth) {
                          statusText = 'Lunas';
                          statusClass = 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)] border border-[var(--nexus-emerald-border)]';
                        } else {
                          const todayDay = new Date().getDate();
                          const isCurrentMonth = new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;
                          
                          if (isCurrentMonth) {
                            if (loan.due_day < todayDay) {
                              const diff = todayDay - loan.due_day;
                              statusText = `Terlambat ${diff} hari`;
                              statusClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                            } else if (loan.due_day === todayDay) {
                              statusText = 'Jatuh tempo hari ini';
                              statusClass = 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
                            }
                          } else {
                            // If viewed month is in the past, all unpaid loans are late
                            const viewedDate = new Date(calendarYear, calendarMonth, 1);
                            const currentDateNoTime = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                            if (viewedDate < currentDateNoTime) {
                              statusText = 'Terlambat';
                              statusClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                            }
                          }
                        }

                        // Calculate remaining balance percentage
                        const remaining = loan.total_remaining_balance ?? (loan.tenure_months * loan.monthly_payment);
                        const remainingPercent = loan.total_repayment > 0 
                          ? Math.round((remaining / loan.total_repayment) * 100)
                          : 0;

                        return (
                          <tr 
                            key={loan.id} 
                            className="group hover:bg-black/[0.01] dark:hover:bg-[var(--nexus-bg-panel)] transition-all cursor-pointer"
                            onClick={() => openEditModal(loan)}
                          >
                            {/* Pinjaman column */}
                            <td className="px-6 py-2.5 flex items-center gap-3">
                              <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-semibold text-xs ${avatarStyle.bg} ${avatarStyle.text}`}>
                                {loan.app_name.trim().charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-[var(--nexus-text-primary)] group-hover:text-[var(--nexus-emerald)] transition-colors ">
                                  {loan.app_name}
                                </p>
                                <p className="text-[10px] font-bold text-[var(--nexus-text-muted)]  mt-0.5">
                                  Pinjam {new Date(loan.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </td>

                            {/* Total Pinjaman */}
                            <td className="px-6 py-2.5 hidden sm:table-cell">
                              <span className="text-xs font-extrabold text-[var(--nexus-text-primary)]">
                                Rp {Number(loan.total_repayment).toLocaleString('id-ID')}
                              </span>
                            </td>

                            {/* Sisa Tagihan */}
                            <td className="px-6 py-2.5">
                              <div className="space-y-0.5">
                                <p className={`text-xs font-extrabold ${statusText.startsWith('Terlambat') ? 'text-rose-500' : 'text-[var(--nexus-text-primary)]'}`}>
                                  Rp {remaining.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[10px] font-bold text-[var(--nexus-text-muted)]">
                                  {remainingPercent}%
                                </p>
                              </div>
                            </td>

                            {/* Tagihan Berikutnya */}
                            <td className="px-6 py-2.5 hidden md:table-cell">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-[var(--nexus-text-primary)]">
                                  {loan.due_day} {monthNames[calendarMonth]} {calendarYear}
                                </p>
                                <p className="text-[10px] font-bold text-[var(--nexus-text-muted)]">
                                  Rp {Number(loan.monthly_payment).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-2.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // prevent opening Edit Modal
                                  toggleInstallmentPaid(loan.id);
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold  tracking-wide cursor-pointer hover:scale-105 active:scale-95 transition-all ${statusClass}`}
                                title="Klik untuk mengubah status pembayaran angsuran bulan ini"
                              >
                                {statusText}
                              </button>
                            </td>

                            {/* Arrow icon */}
                            <td className="px-6 py-2.5 text-right">
                              <ChevronRight className="w-4 h-4 text-[var(--nexus-text-muted)] group-hover:translate-x-1 group-hover:text-[var(--nexus-text-primary)] transition-all shrink-0 ml-auto" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bottom Outlined Actions */}
              {!loading && loans.length > 0 && (
                <div className="p-3 bg-black/[0.01] dark:bg-[var(--nexus-bg-panel)] border-t border-[var(--nexus-glass-border)]">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 rounded-[20px] border border-dashed border-[var(--nexus-emerald-border)] hover:border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald-glow)] transition-all duration-300 font-extrabold   text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Pinjaman Baru
                  </button>
                </div>
              )}
            </Card>

            {/* Ringkasan Pinjol Horizontal Metrics */}
            <Card className="bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[24px] p-4.5 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-[12px] bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--nexus-text-primary)]">{activeCount}</h4>
                  <p className="text-[9px] font-bold   text-[var(--nexus-text-muted)] mt-0.5">Total Pinjaman</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-[12px] bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                  <WalletIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--nexus-text-primary)]">Rp {Math.round(rataRataSisa).toLocaleString('id-ID')}</h4>
                  <p className="text-[9px] font-bold   text-[var(--nexus-text-muted)] mt-0.5">Rata-rata Sisa</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-[12px] bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--nexus-text-primary)]">{rasioIncome}%</h4>
                  <p className="text-[9px] font-bold   text-[var(--nexus-text-muted)] mt-0.5">Rasio Terhadap Income</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-[12px] bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--nexus-text-primary)]">
                    {nearestPaymentDate ? nearestPaymentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}
                  </h4>
                  <p className="text-[9px] font-bold   text-[var(--nexus-text-muted)] mt-0.5">Tagihan Terdekat</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Calendar Grid & Sidebar panels */}
          <div className="xl:col-span-4 space-y-4">
            {/* Agenda Tagihan Month Calendar Card */}
            <Card className="bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[32px] p-4.5 shadow-2xl space-y-4">
              {/* Calendar Header with navigation */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold  tracking-[0.2em] text-[var(--nexus-text-primary)]">
                  Agenda Tagihan
                </h3>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={prevMonth}
                    className="p-2 rounded-xl bg-black/[0.03] dark:bg-[var(--nexus-bg-panel)] hover:bg-black/[0.08] dark:hover:bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-primary)] transition-all cursor-pointer border border-black/5 dark:border-[var(--nexus-glass-border)]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold   text-[var(--nexus-text-primary)] px-2">
                    {monthNames[calendarMonth].substring(0, 3)} {calendarYear}
                  </span>
                  <button 
                    onClick={nextMonth}
                    className="p-2 rounded-xl bg-black/[0.03] dark:bg-[var(--nexus-bg-panel)] hover:bg-black/[0.08] dark:hover:bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-primary)] transition-all cursor-pointer border border-black/5 dark:border-[var(--nexus-glass-border)]"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid Container */}
              <div className="space-y-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--nexus-text-muted)] ">
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span>Sab</span>
                  <span>Min</span>
                </div>

                {/* Day numbers grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, idx) => {
                    const marker = getDayMarker(cell.date);
                    const isToday = new Date().getDate() === cell.day && new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;
                    
                    let bgClass = 'bg-transparent text-[var(--nexus-text-secondary)] hover:bg-black/[0.02] dark:hover:bg-[var(--nexus-bg-panel)]';
                    let borderClass = 'border-transparent';

                    if (!cell.isCurrentMonth) {
                      bgClass = 'bg-transparent text-[var(--nexus-text-muted)]/20 pointer-events-none';
                    } else if (marker === 'paid') {
                      bgClass = 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)]';
                    } else if (marker === 'late') {
                      bgClass = 'bg-rose-500/80 text-[var(--nexus-text-primary)] font-semibold animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]';
                    } else if (marker === 'today') {
                      bgClass = 'bg-orange-500/20 text-orange-400 font-extrabold';
                      borderClass = 'border-orange-500/50 border';
                    } else if (marker === 'upcoming') {
                      bgClass = 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)] font-semibold';
                      borderClass = 'border-[var(--nexus-emerald-border)] border-dashed border';
                    } else if (isToday) {
                      borderClass = 'border-[var(--nexus-text-muted)]/40 border';
                    }

                    return (
                      <button
                        key={`${cell.day}-${idx}`}
                        disabled={!cell.isCurrentMonth}
                        onClick={() => {
                          // Toggle paid status for first loan matching this due day
                          const matchingLoan = activeLoans.find((l) => l.due_day === cell.day);
                          if (matchingLoan) {
                            toggleInstallmentPaid(matchingLoan.id);
                          }
                        }}
                        className={`w-full aspect-square rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${bgClass} ${borderClass} cursor-pointer`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="flex items-center justify-between text-[9px] font-semibold  text-[var(--nexus-text-muted)]  border-t border-[var(--nexus-glass-border)] pt-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    <span>Terlambat</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                    <span>Hari ini</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--nexus-emerald)] inline-block" />
                    <span>Akan datang</span>
                  </div>
                </div>
              </div>

              {/* Late warning card box */}
              {terlambatLoans.length > 0 && (
                <div className="p-3 rounded-[20px] bg-rose-500/5 border border-rose-500/10 flex items-center justify-between group hover:bg-rose-500/10 transition-all cursor-pointer">
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-rose-500  tracking-tight">
                      {terlambatLoans.length} tagihan terlambat
                    </p>
                    <p className="text-[9px] font-semibold text-rose-500/50  tracking-wide">
                      Total denda: Rp {terlambatSum.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              )}
            </Card>

            {/* Tips Aman Pinjol Panel */}
            <Card className="bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[32px] p-4.5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--nexus-emerald)] shrink-0" />
                <h3 className="text-xs font-semibold  tracking-[0.2em] text-[var(--nexus-text-primary)]">
                  Tips Aman Pinjol
                </h3>
              </div>

              <ul className="space-y-2.5">
                {[
                  'Pastikan pinjol terdaftar di OJK',
                  'Jangan pinjam melebihi kemampuan',
                  'Bayar tepat waktu untuk hindari denda',
                  'Jaga data pribadi kamu',
                ].map((tip, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-[11px] font-bold text-[var(--nexus-text-secondary)] leading-relaxed  tracking-tight">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[var(--nexus-glass-border)] pt-3">
                <a
                  href="https://www.ojk.go.id"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-semibold   text-[var(--nexus-emerald)] hover:text-[var(--nexus-emerald)] flex items-center gap-1 transition-all group cursor-pointer"
                >
                  Pelajari lebih lanjut
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* Existing Add Modal (preserves calculations) */}
        <DebtFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
          submitting={submitting}
        />

        {/* Edit & Detail Modal */}
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          title={`Manajemen Pinjaman: ${editingLoan?.app_name}`}
        >
          {editingLoan && (
            <form onSubmit={handleEditSubmit} className="space-y-6 p-2">
              <Input
                label="Nama Aplikasi / Pemberi Pinjaman"
                value={editAppName}
                onChange={(e) => setEditAppName(e.target.value)}
                required
                disabled={submitting}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Kategori"
                  options={[
                    { value: 'pinjol', label: 'Pinjaman Online' },
                    { value: 'paylater', label: 'PayLater' },
                    { value: 'kartu_kredit', label: 'Kartu Kredit' },
                    { value: 'koperasi', label: 'Koperasi' },
                    { value: 'teman_keluarga', label: 'Teman / Keluarga' },
                    { value: 'cicilan_barang', label: 'Cicilan Barang' },
                    { value: 'custom', label: 'Custom / Lainnya' },
                  ]}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as LoanCategory)}
                  required
                  disabled={submitting}
                />
                
                <Select
                  label="Status Kontrak"
                  options={[
                    { value: 'active', label: 'Aktif / Berjalan' },
                    { value: 'paid_off', label: 'Lunas / Selesai' },
                  ]}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'paid_off')}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Dana Cair / Diterima (Rp)"
                  type="number"
                  value={editAmountReceived}
                  onChange={(e) => setEditAmountReceived(e.target.value)}
                  required
                  disabled={submitting}
                />
                <Input
                  label="Total Kewajiban Pembayaran (Rp)"
                  type="number"
                  value={editTotalRepayment}
                  onChange={(e) => setEditTotalRepayment(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cicilan Bulanan (Rp)"
                  type="number"
                  value={editMonthlyPayment}
                  onChange={(e) => setEditMonthlyPayment(e.target.value)}
                  required
                  disabled={submitting}
                />
                <Input
                  label="Tenor (Bulan)"
                  type="number"
                  value={editTenureMonths}
                  onChange={(e) => setEditTenureMonths(e.target.value)}
                  required
                  disabled={submitting}
                />
                <Input
                  label="Tanggal Jatuh Tempo Bulanan"
                  type="number"
                  placeholder="1-31"
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Tanggal Mulai Kontrak"
                  value={editStartDate}
                  onChange={(val) => setEditStartDate(val)}
                  disabled={submitting}
                />
                <Input
                  label="Sisa Kewajiban Manual (Opsional)"
                  type="number"
                  placeholder="Kosongkan untuk kalkulasi otomatis"
                  value={editTotalRepayment}
                  onChange={(e) => setEditTotalRepayment(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <Input
                label="Catatan Tambahan"
                placeholder="No kontrak, limit, atau detail lain..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                disabled={submitting}
              />

              <div className="flex gap-4 pt-4 border-t border-[var(--nexus-glass-border)]">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-[20px] py-6 text-rose-500 border-rose-500/20 hover:bg-rose-500/5 hover:border-rose-500/40 cursor-pointer"
                  onClick={() => handleDelete(editingLoan.id, editingLoan.app_name)}
                  disabled={submitting}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Hapus
                </Button>
                <div className="flex-1" />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-[20px] py-6 cursor-pointer"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  loading={submitting}
                  className="rounded-[20px] bg-[var(--nexus-emerald)] text-[var(--nexus-text-primary)] py-6 cursor-pointer"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </UpgradeGate>
    </div>
  );
}
