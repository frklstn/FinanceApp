import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class DebtsScreen extends StatefulWidget {
  const DebtsScreen({super.key});

  @override
  State<DebtsScreen> createState() => _DebtsScreenState();
}

class _DebtsScreenState extends State<DebtsScreen> {
  List<DebtItem> _debts = [];
  bool _loading = true;
  String _filter = 'i_owe'; // 'i_owe' (Utang Saya), 'they_owe' (Piutang Saya)
  final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _fetchDebts();
  }

  Future<void> _fetchDebts() async {
    final d = await ApiService.getDebts();
    if (mounted) {
      setState(() {
        _debts = d;
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

    final filtered = _debts.where((d) => d.type == _filter).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Utang & Piutang'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchDebts,
        color: AppTheme.primary,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Utang Saya')),
                      selected: _filter == 'i_owe',
                      selectedColor: AppTheme.danger.withOpacity(0.2),
                      labelStyle: TextStyle(
                        color: _filter == 'i_owe' ? AppTheme.danger : AppTheme.textMuted,
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) => setState(() => _filter = 'i_owe'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Piutang Saya')),
                      selected: _filter == 'they_owe',
                      selectedColor: AppTheme.primary.withOpacity(0.2),
                      labelStyle: TextStyle(
                        color: _filter == 'they_owe' ? AppTheme.primary : AppTheme.textMuted,
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) => setState(() => _filter = 'they_owe'),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.handshake_outlined, size: 48, color: AppTheme.textMuted),
                          const SizedBox(height: 12),
                          Text(
                            _filter == 'i_owe' ? 'Tidak ada catatan utang aktif' : 'Tidak ada catatan piutang aktif',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final d = filtered[index];
                        final isOwe = d.type == 'i_owe';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.card,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppTheme.cardBorder),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isOwe ? AppTheme.danger.withOpacity(0.15) : AppTheme.primary.withOpacity(0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  isOwe ? Icons.call_made : Icons.call_received,
                                  color: isOwe ? AppTheme.danger : AppTheme.primary,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      d.personName,
                                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                                    ),
                                    if (d.note != null) ...[
                                      const SizedBox(height: 2),
                                      Text(d.note!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                                    ],
                                  ],
                                ),
                              ),
                              Text(
                                _currencyFormat.format(d.amount),
                                style: TextStyle(
                                  color: isOwe ? AppTheme.danger : AppTheme.primary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
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
    );
  }
}
