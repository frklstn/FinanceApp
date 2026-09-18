import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF09090B);
  static const Color card = Color(0xFF18181B);
  static const Color cardBorder = Color(0xFF27272A);
  static const Color foreground = Color(0xFFF4F4F5);
  static const Color muted = Color(0xFF71717A);
  
  static const Color primary = Color(0xFF10B981); // Emerald 500
  static const Color destructive = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      cardColor: card,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        surface: card,
        error: destructive,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: foreground,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
