import 'package:flutter/material.dart';

/// Brand palette sampled from the RevYne logo (see design/brand/PALETTE.md).
/// Contrast-checked: every text/background pair used here is WCAG AA.
class AppColors {
  // Logo gradient stops.
  static const magenta = Color(0xFFB02FE5);
  static const violet = Color(0xFF6334E2); // primary
  static const indigo = Color(0xFF363DDD);

  // Violet ramp.
  static const violet50 = Color(0xFFF5F2FC);
  static const violet100 = Color(0xFFE8E2F9);
  static const violet200 = Color(0xFFCFC1F6);
  static const violet600 = Color(0xFF461BBB);
  static const violet700 = Color(0xFF391698);
  static const violet900 = Color(0xFF1E0B50);

  // Neutrals (violet-tinted).
  static const ink = Color(0xFF16112E);
  static const muted = Color(0xFF5B5577);
  static const line = Color(0xFFE4E1F2);
  static const bg = Color(0xFFF7F6FC);

  // Supporting.
  static const star = Color(0xFFF5A524); // ratings only
  static const success = Color(0xFF0B7F57);
  static const successSoft = Color(0xFFE7F4EE);
  static const danger = Color(0xFFD02F35);
  static const dangerSoft = Color(0xFFFBE9EA);
  static const amberSoft = Color(0xFFFFF4E0);

  // Semantic aliases used across the app.
  static const primary = violet;
  static const primaryDark = violet600;
  static const primarySoft = violet50;
  static const surface = bg;
  static const surfaceContainerLow = violet50;
  static const surfaceContainer = violet100;
  static const surfaceContainerHigh = violet100;
  static const onSurface = ink;
  static const onSurfaceVariant = muted;
  static const outline = Color(0xFF8A85A3);
  static const outlineVariant = line;
  static const error = danger;
  static const errorContainer = dangerSoft;
  static const successContainer = successSoft;
  static const warning = star;
  static const warningContainer = amberSoft;
  static const googleStar = star;
  static const secondary = magenta;
  static const tertiary = indigo;

  /// The logo gradient — one hero moment per screen.
  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [magenta, violet, indigo],
  );
}

class AppRadius {
  static const card = 20.0;
  static const button = 999.0; // pill
  static const input = 14.0;
  static const chip = 999.0;
}

class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const gutter = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

class AppShadows {
  /// Very soft, violet-tinted elevation for cards.
  static const card = [BoxShadow(color: Color(0x0F2B1174), blurRadius: 24, offset: Offset(0, 8))];

  /// Glow under gradient hero cards and the center nav button.
  static const glow = [BoxShadow(color: Color(0x40461BBB), blurRadius: 28, offset: Offset(0, 12))];
}
