'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { useDebts } from '@/hooks/useDebts';
import { useDebtForecast } from '@/hooks/useDebtForecast';
import { loanTrackerService } from '@/lib/services/loan-tracker.service';
import type { CreateLoanTrackerInput } from '@/lib/services/loan-tracker.service';
import { Button } from '@/components/ui/button';
import { DebtDashboard } from '@/components/debt/DebtDashboard';
import { ActiveDebtList } from '@/components/debt/ActiveDebtList';
import { DebtFormModal } from '@/components/debt/DebtFormModal';
import { DebtCalendar } from '@/components/debt/DebtCalendar';
import { DebtDueTimeline } from '@/components/debt/DebtDueTimeline';
import { IncomeProjectionPanel } from '@/components/forecast/IncomeProjectionPanel';
import { CashflowTimeline } from '@/components/forecast/CashflowTimeline';
import { ForecastAnalyticsSummary } from '@/components/forecast/ForecastAnalytics';
import { SurvivalAnalysis } from '@/components/forecast/SurvivalAnalysis';
import { useToast } from '@/components/ui/toast';
import {
  AlertTriangle,
  Plus,
  BarChart2,
  LayoutList,
  Calendar,
  TrendingUp,
  AlertCircle,
  Info,
} from 'lucide-react';
import '@/styles/pages/pinjol.css';
import '@/styles/debt/dashboard.css';
import '@/styles/forecast/timeline.css';
import '@/styles/debt/calendar.css';

type Tab = 'overview' | 'daftar' | 'forecast' | 'timeline' | 'kalender';

export default function PinjolPage() {
  const { accountId } = useApp();
  const { toast } = useToast();
  const { loans, loading, error, refresh } = useDebts(accountId ?? undefined);
  const forecast = useDebtForecast(accountId ?? undefined, loans);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (input: CreateLoanTrackerInput) => {
    if (!accountId) return;
    setSubmitting(true);
    try {
      await loanTrackerService.createLoanTracker(accountId, input);
      toast('Pinjaman berhasil dicatat!', 'success');
      setIsModalOpen(false);
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan';
      if (msg.includes('does not exist') || msg.includes('schema cache')) {
        toast('Jalankan migration 002 & 003 di Supabase terlebih dahulu.', 'warning');
      } else {
        toast(msg, 'danger');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (id: string, name: string) => {
    if (!confirm(`Tandai "${name}" sebagai LUNAS?`)) return;
    try {
      await loanTrackerService.updateLoanStatus(id, 'paid_off');
      toast(`${name} ditandai lunas!`, 'success');
      await refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal update', 'danger');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan "${name}"?`)) return;
    try {
      await loanTrackerService.deleteLoanTracker(id);
      toast(`${name} dihapus`, 'success');
      await refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus', 'danger');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'forecast', label: 'Forecast', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'daftar', label: 'Daftar', icon: <LayoutList className="w-3.5 h-3.5" /> },
    { key: 'timeline', label: 'Timeline JT', icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'kalender', label: 'Kalender', icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  const isLoading = loading || forecast.plannerLoading;
  const allWarnings = [...forecast.globalWarnings];

  return (
    <div className="pinjol-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Debt Survival Planner
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
            Pinjol tracker dengan siklus gajian, forecast cashflow, dan survival score.
          </p>
        </div>
        <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tambah Pinjaman
        </Button>
      </div>

      <div className="pinjol-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`pinjol-tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="pinjol-warning-item danger mb-4">
          <AlertCircle className="w-4 h-4 pinjol-warning-icon" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="pinjol-shimmer-card shimmer" />
          ))}
        </div>
      ) : (
        <>
          {(activeTab === 'overview' || activeTab === 'forecast') && (
            <IncomeProjectionPanel
              timeline={forecast.incomeTimeline}
              salaryDay={forecast.salaryDay}
              onSaveSalaryDay={forecast.saveSalaryDay}
              onAddEntry={forecast.addIncomeEntry}
              onRemoveEntry={forecast.removeIncomeEntry}
            />
          )}

          {activeTab === 'overview' && (
            <div className="space-y-5">
              <DebtDashboard
                currentForecast={forecast.currentForecast}
                survivalScore={forecast.survivalScore}
                activeDebtCount={forecast.activeLoans.length}
                nextDueDate={forecast.nextDueDate}
              />

              {allWarnings.length > 0 && (
                <div className="pinjol-warnings">
                  {allWarnings.map((w, i) => (
                    <div key={i} className={`pinjol-warning-item ${w.level}`}>
                      <span className="pinjol-warning-icon">
                        {w.level === 'danger' && <AlertCircle className="w-4 h-4" />}
                        {w.level === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {w.level === 'info' && <Info className="w-4 h-4" />}
                      </span>
                      {w.message}
                    </div>
                  ))}
                </div>
              )}

              <SurvivalAnalysis
                insight={forecast.survivalInsight}
                onAnalyze={forecast.requestSurvivalAnalysis}
              />

              <ForecastAnalyticsSummary analytics={forecast.analytics} />
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-5">
              <ForecastAnalyticsSummary analytics={forecast.analytics} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                Cashflow per Siklus Gaji
              </h3>
              <CashflowTimeline periods={forecast.forecastTimeline} />
            </div>
          )}

          {activeTab === 'daftar' && (
            <ActiveDebtList
              loans={loans}
              onAdd={() => setIsModalOpen(true)}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'timeline' && <DebtDueTimeline loans={loans} />}

          {activeTab === 'kalender' && (
            <DebtCalendar loans={forecast.activeLoans} salaryDay={forecast.salaryDay} />
          )}
        </>
      )}

      <DebtFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  );
}
