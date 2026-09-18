import 'package:flutter/material.dart';
import '../constants/theme.dart';
import 'dashboard_screen.dart';
import 'wallets_screen.dart';
import 'pinjol_screen.dart';
import 'profile_screen.dart';
import '../services/updater_service.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Auto-check for updates after initial render
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          UpdaterService.checkForUpdates(context, silent: true);
        }
      });
    });
  }

  final List<Widget> _screens = const [
    DashboardScreen(),
    WalletsScreen(),
    PinjolScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppTheme.cardBorder, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: AppTheme.card,
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.muted,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined, size: 22),
              activeIcon: Icon(Icons.dashboard, size: 22),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined, size: 22),
              activeIcon: Icon(Icons.account_balance_wallet, size: 22),
              label: 'Dompet',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.credit_card_outlined, size: 22),
              activeIcon: Icon(Icons.credit_card, size: 22),
              label: 'Pinjol',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline, size: 22),
              activeIcon: Icon(Icons.person, size: 22),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
