import 'package:flutter/material.dart';

import 'tokens.dart';

class RevyneTheme {
  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.violet,
      primary: AppColors.violet,
      secondary: AppColors.magenta,
      tertiary: AppColors.indigo,
      error: AppColors.danger,
      surface: AppColors.bg,
    );

    // Plus Jakarta Sans is bundled (pubspec fonts) with real 500/600/700/800
    // files, so any TextStyle(fontWeight: ...) renders the true weight.
    const font = 'PlusJakartaSans';
    final base = Typography.material2021().black.apply(fontFamily: font);
    TextStyle w(TextStyle? s, double size, FontWeight weight, {double? height, double? spacing}) =>
        (s ?? const TextStyle()).copyWith(fontSize: size, fontWeight: weight, height: height, letterSpacing: spacing, color: AppColors.ink);

    final textTheme = base.copyWith(
      displayMedium: w(base.displayMedium, 34, FontWeight.w800, height: 1.15, spacing: -0.6),
      headlineMedium: w(base.headlineMedium, 26, FontWeight.w800, height: 1.2, spacing: -0.4),
      headlineSmall: w(base.headlineSmall, 21, FontWeight.w800, height: 1.25, spacing: -0.2),
      titleMedium: w(base.titleMedium, 16, FontWeight.w700, height: 1.4),
      bodyLarge: w(base.bodyLarge, 16, FontWeight.w500, height: 1.5),
      bodyMedium: w(base.bodyMedium, 15, FontWeight.w500, height: 1.45),
      labelLarge: w(base.labelLarge, 15, FontWeight.w700),
      labelSmall: w(base.labelSmall, 12, FontWeight.w600),
    );

    final pill = RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button));
    const buttonText = TextStyle(fontFamily: font, fontSize: 16, fontWeight: FontWeight.w700);

    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.bg,
      textTheme: textTheme,
      fontFamily: font,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.bg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: AppColors.ink,
        centerTitle: false,
        titleTextStyle: const TextStyle(fontFamily: font, fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.ink),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.violet,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          shape: pill,
          textStyle: buttonText,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.violet,
          side: const BorderSide(color: AppColors.violet200, width: 1.5),
          minimumSize: const Size.fromHeight(54),
          shape: pill,
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.violet,
          textStyle: const TextStyle(fontFamily: font, fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        hintStyle: const TextStyle(color: AppColors.outline),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.violet, width: 2),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: const BorderSide(color: AppColors.line),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.line, thickness: 1, space: 1),
      // Clock dial in brand colours: big hour/minute boxes, clear AM/PM toggle.
      timePickerTheme: TimePickerThemeData(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        helpTextStyle: const TextStyle(fontFamily: font, fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 0.4),
        hourMinuteShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        hourMinuteColor: WidgetStateColor.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.violet100 : AppColors.bg),
        hourMinuteTextColor: WidgetStateColor.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.violet700 : AppColors.ink),
        hourMinuteTextStyle: const TextStyle(fontFamily: font, fontSize: 52, fontWeight: FontWeight.w800),
        dayPeriodShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        dayPeriodBorderSide: const BorderSide(color: AppColors.violet200, width: 1.5),
        dayPeriodColor: WidgetStateColor.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.violet : Colors.white),
        dayPeriodTextColor: WidgetStateColor.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : AppColors.muted),
        dayPeriodTextStyle: const TextStyle(fontFamily: font, fontSize: 16, fontWeight: FontWeight.w800),
        dialBackgroundColor: AppColors.violet50,
        dialHandColor: AppColors.violet,
        dialTextColor: WidgetStateColor.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : AppColors.ink),
        dialTextStyle: const TextStyle(fontFamily: font, fontSize: 17, fontWeight: FontWeight.w700),
        entryModeIconColor: AppColors.muted,
        cancelButtonStyle: TextButton.styleFrom(foregroundColor: AppColors.muted, textStyle: const TextStyle(fontFamily: font, fontWeight: FontWeight.w700, fontSize: 15)),
        confirmButtonStyle: TextButton.styleFrom(foregroundColor: AppColors.violet, textStyle: const TextStyle(fontFamily: font, fontWeight: FontWeight.w800, fontSize: 15)),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        headerForegroundColor: AppColors.ink,
        headerHeadlineStyle: const TextStyle(fontFamily: font, fontSize: 28, fontWeight: FontWeight.w800),
        todayBorder: const BorderSide(color: AppColors.violet, width: 1.5),
        cancelButtonStyle: TextButton.styleFrom(foregroundColor: AppColors.muted, textStyle: const TextStyle(fontFamily: font, fontWeight: FontWeight.w700, fontSize: 15)),
        confirmButtonStyle: TextButton.styleFrom(foregroundColor: AppColors.violet, textStyle: const TextStyle(fontFamily: font, fontWeight: FontWeight.w800, fontSize: 15)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
