'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { transactionService } from '@/lib/services/transaction.service';
import { walletService, type Wallet } from '@/lib/services/wallet.service';
import { categoryService, type Category } from '@/lib/services/category.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  Plus,
  Filter,
  Trash2,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function TransactionsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  // Core Data Lists
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Loading & Pagination States
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterWallet, setFilterWallet] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add Transaction Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Quick Add Form States
  const [txType, setTxType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [txWalletId, setTxWalletId] = useState('');
  const [txDestWalletId, setTxDestWalletId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 16)); // YYYY-MM-DDTHH:MM
  const [txTagsString, setTxTagsString] = useState('');

  const fetchFiltersData = useCallback(async () => {
    if (!accountId) return;
    try {
      const [wList, cList] = await Promise.all([
        walletService.getWallets(accountId),
        categoryService.getCategories(accountId),
      ]);
      setWallets(wList);
      setCategories(cList);
    } catch (err: any) {
      console.error(err);
    }
  }, [accountId]);

  const fetchTransactions = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const { data, count: total } = await transactionService.getTransactions(accountId, {
        walletId: filterWallet || undefined,
        categoryId: filterCategory || undefined,
        type: filterType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm.trim() || undefined,
        limit,
        offset,
      });
      setTransactions(data);
      setCount(total);
    } catch (err: any) {
      toast(err.message || 'Failed to retrieve transactions.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, page, filterWallet, filterCategory, filterType, startDate, endDate, searchTerm, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchFiltersData);
    }
  }, [accountId, fetchFiltersData]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchTransactions);
    }
  }, [accountId, page, fetchTransactions]);

  // Handle Quick Add Submit
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    if (!txWalletId || !txAmount) {
      toast('Please enter a wallet and amount.', 'warning');
      return;
    }

    const amountNum = Number(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('Please enter a valid positive amount.', 'danger');
      return;
    }

    if (txType === 'transfer' && !txDestWalletId) {
      toast('Please specify a destination wallet for this transfer.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await transactionService.createTransaction(accountId, {
        workspace_id: accountId,
        wallet_id: txWalletId,
        category_id: txType !== 'transfer' ? txCategoryId || null : null,
        amount: amountNum,
        type: txType,
        destination_wallet_id: txType === 'transfer' ? txDestWalletId : null,
        note: txNote.trim() || null,
        date: new Date(txDate).toISOString(),
        tags: txTagsString ? txTagsString.split(',').map((t) => t.trim()).filter((t) => t) : [],
        attachment_url: null,
        is_recurring: false,
        recurring_id: null,
      });

      toast('Transaction logged successfully!', 'success');
      setIsModalOpen(false);
      
      // Reset Form fields
      setTxAmount('');
      setTxNote('');
      setTxTagsString('');
      setTxCategoryId('');
      setTxWalletId('');
      setTxDestWalletId('');
      
      setPage(1); // Return to first page
      fetchTransactions();
    } catch (err: any) {
      toast(err.message || 'Failed to register transaction.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This will reverse the amount change on the wallet balance.')) return;
    try {
      await transactionService.deleteTransaction(id);
      toast('Transaction deleted successfully.', 'success');
      fetchTransactions();
    } catch (err: any) {
      toast(err.message || 'Failed to remove transaction', 'danger');
    }
  };

  const getTxTypeDetails = (type: string) => {
    switch (type) {
      case 'income':
        return {
          icon: <TrendingUp className="w-4 h-4 text-success" />,
          color: 'text-success bg-success/10 border-success/20',
          sign: '+',
        };
      case 'expense':
        return {
          icon: <TrendingDown className="w-4 h-4 text-danger" />,
          color: 'text-danger bg-danger/10 border-danger/20',
          sign: '-',
        };
      default:
        return {
          icon: <ArrowRightLeft className="w-4 h-4 text-info" />,
          color: 'text-info bg-info/10 border-info/20',
          sign: '',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Title & Floating Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Financial Ledger
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            View, filter, and track all incoming and outgoing transaction flows
          </p>
        </div>
        <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      {/* Advanced Filter Panel */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-light-border/40 dark:border-dark-border/40 text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
          <Filter className="w-4 h-4 text-primary" />
          Filter Options
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'income', label: 'Income Only' },
              { value: 'expense', label: 'Expense Only' },
              { value: 'transfer', label: 'Transfer Only' },
            ]}
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={[
              { value: '', label: 'All Wallets' },
              ...wallets.map((w) => ({ value: w.id, label: w.name })),
            ]}
            value={filterWallet}
            onChange={(e) => {
              setFilterWallet(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
            ]}
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg pt-1">
          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-4 text-light-text-secondary dark:text-dark-text-secondary">
              <Info className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
              No transactions matched
            </h4>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm">
              Adjust your search keywords, remove filter criteria, or insert a brand new transaction record above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-border/40 dark:divide-dark-border/40">
            {transactions.map((tx) => {
              const details = getTxTypeDetails(tx.type);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-light-bg/40 dark:hover:bg-dark-bg/25 transition-all duration-150"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Direction badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${details.color}`}>
                      {details.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary truncate">
                        {tx.note || (tx.type === 'transfer' ? 'Wallet Transfer' : 'Uncategorized expense')}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        <span className="font-semibold">{tx.wallets?.name || 'Unknown account'}</span>
                        <span className="opacity-40">•</span>
                        {tx.type !== 'transfer' ? (
                          <span className="font-medium text-[11px]" style={{ color: tx.categories?.color }}>
                            {tx.categories?.name || 'General'}
                          </span>
                        ) : (
                          <span className="font-semibold text-info text-[11px]">Transfer</span>
                        )}
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold tracking-tight shrink-0 ${
                      tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-danger' : 'text-info'
                    }`}>
                      {details.sign}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Pagination Area */}
        {count > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-light-border/40 dark:border-dark-border/40">
            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, count)} of {count}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => (p * limit < count ? p + 1 : p))}
                disabled={page * limit >= count}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          {/* Type Tab Selection */}
          <div className="grid grid-cols-3 gap-2 bg-light-bg dark:bg-dark-bg/60 p-1 rounded-xl border border-light-border/40 dark:border-dark-border/40">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTxType(t);
                  setTxCategoryId('');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
                  txType === t
                    ? t === 'income'
                      ? 'bg-success text-white shadow-sm shadow-success/15'
                      : t === 'expense'
                      ? 'bg-danger text-white shadow-sm shadow-danger/15'
                      : 'bg-info text-white shadow-sm shadow-info/15'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Transaction Date"
              type="datetime-local"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={txType === 'transfer' ? 'Source Wallet' : 'Wallet Account'}
              options={[
                { value: '', label: '-- Choose --' },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} ($${Number(w.balance).toFixed(2)})` })),
              ]}
              value={txWalletId}
              onChange={(e) => setTxWalletId(e.target.value)}
              required
              disabled={submitting}
            />
            {txType === 'transfer' ? (
              <Select
                label="Destination Wallet"
                options={[
                  { value: '', label: '-- Choose --' },
                  ...wallets.map((w) => ({ value: w.id, label: `${w.name} ($${Number(w.balance).toFixed(2)})` })),
                ]}
                value={txDestWalletId}
                onChange={(e) => setTxDestWalletId(e.target.value)}
                required
                disabled={submitting}
              />
            ) : (
              <Select
                label="Category"
                options={[
                  { value: '', label: '-- General --' },
                  ...categories
                    .filter((c) => c.type === txType)
                    .map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                disabled={submitting}
              />
            )}
          </div>

          <Input
            label="Note / Remarks"
            placeholder="e.g. Starbucks Cappuccino"
            value={txNote}
            onChange={(e) => setTxNote(e.target.value)}
            disabled={submitting}
          />
          <Input
            label="Tags (Comma separated)"
            placeholder="e.g. coffee, breakfast, office"
            value={txTagsString}
            onChange={(e) => setTxTagsString(e.target.value)}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Log Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
