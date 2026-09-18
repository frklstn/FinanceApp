import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, ShieldCheck, Calendar, CreditCard } from 'lucide-react-native';
import { api } from '../../src/lib/api-client';
import { COLORS, SPACING } from '../../src/constants/theme';
import { LoanTracker } from '../../src/types/api';

function formatRupiah(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function PinjolScreen() {
  const [loans, setLoans] = useState<LoanTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPinjolData = useCallback(async () => {
    try {
      const loanRes = await api.get<LoanTracker[]>('/pinjol/loans');
      if (loanRes.success && loanRes.data) setLoans(loanRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPinjolData();
  }, [fetchPinjolData]);

  const totalMonthlyRepayment = loans.reduce((sum, l) => sum + (Number(l.monthly_payment) || 0), 0);
  const totalRemainingLoan = loans.reduce((sum, l) => sum + (Number(l.total_remaining_balance) || Number(l.total_repayment) || 0), 0);

  // Survival score estimation
  const isHealthy = totalMonthlyRepayment === 0;
  const survivalScore = isHealthy ? 100 : Math.max(20, Math.min(85, 100 - (loans.length * 15)));

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchPinjolData();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Survival Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreTop}>
          <View>
            <Text style={styles.scoreLabel}>Debt Survival Score</Text>
            <Text style={styles.scoreValue}>{survivalScore} / 100</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: isHealthy ? '#10b98120' : '#f59e0b20' }]}>
            {isHealthy ? (
              <ShieldCheck size={28} color="#10b981" />
            ) : (
              <AlertTriangle size={28} color="#f59e0b" />
            )}
          </View>
        </View>

        <Text style={styles.scoreDesc}>
          {isHealthy
            ? 'Finansial sangat sehat! Tidak ada cicilan pinjol aktif.'
            : `${loans.length} pinjaman aktif membutuhkan alokasi Rp ${formatRupiah(totalMonthlyRepayment)} per bulan.`}
        </Text>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Total Beban Bulanan</Text>
          <Text style={[styles.metricValue, { color: '#ef4444' }]}>{formatRupiah(totalMonthlyRepayment)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Sisa Pokok Utang</Text>
          <Text style={styles.metricValue}>{formatRupiah(totalRemainingLoan)}</Text>
        </View>
      </View>

      {/* Daftar Pinjaman Online Aktif */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pinjaman Berjalan ({loans.length})</Text>
      </View>

      {loans.length === 0 ? (
        <View style={styles.emptyCard}>
          <CreditCard size={36} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Bebas Pinjol!</Text>
          <Text style={styles.emptySubtitle}>Tidak ada cicilan atau pinjaman online aktif saat ini.</Text>
        </View>
      ) : (
        loans.map((loan) => (
          <View key={loan.id} style={styles.loanCard}>
            <View style={styles.loanTop}>
              <Text style={styles.loanCategory}>{loan.notes || loan.category.toUpperCase()}</Text>
              <View style={styles.dueBadge}>
                <Calendar size={12} color="#f59e0b" />
                <Text style={styles.dueText}>Tgl {loan.due_day}</Text>
              </View>
            </View>

            <View style={styles.loanRow}>
              <Text style={styles.loanLabel}>Cicilan Bulanan</Text>
              <Text style={styles.loanMonthly}>{formatRupiah(loan.monthly_payment)}</Text>
            </View>

            <View style={styles.loanRow}>
              <Text style={styles.loanLabel}>Tenor / Sisa Saldo</Text>
              <Text style={styles.loanDetail}>
                {loan.tenure_months} Bln ({formatRupiah(loan.total_remaining_balance || loan.total_repayment)})
              </Text>
            </View>
          </View>
        ))
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
  },
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  scoreTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDesc: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  metricRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  metricValue: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  emptyTitle: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  loanCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
  },
  loanTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  loanCategory: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  loanLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  loanMonthly: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  loanDetail: {
    color: COLORS.foreground,
    fontSize: 12,
    fontWeight: '500',
  },
});
