'use client';

import React, { useState, useReducer, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import { useDebts } from '@/hooks/useDebts';
import { useDebtForecast } from '@/hooks/useDebtForecast';
import { walletService, Wallet } from '@/lib/services/workspace/wallet.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { APP_TEXTS } from '@/config/branding';
import type { LoanTracker } from '@/lib/debt-planner/types';
import { Debt } from '@/lib/services/finance/debt.service';
import { Button } from '@/components/ui/button';
import { DebtDashboard } from '@/components/finance/debt/DebtDashboard';
import { ActiveDebtList } from '@/components/finance/debt/ActiveDebtList';
import { DebtFormModal } from '@/components/finance/debt/DebtForm';
import { DebtCalendar } from '@/components/finance/debt/DebtCalendar';
import { DebtDueTimeline } from '@/components/finance/debt/DebtDueTimeline';
import { IncomeProjectionPanel } from '@/components/finance/forecast/IncomeProjectionPanel';
import { CashflowTimeline } from '@/components/finance/forecast/CashflowTimeline';
import { ForecastAnalyticsSummary } from '@/components/finance/forecast/ForecastAnalytics';
import { SurvivalAnalysis } from '@/components/finance/forecast/SurvivalAnalysis';
import { useToast } from '@/components/ui/toast';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import {
  AlertTriangle, HandCoins, Plus, BarChart2, LayoutList, Calendar, TrendingUp, AlertCircle, Info, Landmark, Trash2,
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { StateContainer } from '@/components/shared/StateContainer';
import '@/styles/pages/pinjol.css';
import '@/styles/debt/dashboard.css';
import '@/styles/forecast/timeline.css';
import '@/styles/debt/calendar.css';

type Tab = 'overview' | 'daftar' | 'forecast' | 'timeline' | 'kalender' | 'ledger';

// REDUCER FOR UI & FORM STATES (PONTYAIL: Konsolidasi state)
type State = {
  activeTab: Tab;
  submitting: boolean;
  isLoanModalOpen: boolean;
  isDebtModalOpen: boolean;
  isPayModalOpen: boolean;
  selectedDebt: Debt | null;
  debtForm: { name: string; type: 'owe' | 'lend'; amount: string; contactInfo: string; dueDate: string };
  payForm: { walletId: string; amount: string; note: string };
};

type Action = 
  | { type: 'SET_TAB'; payload: Tab }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'TOGGLE_LOAN_MODAL'; payload: boolean }
  | { type: 'TOGGLE_DEBT_MODAL'; payload: boolean }
  | { type: 'OPEN_PAY_MODAL'; payload: { debt: Debt; defaultNote: string } }
  | { type: 'CLOSE_PAY_MODAL' }
  | { type: 'UPDATE_DEBT_FORM'; payload: Partial<State['debtForm']> }
  | { type: 'UPDATE_PAY_FORM'; payload: Partial<State['payForm']> }
  | { type: 'RESET_DEBT_FORM' };

const initialState: State = {
  activeTab: 'overview',
  submitting: false,
  isLoanModalOpen: false,
  isDebtModalOpen: false,
  isPayModalOpen: false,
  selectedDebt: null,
  debtForm: { name: '', type: 'owe', amount: '', contactInfo: '', dueDate: '' },
  payForm: { walletId: '', amount: '', note: '' },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TAB': return { ...state, activeTab: action.payload };
    case 'SET_SUBMITTING': return { ...state, submitting: action.payload };
    case 'TOGGLE_LOAN_MODAL': return { ...state, isLoanModalOpen: action.payload };
    case 'TOGGLE_DEBT_MODAL': return { ...state, isDebtModalOpen: action.payload };
    case 'OPEN_PAY_MODAL': return { ...state, isPayModalOpen: true, selectedDebt: action.payload.debt, payForm: { walletId: '', amount: '', note: action.payload.defaultNote } };
    case 'CLOSE_PAY_MODAL': return { ...state, isPayModalOpen: false, selectedDebt: null };
    case 'UPDATE_DEBT_FORM': return { ...state, debtForm: { ...state.debtForm, ...action.payload } };
    case 'UPDATE_PAY_FORM': return { ...state, payForm: { ...state.payForm, ...action.payload } };
    case 'RESET_DEBT_FORM': return { ...state, debtForm: initialState.debtForm };
    default: return state;
  }
}

