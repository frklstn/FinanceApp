'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/app-context';

import { useDebts } from '@/hooks/useDebts';
import { useDebtForecast } from '@/hooks/useDebtForecast';
import { loanTrackerService } from '@/lib/services/loan-tracker.service';
import { debtService, Debt } from '@/lib/services/debt.service';
import { walletService, Wallet } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { APP_TEXTS } from '@/config/branding';
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
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import {
  AlertTriangle,
  HandCoins,
  Plus,
  BarChart2,
  LayoutList,
  Calendar,
  TrendingUp,
  AlertCircle,
  Info,
  Landmark,
  Trash2,
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import '@/styles/pages/pinjol.css';
import '@/styles/debt/dashboard.css';
import '@/styles/forecast/timeline.css';
import '@/styles/debt/calendar.css';

type Tab = 'overview' | 'daftar' | 'forecast' | 'timeline' | 'kalender' | 'ledger';

export default function PinjolPage() {
  const { accountId } = useApp();
  const { toast } = useToast();
  const { loans, loading, error, refresh } = useDebts(accountId ?? undefined);
  const forecast = useDebtForecast(accountId ?? undefined, loans);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Debt Integrated States
  const [debts, setDebts] = useState<Debt[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<'owe' | 'lend'>('owe');
  const [debtAmount, setDebtAmount] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payWalletId, setPayWalletId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const loadIntegratedData = React.useCallback(async () => {
    if (!accountId) return;
    try {
      const [dList, wList] = await Promise.all([
        debtService.getDebts(accountId),
        walletService.getWallets(accountId),
      ]);
      setDebts(dList);
      setWallets(wList);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    }
  }, [accountId]);

  React.useEffect(() => {
    if (accountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadIntegratedData();
    }
  }, [accountId, loadIntegratedData, refresh]);

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

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !debtName || !debtAmount) return;

    setSubmitting(true);
    try {
      await debtService.createDebt(
        accountId,
        debtName,
        debtType,
        Number(debtAmount),
        contactInfo || null,
        dueDate || null
      );
      toast('Rekod utang piutang berhasil disimpan.', 'success');
      setIsDebtModalOpen(false);
      setDebtName('');
      setDebtAmount('');
      setContactInfo('');
      setDueDate('');
      loadIntegratedData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayWalletId('');
    setPayAmount('');
    setPayNote(`Pelunasan: ${debt.name}`);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedDebt || !payWalletId || !payAmount) return;

    setSubmitting(true);
    try {
      await debtService.recordPayment(
        accountId,
        selectedDebt.id,
        Number(payAmount),
        payWalletId,
        payNote
      );
      toast('Pembayaran berhasil dicatat!', 'success');
      setIsPayModalOpen(false);
      setSelectedDebt(null);
      loadIntegratedData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal mencatat', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: string, name: string) => {
    if (!confirm(`Hapus rekod "${name}"?`)) return;
    try {
      await debtService.deleteDebt(id);
      toast('Rekod dihapus.', 'success');
      loadIntegratedData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus', 'danger');
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
    { key: 'overview', label: APP_TEXTS.pinjol.tabs.overview, icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'ledger', label: APP_TEXTS.pinjol.tabs.ledger, icon: <HandCoins className="w-3.5 h-3.5" /> },
    { key: 'forecast', label: APP_TEXTS.pinjol.tabs.forecast, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'daftar', label: APP_TEXTS.pinjol.tabs.list, icon: <LayoutList className="w-3.5 h-3.5" /> },
    { key: 'timeline', label: APP_TEXTS.pinjol.tabs.timeline, icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'kalender', label: APP_TEXTS.pinjol.tabs.calendar, icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  const isLoading = loading || forecast.plannerLoading;
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
            onClick={() => activeTab === 'ledger' ? setIsDebtModalOpen(true) : setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'ledger' ? 'Tambah Utang/Piutang' : 'Tambah Pinjaman'}
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

            {activeTab === 'ledger' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Net Position Hero */}
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
                            <NumberTicker value={Math.abs(debts.filter(d => d.type === 'lend').reduce((s, d) => s + Number(d.remaining_amount), 0) - debts.filter(d => d.type === 'owe').reduce((s, d) => s + Number(d.remaining_amount), 0))} formatter={formatRupiah} />
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-3 rounded-[24px] bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-rose-400" />
                          <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">
                            Utang: {formatRupiah(debts.filter(d => d.type === 'owe').reduce((s, d) => s + Number(d.remaining_amount), 0))}
                          </span>
                        </div>
                        <div className="px-6 py-3 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                          <HandCoins className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                            Piutang: {formatRupiah(debts.filter(d => d.type === 'lend').reduce((s, d) => s + Number(d.remaining_amount), 0))}
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
                      <Button variant="nexus-emerald" className="w-full py-6 h-auto" onClick={() => setIsDebtModalOpen(true)}>Inisialisasi Protokol Baru</Button>
                    </div>
                  </div>
                </Card>

                {/* Ledger Lists */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Owe Section */}
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
                                <span className="text-white">{formatRupiah(Number(d.amount) - Number(d.remaining_amount))} / {formatRupiah(Number(d.amount))}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${((Number(d.amount) - Number(d.remaining_amount)) / Number(d.amount)) * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{d.due_date ? `Deadline: ${new Date(d.due_date).toLocaleDateString('id-ID')}` : 'Tenor Terbuka'}</span>
                              <Button size="sm" variant="outline" className="h-auto py-2 rounded-xl text-[9px] font-black uppercase" onClick={() => handleOpenPayment(d)}>Bayar Cicilan</Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Lend Section */}
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
                                <span className="text-white">{formatRupiah(Number(d.amount) - Number(d.remaining_amount))} / {formatRupiah(Number(d.amount))}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${((Number(d.amount) - Number(d.remaining_amount)) / Number(d.amount)) * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{d.due_date ? `Deadline: ${new Date(d.due_date).toLocaleDateString('id-ID')}` : 'Tenor Terbuka'}</span>
                              <Button size="sm" variant="outline" className="h-auto py-2 rounded-xl text-[9px] font-black uppercase" onClick={() => handleOpenPayment(d)}>Terima Dana</Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <DebtFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
          submitting={submitting}
        />

        {/* Integrated Debt Modal */}
        <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title="Initialize Ledger Protocol">
          <form onSubmit={handleCreateDebt} className="space-y-8 p-2">
            <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-2 rounded-[24px] border border-white/5">
              {(['owe', 'lend'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDebtType(t)}
                  className={`py-4 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    debtType === t
                      ? t === 'owe' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                      : 'text-white/30 hover:text-white'
                  }`}
                >
                  {t === 'owe' ? 'Utang' : 'Piutang'}
                </button>
              ))}
            </div>

            <Input
              label="Label Protokol"
              placeholder="e.g. Pinjaman Personal, Modal Usaha"
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              required
              disabled={submitting}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Magnitude (Rp)"
                placeholder="0"
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                required
                disabled={submitting}
              />
              <DatePicker
                label="Chronological Deadline"
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                disabled={submitting}
              />
            </div>
            <Input
              label="Counterparty / Catatan"
              placeholder="Nama Orang atau Identitas"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              disabled={submitting}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-[24px] py-8" onClick={() => setIsDebtModalOpen(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" loading={submitting} className="flex-1 rounded-[24px] bg-emerald-500 py-8">Simpan Protokol</Button>
            </div>
          </form>
        </Modal>

        {/* Integrated Payment Modal */}
        <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Execute Repayment Protocol">
          {selectedDebt && (
            <form onSubmit={handlePaymentSubmit} className="space-y-8 p-2">
              <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Entitas</p>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">{selectedDebt.name}</h4>
              </div>

              <Select
                label={selectedDebt.type === 'owe' ? 'Sumber Dana (Dompet)' : 'Tujuan Dana (Dompet)'}
                options={[
                  { value: '', label: '-- Pilih Dompet --' },
                  ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatRupiah(Number(w.balance))})` })),
                ]}
                value={payWalletId}
                onChange={(e) => setPayWalletId(e.target.value)}
                required
                disabled={submitting}
              />
              <Input
                label="Nominal Transaksi (Rp)"
                placeholder="0"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                disabled={submitting}
              />
              <Input
                label="Catatan Log"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                disabled={submitting}
              />

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1 rounded-[24px] py-8" onClick={() => setIsPayModalOpen(false)} disabled={submitting}>Batal</Button>
                <Button type="submit" loading={submitting} className={`flex-1 rounded-[24px] py-8 ${selectedDebt.type === 'owe' ? 'bg-rose-500' : 'bg-emerald-400'}`}>
                  Otorisasi {selectedDebt.type === 'owe' ? 'Pembayaran' : 'Penerimaan'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </UpgradeGate>
    </div>
  );
}
