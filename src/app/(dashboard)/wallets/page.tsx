'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { type Wallet, walletService } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  Banknote,
  Landmark,
  Smartphone,
  Bitcoin,
  PiggyBank,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react';

export default function WalletsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('wallet');

  // Transfer Fields
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchWallets = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const list = await walletService.getWallets(accountId);
      setWallets(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wallets';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    Promise.resolve().then(fetchWallets);
  }, [fetchWallets]);

  const resetForm = () => {
    setName('');
    setType('cash');
    setBalance('0');
    setColor('#6366f1');
    setIcon('wallet');
    setEditingWallet(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsWalletModalOpen(true);
  };

  const handleOpenEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.balance.toString());
    setColor(wallet.color);
    setIcon(wallet.icon);
    setIsWalletModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingWallet) {
        // Update
        await walletService.updateWallet(
          editingWallet.id,
          name,
          type,
          color,
          icon,
          editingWallet.is_active
        );
        toast('Dompet berhasil diperbarui!', 'success');
      } else {
        // Create
        await walletService.createWallet(
          accountId,
          name,
          type,
          Number(balance),
          color,
          icon
        );
        toast('Dompet berhasil dibuat!', 'success');
      }
      setIsWalletModalOpen(false);
      resetForm();
      fetchWallets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan dompet';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dompet ini? Semua transaksi yang berhubungan dengan dompet ini juga akan dihapus.')) return;
    try {
      await walletService.deleteWallet(id);
      toast('Dompet berhasil dihapus.', 'success');
      fetchWallets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus dompet';
      toast(msg, 'danger');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    if (!sourceId || !destId || !transferAmount) return;

    if (sourceId === destId) {
      toast('Dompet asal dan tujuan harus berbeda.', 'danger');
      return;
    }

    const amountNum = Number(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('Masukkan jumlah transfer yang valid.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await walletService.transferFunds(accountId, sourceId, destId, amountNum, transferNote);
      toast('Dana berhasil ditransfer!', 'success');
      setIsTransferModalOpen(false);
      setSourceId('');
      setDestId('');
      setTransferAmount('');
      setTransferNote('');
      fetchWallets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer gagal.';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const getWalletIcon = (wType: string, wColor: string) => {
    const iconClass = 'w-5 h-5';
    const style = { color: wColor };
    switch (wType) {
      case 'cash':
        return <Banknote className={iconClass} style={style} />;
      case 'bank':
        return <Landmark className={iconClass} style={style} />;
      case 'e-wallet':
        return <Smartphone className={iconClass} style={style} />;
      case 'crypto':
        return <Bitcoin className={iconClass} style={style} />;
      case 'savings':
        return <PiggyBank className={iconClass} style={style} />;
      default:
        return <CreditCard className={iconClass} style={style} />;
    }
  };

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-4 md:p-5 pb-24">
      {/* Header Summary Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Dompet & Rekening
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Kelola akun keuangan, aset likuid, dan simpanan Anda
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2 cursor-pointer" onClick={() => setIsTransferModalOpen(true)}>
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Dana
          </Button>
          <Button className="flex items-center gap-2 cursor-pointer" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4" />
            Dompet Baru
          </Button>
        </div>
      </div>

      {/* Aggregate Balance Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-info/10 dark:from-primary/20 dark:to-info/20 border-primary/20 dark:border-primary/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
            Total Saldo Gabungan
          </span>
          <h3 className="text-3xl font-extrabold tracking-tight text-primary dark:text-white mt-1">
            {formatRupiah(totalBalance)}
          </h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary dark:text-white">
          <WalletIcon className="w-6 h-6" />
        </div>
      </Card>

      {/* Wallets Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-4 text-light-text-secondary dark:text-dark-text-secondary">
            <WalletIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">Belum Ada Dompet</h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-4">
            Buat dompet pertama Anda seperti kas, rekening bank, atau e-wallet untuk mulai mencatat saldo dan transaksi.
          </p>
          <Button size="sm" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Dompet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${wallet.color}15` }}
                  >
                    {getWalletIcon(wallet.type, wallet.color)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                      {wallet.name}
                    </h4>
                    <span className="text-xs uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider text-[10px]">
                      {wallet.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(wallet)}
                    className="p-1.5 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/60 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary cursor-pointer transition-all duration-150"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWallet(wallet.id)}
                    className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary dark:text-dark-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <span className="text-[10px] uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                  Saldo Tersedia
                </span>
                <h4 className="text-2xl font-extrabold tracking-tight mt-0.5 text-light-text-primary dark:text-dark-text-primary">
                  {formatRupiah(Number(wallet.balance))}
                </h4>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Wallet Modal */}
      <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title={editingWallet ? 'Edit Dompet' : 'Buat Dompet Baru'}>
        <form onSubmit={handleSaveWallet} className="space-y-4">
          <Input
            label="Nama Dompet"
            placeholder="misal: Dompet Utama, Bank Mandiri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
          <Select
            label="Tipe Dompet"
            options={[
              { value: 'cash', label: 'Uang Tunai / Cash' },
              { value: 'bank', label: 'Rekening Bank' },
              { value: 'e-wallet', label: 'E-Wallet / Dompet Digital' },
              { value: 'crypto', label: 'Aset Kripto' },
              { value: 'savings', label: 'Deposito Tabungan' },
              { value: 'other', label: 'Lainnya' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={submitting}
          />
          {!editingWallet && (
            <Input
              label="Saldo Awal"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              disabled={submitting}
            />
          )}
          
          {/* Color & Icon select grids */}
          <div>
            <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1.5">
              Warna Tema Dompet
            </label>
            <div className="flex gap-2.5">
              {['#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  className={`w-7 h-7 rounded-full border cursor-pointer transition-all duration-150 ${
                    color === col ? 'scale-110 ring-2 ring-primary/20 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWalletModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {editingWallet ? 'Simpan Perubahan' : 'Buat Dompet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Funds Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Dana">
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select
            label="Dompet Asal"
            options={[
              { value: '', label: '-- Pilih Pengirim --' },
              ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatRupiah(Number(w.balance))})` })),
            ]}
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            required
            disabled={submitting}
          />
          <Select
            label="Dompet Tujuan"
            options={[
              { value: '', label: '-- Pilih Penerima --' },
              ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatRupiah(Number(w.balance))})` })),
            ]}
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Jumlah Transfer"
            type="number"
            placeholder="0"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Catatan Transfer"
            placeholder="misal: Pindahan saldo bulanan"
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Kirim Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
