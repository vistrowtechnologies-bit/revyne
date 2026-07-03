import 'package:flutter/material.dart';

/// Backend configuration — same Supabase project as the web app.
class AppConfig {
  static const supabaseUrl = 'https://dbqizpephewiefvghenr.supabase.co';
  static const supabaseAnonKey = 'sb_publishable_377ZtWI_hNXl8C6TuVPTWQ_b6A2L6S_';

  /// Deep link used for the OAuth redirect back into the app.
  /// Must be added to Supabase Auth → URL Configuration → Redirect URLs.
  static const authRedirect = 'io.revyne.app://login-callback';

  /// Public review page base (the web app hosts the customer-facing page).
  static const publicReviewBase = 'https://revyne-pied.vercel.app';
}

class RevyneTheme {
  static const brand = Color(0xFF8127CF);
  static const brandDark = Color(0xFF4F46E5);
  static const magenta = Color(0xFFA200BA);

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(seedColor: brand);
    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFFF8F9FF),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Color(0xFF111827),
        centerTitle: false,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: brand, width: 2),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFEDE9FE)),
        ),
      ),
    );
  }
}

const businessCategories = [
  'Real Estate', 'Restaurant', 'Salon & Beauty', 'Healthcare Clinic',
  'Optician & Optical Store', 'Education & Coaching', 'Car & Bike Service',
  'Electronics & Appliances', 'Home Services', 'Travel & Transport',
  'Hotel & Stay', 'Fitness & Gym', 'Retail Store', 'Jewellery',
  'Event & Wedding Services', 'Legal & Finance', 'IT & Digital Services',
  'Driver Service', 'Other',
];
