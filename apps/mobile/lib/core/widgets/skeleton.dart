// Loading placeholders shaped like the content that is coming, in place of
// spinners (same as the web app's widgets.tsx skeletons).
import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'ui.dart';

/// Gently pulses everything inside it. One per skeleton layout.
class SkeletonPulse extends StatefulWidget {
  const SkeletonPulse({super.key, required this.child, this.label = 'Loading'});
  final Widget child;
  final String label;

  @override
  State<SkeletonPulse> createState() => _SkeletonPulseState();
}

class _SkeletonPulseState extends State<SkeletonPulse> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    return Semantics(
      label: widget.label,
      container: true,
      child: ExcludeSemantics(
        child: still ? widget.child : FadeTransition(opacity: Tween(begin: 1.0, end: 0.45).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)), child: widget.child),
      ),
    );
  }
}

/// One grey block.
class Sk extends StatelessWidget {
  const Sk({super.key, this.width, required this.height, this.radius = 8, this.onDark = false});
  final double? width;
  final double height;
  final double radius;
  final bool onDark;

  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: onDark ? Colors.white.withValues(alpha: 0.22) : AppColors.violet100,
          borderRadius: BorderRadius.circular(radius),
        ),
      );
}

/// A line that takes [fraction] of the available width.
class SkLine extends StatelessWidget {
  const SkLine(this.fraction, {super.key, this.height = 13});
  final double fraction;
  final double height;

  @override
  Widget build(BuildContext context) => FractionallySizedBox(alignment: Alignment.centerLeft, widthFactor: fraction, child: Sk(height: height));
}

/// Rows of avatar + two lines, like a list of reviews or notifications.
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key, this.rows = 3, this.avatar = true, this.label = 'Loading'});
  final int rows;
  final bool avatar;
  final String label;

  @override
  Widget build(BuildContext context) => SkeletonPulse(
        label: label,
        child: Column(
          children: [
            for (var i = 0; i < rows; i++) ...[
              if (i > 0) const SizedBox(height: 8),
              AppCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (avatar) ...[const Sk(width: 40, height: 40, radius: 20), const SizedBox(width: 12)],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkLine(i.isEven ? 0.45 : 0.35, height: 14),
                          const SizedBox(height: 10),
                          const SkLine(0.95, height: 12),
                          const SizedBox(height: 6),
                          SkLine(i.isEven ? 0.7 : 0.55, height: 12),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      );
}

/// A plain card with a few lines: for small panels.
class CardSkeleton extends StatelessWidget {
  const CardSkeleton({super.key, this.lines = 3, this.label = 'Loading'});
  final int lines;
  final String label;

  @override
  Widget build(BuildContext context) => SkeletonPulse(
        label: label,
        child: AppCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SkLine(0.4, height: 16),
              for (var i = 0; i < lines; i++) ...[const SizedBox(height: 12), SkLine(i == lines - 1 ? 0.6 : 0.9)],
            ],
          ),
        ),
      );
}

/// The gradient hero card, empty.
class HeroSkeleton extends StatelessWidget {
  const HeroSkeleton({super.key, this.height = 250});
  final double height;

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(24)),
        child: Opacity(
          opacity: 0.9,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Sk(width: 90, height: 12, onDark: true),
              const SizedBox(height: 16),
              const Sk(width: 160, height: 44, radius: 12, onDark: true),
              const Spacer(),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  for (final (i, h) in const [30.0, 46.0, 24.0, 58.0, 38.0, 50.0, 64.0].indexed) ...[
                    if (i > 0) const SizedBox(width: 10),
                    Expanded(child: Sk(height: h, onDark: true)),
                  ],
                ],
              ),
            ],
          ),
        ),
      );
}

/// A 2×2 grid of number tiles.
class TilesSkeleton extends StatelessWidget {
  const TilesSkeleton({super.key, this.count = 4});
  final int count;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, c) {
          final w = (c.maxWidth - 12) / 2;
          return Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              for (var i = 0; i < count; i++)
                SizedBox(
                  width: w,
                  child: const AppCard(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [Sk(width: 36, height: 36, radius: 12), SizedBox(height: 14), Sk(width: 64, height: 26), SizedBox(height: 8), SkLine(0.8, height: 12)],
                    ),
                  ),
                ),
            ],
          );
        },
      );
}

/// Home while the numbers load.
class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const SkeletonPulse(
        label: 'Loading your numbers',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TilesSkeleton(),
            SizedBox(height: AppSpacing.lg),
            HeroSkeleton(),
            SizedBox(height: AppSpacing.lg),
            Sk(width: 120, height: 12),
            SizedBox(height: AppSpacing.sm),
            AppCard(
              padding: EdgeInsets.all(16),
              child: Row(children: [
                Sk(width: 40, height: 40, radius: 20),
                SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [SkLine(0.5, height: 14), SizedBox(height: 10), SkLine(0.9, height: 12)])),
              ]),
            ),
          ],
        ),
      );
}

/// Stats / monthly report while they load: hero, tiles and a chart card.
class StatsSkeleton extends StatelessWidget {
  const StatsSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const SkeletonPulse(
        label: 'Loading your stats',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            HeroSkeleton(height: 190),
            SizedBox(height: AppSpacing.md),
            TilesSkeleton(),
            SizedBox(height: AppSpacing.md),
            AppCard(
              padding: EdgeInsets.all(18),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [SkLine(0.35, height: 16), SizedBox(height: 16), Sk(height: 140, radius: 12)]),
            ),
          ],
        ),
      );
}
