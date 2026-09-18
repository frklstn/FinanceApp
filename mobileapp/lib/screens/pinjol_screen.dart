import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class PinjolScreen extends StatefulWidget {
  const PinjolScreen({super.key});

  @override
  State<PinjolScreen> createState() => _PinjolScreenState();
}

class _PinjolScreenState extends State<PinjolScreen> {
  List<LoanTracker> _loans = [];
  bool _loading = true;

  final _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _fetchLoans();
  }

  Future<void> _fetchLoans() async {
    final loans = await ApiService.getLoans();
    if (mounted) {
      setState(() {
        _loans = loans;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    final totalMonthly = _loans.fold<double>(0.0, (sum, l) => sum + l.monthlyPayment);
    final isHealthy = totalMonthly == 0.0;
    final survivalScore = isHealthy ? 100 : (100 - (_loans.length * 15)).clamp(20, 85);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Debt Survival Planner'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchLoans,
        color: AppTheme.primary,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'DEBT SURVIVAL SCORE',
                            style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$survivalScore / 100',
                            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 24, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isHealthy ? AppTheme.primary.withOpacity(0.15) : AppTheme.warning.withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isHealthy ? Icons.verified_user : Icons.warning_amber_rounded,
                          color: isHealthy ? AppTheme.primary : AppTheme.warning,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    isHealthy
                        ? 'Finansial sangat sehat! Tidak ada cicilan pinjol aktif.'
                        : '${_loans.length} cicilan aktif membutuhkan alokasi ${_currencyFormat.format(totalMonthly)}/bulan.',
                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Daftar Pinjaman Online',
              style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),

            if (_loans.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.sentiment_satisfied_alt, size: 36, color: AppTheme.primary),
                    SizedBox(height: 8),
                    Text('Bebas Cicilan Pinjol', style: TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                    SizedBox(height: 4),
                    Text('Tidak ada data pinjol aktif tercatat saat ini.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _loans.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final l = _loans[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              l.notes ?? l.category.toUpperCase(),
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.warning.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Jatuh Tempo: Tgl ${l.dueDay}',
                                style: const TextStyle(color: AppTheme.warning, fontSize: 10, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Cicilan Per Bulan', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            Text(
                              _currencyFormat.format(l.monthlyPayment),
                              style: const TextStyle(color: AppTheme.danger, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Tenor & Total', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            Text(
                              '${l.tenureMonths} Bln (${_currencyFormat.format(l.totalRemainingBalance ?? l.totalRepayment)})',
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
