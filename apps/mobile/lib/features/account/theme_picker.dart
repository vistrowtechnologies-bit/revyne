import 'package:flutter/material.dart';

import '../../core/theme/palettes.dart';
import '../../core/theme/tokens.dart';

/// Small gradient swatch for a palette.
class PaletteDot extends StatelessWidget {
  const PaletteDot(this.palette, {super.key, this.size = 22});
  final BrandPalette palette;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(gradient: palette.gradient, shape: BoxShape.circle),
      );
}

/// Bottom sheet to pick the app's colour theme. Applies instantly.
Future<void> showThemePicker(BuildContext context) => showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) => const _ThemePicker(),
    );

class _ThemePicker extends StatelessWidget {
  const _ThemePicker();

  @override
  Widget build(BuildContext context) {
    final current = BrandPalette.current;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, 12, AppSpacing.md, AppSpacing.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: AppSpacing.md),
            Text('App colour', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 2),
            const Text('Choose the look of your RevYne. Only changes this phone.', style: TextStyle(color: AppColors.muted, fontSize: 14.5)),
            const SizedBox(height: AppSpacing.md),
            for (final p in BrandPalette.all)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Material(
                  color: p.id == current.id ? p.shade50 : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(color: p.id == current.id ? p.primary : AppColors.line, width: p.id == current.id ? 2 : 1),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () {
                      Navigator.of(context).pop();
                      BrandPalette.choose(p); // the app redraws in the new colours
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(children: [
                        // A mini preview: the gradient hero with a primary pill.
                        Container(
                          width: 64,
                          height: 44,
                          decoration: BoxDecoration(gradient: p.gradient, borderRadius: BorderRadius.circular(12)),
                          alignment: Alignment.bottomLeft,
                          padding: const EdgeInsets.all(7),
                          child: Container(width: 26, height: 8, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4))),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
                        for (final c in [p.shade100, p.primary, p.shade700])
                          Container(
                            width: 14,
                            height: 14,
                            margin: const EdgeInsets.only(left: 4),
                            decoration: BoxDecoration(color: c, shape: BoxShape.circle),
                          ),
                        const SizedBox(width: AppSpacing.sm),
                        Icon(p.id == current.id ? Icons.check_circle_rounded : Icons.circle_outlined,
                            color: p.id == current.id ? p.primary : AppColors.line),
                      ]),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
