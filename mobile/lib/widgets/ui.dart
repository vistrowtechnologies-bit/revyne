import 'package:flutter/material.dart';

import '../config.dart';

/// Standard 20px-radius card matching the RevYne design system.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color,
    this.borderColor,
    this.borderWidth = 1,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final Color? borderColor;
  final double borderWidth;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: borderColor ?? AppColors.outlineVariant, width: borderWidth),
      ),
      child: child,
    );
  }
}

/// Small colored status pill, e.g. "FREE PLAN", "Connected", "Success".
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
            Container(width: 6, height: 6, decoration: BoxDecoration(color: foreground, shape: BoxShape.circle)),
            const SizedBox(width: 6),
          ],
          Text(label, style: TextStyle(color: foreground, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

/// A single metric tile used on the Dashboard (Avg Rating / Reviews / AI Replies).
class MetricTile extends StatelessWidget {
  const MetricTile({super.key, required this.label, required this.value, this.caption, this.trailing});

  final String label;
  final String value;
  final String? caption;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(label,
                    style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w500),
                    maxLines: 2),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primaryContainer)),
          if (caption != null) ...[
            const SizedBox(height: 2),
            Text(caption!, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
          ],
        ],
      ),
    );
  }
}

/// Selectable pill chip, used for tone selection, language selection, tags.
class SelectChip extends StatelessWidget {
  const SelectChip({super.key, required this.label, required this.selected, required this.onTap, this.dense = false});

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.chip),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: EdgeInsets.symmetric(horizontal: dense ? 12 : 16, vertical: dense ? 8 : 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryContainer : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.chip),
          border: Border.all(color: selected ? AppColors.primaryContainer : AppColors.outlineVariant),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: dense ? 12 : 13,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.onSurface,
          ),
        ),
      ),
    );
  }
}

/// Removable tag pill (onboarding "top products" input).
class RemovableTag extends StatelessWidget {
  const RemovableTag({super.key, required this.label, required this.onRemove});

  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 14, right: 6, top: 8, bottom: 8),
      decoration: BoxDecoration(color: AppColors.primaryFixed, borderRadius: BorderRadius.circular(AppRadius.chip)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primaryContainer)),
          const SizedBox(width: 4),
          InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(999),
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.close_rounded, size: 16, color: AppColors.primaryContainer),
            ),
          ),
        ],
      ),
    );
  }
}

/// Numbered step dots used at the top of onboarding screens.
class StepDots extends StatelessWidget {
  const StepDots({super.key, required this.labels, required this.currentStep});

  final List<String> labels;
  final int currentStep; // 1-based

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < labels.length; i++) ...[
          Expanded(
            flex: 0,
            child: Column(
              children: [
                _Dot(index: i + 1, state: i + 1 < currentStep ? _DotState.done : i + 1 == currentStep ? _DotState.active : _DotState.upcoming),
                const SizedBox(height: 6),
                Text(labels[i],
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: i + 1 == currentStep ? AppColors.primaryContainer : AppColors.outline,
                    )),
              ],
            ),
          ),
          if (i != labels.length - 1)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Container(height: 2, color: i + 1 < currentStep ? AppColors.primaryContainer : AppColors.outlineVariant),
              ),
            ),
        ],
      ],
    );
  }
}

enum _DotState { done, active, upcoming }

class _Dot extends StatelessWidget {
  const _Dot({required this.index, required this.state});
  final int index;
  final _DotState state;

  @override
  Widget build(BuildContext context) {
    final bg = state == _DotState.upcoming ? AppColors.surfaceContainerHigh : AppColors.primaryContainer;
    final fg = state == _DotState.upcoming ? AppColors.onSurfaceVariant : Colors.white;
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: state == _DotState.done
          ? const Icon(Icons.check_rounded, color: Colors.white, size: 18)
          : Text('$index', style: TextStyle(color: fg, fontWeight: FontWeight.w700)),
    );
  }
}

/// Circular health/progress ring with a centered value + label, used on
/// Dashboard's GMB summary and the full Google Business health card.
class ScoreRing extends StatelessWidget {
  const ScoreRing({super.key, required this.score, this.size = 88, this.strokeWidth = 8});

  final int? score;
  final double size;
  final double strokeWidth;

  Color get _color {
    if (score == null) return AppColors.outline;
    if (score! >= 80) return AppColors.success;
    if (score! >= 55) return const Color(0xFFF59E0B);
    return AppColors.error;
  }

  String get _label {
    if (score == null) return 'Loading…';
    if (score! >= 80) return 'Excellent';
    if (score! >= 55) return 'Good';
    return 'Needs Work';
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: (score ?? 0) / 100,
              strokeWidth: strokeWidth,
              backgroundColor: AppColors.surfaceContainerHigh,
              valueColor: AlwaysStoppedAnimation(_color),
              strokeCap: StrokeCap.round,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('${score ?? '–'}', style: TextStyle(fontSize: size * 0.32, fontWeight: FontWeight.w800, color: _color)),
              Text(_label.toUpperCase(),
                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.onSurfaceVariant)),
            ],
          ),
        ],
      ),
    );
  }
}

/// Section header used above lists ("Recent Reviews", "Payment History"...).
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
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.onSurface)),
        if (action != null)
          TextButton(
            onPressed: onAction,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [Text(action!), const Icon(Icons.chevron_right_rounded, size: 18)],
            ),
          ),
      ],
    );
  }
}

/// Empty-state pattern reused across Dashboard / GMB / Support / Orders.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, required this.body, this.icon});

  final String title;
  final String body;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, color: AppColors.outline, size: 28),
            const SizedBox(height: 8),
          ],
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
        ],
      ),
    );
  }
}

/// Back-arrow + brand-purple wordmark app bar used on every inner screen.
PreferredSizeWidget brandAppBar(String title, {List<Widget>? actions}) {
  return AppBar(title: Text(title), actions: actions);
}
