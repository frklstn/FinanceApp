import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// FinanceApp Mobile — Production WebView wrapper for the Next.js web app
/// deployed on Vercel at https://financeapp-projects.vercel.app
///
/// Features:
///   - Full-screen WebView with JavaScript enabled
///   - Splash screen with fade animation
///   - Pull-to-refresh support
///   - Android back-button navigates WebView history
///   - Network error fallback page with retry
///   - Timeout handling (30s)
///   - Domain-locked navigation (security)
///   - External URL safe opening via system browser
///   - Status bar theming

// ─── Configuration ───────────────────────────────────────────────────────
const String kAppUrl = 'https://financeapp-projects.vercel.app';
const String kAppDomain = 'financeapp-projects.vercel.app';
const String kAppTitle = 'FinanceApp';
const int kTimeoutSeconds = 30;

// Allowed domains (app domain + auth/payment providers if needed)
const List<String> _kAllowedDomains = [
  kAppDomain,
  'vercel.app', // Vercel preview URLs
  'supabase.co', // Auth redirects
  'accounts.google.com', // OAuth
];

// ─── Color Palette (matches the web app theme) ───────────────────────────
const Color kPrimary = Color(0xFF6366F1); // Indigo-500
const Color kPrimaryDark = Color(0xFF4338CA); // Indigo-700
const Color kBackground = Color(0xFF0F172A); // Slate-900
const Color kSurface = Color(0xFF1E293B); // Slate-800
const Color kTextPrimary = Color(0xFFF8FAFC); // Slate-50
const Color kTextSecondary = Color(0xFF94A3B8); // Slate-400

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: kBackground,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const FinanceApp());
}

