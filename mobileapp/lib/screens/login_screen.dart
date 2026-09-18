import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import 'main_navigation.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _apiKeyController = TextEditingController();
  
  bool _isApiKeyMode = false;
  bool _loading = false;
  String? _error;

  Future<void> _handleLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (_isApiKeyMode) {
        final key = _apiKeyController.text.trim();
        if (key.isEmpty) {
          setState(() {
            _error = 'API Key wajib diisi.';
            _loading = false;
          });
          return;
        }

        await ApiService.setApiKey(key);
        final profile = await ApiService.getProfile();
        if (profile != null) {
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const MainNavigation()),
          );
          return;
        } else {
          await ApiService.clearAuth();
          setState(() {
            _error = 'API Key tidak valid atau telah dicabut.';
          });
        }
      } else {
        final id = _emailController.text.trim();
        final pass = _passwordController.text;
        if (id.isEmpty || pass.isEmpty) {
          setState(() {
            _error = 'Email/Username dan Password wajib diisi.';
            _loading = false;
          });
          return;
        }

        final success = await ApiService.login(id, pass);
        if (success) {
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const MainNavigation()),
          );
          return;
        } else {
          setState(() {
            _error = 'Email atau password salah.';
          });
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Gagal terhubung ke server backend.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                    ),
                    child: const Center(
                      child: Text('🪙', style: TextStyle(fontSize: 32)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'FinanceApp Native',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.foreground,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Terhubung langsung ke Rust Engine API',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppTheme.muted),
                ),
                const SizedBox(height: 32),

                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.destructive.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.destructive.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, size: 16, color: AppTheme.destructive),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(_error!, style: const TextStyle(color: AppTheme.destructive, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.cardBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (!_isApiKeyMode) ...[
                        const Text('Email atau Username', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.muted)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _emailController,
                          style: const TextStyle(color: AppTheme.foreground, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'nama@email.com / username',
                            hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
                            prefixIcon: const Icon(Icons.email_outlined, size: 18, color: AppTheme.muted),
                            filled: true,
                            fillColor: AppTheme.background,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.muted)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          style: const TextStyle(color: AppTheme.foreground, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: '••••••••',
                            hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
                            prefixIcon: const Icon(Icons.lock_outline, size: 18, color: AppTheme.muted),
                            filled: true,
                            fillColor: AppTheme.background,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ] else ...[
                        const Text('Third-Party API Key', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.muted)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _apiKeyController,
                          style: const TextStyle(color: AppTheme.foreground, fontSize: 13, fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: 'fin_live_...',
                            hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
                            prefixIcon: const Icon(Icons.key, size: 18, color: AppTheme.primary),
                            filled: true,
                            fillColor: AppTheme.background,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),

                      ElevatedButton(
                        onPressed: _loading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                            : Text(_isApiKeyMode ? 'Masuk dengan API Key' : 'Masuk', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                TextButton(
                  onPressed: () {
                    setState(() {
                      _isApiKeyMode = !_isApiKeyMode;
                      _error = null;
                    });
                  },
                  child: Text(
                    _isApiKeyMode ? '← Masuk dengan Email / Password' : 'Masuk instan menggunakan API Key →',
                    style: const TextStyle(color: AppTheme.muted, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
