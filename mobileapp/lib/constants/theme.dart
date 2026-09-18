import 'package:flutter/material.dart';

class AppTheme {
  // Permukaan (Warm Dark Obsidian / Cream Palette - Selaras Webapp tokens.css)
  static const Color background = Color(0xFF15130F);
  static const Color card = Color(0xFF1C1A15);
  static const Color surface = Color(0xFF211E18);
  static const Color cardBorder = Color(0x1AF3EDE3); // rgba(243, 237, 227, 0.10)

  // Aksen Tunggal: Terracotta Warm Glow (Bukan Hijau Generik)
  static const Color primary = Color(0xFFE2916A);
  static const Color primaryHover = Color(0xFFEDA684);
  static const Color primaryDim = Color(0xFFC2693F);
  static const Color primaryGlow = Color(0x33E2916A);
  static const Color primaryBorder = Color(0x42E2916A);

  // Tipografi
  static const Color textPrimary = Color(0xFFF3EDE3);
  static const Color textSecondary = Color(0xFFB8AE9C);
  static const Color textMuted = Color(0xFF8A8071);
  static const Color foreground = textPrimary;
  static const Color muted = textMuted;

  // Sinyal
  static const Color danger = Color(0xFFFB7185);
  static const Color destructive = danger;
  static const Color warning = Color(0xFFF0B429);
  static const Color success = Color(0xFFE2916A);
  static const Color info = Color(0xFF38BDF8);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      cardColor: card,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        surface: card,
        error: danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textPrimary),
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: cardBorder,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
