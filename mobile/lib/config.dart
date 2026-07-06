import 'package:flutter/material.dart';

/// Backend configuration — same Supabase project as the web app.
class AppConfig {
  static const supabaseUrl = 'https://dbqizpephewiefvghenr.supabase.co';
  static const supabaseAnonKey = 'sb_publishable_377ZtWI_hNXl8C6TuVPTWQ_b6A2L6S_';

  /// Deep link used for the OAuth redirect back into the app.
  /// Must be added to Supabase Auth → URL Configuration → Redirect URLs.
  static const authRedirect = 'io.revyne.app://login-callback';

  /// Web OAuth Client ID for Supabase login — passed as GoogleSignIn's
  /// serverClientId so the idToken audience matches what Supabase's Google
  /// provider expects (Supabase Auth → Providers → Google → Client IDs).
  static const googleWebClientId =
      '390263564292-j1ihpm78dmkg75oag33p3smjv1jirllq.apps.googleusercontent.com';

  /// Public review page base (the web app hosts the customer-facing page).
  static const publicReviewBase = 'https://revyne-pied.vercel.app';

  /// Google OAuth Client ID for the Google Business Profile integration
  /// (separate grant from Supabase login, requests business.manage scope).
  /// This is the debug-signed Android OAuth client — swap to the release
  /// client ID (390263564292-mso3...) when building a release APK.
  static const googleGmbClientId =
      '390263564292-dnekc3k6udpasgi73abaqr1qoo06icbv.apps.googleusercontent.com';
}

/// One entry per selectable theme swatch shown on the Profile screen.
class AppThemeOption {
  const AppThemeOption(this.id, this.label, this.seed, this.tertiary);
  final String id;
  final String label;
  final Color seed;
  final Color tertiary;
}

const appThemeOptions = [
  AppThemeOption('default', 'Default', AppColors.primaryContainer, AppColors.tertiaryContainer),
  AppThemeOption('dark', 'Dark', Color(0xFF312E81), Color(0xFF4C1D95)),
  AppThemeOption('blue', 'Blue', Color(0xFF2563EB), Color(0xFF0EA5E9)),
  AppThemeOption('red', 'Red', Color(0xFFDC2626), Color(0xFFEA580C)),
  AppThemeOption('green', 'Green', Color(0xFF16A34A), Color(0xFF0D9488)),
];

/// App-wide selected theme id — the Profile screen's "Change Theme" dots
/// write here, and RevyneApp rebuilds via a ValueListenableBuilder.
class AppTheme {
  static final ValueNotifier<String> selected = ValueNotifier<String>('default');
}

/// Design tokens taken directly from the RevYne Stitch design system
/// (revyne_design_system/DESIGN.md) — do not hand-tune these, update the
/// source design system first if the brand changes.
class AppColors {
  static const surface = Color(0xFFF8F9FF);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFEFF4FF);
  static const surfaceContainer = Color(0xFFE6EEFF);
  static const surfaceContainerHigh = Color(0xFFDDE9FF);
  static const surfaceContainerHighest = Color(0xFFD3E3FF);
  static const onSurface = Color(0xFF0B1C30);
  static const onSurfaceVariant = Color(0xFF4D4354);
  static const inverseSurface = Color(0xFF213146);
  static const outline = Color(0xFF7E7385);
  static const outlineVariant = Color(0xFFCFC2D6);

  static const primary = Color(0xFF6500AD);
  static const primaryContainer = Color(0xFF8127CF); // the "brand purple" swatch
  static const primaryFixed = Color(0xFFF0DBFF); // AI-suggestion soft background
  static const primaryFixedVariant = Color(0xFF6900B3);

  static const secondary = Color(0xFFA200BA);
  static const secondaryContainer = Color(0xFFEA5FFE);

  static const tertiary = Color(0xFF2C2ABC);
  static const tertiaryContainer = Color(0xFF4648D4);

  static const error = Color(0xFFBA1A1A);
  static const errorContainer = Color(0xFFFFDAD6);
  static const onErrorContainer = Color(0xFF93000A);

  static const success = Color(0xFF34A853);
  static const successContainer = Color(0xFFDCFCE7);
  static const warningContainer = Color(0xFFFFF3D6);

  // Dark theme
  static const darkCanvas = Color(0xFF0F172A);
  static const darkPanel = Color(0xFF1E293B);
  static const darkPrimary = Color(0xFFC084FC);
  static const darkOnSurface = Color(0xFFE2E8F0);
  static const darkMuted = Color(0xFF94A3B8);
  static const darkLine = Color(0xFF334155);
}

class AppRadius {
  static const card = 20.0;
  static const button = 14.0;
  static const input = 8.0;
  static const chip = 999.0;
}

class AppSpacing {
  static const margin = 16.0;
  static const gutter = 12.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
}

class RevyneTheme {
  /// Builds the theme for a selected swatch id (see [appThemeOptions]).
  /// Components wired to Theme.of(context) — buttons, app bar, inputs, nav —
  /// re-skin correctly; a handful of decorative icon accents on individual
  /// screens are hardcoded to the brand purple and do not change with theme.
  static ThemeData light([String themeId = 'default']) {
    final option = appThemeOptions.firstWhere((o) => o.id == themeId, orElse: () => appThemeOptions.first);
    final scheme = ColorScheme.fromSeed(
      seedColor: option.seed,
      primary: option.seed,
      secondary: AppColors.secondary,
      tertiary: option.tertiary,
      error: AppColors.error,
      surface: AppColors.surface,
    );

    const textTheme = TextTheme(
      displayMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, height: 1.25, letterSpacing: -0.4),
      headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.33),
      headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, height: 1.4),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.5),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.43),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.43),
      labelSmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.33),
    );

    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      fontFamily: 'Inter',
      scaffoldBackgroundColor: AppColors.surface,
      textTheme: textTheme.apply(bodyColor: AppColors.onSurface, displayColor: AppColors.onSurface),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: option.seed,
        titleTextStyle: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: option.seed,
          fontFamily: 'Inter',
        ),
        centerTitle: false,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: option.seed,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: option.seed,
          side: BorderSide(color: option.seed, width: 1.5),
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: option.seed,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: BorderSide(color: option.seed, width: 2),
        ),
        labelStyle: const TextStyle(color: AppColors.outline, fontFamily: 'Inter'),
        hintStyle: const TextStyle(color: AppColors.outline, fontFamily: 'Inter'),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: const BorderSide(color: AppColors.outlineVariant, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.outlineVariant, thickness: 1, space: 1),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: option.seed,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              fontFamily: 'Inter',
              color: states.contains(WidgetState.selected) ? option.seed : AppColors.outline,
            )),
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
              color: states.contains(WidgetState.selected) ? Colors.white : AppColors.outline,
            )),
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

const indianLanguages = [
  'English', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati',
  'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili',
  'Sanskrit', 'Nepali', 'Konkani', 'Sindhi', 'Dogri', 'Kashmiri', 'Manipuri',
  'Bodo', 'Santali', 'Hinglish',
];
