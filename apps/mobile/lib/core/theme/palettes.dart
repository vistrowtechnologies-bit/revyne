import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One app colour theme: a 3-stop gradient, a primary with its ramp, and the
/// tinted page background/lines. White text on [primary] and [shade600] is
/// WCAG AA (≥4.5:1); [shade700] text on [shade50] is AA too.
@immutable
class BrandPalette {
  const BrandPalette({
    required this.id,
    required this.name,
    required this.start,
    required this.primary,
    required this.end,
    required this.shade50,
    required this.shade100,
    required this.shade200,
    required this.shade600,
    required this.shade700,
    required this.shade900,
    required this.background,
    required this.line,
  });

  final String id;
  final String name;
  final Color start; // gradient first stop
  final Color primary; // gradient middle, buttons, active states
  final Color end; // gradient last stop
  final Color shade50;
  final Color shade100;
  final Color shade200;
  final Color shade600;
  final Color shade700;
  final Color shade900;
  final Color background;
  final Color line;

  static const royal = BrandPalette(
    id: 'royal',
    name: 'Royal',
    start: Color(0xFFB02FE5),
    primary: Color(0xFF6334E2),
    end: Color(0xFF363DDD),
    shade50: Color(0xFFF5F2FC),
    shade100: Color(0xFFE8E2F9),
    shade200: Color(0xFFCFC1F6),
    shade600: Color(0xFF461BBB),
    shade700: Color(0xFF391698),
    shade900: Color(0xFF1E0B50),
    background: Color(0xFFF7F6FC),
    line: Color(0xFFE4E1F2),
  );

  static const ocean = BrandPalette(
    id: 'ocean',
    name: 'Ocean',
    start: Color(0xFF0891B2),
    primary: Color(0xFF2563EB),
    end: Color(0xFF1E3A8A),
    shade50: Color(0xFFEFF6FF),
    shade100: Color(0xFFDBEAFE),
    shade200: Color(0xFFBFDBFE),
    shade600: Color(0xFF1D4ED8),
    shade700: Color(0xFF1E40AF),
    shade900: Color(0xFF172554),
    background: Color(0xFFF5F8FD),
    line: Color(0xFFE0E7F3),
  );

  static const emerald = BrandPalette(
    id: 'emerald',
    name: 'Emerald',
    start: Color(0xFF0D9488),
    primary: Color(0xFF047857),
    end: Color(0xFF064E3B),
    shade50: Color(0xFFECFDF5),
    shade100: Color(0xFFD1FAE5),
    shade200: Color(0xFFA7F3D0),
    shade600: Color(0xFF065F46),
    shade700: Color(0xFF064E3B),
    shade900: Color(0xFF022C22),
    background: Color(0xFFF4FAF7),
    line: Color(0xFFDCEBE4),
  );

  static const coral = BrandPalette(
    id: 'coral',
    name: 'Coral',
    start: Color(0xFFF97316),
    primary: Color(0xFFBE123C), // deeper rose: #E11D48 was 4.4:1 as text, below AA
    end: Color(0xFF881337),
    shade50: Color(0xFFFFF1F2),
    shade100: Color(0xFFFFE4E6),
    shade200: Color(0xFFFECDD3),
    shade600: Color(0xFF9F1239),
    shade700: Color(0xFF881337),
    shade900: Color(0xFF4C0519),
    background: Color(0xFFFCF7F7),
    line: Color(0xFFF1E1E4),
  );

  static const midnight = BrandPalette(
    id: 'midnight',
    name: 'Midnight',
    start: Color(0xFF475569),
    primary: Color(0xFF1E293B),
    end: Color(0xFF0B1120),
    shade50: Color(0xFFF1F5F9),
    shade100: Color(0xFFE2E8F0),
    shade200: Color(0xFFCBD5E1),
    shade600: Color(0xFF0F172A),
    shade700: Color(0xFF0F172A),
    shade900: Color(0xFF020617),
    background: Color(0xFFF6F7F9),
    line: Color(0xFFE2E5EA),
  );

  static const all = [royal, ocean, emerald, coral, midnight];

  LinearGradient get gradient =>
      LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [start, primary, end]);

  // ── The owner's choice, saved on this phone ────────────────────────────────

  static const _key = 'brand_palette';

  /// Current theme; the app rebuilds when it changes.
  static final notifier = ValueNotifier<BrandPalette>(royal);
  static BrandPalette get current => notifier.value;

  static BrandPalette byId(String? id) => all.firstWhere((p) => p.id == id, orElse: () => royal);

  /// Call before runApp.
  static Future<void> load() async {
    try {
      notifier.value = byId((await SharedPreferences.getInstance()).getString(_key));
    } catch (_) {
      // Keep the default if storage isn't available.
    }
  }

  static Future<void> choose(BrandPalette p) async {
    notifier.value = p;
    try {
      await (await SharedPreferences.getInstance()).setString(_key, p.id);
    } catch (_) {}
  }
}
