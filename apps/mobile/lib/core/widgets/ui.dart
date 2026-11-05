import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// White card: 20px radius, hairline border, very soft violet shadow.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(20), this.color, this.onTap, this.borderColor});

  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final Color? borderColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppRadius.card);
    return DecoratedBox(
      decoration: BoxDecoration(borderRadius: radius, boxShadow: color == null ? AppShadows.card : null),
      child: Material(
        color: color ?? Colors.white,
        shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: borderColor ?? AppColors.line)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
      ),
    );
  }
}

/// The one gradient moment per screen — the logo gradient with a soft glow.
class GradientCard extends StatelessWidget {
  const GradientCard({super.key, required this.child, this.padding = const EdgeInsets.all(22), this.onTap});

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(24);
    return DecoratedBox(
      decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: radius, boxShadow: AppShadows.glow),
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          borderRadius: radius,
          onTap: onTap,
          child: Padding(
            padding: padding,
            child: DefaultTextStyle.merge(style: const TextStyle(color: Colors.white), child: child),
          ),
        ),
      ),
    );
  }
}

/// Full-width pill button filled with the logo gradient.
class GradientButton extends StatelessWidget {
  const GradientButton({super.key, required this.label, required this.onPressed, this.icon, this.busy = false});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !busy;
    return Opacity(
      opacity: enabled ? 1 : 0.55,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          borderRadius: BorderRadius.circular(AppRadius.button),
          boxShadow: enabled ? AppShadows.glow : null,
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(AppRadius.button),
            onTap: enabled ? onPressed : null,
            child: SizedBox(
              height: 54,
              child: Center(
                child: busy
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon != null) ...[Icon(icon, color: Colors.white, size: 20), const SizedBox(width: 10)],
                          Text(label, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The RevYne mark (logo image) with optional wordmark.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 32, this.wordmark = true});

  final double size;
  final bool wordmark;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(size * 0.26),
          child: Image.asset('assets/brand/logo.png', width: size, height: size),
        ),
        if (wordmark) ...[
          const SizedBox(width: 10),
          Text('RevYne', style: TextStyle(fontSize: size * 0.62, fontWeight: FontWeight.w800, color: AppColors.ink, letterSpacing: -0.3)),
        ],
      ],
    );
  }
}

/// Rounded square icon tile (violet tint) used in lists and quick actions.
class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.size = 44, this.background = AppColors.violet50, this.foreground = AppColors.violet});

  final IconData icon;
  final double size;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(size * 0.32)),
        alignment: Alignment.center,
        child: Icon(icon, color: foreground, size: size * 0.5),
      );
}

/// Small pill, e.g. "Not connected", "NEW".
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.background, required this.foreground, this.dot = false});

  final String label;
  final Color background;
  final Color foreground;
  final bool dot;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(AppRadius.chip)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(width: 7, height: 7, decoration: BoxDecoration(color: foreground, shape: BoxShape.circle)),
            const SizedBox(width: 6),
          ],
          Text(label, style: TextStyle(color: foreground, fontSize: 12.5, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

/// Star rating row.
class Stars extends StatelessWidget {
  const Stars(this.rating, {super.key, this.size = 18});

  final int rating;
  final double size;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 1; i <= 5; i++)
            Icon(i <= rating ? Icons.star_rounded : Icons.star_outline_rounded, color: AppColors.star, size: size),
        ],
      );
}

/// Single metric tile.
class MetricTile extends StatelessWidget {
  const MetricTile({super.key, required this.label, required this.value, this.caption});

  final String label;
  final String value;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.ink)),
          if (caption != null) ...[
            const SizedBox(height: 2),
            Text(caption!, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          ],
        ],
      ),
    );
  }
}

/// Selectable pill chip for tone, language and tag pickers.
class SelectChip extends StatelessWidget {
  const SelectChip({super.key, required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.chip),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.violet : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.chip),
          border: Border.all(color: selected ? AppColors.violet : AppColors.line),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: selected ? Colors.white : AppColors.ink),
        ),
      ),
    );
  }
}

/// Progress bar for multi-step flows (onboarding).
class StepDots extends StatelessWidget {
  const StepDots({super.key, required this.count, required this.current});

  final int count;
  final int current; // 1-based

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 1; i <= count; i++) ...[
          Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              height: 5,
              decoration: BoxDecoration(
                gradient: i <= current ? AppColors.brandGradient : null,
                color: i <= current ? null : AppColors.violet100,
                borderRadius: BorderRadius.circular(AppRadius.chip),
              ),
            ),
          ),
          if (i != count) const SizedBox(width: 6),
        ],
      ],
    );
  }
}

/// Circular 0–100 score ring (Google Score, Phase 3).
class ScoreRing extends StatelessWidget {
  const ScoreRing({super.key, required this.score, this.size = 88});

  final int? score;
  final double size;

  Color get _color {
    final s = score;
    if (s == null) return AppColors.outline;
    if (s >= 80) return AppColors.success;
    if (s >= 55) return AppColors.star;
    return AppColors.danger;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox.expand(
            child: CircularProgressIndicator(
              value: (score ?? 0) / 100,
              strokeWidth: 8,
              backgroundColor: AppColors.violet100,
              valueColor: AlwaysStoppedAnimation(_color),
              strokeCap: StrokeCap.round,
            ),
          ),
          Text('${score ?? '–'}', style: TextStyle(fontSize: size * 0.32, fontWeight: FontWeight.w800, color: _color)),
        ],
      ),
    );
  }
}

/// Small uppercase label above a section, with an optional action.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.action, this.onAction});

  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title.toUpperCase(),
          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: AppColors.muted, letterSpacing: 0.8),
        ),
        if (action != null) TextButton(onPressed: onAction, child: Text(action!)),
      ],
    );
  }
}

/// Calm empty / placeholder state.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, required this.body, this.icon});

  final String title;
  final String body;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          if (icon != null) ...[IconTile(icon!, size: 56), const SizedBox(height: 14)],
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(body, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted, fontSize: 14.5)),
        ],
      ),
    );
  }
}

/// Initials avatar for customers ("Priya Sharma" → "PS").
class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar(this.name, {super.key, this.size = 44});

  final String? name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final parts = (name ?? '').trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    final initials = parts.isEmpty ? '' : parts.take(2).map((p) => p[0].toUpperCase()).join();
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(color: AppColors.violet50, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: initials.isEmpty
          ? Icon(Icons.person_rounded, color: AppColors.violet, size: size * 0.5)
          : Text(initials, style: TextStyle(color: AppColors.violet700, fontWeight: FontWeight.w800, fontSize: size * 0.34)),
    );
  }
}
