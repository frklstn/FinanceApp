'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import { walletService, type Wallet } from '@/lib/services/workspace/wallet.service';
import { categoryService, type Category } from '@/lib/services/finance/category.service';
import { transactionService } from '@/lib/services/workspace/transaction.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { formatCurrency } from '@/lib/debt-planner/format';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  initialType: 'income' | 'expense' | 'transfer';
  onSuccess?: () => void;
}

export function QuickAddModal({ isOpen, onClose, accountId, initialType, onSuccess }: QuickAddModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16));
  const [walletId, setWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setType(initialType);
    }
  }

  useEffect(() => {
    if (isOpen && accountId) {
      const fetchData = async () => {
        try {
          const [wList, cList] = await Promise.all([
            walletService.getWallets(accountId),
            categoryService.getCategories(accountId)
          ]);
          setWallets(wList);
          setCategories(cList);
        } catch (err) {
          console.error('Failed to fetch modal data:', err);
        }
      };
      fetchData();
    }
  }, [isOpen, accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !walletId || !amount) {
      toast('Mohon lengkapi data wajib (Nominal & Dompet).', 'warning');
      return;
    }

    const selectedWallet = wallets.find(w => w.id === walletId);
    const currency = selectedWallet?.currency || 'IDR';

    setLoading(true);
    try {
      const exchangeRate = await currencyService.getExchangeRate(currency, 'IDR');

      await transactionService.createTransaction(accountId, {
        workspace_id: accountId,
        wallet_id: walletId,
        category_id: type !== 'transfer' ? categoryId || null : null,
        amount: Number(amount),
        type,
        destination_wallet_id: type === 'transfer' ? destWalletId : null,
        note: note.trim() || null,
        date: new Date(date).toISOString(),
        tags: [],
        currency,
        exchange_rate: exchangeRate,
        attachment_url: null,
        is_recurring: false,
        recurring_id: null,
      });

      toast('Transaksi berhasil dicatat!', 'success');
      setAmount('');
      setNote('');
      setCategoryId('');
      setWalletId('');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan transaksi.';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Catat ${type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Transfer'} Baru`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Jumlah Nominal (${wallets.find(w => w.id === walletId)?.currency || 'Rp'})`}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
          />
          <DatePicker
            label="Tanggal"
            showTime={true}
            value={date}
            onChange={(val) => setDate(val)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={type === 'transfer' ? 'Dari Dompet' : 'Pilih Dompet'}
            options={[
              { value: '', label: '-- Pilih Dompet --' },
              ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance), w.currency || 'IDR')})` })),
            ]}
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            required
            disabled={loading}
          />
          
          {type === 'transfer' ? (
            <Select
              label="Ke Dompet"
              options={[
                { value: '', label: '-- Pilih Dompet --' },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance), w.currency || 'IDR')})` })),
              ]}
              value={destWalletId}
              onChange={(e) => setDestWalletId(e.target.value)}
              required
              disabled={loading}
            />
          ) : (
            <Select
              label="Kategori"
              options={[
                { value: '', label: '-- Tanpa Kategori --' },
                ...categories
                  .filter((c) => c.type === type)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
            />
          )}
        </div>

        <Input
          label="Catatan / Keterangan"
          placeholder="Contoh: Gaji bulanan, Makan siang, dll"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-light-border/40 dark:border-dark-border/40">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" loading={loading}>
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
