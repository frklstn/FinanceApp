import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  List<Budget> _budgets = [];
  bool _loading = true;
  final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _fetchBudgets();
  }

  Future<void> _fetchBudgets() async {
    final b = await ApiService.getBudgets();
    if (mounted) {
      setState(() {
        _budgets = b;
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

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Anggaran Bulanan'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchBudgets,
        color: AppTheme.primary,
        child: _budgets.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.pie_chart_outline, size: 48, color: AppTheme.textMuted),
                      SizedBox(height: 12),
                      Text(
                        'Belum Ada Anggaran Bulanan',
                        style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Buat anggaran bulanan untuk mengontrol pengeluaran kategori Anda.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _budgets.length,
                itemBuilder: (context, index) {
                  final b = _budgets[index];
                  final percent = b.amount > 0 ? (b.spent / b.amount).clamp(0.0, 1.0) : 0.0;
                  final isOver = b.spent > b.amount;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isOver ? AppTheme.danger.withOpacity(0.4) : AppTheme.cardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              b.categoryName,
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isOver ? AppTheme.danger.withOpacity(0.15) : AppTheme.primary.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '${(percent * 100).toInt()}% Terpakai',
                                style: TextStyle(
                                  color: isOver ? AppTheme.danger : AppTheme.primary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: percent,
                            minHeight: 8,
                            backgroundColor: AppTheme.surface,
                            valueColor: AlwaysStoppedAnimation<Color>(isOver ? AppTheme.danger : AppTheme.primary),
                          ),
                        ),
                        const SizedBox(height: 10),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Terpakai: ${_currencyFormat.format(b.spent)}',
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                            ),
                            Text(
                              'Batas: ${_currencyFormat.format(b.amount)}',
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
