'use client';

import React, { useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/components/ui/toast';
import { useDashboard, type DateFilter, type OptimizationSuggestion } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/debt-planner/format';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Bell, User, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import NumberTicker from '@/components/ui/number-ticker';
import { QuickAddModal } from '@/components/finance/transaction/QuickAdd';
import { AccountSettings } from '@/components/user/profile/Settings';
import { BudgetOptimizerWidget } from '@/components/finance/dashboard/BudgetOptimizerWidget';
import { SpendingChart } from '@/components/charts/spending-chart';
import { StateContainer } from '@/components/shared/StateContainer';

import { useModalStore } from '@/stores/modal-store';

// Reducer for UI state
type State = {
  dateFilter: DateFilter;
  isNotificationsOpen: boolean;
  isProfileOpen: boolean;
  submitting: boolean;
};

type Action =
  | { type: 'SET_DATE_FILTER'; payload: DateFilter }
  | { type: 'TOGGLE_NOTIFICATIONS' }
  | { type: 'TOGGLE_PROFILE' }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialState: State = {
  dateFilter: 'thisMonth',
  isNotificationsOpen: false,
  isProfileOpen: false,
  submitting: false,
};

function uiReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATE_FILTER': return { ...state, dateFilter: action.payload };
    case 'TOGGLE_NOTIFICATIONS': return { ...state, isNotificationsOpen: !state.isNotificationsOpen };
    case 'TOGGLE_PROFILE': return { ...state, isProfileOpen: !state.isProfileOpen };
    case 'SET_SUBMITTING': return { ...state, submitting: action.payload };
    default: return state;
  }
}