class FinanceApp extends StatelessWidget {
  const FinanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: kAppTitle,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: kPrimary,
          brightness: Brightness.dark,
          surface: kBackground,
        ),
        scaffoldBackgroundColor: kBackground,
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen>
    with SingleTickerProviderStateMixin {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  int _loadingProgress = 0;
  int _retryCount = 0;
  Timer? _timeoutTimer;

  // Splash animation
  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;
  bool _splashDismissed = false;

  @override
  void initState() {
    super.initState();

    // Splash fade-out animation
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _splashDismissed = true);
      }
    });

    _initWebView();
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() => _loadingProgress = progress);
            }
          },
          onPageStarted: (String url) {
            _cancelTimeout();
            _startTimeout();
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
                _errorMessage = '';
              });
            }
          },
          onPageFinished: (String url) {
            _cancelTimeout();
            if (mounted) {
              setState(() => _isLoading = false);
              _retryCount = 0; // Reset retry count on success
              if (!_splashDismissed) {
                _fadeController.forward();
              }
            }
          },
          onWebResourceError: (WebResourceError error) {
            // Only treat main-frame errors as fatal
            if (error.isForMainFrame == true) {
              _cancelTimeout();
              if (mounted) {
                setState(() {
                  _hasError = true;
                  _isLoading = false;
                  _errorMessage = _friendlyError(error.errorCode);
                });
              }
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            return _handleNavigation(request);
          },
        ),
      )
      ..setUserAgent('FinanceApp-Mobile/1.0 (Flutter WebView)')
      ..loadRequest(Uri.parse(kAppUrl));

    // Start initial timeout
    _startTimeout();
  }

  // ─── Timeout Handling ──────────────────────────────────────────────────

  void _startTimeout() {
    _timeoutTimer = Timer(const Duration(seconds: kTimeoutSeconds), () {
      if (mounted && _isLoading) {
        setState(() {
          _hasError = true;
          _isLoading = false;
          _errorMessage = 'Server tidak merespons.\nSilakan coba lagi nanti.';
        });
      }
    });
  }

  void _cancelTimeout() {
    _timeoutTimer?.cancel();
    _timeoutTimer = null;
  }

  // ─── Navigation Security ──────────────────────────────────────────────

  NavigationDecision _handleNavigation(NavigationRequest request) {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.prevent;

    // Allow data: and about: schemes (internal)
    if (uri.scheme == 'data' || uri.scheme == 'about') {
      return NavigationDecision.navigate;
    }

    // Block javascript: and other dangerous schemes
    if (uri.scheme != 'http' && uri.scheme != 'https') {
      return NavigationDecision.prevent;
    }

    // Check if domain is in allowed list
    final host = uri.host.toLowerCase();
    final isAllowed = _kAllowedDomains.any(
      (domain) => host == domain || host.endsWith('.$domain'),
    );

    if (isAllowed) {
      return NavigationDecision.navigate;
    }

    // Open external URLs safely in system browser
    _openExternal(uri);
    return NavigationDecision.prevent;
  }

  Future<void> _openExternal(Uri uri) async {
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      // Silently fail — don't crash the app for external links
    }
  }

  // ─── Friendly Error Messages ──────────────────────────────────────────

  String _friendlyError(int errorCode) {
    switch (errorCode) {
      case -2: // net::ERR_FAILED
        return 'Gagal memuat halaman.\nPeriksa koneksi internet Anda.';
      case -6: // net::ERR_CONNECTION_REFUSED
        return 'Server menolak koneksi.\nSilakan coba lagi nanti.';
      case -7: // net::ERR_TIMED_OUT
        return 'Waktu koneksi habis.\nPeriksa koneksi internet Anda.';
      case -105: // net::ERR_NAME_NOT_RESOLVED
        return 'Tidak dapat menemukan server.\nPeriksa koneksi internet Anda.';
      case -109: // net::ERR_ADDRESS_UNREACHABLE
        return 'Server tidak dapat dijangkau.';
      case -201: // net::ERR_CERT_AUTHORITY_INVALID
        return 'Sertifikat keamanan tidak valid.';
      default:
        return 'Koneksi terputus.\nPastikan perangkat Anda terhubung ke internet.';
    }
  }

  // ─── Reload with Retry Strategy ───────────────────────────────────────

  Future<void> _reload() async {
    if (_retryCount >= 3) {
      // After 3 retries, do a full fresh load instead of reload
      _retryCount = 0;
      setState(() {
        _hasError = false;
        _isLoading = true;
        _errorMessage = '';
      });
      await _controller.loadRequest(Uri.parse(kAppUrl));
    } else {
      _retryCount++;
      setState(() {
        _hasError = false;
        _isLoading = true;
        _errorMessage = '';
      });
      await _controller.reload();
    }
  }

  @override
  void dispose() {
    _cancelTimeout();
    _fadeController.dispose();
    super.dispose();
  }

  /// Handle Android back button to navigate WebView history
  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // Don't exit app
    }
    return true; // Allow app exit
  }

  @override
  Widget build(BuildContext context) {
    // ignore: deprecated_member_use
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              // ─── WebView Layer ───────────────────────────────────
              if (!_hasError)
                RefreshIndicator(
                  onRefresh: _reload,
                  color: kPrimary,
                  backgroundColor: kSurface,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height:
                          MediaQuery.of(context).size.height -
                          MediaQuery.of(context).padding.top,
                      child: WebViewWidget(controller: _controller),
                    ),
                  ),
                ),

              // ─── Error Fallback ──────────────────────────────────
              if (_hasError) _buildErrorPage(),

              // ─── Loading Progress Bar ────────────────────────────
              if (_isLoading && !_hasError)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _loadingProgress / 100,
                    minHeight: 3,
                    color: kPrimary,
                    backgroundColor: kSurface,
                  ),
                ),

              // ─── Splash Overlay (fades out on first load) ────────
              if (!_splashDismissed)
                FadeTransition(
                  opacity: ReverseAnimation(_fadeAnimation),
                  child: IgnorePointer(
                    ignoring: !_isLoading,
                    child: _buildSplash(),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Premium dark splash screen
  Widget _buildSplash() {
    return Container(
      color: kBackground,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // App Icon
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [kPrimary, Color(0xFF8B5CF6)], // Indigo → Violet
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: kPrimary.withValues(alpha: 0.4),
                    blurRadius: 32,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(
                Icons.account_balance_wallet_rounded,
                size: 48,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            // App Name
            const Text(
              kAppTitle,
              style: TextStyle(
                color: kTextPrimary,
                fontSize: 28,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Personal Finance & Debt Survival Planner',
              style: TextStyle(
                color: kTextSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 48),
            // Loading indicator
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(
                  kPrimary.withValues(alpha: 0.8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Network error / offline fallback page
  Widget _buildErrorPage() {
    return Container(
      color: kBackground,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Error Icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: kSurface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.wifi_off_rounded,
                  size: 40,
                  color: kTextSecondary,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Koneksi Terputus',
                style: TextStyle(
                  color: kTextPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _errorMessage.isNotEmpty
                    ? _errorMessage
                    : 'Pastikan perangkat Anda terhubung ke internet,\nlalu coba lagi.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: kTextSecondary,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              if (_retryCount > 0) ...[
                const SizedBox(height: 8),
                Text(
                  'Percobaan ulang: $_retryCount/3',
                  style: TextStyle(
                    color: kTextSecondary.withValues(alpha: 0.6),
                    fontSize: 12,
                  ),
                ),
              ],
              const SizedBox(height: 32),
              // Retry button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _reload,
                  icon: const Icon(Icons.refresh_rounded, size: 20),
                  label: Text(
                    _retryCount >= 3 ? 'Muat Ulang' : 'Coba Lagi',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
