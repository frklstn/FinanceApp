'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { transactionService } from '@/lib/services/transaction.service';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import * as XLSX from 'xlsx';
import {
  User,
  Settings,
  Database,
  Download,
} from 'lucide-react';

export default function SettingsPage() {
  const { accountId, appSettings } = useApp();
  const { toast } = useToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'data'>('profile');
  const [loading, setLoading] = useState(true);

  // Profile preferences fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Predefined premium avatar presets
  const PRESET_AVATARS = [
    { name: 'Trader Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
    { name: 'Gold Investor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
    { name: 'Fintech Guru', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Finance' },
    { name: 'Wealth Star', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wealth' },
    { name: 'Crypto Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Trader' },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || 'User');
        setCurrency(user.user_metadata?.currency || 'USD');
        
        // Fetch current custom profile details from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setAvatarUrl(profile.avatar_url || '');
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(fetchProfile);
    // Query param tab select check
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'data') {
        Promise.resolve().then(() => setActiveTab('data'));
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    if (fullName) {
      document.title = `FinanceApp - ${fullName}`;
    }
  }, [fullName]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          currency: currency,
          avatar_url: avatarUrl,
        },
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      toast('Profile preferences and avatar updated!', 'success');
      
      // Instantly update tab title
      document.title = `FinanceApp - ${fullName}`;
    } catch (err: any) {
      toast(err.message || 'Failed to update settings', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcelExport = async () => {
    if (!accountId) return;
    toast('Fetching full ledger transactions...', 'info');

    try {
      // 1. Fetch ALL transactions inside workspace
      const { data: allTxs } = await transactionService.getTransactions(accountId, {
        limit: 10000,
      });

      if (allTxs.length === 0) {
        toast('Tidak ada transaksi untuk diekspor.', 'warning');
        return;
      }

      // 2. Map items to neat headers
      const rows = allTxs.map((tx) => ({
        ID: tx.id,
        Date: new Date(tx.date).toLocaleDateString(),
        Type: tx.type.toUpperCase(),
        Amount: Number(tx.amount),
        Wallet: tx.wallets?.name || 'General',
        Category: tx.categories?.name || 'General',
        Note: tx.note || '',
        Tags: tx.tags?.join(', ') || '',
      }));

      // 3. Create SheetJS sheet & workbook
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions Ledger');

      // Autofit widths
      const colWidths = [
        { wch: 25 }, // ID
        { wch: 12 }, // Date
        { wch: 10 }, // Type
        { wch: 12 }, // Amount
        { wch: 15 }, // Wallet
        { wch: 15 }, // Category
        { wch: 30 }, // Note
        { wch: 20 }, // Tags
      ];
      worksheet['!cols'] = colWidths;

      // 4. Save file
      const fileName = `${appSettings.app_name.replace(/\s+/g, '_')}_Ledger.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast('Excel sheet workbook exported successfully!', 'success');

    } catch (err: any) {
      toast(err.message || 'Excel compilation failed.', 'danger');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
          <Settings className="w-5.5 h-5.5 text-primary" />
          System Preferences & Settings
        </h2>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Configure profile metadata, default currency, and export transaction data.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-light-border/40 dark:border-dark-border/40 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary text-primary'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <User className="w-4 h-4" />
          Profile preferences
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeTab === 'data'
              ? 'border-b-2 border-primary text-primary'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <Database className="w-4 h-4" />
          Export & Import
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
      ) : activeTab === 'profile' ? (
        /* Profile tab */
        <Card className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitting}
              />
              <Input
                label="Email Address"
                value={email}
                required
                disabled
                description="Your login credential address is immutable."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Global Currency Symbol"
                options={[
                  { value: 'USD', label: 'USD ($) - United States' },
                  { value: 'EUR', label: 'EUR (€) - European Union' },
                  { value: 'IDR', label: 'IDR (Rp) - Indonesia' },
                  { value: 'GBP', label: 'GBP (£) - United Kingdom' },
                ]}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Premium User Avatar Customizer Section */}
            <div className="space-y-4 pt-4 border-t border-light-border/40 dark:border-dark-border/40">
              <label className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                User Profile Avatar
              </label>
              
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/20 dark:bg-dark-bg/10">
                {/* Live Preview Avatar Circle */}
                <div className="relative w-20 h-20 rounded-full border-2 border-primary/45 bg-light-card dark:bg-dark-card flex items-center justify-center overflow-hidden shadow-md shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-light-text-secondary" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-3">
                  <Input
                    label="Avatar Custom URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={submitting}
                    description="Paste any premium direct graphic link, or select from the presets below."
                  />
                </div>
              </div>

              {/* Predefined Avatars Picker Grid */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                  Select Predefined Premium Avatar Preset:
                </p>
                <div className="grid grid-cols-5 gap-3 max-w-lg">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => setAvatarUrl(av.url)}
                      className={`relative aspect-square rounded-xl border flex items-center justify-center p-1.5 transition-all duration-150 cursor-pointer ${
                        avatarUrl === av.url
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-light-border/40 dark:border-dark-border/40 hover:border-primary/40 hover:bg-light-bg/50 dark:hover:bg-dark-bg/25'
                      }`}
                      title={av.name}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-full object-contain" />
                      {avatarUrl === av.url && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-extrabold shadow-sm border border-light-bg dark:border-dark-bg">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-light-border/40 dark:border-dark-border/40">
              <Button type="submit" loading={submitting}>
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* Data Tab */
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
              Export Finance Data
            </h3>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              Unduh seluruh transaksi akun Anda dalam format `.xlsx` (kategori, dompet, nominal, catatan).
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button className="flex items-center gap-2 cursor-pointer" onClick={handleExcelExport}>
                <Download className="w-4 h-4" />
                Export Ledger to Excel (.xlsx)
              </Button>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
