import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/theme/palettes.dart';
import 'package:revyne_app/core/theme/tokens.dart';

/// WCAG contrast ratio between two opaque colours.
double contrast(Color a, Color b) {
  double lum(Color c) {
    double ch(double v) => v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4).toDouble();
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }

  final l1 = lum(a), l2 = lum(b);
  return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05);
}

void main() {
  test('five palettes with unique ids; unknown id falls back to Royal', () {
    expect(BrandPalette.all.length, 5);
    expect(BrandPalette.all.map((p) => p.id).toSet().length, 5);
    expect(BrandPalette.byId('nope'), BrandPalette.royal);
    expect(BrandPalette.byId('ocean'), BrandPalette.ocean);
  });

  test('every palette keeps text readable (WCAG AA 4.5:1)', () {
    for (final p in BrandPalette.all) {
      expect(contrast(Colors.white, p.primary), greaterThanOrEqualTo(4.5), reason: '${p.name}: white on primary');
      expect(contrast(Colors.white, p.shade600), greaterThanOrEqualTo(4.5), reason: '${p.name}: white on shade600');
      expect(contrast(p.shade700, p.shade50), greaterThanOrEqualTo(4.5), reason: '${p.name}: shade700 on shade50');
      expect(contrast(p.primary, p.background), greaterThanOrEqualTo(4.5), reason: '${p.name}: primary text on page');
    }
  });

  test('AppColors follow the chosen palette', () {
    BrandPalette.notifier.value = BrandPalette.emerald;
    expect(AppColors.violet, BrandPalette.emerald.primary);
    expect(AppColors.brandGradient.colors.first, BrandPalette.emerald.start);
    BrandPalette.notifier.value = BrandPalette.royal;
    expect(AppColors.violet, const Color(0xFF6334E2));
  });
}
