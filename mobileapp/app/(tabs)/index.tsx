import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react-native';
import { api } from '../../src/lib/api-client';
import { COLORS, SPACING } from '../../src/constants/theme';
import { DashboardSummary, Transaction, Wallet } from '../../src/types/api';

function formatRupiah(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [sumRes, walRes, txRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<Wallet[]>('/wallets'),
        api.get<Transaction[]>('/transactions?limit=10'),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (walRes.success && walRes.data) setWallets(walRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data);

      if (!sumRes.success && sumRes.message) {
        setError(sumRes.message);
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Menghubungkan ke Backend Rust...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color={COLORS.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Saldo Bersih Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Saldo Bersih</Text>
        <Text style={styles.heroBalance}>{formatRupiah(summary?.total_balance)}</Text>
        
        <View style={styles.cashflowRow}>
          <View style={styles.cashflowItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#10b98120' }]}>
              <ArrowDownLeft size={16} color="#10b981" />
            </View>
            <View>
              <Text style={styles.cashflowLabel}>Pemasukan</Text>
              <Text style={[styles.cashflowValue, { color: '#10b981' }]}>
                {formatRupiah(summary?.total_income)}
              </Text>
            </View>
          </View>

          <View style={styles.cashflowItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#ef444420' }]}>
              <ArrowUpRight size={16} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.cashflowLabel}>Pengeluaran</Text>
              <Text style={[styles.cashflowValue, { color: '#ef4444' }]}>
                {formatRupiah(summary?.total_expense)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dompet Aktif List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dompet Aktif</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/wallets')}>
          <Text style={styles.sectionLink}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletsScroll}>
        {wallets.length === 0 ? (
          <View style={styles.emptyWalletCard}>
            <Text style={styles.emptyText}>Belum ada dompet terdaftar</Text>
          </View>
        ) : (
          wallets.map((w) => (
            <View key={w.id} style={[styles.walletCard, { borderColor: w.color || COLORS.cardBorder }]}>
              <View style={styles.walletCardTop}>
                <View style={[styles.walletDot, { backgroundColor: w.color || COLORS.primary }]} />
                <Text style={styles.walletType}>{w.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.walletName} numberOfLines={1}>{w.name}</Text>
              <Text style={styles.walletBalance}>{formatRupiah(w.balance)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Transaksi Terbaru */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
        <Text style={styles.txCountBadge}>{summary?.transaction_count ?? 0} Transaksi</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Belum ada transaksi di periode ini</Text>
        </View>
      ) : (
        <View style={styles.txList}>
          {transactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            return (
              <View key={tx.id} style={styles.txItem}>
                <View
                  style={[
                    styles.txIconCircle,
                    { backgroundColor: isExpense ? '#ef444415' : isIncome ? '#10b98115' : '#3b82f615' },
                  ]}
                >
                  {isExpense ? (
                    <ArrowUpRight size={18} color="#ef4444" />
                  ) : isIncome ? (
                    <ArrowDownLeft size={18} color="#10b981" />
                  ) : (
                    <RefreshCw size={16} color="#3b82f6" />
                  )}
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txNote} numberOfLines={1}>
                    {tx.note || (isExpense ? 'Pengeluaran' : isIncome ? 'Pemasukan' : 'Transfer')}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.txAmount,
                    { color: isExpense ? '#ef4444' : isIncome ? '#10b981' : COLORS.foreground },
                  ]}
                >
                  {isExpense ? '-' : isIncome ? '+' : ''}
                  {formatRupiah(tx.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#ef444415',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  errorText: {
    color: COLORS.destructive,
    fontSize: 12,
    flex: 1,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  heroLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroBalance: {
    color: COLORS.foreground,
    fontSize: 28,
    fontWeight: '700',
    marginVertical: SPACING.sm,
  },
  cashflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  cashflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashflowLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },
  cashflowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLink: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  txCountBadge: {
    color: COLORS.muted,
    fontSize: 11,
  },
  walletsScroll: {
    marginBottom: SPACING.lg,
  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    width: 150,
    marginRight: SPACING.sm,
    borderWidth: 1,
  },
  emptyWalletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  walletCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  walletType: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  walletName: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  walletBalance: {
    color: COLORS.foreground,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  txList: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  txInfo: {
    flex: 1,
  },
  txNote: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  txDate: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
  },
});
