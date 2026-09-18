import 'package:flutter/material.dart';
import '../constants/theme.dart';
import 'budgets_screen.dart';
import 'savings_screen.dart';
import 'debts_screen.dart';
import 'pinjol_screen.dart';
import 'profile_screen.dart';

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Menu & Fitur Lengkap'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'PERENCANAAN FINANSIAL',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5),
          ),
          const SizedBox(height: 12),

          _buildMenuItem(
            context,
            icon: Icons.pie_chart_outline,
            iconColor: AppTheme.primary,
            title: 'Anggaran Bulanan',
            subtitle: 'Kontrol batas belanja dan konsumsi per kategori',
            destination: const BudgetsScreen(),
          ),
          const SizedBox(height: 10),

          _buildMenuItem(
            context,
            icon: Icons.savings_outlined,
            iconColor: AppTheme.info,
            title: 'Target Tabungan',
            subtitle: 'Tabungan impian & progres pencapaian target',
            destination: const SavingsScreen(),
          ),
          const SizedBox(height: 10),

          _buildMenuItem(
            context,
            icon: Icons.handshake_outlined,
            iconColor: AppTheme.warning,
            title: 'Utang & Piutang',
            subtitle: 'Catat utang personal dan piutang rekan/teman',
            destination: const DebtsScreen(),
          ),
          const SizedBox(height: 10),

          _buildMenuItem(
            context,
            icon: Icons.credit_card_outlined,
            iconColor: AppTheme.danger,
            title: 'Pinjol Debt Planner',
            subtitle: 'Debt survival score, cicilan, & jatuh tempo',
            destination: const PinjolScreen(),
          ),
          const SizedBox(height: 24),

          const Text(
            'AKUN & PENGATURAN',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5),
          ),
          const SizedBox(height: 12),

          _buildMenuItem(
            context,
            icon: Icons.settings_outlined,
            iconColor: AppTheme.textSecondary,
            title: 'Pengaturan & Profil',
            subtitle: 'Manajemen akun, API Key bot, dan OTA Update',
            destination: const ProfileScreen(),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required Widget destination,
  }) {
    return InkWell(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => destination));
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
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
                color: iconColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppTheme.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
