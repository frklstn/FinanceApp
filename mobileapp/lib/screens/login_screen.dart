import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/updater_service.dart';
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
  String _currentVersion = '1.0.0';

  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '792379168886-dbg409p53a194ei931hpitstgiq1l1dt.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
    _loadVersionAndCheckUpdates();
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    _emailController.dispose();
    _passwordController.dispose();
    _apiKeyController.dispose();
    super.dispose();
  }

  Future<void> _loadVersionAndCheckUpdates() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _currentVersion = info.version;
        });
      }
    } catch (_) {}

    // Auto-check for updates quietly on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          UpdaterService.checkForUpdates(context, silent: true);
        }
      });
    });
  }

  void _initDeepLinks() {
    _appLinks = AppLinks();

    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      if (uri.scheme == 'financeapp' && uri.host == 'auth' && uri.path == '/callback') {
        final token = uri.queryParameters['token'];
        if (token != null && token.isNotEmpty) {
          _handleAuthCallbackToken(token);
        }
      }
    }, onError: (_) {});
  }

  Future<void> _handleAuthCallbackToken(String token) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ApiService.saveJwtToken(token);
      final profile = await ApiService.getProfile();
      if (profile != null && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MainNavigation()),
        );
        return;
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Gagal memproses sesi login Google.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // 1. Coba Native GMS Google Play Services Account Picker
      try {
        final account = await _googleSignIn.signIn();
        if (account != null) {
          final auth = await account.authentication;
          final success = await ApiService.googleLogin(
            email: account.email,
            name: account.displayName,
            avatarUrl: account.photoUrl,
            idToken: auth.idToken,
          );

          if (success && mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const MainNavigation()),
            );
            return;
          }
        }
      } catch (_) {
        // Fallback ke browser jika GMS gagal atau tidak tersedia
      }

      // 2. Fallback Browser OAuth
      final googleAuthUri = Uri.parse('https://fin.llvy.space/api/auth/google?mode=mobile');
      await launchUrl(
        googleAuthUri,
        mode: LaunchMode.externalApplication,
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Gagal memulai login Google: $e';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

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
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Bar: OTA Update Checker Button
                Align(
                  alignment: Alignment.centerRight,
                  child: InkWell(
                    onTap: () => UpdaterService.checkForUpdates(context, silent: false),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppTheme.card,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.cardBorder),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.system_update_rounded, size: 13, color: AppTheme.primary),
                          const SizedBox(width: 5),
                          Text(
                            'v$_currentVersion • Cek Update',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Plakat Batu Khas Webapp (Stone Plaque with carved $)
                Center(
                  child: Container(
                    width: 90,
                    height: 110,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFF1EAD9), Color(0xFFE3D7BC), Color(0xFFC2B190)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.4),
                          offset: const Offset(0, 12),
                          blurRadius: 24,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        r'$',
                        style: TextStyle(
                          fontSize: 52,
                          fontFamily: 'serif',
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFD9CBAC),
                          shadows: [
                            Shadow(
                              offset: const Offset(1, 1.5),
                              color: Colors.white.withOpacity(0.8),
                              blurRadius: 0,
                            ),
                            Shadow(
                              offset: const Offset(-1, -1),
                              color: const Color(0xFF78684A).withOpacity(0.6),
                              blurRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'FinanceApp',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Kelola Arus Kas & Debt Survival Planner',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 28),

                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.danger.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.danger.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, size: 16, color: AppTheme.danger),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(_error!, style: const TextStyle(color: AppTheme.danger, fontSize: 12, fontWeight: FontWeight.w500)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Google OAuth / GMS Button
                if (!_isApiKeyMode) ...[
                  OutlinedButton(
                    onPressed: _loading ? null : _handleGoogleLogin,
                    style: OutlinedButton.styleFrom(
                      backgroundColor: AppTheme.card,
                      foregroundColor: AppTheme.textPrimary,
                      side: const BorderSide(color: AppTheme.cardBorder),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'G',
                            style: TextStyle(
                              color: Color(0xFF4285F4),
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'sans-serif',
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Lanjutkan dengan Google',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Divider "atau"
                  Row(
                    children: const [
                      Expanded(child: Divider(color: AppTheme.cardBorder)),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'atau dengan email',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                      Expanded(child: Divider(color: AppTheme.cardBorder)),
                    ],
                  ),
                  const SizedBox(height: 20),
                ],

                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: AppTheme.card,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.cardBorder),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        offset: const Offset(0, 8),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (!_isApiKeyMode) ...[
                        const Text('Email atau Username', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _emailController,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'nama@email.com / username',
                            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            prefixIcon: const Icon(Icons.mail_outline, size: 18, color: AppTheme.textMuted),
                            filled: true,
                            fillColor: AppTheme.surface,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.cardBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.cardBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.primary),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: '••••••••',
                            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            prefixIcon: const Icon(Icons.lock_outline, size: 18, color: AppTheme.textMuted),
                            filled: true,
                            fillColor: AppTheme.surface,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.cardBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.cardBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.primary),
                            ),
                          ),
                        ),
                      ] else ...[
                        const Text('Third-Party API Key', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _apiKeyController,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: 'fin_live_...',
                            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            prefixIcon: const Icon(Icons.key, size: 18, color: AppTheme.primary),
                            filled: true,
                            fillColor: AppTheme.surface,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.cardBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.cardBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppTheme.primary),
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 22),

                      ElevatedButton(
                        onPressed: _loading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: const Color(0xFF15130F),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF15130F)))
                            : Text(_isApiKeyMode ? 'Masuk dengan API Key' : 'Masuk', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                TextButton(
                  onPressed: () {
                    setState(() {
                      _isApiKeyMode = !_isApiKeyMode;
                      _error = null;
                    });
                  },
                  child: Text(
                    _isApiKeyMode ? '← Masuk dengan Email / Password' : 'Masuk instan menggunakan API Key →',
                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w500),
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
