import 'package:flutter/material.dart';
import 'constants/theme.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation.dart';
import 'services/api_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FinanceApp());
}

class FinanceApp extends StatelessWidget {
  const FinanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FinanceApp Native',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _checking = true;
  bool _authenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await ApiService.getToken();
    final apiKey = await ApiService.getApiKey();

    if ((token != null && token.isNotEmpty) || (apiKey != null && apiKey.isNotEmpty)) {
      final profile = await ApiService.getProfile();
      if (profile != null) {
        if (mounted) {
          setState(() {
            _authenticated = true;
            _checking = false;
          });
          return;
        }
      }
    }

    if (mounted) {
      setState(() {
        _authenticated = false;
        _checking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    return _authenticated ? const MainNavigation() : const LoginScreen();
  }
}