export default function PinjolPage() {
  const { accountId, t } = useApp();
  const { toast } = useToast();
  
  // Custom Hook (Semua Logic Fetch & Manipulasi Pindah ke Sini)
  const { 
    loans, debts, loading: debtsLoading, error: debtsError, 
    createLoan, updateLoanStatus, deleteLoan, 
    createDebt, deleteDebt, recordPayment 
  } = useDebts(accountId ?? undefined);
  
  const forecast = useDebtForecast(accountId ?? undefined, loans);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load Wallets (untuk dropdown pembayaran)
  useEffect(() => {
    if (accountId) {
      walletService.getWallets(accountId).then(setWallets).catch(console.error);
    }
  }, [accountId]);

  // Handlers
  const handleCreateLoan = async (data: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      await createLoan(data);
      toast('Pinjaman berhasil disimpan', 'success');
      dispatch({ type: 'TOGGLE_LOAN_MODAL', payload: false });
    } catch {
      toast('Gagal menyimpan', 'danger');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handleCreateDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.debtForm.name || !state.debtForm.amount) return;
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      await createDebt(
        state.debtForm.name, 
        state.debtForm.type, 
        Number(state.debtForm.amount), 
        state.debtForm.contactInfo || null, 
        state.debtForm.dueDate || null
      );
      toast('Rekod utang piutang berhasil disimpan.', 'success');
      dispatch({ type: 'TOGGLE_DEBT_MODAL', payload: false });
      dispatch({ type: 'RESET_DEBT_FORM' });
    } catch (err: any) {
      toast(err.message || 'Gagal menyimpan', 'danger');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedDebt || !state.payForm.walletId || !state.payForm.amount) return;
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      await recordPayment(
        state.selectedDebt.id, 
        Number(state.payForm.amount), 
        state.payForm.walletId, 
        state.payForm.note
      );
      toast('Pembayaran berhasil dicatat!', 'success');
      dispatch({ type: 'CLOSE_PAY_MODAL' });
    } catch (err: any) {
      toast(err.message || 'Gagal mencatat', 'danger');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handleDeleteDebt = async (id: string, name: string) => {
    if (!confirm(`Hapus rekod "${name}"?`)) return;
    try {
      await deleteDebt(id);
      toast('Rekod dihapus.', 'success');
    } catch (err: any) {
      toast(err.message || 'Gagal menghapus', 'danger');
    }
  };

  const handleMarkPaid = async (id: string, name: string) => {
    if (!confirm(`Tandai "${name}" sebagai LUNAS?`)) return;
    try {
      await updateLoanStatus(id, 'paid_off');
      toast(`${name} ditandai lunas!`, 'success');
    } catch (err: any) {
      toast(err.message || 'Gagal update', 'danger');
    }
  };

  const handleDeleteLoan = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan "${name}"?`)) return;
    try {
      await deleteLoan(id);
      toast(`${name} dihapus`, 'success');
    } catch (err: any) {
      toast(err.message || 'Gagal menghapus', 'danger');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: APP_TEXTS.pinjol.tabs.overview, icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'ledger', label: APP_TEXTS.pinjol.tabs.ledger, icon: <HandCoins className="w-3.5 h-3.5" /> },
    { key: 'forecast', label: APP_TEXTS.pinjol.tabs.forecast, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'daftar', label: APP_TEXTS.pinjol.tabs.list, icon: <LayoutList className="w-3.5 h-3.5" /> },
    { key: 'timeline', label: APP_TEXTS.pinjol.tabs.timeline, icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'kalender', label: APP_TEXTS.pinjol.tabs.calendar, icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  const isLoading = debtsLoading || forecast.plannerLoading;
  const allWarnings = [...forecast.globalWarnings];

  return (
    <div className="space-y-8">
      <UpgradeGate>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              {APP_TEXTS.pinjol.title}
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
              {APP_TEXTS.pinjol.subtitle}
            </p>
          </div>
          <Button 
            variant="nexus-emerald" 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => dispatch({ type: state.activeTab === 'ledger' ? 'TOGGLE_DEBT_MODAL' : 'TOGGLE_LOAN_MODAL', payload: true })}
          >
            <Plus className="w-4 h-4" />
            {state.activeTab === 'ledger' ? 'Tambah Utang/Piutang' : 'Tambah Pinjaman'}
          </Button>
        </div>

        <div className="pinjol-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`pinjol-tab-btn ${state.activeTab === t.key ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_TAB', payload: t.key })}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <StateContainer 
          loading={isLoading} 
          error={debtsError} 
          onRetry={refresh}
          loadingFallback={
            <div className="space-y-4">
              {[1, 2, 3].map((n) => <div key={n} className="pinjol-shimmer-card shimmer" />)}
            </div>
          }
        >
          <>
            {(state.activeTab === 'overview' || state.activeTab === 'forecast') && (
              <IncomeProjectionPanel
                timeline={forecast.incomeTimeline}
                salaryDay={forecast.salaryDay}
                onSaveSalaryDay={forecast.saveSalaryDay}
                onAddEntry={forecast.addIncomeEntry}
                onRemoveEntry={forecast.removeIncomeEntry}
              />
            )}

            {state.activeTab === 'overview' && (
              <div className="space-y-5">
                {forecast.currentForecast && forecast.survivalScore && (
                  <DebtDashboard
                    currentForecast={forecast.currentForecast}
                    survivalScore={forecast.survivalScore}
                    activeDebtCount={forecast.activeLoans.length}
                    nextDueDate={forecast.nextDueDate}
                  />
                )}

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

                <SurvivalAnalysis insight={forecast.survivalInsight} onAnalyze={forecast.requestSurvivalAnalysis} />
                {forecast.analytics && <ForecastAnalyticsSummary analytics={forecast.analytics} />}
              </div>
            )}

            {state.activeTab === 'forecast' && (
              <div className="space-y-5">
                {forecast.analytics && <ForecastAnalyticsSummary analytics={forecast.analytics} />}
                <h3 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Cashflow per Siklus Gaji</h3>
                <CashflowTimeline periods={forecast.forecastTimeline} />
              </div>
            )}

            {state.activeTab === 'daftar' && (
              <ActiveDebtList loans={loans} onAdd={() => dispatch({ type: 'TOGGLE_LOAN_MODAL', payload: true })} onMarkPaid={handleMarkPaid} onDelete={handleDeleteLoan} />
            )}

            {state.activeTab === 'timeline' && <DebtDueTimeline loans={loans} />}
            {state.activeTab === 'kalender' && <DebtCalendar loans={forecast.activeLoans} salaryDay={forecast.salaryDay} />}

            {state.activeTab === 'ledger' && (
              <StateContainer isEmpty={debts.length === 0} emptyTitle="Ledger Kosong" emptyDescription="Tidak ada catatan utang/piutang." emptyAction={<Button variant="nexus-emerald" onClick={() => dispatch({ type: 'TOGGLE_DEBT_MODAL', payload: true })}>Inisialisasi Protokol</Button>}>
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card glass className="p-8 md:p-12 relative group overflow-hidden border-white/5 shadow-2xl">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-rose-500/10" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">Posisi Eksposur Bersih</p>
                        <div className="flex items-baseline gap-3">
                          <span className={`text-4xl md:text-7xl font-black tracking-tighter ${(() => {
                            const owe = debts.filter(d => d.type === 'owe').reduce((s, d) => s + Number(d.remaining_amount), 0);
                            const lend = debts.filter(d => d.type === 'lend').reduce((s, d) => s + Number(d.remaining_amount), 0);
                            return lend - owe >= 0 ? 'text-emerald-400' : 'text-rose-500';
                          })()}`}>
                            <NumberTicker value={Math.abs(debts.filter(d => d.type === 'lend').reduce((s, d) => s + Number(d.remaining_amount), 0) - debts.filter(d => d.type === 'owe').reduce((s, d) => s + Number(d.remaining_amount), 0))} formatter={formatCurrency} />
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-3 rounded-[24px] bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-rose-400" />
                          <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">
                            Utang: {formatCurrency(debts.filter(d => d.type === 'owe').reduce((s, d) => s + Number(d.remaining_amount), 0))}
                          </span>
                        </div>
                        <div className="px-6 py-3 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                          <HandCoins className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                            Piutang: {formatCurrency(debts.filter(d => d.type === 'lend').reduce((s, d) => s + Number(d.remaining_amount), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[40px] border border-white/5 p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Status Ledger</h4>
                        <div className="text-2xl font-black text-white italic">{debts.length} <span className="text-xs not-italic text-white/20">Unit</span></div>
                      </div>
                      <p className="text-[11px] font-bold text-white/40 leading-relaxed uppercase tracking-tight">
                        Audit sistem mendeteksi <span className="text-white">{debts.filter(d => d.type === 'owe').length} kontrak utang</span> dan <span className="text-white">{debts.filter(d => d.type === 'lend').length} piutang aktif</span>.
                      </p>
                      <Button variant="nexus-emerald" className="w-full py-6 h-auto" onClick={() => dispatch({ type: 'TOGGLE_DEBT_MODAL', payload: true })}>Inisialisasi Protokol Baru</Button>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <Landmark className="w-5 h-5 text-rose-500" /> Utang Personal
                    </h3>
                    <div className="space-y-4">
                      {debts.filter(d => d.type === 'owe').length === 0 ? (
                        <div className="p-12 rounded-[32px] bg-white/[0.01] border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Tidak Ada Utang Aktif</p>
                        </div>
                      ) : (
                        debts.filter(d => d.type === 'owe').map((d) => (
                          <Card key={d.id} glass className="p-6 border-white/5 space-y-4 relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-white uppercase">{d.name}</h4>
                                <p className="text-[10px] text-white/30 font-bold uppercase">{d.contact_info || 'Tanpa Catatan'}</p>
                              </div>
                              <button onClick={() => handleDeleteDebt(d.id, d.name)} className="text-white/10 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-white/20">Progres Pelunasan</span>
                                <span className="text-white">{formatCurrency(Number(d.amount) - Number(d.remaining_amount))} / {formatCurrency(Number(d.amount))}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${((Number(d.amount) - Number(d.remaining_amount)) / Number(d.amount)) * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{d.due_date ? `Deadline: ${new Date(d.due_date).toLocaleDateString('id-ID')}` : 'Tenor Terbuka'}</span>
                              <Button size="sm" variant="outline" className="h-auto py-2 rounded-xl text-[9px] font-black uppercase" onClick={() => dispatch({ type: 'OPEN_PAY_MODAL', payload: { debt: d, defaultNote: `Pelunasan: ${d.name}` } })}>Bayar Cicilan</Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <HandCoins className="w-5 h-5 text-emerald-500" /> Piutang Personal
                    </h3>
                    <div className="space-y-4">
                      {debts.filter(d => d.type === 'lend').length === 0 ? (
                        <div className="p-12 rounded-[32px] bg-white/[0.01] border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Tidak Ada Piutang Aktif</p>
                        </div>
                      ) : (
                        debts.filter(d => d.type === 'lend').map((d) => (
                          <Card key={d.id} glass className="p-6 border-white/5 space-y-4 relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-white uppercase">{d.name}</h4>
                                <p className="text-[10px] text-white/30 font-bold uppercase">{d.contact_info || 'Tanpa Catatan'}</p>
                              </div>
                              <button onClick={() => handleDeleteDebt(d.id, d.name)} className="text-white/10 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-white/20">Progres Penagihan</span>
                                <span className="text-white">{formatCurrency(Number(d.amount) - Number(d.remaining_amount))} / {formatCurrency(Number(d.amount))}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${((Number(d.amount) - Number(d.remaining_amount)) / Number(d.amount)) * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{d.due_date ? `Deadline: ${new Date(d.due_date).toLocaleDateString('id-ID')}` : 'Tenor Terbuka'}</span>
                              <Button size="sm" variant="outline" className="h-auto py-2 rounded-xl text-[9px] font-black uppercase" onClick={() => dispatch({ type: 'OPEN_PAY_MODAL', payload: { debt: d, defaultNote: `Terima dari: ${d.name}` } })}>Terima Dana</Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </StateContainer>
            )}
          </>
        </StateContainer>

        {/* MODALS */}
        <DebtFormModal
          isOpen={state.isLoanModalOpen}
          onClose={() => dispatch({ type: 'TOGGLE_LOAN_MODAL', payload: false })}
          onSubmit={handleCreateLoan}
          submitting={state.submitting}
        />

        <Modal isOpen={state.isDebtModalOpen} onClose={() => dispatch({ type: 'TOGGLE_DEBT_MODAL', payload: false })} title="Initialize Ledger Protocol">
          <form onSubmit={handleCreateDebtSubmit} className="space-y-8 p-2">
            <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-2 rounded-[24px] border border-white/5">
              {(['owe', 'lend'] as const).map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => dispatch({ type: 'UPDATE_DEBT_FORM', payload: { type: t } })}
                  className={`py-4 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    state.debtForm.type === t ? (t === 'owe' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white') : 'text-white/30 hover:text-white'
                  }`}
                >
                  {t === 'owe' ? 'Utang' : 'Piutang'}
                </button>
              ))}
            </div>

            <Input label="Label Protokol" value={state.debtForm.name} onChange={(e) => dispatch({ type: 'UPDATE_DEBT_FORM', payload: { name: e.target.value } })} required disabled={state.submitting} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Magnitude (Rp)" type="number" value={state.debtForm.amount} onChange={(e) => dispatch({ type: 'UPDATE_DEBT_FORM', payload: { amount: e.target.value } })} required disabled={state.submitting} />
              <DatePicker label="Chronological Deadline" value={state.debtForm.dueDate} onChange={(val) => dispatch({ type: 'UPDATE_DEBT_FORM', payload: { dueDate: val } })} disabled={state.submitting} />
            </div>
            <Input label="Counterparty / Catatan" value={state.debtForm.contactInfo} onChange={(e) => dispatch({ type: 'UPDATE_DEBT_FORM', payload: { contactInfo: e.target.value } })} disabled={state.submitting} />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-[24px] py-8" onClick={() => dispatch({ type: 'TOGGLE_DEBT_MODAL', payload: false })} disabled={state.submitting}>Batal</Button>
              <Button type="submit" loading={state.submitting} className="flex-1 rounded-[24px] bg-emerald-500 py-8">Simpan Protokol</Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={state.isPayModalOpen} onClose={() => dispatch({ type: 'CLOSE_PAY_MODAL' })} title="Execute Repayment Protocol">
          {state.selectedDebt && (
            <form onSubmit={handlePaymentSubmit} className="space-y-8 p-2">
              <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Entitas</p>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">{state.selectedDebt.name}</h4>
              </div>
              <Select
                label={state.selectedDebt.type === 'owe' ? 'Sumber Dana (Dompet)' : 'Tujuan Dana (Dompet)'}
                options={[{ value: '', label: '-- Pilih Dompet --' }, ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance))})` }))]}
                value={state.payForm.walletId} onChange={(e) => dispatch({ type: 'UPDATE_PAY_FORM', payload: { walletId: e.target.value } })} required disabled={state.submitting}
              />
              <Input label="Nominal Transaksi (Rp)" type="number" value={state.payForm.amount} onChange={(e) => dispatch({ type: 'UPDATE_PAY_FORM', payload: { amount: e.target.value } })} required disabled={state.submitting} />
              <Input label="Catatan Log" value={state.payForm.note} onChange={(e) => dispatch({ type: 'UPDATE_PAY_FORM', payload: { note: e.target.value } })} disabled={state.submitting} />
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1 rounded-[24px] py-8" onClick={() => dispatch({ type: 'CLOSE_PAY_MODAL' })} disabled={state.submitting}>Batal</Button>
                <Button type="submit" loading={state.submitting} className={`flex-1 rounded-[24px] py-8 ${state.selectedDebt.type === 'owe' ? 'bg-rose-500' : 'bg-emerald-400'}`}>
                  Otorisasi {state.selectedDebt.type === 'owe' ? 'Pembayaran' : 'Penerimaan'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </UpgradeGate>
    </div>
  );
}