export default function DashboardPage() {
  const { profile, t } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  const [uiState, dispatch] = useReducer(uiReducer, initialState);
  const { openQuickAdd } = useModalStore();

  const {
    loading, error, financialStats, recentTxs, chartData,
    statusText, optimizerSuggestions, applyOptimization, refresh
  } = useDashboard(profile?.id, uiState.dateFilter);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('settings') === 'true') {
      dispatch({ type: 'TOGGLE_PROFILE' });
    }
  }, []);

  const handleApplyOptimization = async (suggestion: OptimizationSuggestion) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      await applyOptimization(suggestion);
      toast(t('dashboard.success.optimizeSuccess').replace('{category}', suggestion.categoryName), 'success');
    } catch {
      toast(t('dashboard.error.optimizeFailed'), 'danger');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const HeroWidgets = [
    { label: t('dashboard.hero.netWorth'), value: financialStats.totalBalance, icon: Wallet, color: 'text-emerald-400', colorCode: 'var(--nexus-success)', path: '/finance/wallets' },
    { label: t('dashboard.widget.income'), value: financialStats.income, icon: TrendingUp, color: 'text-emerald-400', colorCode: 'var(--nexus-success)', action: () => openQuickAdd('income') },
    { label: t('dashboard.widget.expense'), value: financialStats.expense, icon: TrendingDown, color: 'text-rose-400', colorCode: 'var(--nexus-danger)', action: () => openQuickAdd('expense') },
    { label: t('dashboard.widget.savings'), value: financialStats.savings, icon: PiggyBank, color: 'text-amber-400', colorCode: 'var(--nexus-warning)', path: '/finance/savings' },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-0.5">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl md:text-3xl font-black text-[var(--nexus-text-primary)] tracking-tighter uppercase font-outfit">
            {t('dashboard.greeting', 'Halo, ')}<span className="text-emerald-500">{profile?.full_name || 'User'}!</span>
          </motion.h1>
          <p className="text-[10px] font-semibold text-[var(--nexus-text-muted)] font-outfit animate-pulse">
            {statusText}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <Select
              value={uiState.dateFilter}
              onChange={(e) => dispatch({ type: 'SET_DATE_FILTER', payload: e.target.value as DateFilter })}
              options={[
                { value: 'today', label: t('common.today') }, { value: 'thisWeek', label: t('common.thisWeek') },
                { value: 'thisMonth', label: t('common.thisMonth') }, { value: 'last3Months', label: t('common.last3Months') },
              ]}
              className="rounded-[24px] bg-[var(--nexus-bg-panel)]/50 backdrop-blur-3xl border border-[var(--nexus-glass-border)] py-3 h-auto min-w-[180px] text-[var(--nexus-text-primary)]"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATIONS' })} className="p-3.5 rounded-[24px] bg-[var(--nexus-bg-panel)]/50 backdrop-blur-3xl border border-[var(--nexus-glass-border)] text-[var(--nexus-text-primary)] hover:bg-[var(--nexus-bg-panel)] transition-all relative shadow-xl shadow-emerald-500/5 cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
              </button>

              <AnimatePresence>
                {uiState.isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATIONS' })} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 p-6 rounded-[32px] bg-[var(--nexus-bg-popup)] backdrop-blur-3xl border border-[var(--nexus-glass-border)] shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-[100]">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nexus-text-primary)]">{t('dashboard.notifications')}</h4>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">{t('dashboard.notifications.new')}</span>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-[20px] bg-[var(--nexus-bg-panel)]/50 border border-[var(--nexus-glass-border)] space-y-2">
                          <p className="text-[11px] font-bold text-[var(--nexus-text-primary)] uppercase tracking-tight">{t('dashboard.notifications.statusInsight')}</p>
                          <p className="text-[9px] font-medium text-[var(--nexus-text-muted)] leading-relaxed uppercase">
                            {financialStats.score >= 80 ? t('dashboard.notifications.scoreOptimal') : 
                             financialStats.score >= 50 ? t('dashboard.notifications.scoreStable') : t('dashboard.notifications.scoreCritical')}
                          </p>
                        </div>
                        {financialStats.activeLoansCount > 0 && (
                          <button onClick={() => { dispatch({ type: 'TOGGLE_NOTIFICATIONS' }); router.push('/finance/pinjol'); }} className="w-full p-4 rounded-[20px] bg-rose-500/5 border border-rose-500/20 text-left hover:bg-rose-500/10 transition-all group">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-tight">{t('dashboard.notifications.debtWarning')}</p>
                              <ArrowRight className="w-3 h-3 text-rose-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-[9px] font-medium text-rose-500/60 leading-relaxed uppercase">{t('dashboard.notifications.debtWarningDesc').replace('{count}', String(financialStats.activeLoansCount))}</p>
                          </button>
                        )}
                        <button onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATIONS' })} className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-colors">{t('common.close')}</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => dispatch({ type: 'TOGGLE_PROFILE' })} className="w-10 h-10 rounded-[20px] bg-[var(--nexus-bg-panel)]/50 backdrop-blur-3xl border border-[var(--nexus-glass-border)] text-[var(--nexus-text-primary)] hover:bg-[var(--nexus-bg-panel)] transition-all relative flex items-center justify-center overflow-hidden cursor-pointer shrink-0" title="Preferensi Akun">
              {profile?.avatar_url ? (<img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover animate-in fade-in" />) : (<User className="w-4 h-4 text-[var(--nexus-text-secondary)] animate-in fade-in" />)}
            </button>
          </div>
        </div>
      </header>

      <StateContainer loading={loading} error={error} onRetry={refresh} isEmpty={!loading && !error && financialStats.income === 0 && financialStats.expense === 0}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-4">
          {/* KOLOM KIRI (Data Utama) - Mobile: 1 col, LG: 8 cols, XL: 9 cols */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6 flex flex-col">
            {/* Hero Widgets - Mobile: 2x2, MD: 4x1 */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {HeroWidgets.map((w, i) => (
                <motion.button key={w.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => w.action ? w.action() : router.push(w.path!)} className={`relative group p-4 md:p-5 rounded-[20px] md:rounded-[24px] bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] transition-all text-left overflow-hidden cursor-pointer hover:shadow-xl min-h-[90px] md:min-h-[110px] flex flex-col justify-between`} style={{ background: `radial-gradient(circle at top right, color-mix(in srgb, ${w.colorCode} 15%, transparent), transparent 60%)` }}>
                  <div className="flex justify-between items-start mb-1 md:mb-2">
                    <p className="text-[8px] md:text-[9px] font-bold text-[var(--nexus-text-secondary)] uppercase tracking-[0.1em] md:tracking-[0.15em]">{w.label}</p>
                    <w.icon className={`w-3 h-3 md:w-4 md:h-4 ${w.color} transition-transform group-hover:scale-110 relative z-10 opacity-70`} />
                  </div>
                  <div className="text-lg md:text-xl lg:text-2xl font-black text-[var(--nexus-text-primary)] tracking-tighter truncate">
                    <NumberTicker value={w.value} formatter={formatCurrency} />
                  </div>
                </motion.button>
              ))}
            </section>

            {/* Chart */}
            <Card glass className="p-4 md:p-5 border-[var(--nexus-glass-border)] rounded-[20px] md:rounded-[24px] flex-1 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs md:text-sm font-bold text-[var(--nexus-text-primary)] uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /> {t('dashboard.chart.expenseTrendsTitle')}</h3>
              </div>
              <div className="flex-1 w-full -ml-4 min-w-0">
                <SpendingChart data={chartData} />
              </div>
            </Card>
          </div>

          {/* KOLOM KANAN (Insight) - Mobile: Bawah, LG: 4 cols, XL: 3 cols */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col">
            {/* Health Score */}
            <Card glass className="p-4 md:p-5 border-[var(--nexus-glass-border)] rounded-[20px] md:rounded-[24px] shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-[10px] md:rounded-xl bg-emerald-500/10 flex items-center justify-center"><ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /></div>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--nexus-text-muted)]">Skor AI</span>
                </div>
                <div className="text-xl md:text-2xl font-black text-[var(--nexus-text-primary)] italic tracking-tighter">{financialStats.score}</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2 md:mb-3">
                <motion.div initial={{ width: 0 }} animate={{ width: `${financialStats.score}%` }} transition={{ delay: 0.5 }} className={`h-full ${financialStats.score > 70 ? "bg-emerald-500" : "bg-amber-500"}`} />
              </div>
              <p className="text-[9px] md:text-[10px] font-semibold text-[var(--nexus-text-secondary)] leading-relaxed border-l-2 border-emerald-500/30 pl-2">{statusText}</p>
            </Card>

            {/* Insight List - Dibatasi tinggi max di desktop biar bisa scroll */}
            <Card glass className="p-4 md:p-5 border-[var(--nexus-glass-border)] rounded-[20px] md:rounded-[24px] flex-1 max-h-[400px] lg:max-h-full overflow-y-auto no-scrollbar flex flex-col gap-3 md:gap-4">
              <h3 className="text-[9px] md:text-[10px] font-bold text-[var(--nexus-text-primary)] uppercase tracking-widest sticky top-0 bg-[var(--nexus-bg-card)]/80 backdrop-blur-sm py-1 z-10">Saran AI & Insight</h3>
              
              <div className="space-y-2 md:space-y-3">
                {optimizerSuggestions.length > 0 && (
                  <div className="border border-dashed border-[var(--nexus-glass-border)] rounded-xl p-2 md:p-3 bg-amber-500/5">
                    <BudgetOptimizerWidget suggestions={optimizerSuggestions.slice(0, 1)} onApply={handleApplyOptimization} loading={uiState.submitting} />
                  </div>
                )}

                {financialStats.insights.map((insight) => (
                  <motion.div key={insight.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-2.5 md:p-3 rounded-[10px] md:rounded-xl bg-[var(--nexus-bg-panel)]/50 border border-[var(--nexus-glass-border)] group cursor-pointer hover:bg-[var(--nexus-bg-panel)] transition-colors" onClick={() => router.push(insight.link)}>
                    <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-0.5 md:mb-1" style={{ color: `var(--nexus-${insight.level === 'warning' ? 'warning' : 'info'})` }}>{t(`insights.category.${insight.category}` as any, insight.category)}</div>
                    <p className="text-[10px] md:text-xs font-medium text-[var(--nexus-text-primary)] leading-snug line-clamp-2">{insight.summary}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </StateContainer>

      {/* Modals */}
      <QuickAddModal
        accountId={profile?.id || ''}
        onSuccess={refresh}
      />
      <AccountSettings
        isOpen={uiState.isProfileOpen}
        onClose={() => dispatch({ type: 'TOGGLE_PROFILE' })}
      />
    </div>
  );
}