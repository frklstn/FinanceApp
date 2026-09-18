import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'budgets_screen.dart';
import 'savings_screen.dart';
import 'debts_screen.dart';
import 'pinjol_screen.dart';
import 'transactions_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardSummary? _summary;
  List<Wallet> _wallets = [];
  List<Transaction> _transactions = [];
  List<CategorySpending> _categories = [];
  bool _loading = true;

  final _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final summary = await ApiService.getSummary();
    final wallets = await ApiService.getWallets();
    final transactions = await ApiService.getTransactions(limit: 6);
    final categories = await ApiService.getCategorySpending();

    if (mounted) {
      setState(() {
        _summary = summary;
        _wallets = wallets;
        _transactions = transactions;
        _categories = categories;
        _loading = false;
      });
    }
  }

  void _showQuickAddDialog() {
    if (_wallets.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Buat dompet terlebih dahulu di tab Dompet.')),
      );
      return;
    }

    String selectedWalletId = _wallets.first.id;
    String type = 'expense';
    final amountController = TextEditingController();
    final noteController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Catat Transaksi Cepat',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close, size: 20, color: AppTheme.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setModalState(() => type = 'expense'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: type == 'expense' ? AppTheme.danger.withOpacity(0.2) : AppTheme.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: type == 'expense' ? AppTheme.danger : AppTheme.cardBorder,
                          ),
                        ),
                        child: Text(
                          'Pengeluaran',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: type == 'expense' ? AppTheme.danger : AppTheme.textMuted,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setModalState(() => type = 'income'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: type == 'income' ? AppTheme.primary.withOpacity(0.2) : AppTheme.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: type == 'income' ? AppTheme.primary : AppTheme.cardBorder,
                          ),
                        ),
                        child: Text(
                          'Pemasukan',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: type == 'income' ? AppTheme.primary : AppTheme.textMuted,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              DropdownButtonFormField<String>(
                value: selectedWalletId,
                dropdownColor: AppTheme.surface,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Pilih Dompet',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: _wallets.map((w) {
                  return DropdownMenuItem(
                    value: w.id,
                    child: Text('${w.name} (${_currencyFormat.format(w.balance)})'),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setModalState(() => selectedWalletId = val);
                },
              ),
              const SizedBox(height: 12),

              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  labelText: 'Nominal (Rp)',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: noteController,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  labelText: 'Catatan / Keterangan',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),

              ElevatedButton(
                onPressed: () async {
                  final amt = double.tryParse(amountController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0.0;
                  if (amt <= 0) return;

                  final ok = await ApiService.createTransaction(
                    walletId: selectedWalletId,
                    amount: amt,
                    type: type,
                    note: noteController.text.trim().isEmpty ? null : noteController.text.trim(),
                  );

                  if (ok && mounted) {
                    Navigator.pop(ctx);
                    _fetchData();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: const Color(0xFF15130F),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Simpan Transaksi', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
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
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.account_balance_wallet_rounded, color: AppTheme.primary, size: 18),
            ),
            const SizedBox(width: 10),
            const Text('FinanceApp', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppTheme.primary),
            onPressed: _showQuickAddDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: AppTheme.primary,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // 1. Hero Net Worth Card (Sesuai Webapp)
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
                  const Text(
                    'TOTAL SALDO BERSIH',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _currencyFormat.format(_summary?.totalBalance ?? 0),
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 26, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppTheme.cardBorder),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.arrow_downward, color: AppTheme.primary, size: 16),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pemasukan', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                              Text(
                                _currencyFormat.format(_summary?.totalIncome ?? 0),
                                style: const TextStyle(color: AppTheme.primary, fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.danger.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.arrow_upward, color: AppTheme.danger, size: 16),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pengeluaran', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                              Text(
                                _currencyFormat.format(_summary?.totalExpense ?? 0),
                                style: const TextStyle(color: AppTheme.danger, fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Menu Pintas Cepat (Quick Access Grid Identik Webapp)
            Row(
              children: [
                _buildQuickAction(
                  context,
                  icon: Icons.pie_chart_outline,
                  label: 'Anggaran',
                  destination: const BudgetsScreen(),
                  color: AppTheme.primary,
                ),
                const SizedBox(width: 10),
                _buildQuickAction(
                  context,
                  icon: Icons.savings_outlined,
                  label: 'Tabungan',
                  destination: const SavingsScreen(),
                  color: AppTheme.info,
                ),
                const SizedBox(width: 10),
                _buildQuickAction(
                  context,
                  icon: Icons.handshake_outlined,
                  label: 'Utang',
                  destination: const DebtsScreen(),
                  color: AppTheme.warning,
                ),
                const SizedBox(width: 10),
                _buildQuickAction(
                  context,
                  icon: Icons.credit_card_outlined,
                  label: 'Pinjol',
                  destination: const PinjolScreen(),
                  color: AppTheme.danger,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 3. Dompet Aktif (Horizontal Scroll)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Dompet Aktif',
                  style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                Text(
                  '${_wallets.length} dompet',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 110,
              child: _wallets.isEmpty
                  ? Center(
                      child: Text('Belum ada dompet', style: TextStyle(color: AppTheme.textMuted)),
                    )
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _wallets.length,
                      itemBuilder: (context, index) {
                        final w = _wallets[index];
                        final colorInt = int.tryParse(w.color.replaceAll('#', '0xFF')) ?? 0xFFE2916A;

                        return Container(
                          width: 160,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.card,
                            borderRadius: BorderRadius.circular(14),
                            border: Border(
                              left: BorderSide(color: Color(colorInt), width: 3.5),
                              top: const BorderSide(color: AppTheme.cardBorder),
                              right: const BorderSide(color: AppTheme.cardBorder),
                              bottom: const BorderSide(color: AppTheme.cardBorder),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                w.type.toUpperCase(),
                                style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.w700),
                              ),
                              Text(
                                w.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                _currencyFormat.format(w.balance),
                                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 24),

            // 4. Kategori Pengeluaran Terbesar (Jika Ada)
            if (_categories.isNotEmpty) ...[
              const Text(
                'Alokasi Pengeluaran Terbesar',
                style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  children: _categories.map((c) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(c.name, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                              Text(_currencyFormat.format(c.amount), style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: c.share / 100,
                              minHeight: 6,
                              backgroundColor: AppTheme.surface,
                              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // 5. Aktivitas Transaksi Terbaru
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Aktivitas Terbaru',
                  style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const TransactionsScreen()));
                  },
                  child: const Text(
                    'Lihat Semua →',
                    style: TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_transactions.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: const Center(
                  child: Text('Belum ada catatan transaksi', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _transactions.length,
                  separatorBuilder: (_, __) => const Divider(color: AppTheme.cardBorder, height: 1),
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    final isExpense = tx.type == 'expense';
                    final isIncome = tx.type == 'income';

                    return ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isExpense
                              ? AppTheme.danger.withOpacity(0.15)
                              : isIncome
                                  ? AppTheme.primary.withOpacity(0.15)
                                  : AppTheme.info.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          isExpense
                              ? Icons.arrow_outward
                              : isIncome
                                  ? Icons.arrow_downward
                                  : Icons.sync,
                          color: isExpense
                              ? AppTheme.danger
                              : isIncome
                                  ? AppTheme.primary
                                  : AppTheme.info,
                          size: 18,
                        ),
                      ),
                      title: Text(
                        tx.note ?? (isExpense ? 'Pengeluaran' : 'Pemasukan'),
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        DateFormat('dd MMM yyyy, HH:mm').format(tx.date),
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                      ),
                      trailing: Text(
                        '${isExpense ? '-' : isIncome ? '+' : ''}${_currencyFormat.format(tx.amount)}',
                        style: TextStyle(
                          color: isExpense ? AppTheme.danger : isIncome ? AppTheme.primary : AppTheme.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Widget destination,
    required Color color,
  }) {
    return Expanded(
      child: InkWell(
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => destination));
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.cardBorder),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
