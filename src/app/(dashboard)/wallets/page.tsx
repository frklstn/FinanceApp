'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { type Wallet, walletService } from '@/lib/services/wallet.service';
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
  const [color, setColor] = useState('#4F46E5');
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
    } catch (err: any) {
      toast(err.message || 'Failed to load wallets', 'danger');
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
    setColor('#4F46E5');
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
        toast('Wallet updated successfully!', 'success');
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
        toast('Wallet created successfully!', 'success');
      }
      setIsWalletModalOpen(false);
      resetForm();
      fetchWallets();
    } catch (err: any) {
      toast(err.message || 'Failed to save wallet', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wallet? All transactions belonging to this wallet will be deleted.')) return;
    try {
      await walletService.deleteWallet(id);
      toast('Wallet deleted successfully.', 'success');
      fetchWallets();
    } catch (err: any) {
      toast(err.message || 'Failed to delete wallet', 'danger');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    if (!sourceId || !destId || !transferAmount) return;

    if (sourceId === destId) {
      toast('Source and destination wallets must be different.', 'danger');
      return;
    }

    const amountNum = Number(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('Please enter a valid transfer amount.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await walletService.transferFunds(accountId, sourceId, destId, amountNum, transferNote);
      toast('Funds transferred successfully!', 'success');
      setIsTransferModalOpen(false);
      setSourceId('');
      setDestId('');
      setTransferAmount('');
      setTransferNote('');
      fetchWallets();
    } catch (err: any) {
      toast(err.message || 'Transfer failed.', 'danger');
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
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Summary Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Kantong & Wallets
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Manage your financial accounts, liquid assets, and deposits
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2 cursor-pointer" onClick={() => setIsTransferModalOpen(true)}>
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Funds
          </Button>
          <Button className="flex items-center gap-2 cursor-pointer" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4" />
            New Wallet
          </Button>
        </div>
      </div>

      {/* Aggregate Balance Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-info/10 dark:from-primary/20 dark:to-info/20 border-primary/20 dark:border-primary/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
            Aggregate Balance
          </span>
          <h3 className="text-3xl font-extrabold tracking-tight text-primary dark:text-white mt-1">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <h3 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">No Wallets Configured</h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-4">
            Create your first cash, bank account, or digital e-wallet to start tracking balances and cash flows
          </p>
          <Button size="sm" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Wallet
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
                  Available Balance
                </span>
                <h4 className="text-2xl font-extrabold tracking-tight mt-0.5 text-light-text-primary dark:text-dark-text-primary">
                  ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Wallet Modal */}
      <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title={editingWallet ? 'Edit Wallet' : 'Create New Wallet'}>
        <form onSubmit={handleSaveWallet} className="space-y-4">
          <Input
            label="Wallet Name"
            placeholder="e.g. Chase Bank, Pocket Cash"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
          <Select
            label="Wallet Type"
            options={[
              { value: 'cash', label: 'Cash / Dompet' },
              { value: 'bank', label: 'Bank Account' },
              { value: 'e-wallet', label: 'E-Wallet / Digital' },
              { value: 'crypto', label: 'Crypto Asset' },
              { value: 'savings', label: 'Savings Deposit' },
              { value: 'other', label: 'Other Type' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={submitting}
          />
          {!editingWallet && (
            <Input
              label="Starting Balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              disabled={submitting}
            />
          )}
          
          {/* Color & Icon select grids */}
          <div>
            <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1.5">
              Wallet Theme Color
            </label>
            <div className="flex gap-2.5">
              {['#4F46E5', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'].map((col) => (
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
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingWallet ? 'Update Wallet' : 'Create Wallet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Funds Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Funds">
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select
            label="Source Wallet"
            options={[
              { value: '', label: '-- Select Sender --' },
              ...wallets.map((w) => ({ value: w.id, label: `${w.name} ($${Number(w.balance).toFixed(2)})` })),
            ]}
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            required
            disabled={submitting}
          />
          <Select
            label="Destination Wallet"
            options={[
              { value: '', label: '-- Select Receiver --' },
              ...wallets.map((w) => ({ value: w.id, label: `${w.name} ($${Number(w.balance).toFixed(2)})` })),
            ]}
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Transfer Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Transfer Note"
            placeholder="e.g. Weekly savings target sweep"
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
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
