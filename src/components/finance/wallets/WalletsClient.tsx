'use client';

import React, { useState, useCallback } from 'react';
import { type Wallet, walletService } from '@/lib/services/workspace/wallet.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { transactionService } from '@/lib/services/workspace/transaction.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Banknote, Landmark, Smartphone, Bitcoin, PiggyBank, Plus, ArrowRightLeft, Settings2, Trash2 } from 'lucide-react';

const WALLET_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-5 h-5" />,
  bank: <Landmark className="w-5 h-5" />,
  ewallet: <Smartphone className="w-5 h-5" />,
  investment: <PiggyBank className="w-5 h-5" />,
  crypto: <Bitcoin className="w-5 h-5" />
};

const DEFAULT_CURRENCIES = [
  { value: 'IDR', label: 'Indonesian Rupiah (IDR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' }
];

interface WalletsClientProps {
  initialWallets: Wallet[];
  accountId: string;
}

export function WalletsClient({ initialWallets, accountId }: WalletsClientProps) {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('cash');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('IDR');
  const [color, setColor] = useState('var(--nexus-success)');

  // Transfer State
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const refreshWallets = useCallback(async () => {
    try {
      const data = await walletService.getWallets(accountId);
      setWallets(data);
    } catch {
      toast('Gagal memuat dompet', 'danger');
    }
  }, [accountId, toast]);

  const handleOpenModal = (wallet?: Wallet) => {
    if (wallet) {
      setEditingWallet(wallet);
      setName(wallet.name);
      setType(wallet.type);
      setBalance(wallet.balance.toString());
      setCurrency(wallet.currency || 'IDR');
      setColor(wallet.color || 'var(--nexus-success)');
    } else {
      setEditingWallet(null);
      setName('');
      setType('cash');
      setBalance('0');
      setCurrency('IDR');
      setColor('var(--nexus-success)');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWallet(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || !accountId) return;

    setSubmitting(true);
    try {
      if (editingWallet) {
        await walletService.updateWallet(editingWallet.id, {
          name, type, balance: Number(balance), currency, color
        });
        toast('Dompet berhasil diperbarui', 'success');
      } else {
        await walletService.createWallet(accountId, {
          name, type, balance: Number(balance), currency, color
        });
        toast('Dompet berhasil ditambahkan', 'success');
      }
      handleCloseModal();
      refreshWallets();
    } catch {
      toast('Gagal menyimpan dompet', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dompet ini? Transaksi di dalamnya tidak akan terhapus namun akan kehilangan referensi dompet.')) return;
    setSubmitting(true);
    try {
      await walletService.deleteWallet(id);
      toast('Dompet dihapus', 'success');
      refreshWallets();
    } catch {
      toast('Gagal menghapus dompet', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWalletId || !destWalletId || !transferAmount || sourceWalletId === destWalletId) return;

    setSubmitting(true);
    try {
      const source = wallets.find(w => w.id === sourceWalletId);
      const dest = wallets.find(w => w.id === destWalletId);

      if (!source || !dest) throw new Error('Dompet tidak valid');
      if (Number(source.balance) < Number(transferAmount)) throw new Error('Saldo tidak cukup');

      const amountToDeduct = Number(transferAmount);
      let amountToAdd = amountToDeduct;

      if (source.currency !== dest.currency) {
        amountToAdd = await currencyService.convert(amountToDeduct, source.currency || 'IDR', dest.currency || 'IDR');
      }

      await transactionService.createTransfer({
        accountId,
        sourceWalletId,
        destinationWalletId: destWalletId,
        amount: amountToDeduct,
        convertedAmount: amountToAdd,
        date: new Date().toISOString(),
        note: 'Transfer antar dompet'
      });

      toast('Transfer berhasil', 'success');
      setIsTransferOpen(false);
      setTransferAmount('');
      refreshWallets();
    } catch (err: any) {
      toast(err.message || 'Gagal transfer', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-[var(--nexus-text-primary)] uppercase tracking-tighter">Dompet Saya</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Dompet Baru
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map(wallet => (
          <Card key={wallet.id} glass className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: wallet.color || 'var(--nexus-success)' }} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[var(--nexus-bg-panel)] flex items-center justify-center text-[var(--nexus-text-secondary)]">
                  {WALLET_ICONS[wallet.type] || <Banknote className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--nexus-text-primary)]">{wallet.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--nexus-text-muted)]">{wallet.type}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenModal(wallet)}>
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(wallet.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[var(--nexus-text-secondary)]">Saldo Saat Ini</p>
              <p className="text-2xl font-black tracking-tighter text-[var(--nexus-text-primary)]">
                {formatCurrency(Number(wallet.balance))}
                <span className="text-sm font-semibold text-[var(--nexus-text-muted)] ml-1">{wallet.currency || 'IDR'}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>

      {wallets.length === 0 && (
        <div className="text-center py-20 bg-[var(--nexus-bg-card)] rounded-[32px] border border-[var(--nexus-glass-border)] border-dashed">
          <Banknote className="w-12 h-12 text-[var(--nexus-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--nexus-text-primary)] mb-2">Belum ada dompet</h3>
          <p className="text-sm text-[var(--nexus-text-secondary)] mb-6">Tambahkan dompet pertama Anda untuk mulai mencatat keuangan.</p>
          <Button onClick={() => handleOpenModal()}>Tambah Dompet</Button>
        </div>
      )}

      {/* Wallet Form Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingWallet ? 'Edit Dompet' : 'Dompet Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama Dompet" value={name} onChange={e => setName(e.target.value)} required placeholder="Mis: BCA, Gopay, Brankas" disabled={submitting} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipe" value={type} onChange={e => setType(e.target.value as any)} options={[
              { value: 'cash', label: 'Tunai' }, { value: 'bank', label: 'Rekening Bank' },
              { value: 'ewallet', label: 'E-Wallet' }, { value: 'investment', label: 'Investasi' }, { value: 'crypto', label: 'Kripto' }
            ]} disabled={submitting} />
            <Select label="Mata Uang" value={currency} onChange={e => setCurrency(e.target.value)} options={DEFAULT_CURRENCIES} disabled={submitting} />
          </div>
          <Input label="Saldo Awal" type="number" value={balance} onChange={e => setBalance(e.target.value)} required disabled={submitting} />
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--nexus-text-secondary)]">Warna Label</label>
            <div className="flex gap-2">
              {['var(--nexus-success)', 'var(--nexus-info)', 'var(--nexus-warning)', 'var(--nexus-danger)', '#8b5cf6', '#ec4899'].map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--nexus-glass-border)] mt-6">
            <Button variant="outline" type="button" onClick={handleCloseModal} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transfer Antar Dompet">
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select label="Sumber" value={sourceWalletId} onChange={e => setSourceWalletId(e.target.value)} required
            options={wallets.map(w => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance))})` }))} disabled={submitting} />
          
          <div className="flex justify-center my-2"><ArrowRightLeft className="w-5 h-5 text-[var(--nexus-text-muted)] rotate-90 md:rotate-0" /></div>
          
          <Select label="Tujuan" value={destWalletId} onChange={e => setDestWalletId(e.target.value)} required
            options={wallets.map(w => ({ value: w.id, label: w.name }))} disabled={submitting} />
            
          <Input label="Jumlah Transfer" type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} required disabled={submitting} />

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--nexus-glass-border)] mt-6">
            <Button variant="outline" type="button" onClick={() => setIsTransferOpen(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Memproses...' : 'Transfer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}