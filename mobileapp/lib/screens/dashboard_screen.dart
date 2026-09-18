import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardSummary? _summary;
  List<Wallet> _wallets = [];
  List<Transaction> _transactions = [];
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
    final transactions = await ApiService.getTransactions(limit: 10);

    if (mounted) {
      setState(() {
        _summary = summary;
        _wallets = wallets;
        _transactions = transactions;
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
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.foreground),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(LucideIcons.x, size: 20, color: AppTheme.muted),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Type Selector
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setModalState(() => type = 'expense'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: type == 'expense' ? AppTheme.destructive.withOpacity(0.2) : AppTheme.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: type == 'expense' ? AppTheme.destructive : AppTheme.cardBorder,
                          ),
                        ),
                        child: Text(
                          'Pengeluaran',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: type == 'expense' ? AppTheme.destructive : AppTheme.muted,
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
                          color: type == 'income' ? AppTheme.primary.withOpacity(0.2) : AppTheme.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: type == 'income' ? AppTheme.primary : AppTheme.cardBorder,
                          ),
                        ),
                        child: Text(
                          'Pemasukan',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: type == 'income' ? AppTheme.primary : AppTheme.muted,
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

              // Amount Input
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: AppTheme.foreground, fontSize: 16, fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  labelText: 'Nominal (Rp)',
                  labelStyle: const TextStyle(color: AppTheme.muted),
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),

              // Note Input
              TextField(
                controller: noteController,
                style: const TextStyle(color: AppTheme.foreground, fontSize: 14),
                decoration: InputDecoration(
                  labelText: 'Catatan / Keterangan',
                  labelStyle: const TextStyle(color: AppTheme.muted),
                  filled: true,
                  fillColor: AppTheme.background,
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
                  foregroundColor: Colors.black,
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
        title: const Text('FinanceApp Native'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus, color: AppTheme.primary),
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
            // Saldo Card
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
                    style: TextStyle(color: AppTheme.muted, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _currencyFormat.format(_summary?.totalBalance ?? 0),
                    style: const TextStyle(color: AppTheme.foreground, fontSize: 26, fontWeight: FontWeight.w800),
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
                            child: const Icon(LucideIcons.arrowDownLeft, color: AppTheme.primary, size: 16),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pemasukan', style: TextStyle(color: AppTheme.muted, fontSize: 11)),
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
                              color: AppTheme.destructive.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(LucideIcons.arrowUpRight, color: AppTheme.destructive, size: 16),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pengeluaran', style: TextStyle(color: AppTheme.muted, fontSize: 11)),
                              Text(
                                _currencyFormat.format(_summary?.totalExpense ?? 0),
                                style: const TextStyle(color: AppTheme.destructive, fontSize: 13, fontWeight: FontWeight.w700),
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
            const SizedBox(height: 24),

            // Wallets Section
            const Text(
              'Dompet Aktif',
              style: TextStyle(color: AppTheme.foreground, fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 110,
              child: _wallets.isEmpty
                  ? Center(
                      child: Text('Belum ada dompet', style: TextStyle(color: AppTheme.muted)),
                    )
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _wallets.length,
                      itemBuilder: (context, index) {
                        final w = _wallets[index];
                        return Container(
                          width: 150,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.card,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.cardBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                w.type.toUpperCase(),
                                style: const TextStyle(color: AppTheme.muted, fontSize: 10, fontWeight: FontWeight.w700),
                              ),
                              Text(
                                w.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppTheme.foreground, fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                _currencyFormat.format(w.balance),
                                style: const TextStyle(color: AppTheme.foreground, fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 24),

            // Transactions Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Aktivitas Terbaru',
                  style: TextStyle(color: AppTheme.foreground, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                Text(
                  '${_summary?.transactionCount ?? 0} transaksi',
                  style: const TextStyle(color: AppTheme.muted, fontSize: 12),
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
                  child: Text('Belum ada catatan transaksi', style: TextStyle(color: AppTheme.muted, fontSize: 13)),
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
                              ? AppTheme.destructive.withOpacity(0.15)
                              : isIncome
                                  ? AppTheme.primary.withOpacity(0.15)
                                  : AppTheme.info.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          isExpense
                              ? LucideIcons.arrowUpRight
                              : isIncome
                                  ? LucideIcons.arrowDownLeft
                                  : LucideIcons.refreshCw,
                          color: isExpense
                              ? AppTheme.destructive
                              : isIncome
                                  ? AppTheme.primary
                                  : AppTheme.info,
                          size: 18,
                        ),
                      ),
                      title: Text(
                        tx.note ?? (isExpense ? 'Pengeluaran' : 'Pemasukan'),
                        style: const TextStyle(color: AppTheme.foreground, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        DateFormat('dd MMM yyyy, HH:mm').format(tx.date),
                        style: const TextStyle(color: AppTheme.muted, fontSize: 11),
                      ),
                      trailing: Text(
                        '${isExpense ? '-' : isIncome ? '+' : ''}${_currencyFormat.format(tx.amount)}',
                        style: TextStyle(
                          color: isExpense ? AppTheme.destructive : isIncome ? AppTheme.primary : AppTheme.foreground,
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
}
