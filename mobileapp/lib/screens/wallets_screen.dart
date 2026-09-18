import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class WalletsScreen extends StatefulWidget {
  const WalletsScreen({super.key});

  @override
  State<WalletsScreen> createState() => _WalletsScreenState();
}

class _WalletsScreenState extends State<WalletsScreen> {
  List<Wallet> _wallets = [];
  bool _loading = true;

  final _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _fetchWallets();
  }

  Future<void> _fetchWallets() async {
    final wallets = await ApiService.getWallets();
    if (mounted) {
      setState(() {
        _wallets = wallets;
        _loading = false;
      });
    }
  }

  void _showAddWalletDialog() {
    final nameController = TextEditingController();
    final balanceController = TextEditingController();
    String selectedType = 'bank';
    String selectedColor = '#2563EB';

    final colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.card,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Tambah Dompet Baru', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: AppTheme.foreground, fontSize: 14),
                decoration: InputDecoration(
                  labelText: 'Nama Dompet',
                  labelStyle: const TextStyle(color: AppTheme.muted, fontSize: 12),
                  hintText: 'Misal: BCA, Mandiri, Kas',
                  hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 12),
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: balanceController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: AppTheme.foreground, fontSize: 14),
                decoration: InputDecoration(
                  labelText: 'Saldo Awal (Rp)',
                  labelStyle: const TextStyle(color: AppTheme.muted, fontSize: 12),
                  hintText: '0',
                  hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 12),
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),
              const Text('Tipe Dompet', style: TextStyle(color: AppTheme.muted, fontSize: 11, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Row(
                children: ['bank', 'ewallet', 'cash'].map((t) {
                  final isSelected = selectedType == t;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setDialogState(() => selectedType = t),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primary.withOpacity(0.2) : AppTheme.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.cardBorder),
                        ),
                        child: Text(
                          t == 'bank' ? 'Bank' : t == 'ewallet' ? 'E-Wallet' : 'Tunai',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isSelected ? AppTheme.primary : AppTheme.muted,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              const Text('Warna', style: TextStyle(color: AppTheme.muted, fontSize: 11, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: colors.map((c) {
                  final isSelected = selectedColor == c;
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedColor = c),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: Color(int.parse(c.replaceAll('#', '0xFF'))),
                        shape: BoxShape.circle,
                        border: isSelected ? Border.all(color: Colors.white, width: 2) : null,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppTheme.muted)),
            ),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                if (name.isEmpty) return;
                final bal = double.tryParse(balanceController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0.0;

                final ok = await ApiService.createWallet(name, bal, selectedType, selectedColor);
                if (ok && mounted) {
                  Navigator.pop(ctx);
                  _fetchWallets();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.black,
              ),
              child: const Text('Simpan', style: TextStyle(fontWeight: FontWeight.w700)),
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
        title: const Text('Kelola Dompet'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus, color: AppTheme.primary),
            onPressed: _showAddWalletDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchWallets,
        color: AppTheme.primary,
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _wallets.length,
          itemBuilder: (context, index) {
            final w = _wallets[index];
            final colorInt = int.tryParse(w.color.replaceAll('#', '0xFF')) ?? 0xFF10B981;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.cardBorder),
                borderLeft: BorderSide(color: Color(colorInt), width: 4),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Color(colorInt).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      w.type == 'bank' ? LucideIcons.landmark : w.type == 'ewallet' ? LucideIcons.smartphone : LucideIcons.wallet,
                      color: Color(colorInt),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          w.name,
                          style: const TextStyle(color: AppTheme.foreground, fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          w.type.toUpperCase(),
                          style: const TextStyle(color: AppTheme.muted, fontSize: 10, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    _currencyFormat.format(w.balance),
                    style: const TextStyle(color: AppTheme.foreground, fontSize: 15, fontWeight: FontWeight.w800),
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
