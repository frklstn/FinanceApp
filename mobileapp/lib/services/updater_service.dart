import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../constants/theme.dart';

class AppUpdateInfo {
  final String version;
  final String downloadUrl;
  final String releaseNotes;

  AppUpdateInfo({
    required this.version,
    required this.downloadUrl,
    required this.releaseNotes,
  });
}

class UpdaterService {
  static const String _githubRepo = 'frklstn/FinanceApp';

  static Future<AppUpdateInfo?> checkLatestVersion() async {
    try {
      // 1. Try Rust Backend API first
      final backendRes = await http.get(
        Uri.parse('https://fin.llvy.space/api/v1/app/version'),
        headers: {'Accept': 'application/json'},
      );

      if (backendRes.statusCode == 200) {
        final json = jsonDecode(backendRes.body);
        if (json['success'] == true && json['data'] != null) {
          final d = json['data'];
          return AppUpdateInfo(
            version: d['latest_version'] ?? '1.0.0',
            downloadUrl: d['download_url'] ?? '',
            releaseNotes: d['release_notes'] ?? 'Pembaruan aplikasi.',
          );
        }
      }

      // 2. Fallback to GitHub Releases API
      final ghRes = await http.get(
        Uri.parse('https://api.github.com/repos/$_githubRepo/releases/latest'),
        headers: {'Accept': 'application/vnd.github+json'},
      );

      if (ghRes.statusCode == 200) {
        final json = jsonDecode(ghRes.body);
        final tag = (json['tag_name'] as String? ?? 'v1.0.0').replaceAll('v', '');
        final body = json['body'] as String? ?? 'Pembaruan stabilitas dan performa.';
        
        String downloadUrl = '';
        if (json['assets'] is List) {
          for (final asset in json['assets']) {
            final name = asset['name'] as String? ?? '';
            if (name.contains('Flutter') && name.endsWith('.apk')) {
              downloadUrl = asset['browser_download_url'] ?? '';
              break;
            }
          }
          if (downloadUrl.isEmpty && (json['assets'] as List).isNotEmpty) {
            downloadUrl = json['assets'][0]['browser_download_url'] ?? '';
          }
        }

        if (downloadUrl.isNotEmpty) {
          return AppUpdateInfo(
            version: tag,
            downloadUrl: downloadUrl,
            releaseNotes: body,
          );
        }
      }
    } catch (_) {}
    return null;
  }

  static bool _isNewer(String remote, String current) {
    try {
      final rParts = remote.replaceAll(RegExp(r'[^0-9.]'), '').split('.').map(int.parse).toList();
      final cParts = current.replaceAll(RegExp(r'[^0-9.]'), '').split('.').map(int.parse).toList();

      for (int i = 0; i < rParts.length && i < cParts.length; i++) {
        if (rParts[i] > cParts[i]) return true;
        if (rParts[i] < cParts[i]) return false;
      }
      return rParts.length > cParts.length;
    } catch (_) {
      return remote != current;
    }
  }

  static Future<void> checkForUpdates(BuildContext context, {bool silent = false}) async {
    final packageInfo = await PackageInfo.fromPlatform();
    final currentVersion = packageInfo.version;

    final latest = await checkLatestVersion();
    if (latest == null) {
      if (!silent && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak dapat memeriksa pembaruan saat ini.')),
        );
      }
      return;
    }

    if (_isNewer(latest.version, currentVersion)) {
      if (context.mounted) {
        _showUpdateDialog(context, latest, currentVersion);
      }
    } else {
      if (!silent && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Aplikasi sudah versi terbaru (v$currentVersion).'),
            backgroundColor: AppTheme.card,
          ),
        );
      }
    }
  }

  static void _showUpdateDialog(BuildContext context, AppUpdateInfo update, String currentVersion) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _UpdateProgressDialog(update: update, currentVersion: currentVersion),
    );
  }
}

class _UpdateProgressDialog extends StatefulWidget {
  final AppUpdateInfo update;
  final String currentVersion;

  const _UpdateProgressDialog({
    required this.update,
    required this.currentVersion,
  });

  @override
  State<_UpdateProgressDialog> createState() => _UpdateProgressDialogState();
}

class _UpdateProgressDialogState extends State<_UpdateProgressDialog> {
  bool _downloading = false;
  double _progress = 0.0;
  String _statusText = '';
  String? _error;

  Future<void> _startDownload() async {
    setState(() {
      _downloading = true;
      _progress = 0.0;
      _statusText = 'Mengunduh berkas APK...';
      _error = null;
    });

    try {
      final dir = await getTemporaryDirectory();
      final apkPath = '${dir.path}/FinanceApp-update.apk';
      final file = File(apkPath);
      if (await file.exists()) {
        await file.delete();
      }

      final dio = Dio();
      await dio.download(
        widget.update.downloadUrl,
        apkPath,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            setState(() {
              _progress = received / total;
              final percent = (_progress * 100).toInt();
              final mbReceived = (received / (1024 * 1024)).toStringAsFixed(1);
              final mbTotal = (total / (1024 * 1024)).toStringAsFixed(1);
              _statusText = 'Mengunduh: $percent% ($mbReceived MB / $mbTotal MB)';
            });
          }
        },
      );

      setState(() {
        _statusText = 'Memasang pembaruan...';
      });

      // Invoke Android Native Package Installer
      final result = await OpenFilex.open(
        apkPath,
        type: 'application/vnd.android.package-archive',
      );

      if (result.type != ResultType.done) {
        setState(() {
          _error = 'Gagal membuka penginstal: ${result.message}';
          _downloading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Gagal mengunduh: $e';
        _downloading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppTheme.cardBorder),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.system_update_rounded, color: AppTheme.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Pembaruan Tersedia',
                  style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                Text(
                  'v${widget.currentVersion} → v${widget.update.version}',
                  style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.danger.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_error!, style: const TextStyle(color: AppTheme.danger, fontSize: 12)),
            ),
            const SizedBox(height: 12),
          ],
          if (!_downloading) ...[
            const Text(
              'Catatan Rilis:',
              style: TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Container(
              constraints: const BoxConstraints(maxHeight: 120),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: SingleChildScrollView(
                child: Text(
                  widget.update.releaseNotes.trim().isEmpty
                      ? 'Pembaruan rutin performa, fitur, dan kestabilan aplikasi.'
                      : widget.update.releaseNotes,
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, height: 1.4),
                ),
              ),
            ),
          ] else ...[
            Text(
              _statusText,
              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: _progress > 0 ? _progress : null,
                minHeight: 10,
                backgroundColor: AppTheme.surface,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
              ),
            ),
          ],
        ],
      ),
      actions: [
        if (!_downloading) ...[
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Nanti Saja', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: _startDownload,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: const Color(0xFF15130F),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Perbarui Sekarang', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ],
    );
  }
}
