import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class SavingsScreen extends StatefulWidget {
  const SavingsScreen({super.key});

  @override
  State<SavingsScreen> createState() => _SavingsScreenState();
}

class _SavingsScreenState extends State<SavingsScreen> {
  List<SavingsGoal> _savings = [];
  List<Wallet> _wallets = [];
  bool _loading = true;
  final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _fetchSavings();
  }

  Future<void> _fetchSavings() async {
    final s = await ApiService.getSavings();
    final w = await ApiService.getWallets();
    if (mounted) {
      setState(() {
        _savings = s;
        _wallets = w;
        _loading = false;
      });
    }
  }

  void _showContributeDialog(SavingsGoal goal) {
    if (_wallets.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Buat dompet sumber terlebih dahulu.')),
      );
      return;
    }

    String selectedWalletId = _wallets.first.id;
    final amountController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.card,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.cardBorder)),
          title: Text('Setor ke ${goal.name}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedWalletId,
                dropdownColor: AppTheme.surface,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Ambil dari Dompet',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: _wallets.map((w) => DropdownMenuItem(value: w.id, child: Text('${w.name} (${_currencyFormat.format(w.balance)})'))).toList(),
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedWalletId = val);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  labelText: 'Nominal Setoran (Rp)',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppTheme.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(amountController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0.0;
                if (amt <= 0) return;

                final ok = await ApiService.contributeSavings(
                  savingsGoalId: goal.id,
                  walletId: selectedWalletId,
                  amount: amt,
                );

                if (ok && mounted) {
                  Navigator.pop(ctx);
                  _fetchSavings();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: const Color(0xFF15130F),
              ),
              child: const Text('Setor Sekarang', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
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
        title: const Text('Target Tabungan'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchSavings,
        color: AppTheme.primary,
        child: _savings.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.savings_outlined, size: 48, color: AppTheme.textMuted),
                      SizedBox(height: 12),
                      Text('Belum Ada Target Tabungan', style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
                      SizedBox(height: 6),
                      Text('Buat pos tabungan impian Anda untuk memantau kemajuan finansial.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _savings.length,
                itemBuilder: (context, index) {
                  final s = _savings[index];
                  final percent = s.targetAmount > 0 ? (s.currentAmount / s.targetAmount).clamp(0.0, 1.0) : 0.0;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(s.name, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                            Text('${(percent * 100).toInt()}%', style: const TextStyle(color: AppTheme.primary, fontSize: 14, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: percent,
                            minHeight: 8,
                            backgroundColor: AppTheme.surface,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Terkumpul: ${_currencyFormat.format(s.currentAmount)}', style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
                                Text('Target: ${_currencyFormat.format(s.targetAmount)}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                              ],
                            ),
                            ElevatedButton.icon(
                              onPressed: () => _showContributeDialog(s),
                              icon: const Icon(Icons.add, size: 14),
                              label: const Text('Nabung', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary.withOpacity(0.15),
                                foregroundColor: AppTheme.primary,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
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
