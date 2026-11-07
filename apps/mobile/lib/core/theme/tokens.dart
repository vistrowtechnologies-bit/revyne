import 'package:flutter/material.dart';

import 'palettes.dart';

/// App colours. The brand colours follow the owner's chosen theme
/// ([BrandPalette], default "Royal" = the RevYne logo, see
/// design/brand/PALETTE.md), so they are getters, not constants. Names keep the
/// original "violet" wording; they mean "the theme's primary ramp".
/// Contrast-checked: every text/background pair used here is WCAG AA.
class AppColors {
  static BrandPalette get _p => BrandPalette.current;

  // Gradient stops.
  static Color get magenta => _p.start;
  static Color get violet => _p.primary; // primary
  static Color get indigo => _p.end;

  // Primary ramp.
  static Color get violet50 => _p.shade50;
  static Color get violet100 => _p.shade100;
  static Color get violet200 => _p.shade200;
  static Color get violet600 => _p.shade600;
  static Color get violet700 => _p.shade700;
  static Color get violet900 => _p.shade900;

  // Neutrals.
  static const ink = Color(0xFF16112E);
  static const muted = Color(0xFF5B5577);
  static Color get line => _p.line;
  static Color get bg => _p.background;

  // Supporting.
  static const star = Color(0xFFF5A524); // ratings only
  static const success = Color(0xFF0B7F57);
  static const successSoft = Color(0xFFE7F4EE);
  static const danger = Color(0xFFD02F35);
  static const dangerSoft = Color(0xFFFBE9EA);
  static const amberSoft = Color(0xFFFFF4E0);

  // Semantic aliases used across the app.
  static Color get primary => violet;
  static Color get primaryDark => violet600;
  static Color get primarySoft => violet50;
  static Color get surface => bg;
  static Color get surfaceContainerLow => violet50;
  static Color get surfaceContainer => violet100;
  static Color get surfaceContainerHigh => violet100;
  static const onSurface = ink;
  static const onSurfaceVariant = muted;
  static const outline = Color(0xFF8A85A3);
  static Color get outlineVariant => line;
  static const error = danger;
  static const errorContainer = dangerSoft;
  static const successContainer = successSoft;
  static const warning = star;
  static const warningContainer = amberSoft;
  static const googleStar = star;
  static Color get secondary => magenta;
  static Color get tertiary => indigo;

  /// The theme gradient — one hero moment per screen.
  static LinearGradient get brandGradient => _p.gradient;
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

  /// Glow under gradient hero cards and the center nav button (theme-tinted).
  static List<BoxShadow> get glow =>
      [BoxShadow(color: BrandPalette.current.shade600.withValues(alpha: 0.25), blurRadius: 28, offset: const Offset(0, 12))];
}
