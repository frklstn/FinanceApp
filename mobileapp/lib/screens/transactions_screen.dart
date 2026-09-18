import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  List<Transaction> _transactions = [];
  List<Wallet> _wallets = [];
  bool _loading = true;
  String _filterType = 'all'; // 'all', 'income', 'expense'
  String _searchQuery = '';
  final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final txs = await ApiService.getTransactions(limit: 50);
    final wallets = await ApiService.getWallets();
    if (mounted) {
      setState(() {
        _transactions = txs;
        _wallets = wallets;
        _loading = false;
      });
    }
  }

  void _showAddTransactionDialog() {
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
                    'Catat Transaksi',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20, color: AppTheme.textMuted),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Pengeluaran')),
                      selected: type == 'expense',
                      selectedColor: AppTheme.danger.withOpacity(0.2),
                      labelStyle: TextStyle(
                        color: type == 'expense' ? AppTheme.danger : AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (_) => setModalState(() => type = 'expense'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Pemasukan')),
                      selected: type == 'income',
                      selectedColor: AppTheme.primary.withOpacity(0.2),
                      labelStyle: TextStyle(
                        color: type == 'income' ? AppTheme.primary : AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (_) => setModalState(() => type = 'income'),
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
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
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
                  labelText: 'Catatan / Deskripsi',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 18),

              ElevatedButton(
                onPressed: () async {
                  final raw = amountController.text.replaceAll(RegExp(r'[^0-9]'), '');
                  final amt = double.tryParse(raw) ?? 0.0;
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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

    final filteredTxs = _transactions.where((t) {
      if (_filterType == 'income' && t.type != 'income') return false;
      if (_filterType == 'expense' && t.type != 'expense') return false;
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchNote = t.note?.toLowerCase().contains(q) ?? false;
        final matchCat = t.categoryName?.toLowerCase().contains(q) ?? false;
        return matchNote || matchCat;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Riwayat Transaksi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppTheme.primary),
            onPressed: _showAddTransactionDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: AppTheme.primary,
        child: Column(
          children: [
            // Filter & Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                children: [
                  TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Cari transaksi / catatan...',
                      hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                      prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                      filled: true,
                      fillColor: AppTheme.card,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.cardBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.cardBorder),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      FilterChip(
                        label: const Text('Semua'),
                        selected: _filterType == 'all',
                        onSelected: (_) => setState(() => _filterType = 'all'),
                        selectedColor: AppTheme.primary.withOpacity(0.2),
                        labelStyle: TextStyle(
                          color: _filterType == 'all' ? AppTheme.primary : AppTheme.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Pemasukan'),
                        selected: _filterType == 'income',
                        onSelected: (_) => setState(() => _filterType = 'income'),
                        selectedColor: AppTheme.primary.withOpacity(0.2),
                        labelStyle: TextStyle(
                          color: _filterType == 'income' ? AppTheme.primary : AppTheme.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Pengeluaran'),
                        selected: _filterType == 'expense',
                        onSelected: (_) => setState(() => _filterType = 'expense'),
                        selectedColor: AppTheme.danger.withOpacity(0.2),
                        labelStyle: TextStyle(
                          color: _filterType == 'expense' ? AppTheme.danger : AppTheme.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Transactions List
            Expanded(
              child: filteredTxs.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.textMuted),
                          SizedBox(height: 12),
                          Text('Belum ada transaksi pada filter ini', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: filteredTxs.length,
                      itemBuilder: (context, index) {
                        final tx = filteredTxs[index];
                        final isIncome = tx.type == 'income';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.card,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.cardBorder),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isIncome ? AppTheme.primary.withOpacity(0.15) : AppTheme.danger.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                                  color: isIncome ? AppTheme.primary : AppTheme.danger,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      tx.note ?? tx.categoryName ?? (isIncome ? 'Pemasukan' : 'Pengeluaran'),
                                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      DateFormat('dd MMM yyyy, HH:mm').format(tx.date),
                                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '${isIncome ? '+' : '-'}${_currencyFormat.format(tx.amount)}',
                                style: TextStyle(
                                  color: isIncome ? AppTheme.primary : AppTheme.danger,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primary,
        foregroundColor: const Color(0xFF15130F),
        onPressed: _showAddTransactionDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
