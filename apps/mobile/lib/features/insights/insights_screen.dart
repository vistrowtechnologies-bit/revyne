import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/pickers.dart';
import '../../core/widgets/ui.dart';
import '../reports/report_screen.dart';
import 'insights_repository.dart';

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
String _short(DateTime d) => '${d.day} ${_months[d.month - 1]}';

/// Small "▲ 12%" / "▼ 5%" badge; nothing when there's no earlier data.
class ChangeBadge extends StatelessWidget {
  const ChangeBadge({super.key, required this.now, required this.before, this.onDark = false});
  final int now;
  final int before;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final pct = percentChange(now, before);
    if (pct == null) return const SizedBox.shrink();
    final up = pct >= 0;
    final color = onDark ? Colors.white : (up ? AppColors.success : AppColors.danger);
    return Text('${up ? '▲' : '▼'} ${pct.abs()}%', style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 12.5));
  }
}

/// Google tab card: last 28 days at a glance; opens the full screen.
class InsightsCard extends ConsumerWidget {
  const InsightsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(insightsProvider(last28Days));
    final v = async.value;
    return AppCard(
      padding: const EdgeInsets.all(18),
      onTap: () => Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const InsightsScreen())),
      child: Row(
        children: [
          const IconTile(Icons.insights_rounded),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  v == null
                      ? (async.hasError ? 'Calls, directions & searches' : 'Loading stats…')
                      : '${v.totals.views} views · ${v.totals.actions} actions',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
                const SizedBox(height: 2),
                Text(
                  v == null
                      ? (async.hasError ? (async.error is InsightsException ? (async.error as InsightsException).message : 'Tap to try again') : 'Last 28 days on Google')
                      : 'Last 28 days · ${v.totals.calls} calls, ${v.totals.directions} directions',
                  style: const TextStyle(color: AppColors.muted, fontSize: 14),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    );
  }
}

class InsightsScreen extends ConsumerStatefulWidget {
  const InsightsScreen({super.key});

  @override
  ConsumerState<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends ConsumerState<InsightsScreen> {
  StatsRange _range = last28Days;

  bool get _custom => _range.start != null;

  /// Calendar range picker within Google's window: ~18 months back, ending 2 days ago.
  Future<void> _pickCustom() async {
    final now = DateTime.now();
    final last = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 2));
    final picked = await pickDateRange(
      context,
      first: last.subtract(const Duration(days: 538)),
      last: last,
      initial: _custom ? DateTimeRange(start: _range.start!, end: _range.end!) : DateTimeRange(start: last.subtract(const Duration(days: 27)), end: last),
      title: 'Pick dates for your stats',
    );
    if (picked == null) return;
    if (picked.duration.inDays > 365) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pick up to one year at a time.')));
      return;
    }
    setState(() => _range = (days: picked.duration.inDays + 1, start: picked.start, end: picked.end));
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(insightsProvider(_range));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Google stats'),
        actions: [
          TextButton.icon(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportScreen())),
            icon: const Icon(Icons.description_outlined, size: 20),
            label: const Text('Reports'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(insightsProvider(_range));
          try {
            await ref.read(insightsProvider(_range).future);
          } catch (_) {}
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl),
          children: [
            Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
              for (final d in const [7, 28, 90])
                SelectChip(label: '$d days', selected: !_custom && _range.days == d, onTap: () => setState(() => _range = (days: d, start: null, end: null))),
              SelectChip(
                label: _custom ? '${_short(_range.start!)} – ${_short(_range.end!)}' : 'Custom dates',
                selected: _custom,
                onTap: _pickCustom,
              ),
            ]),
            const SizedBox(height: AppSpacing.md),
            ...async.when(
              loading: () => [const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))],
              error: (e, _) => [
                EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load stats", body: e is InsightsException ? e.message : 'Pull down to try again.'),
              ],
              data: (v) => _content(v),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _content(Insights v) {
    final t = v.totals;
    final p = v.previous;
    final tiles = [
      (Icons.call_outlined, 'Calls', t.calls, p.calls),
      (Icons.directions_outlined, 'Directions', t.directions, p.directions),
      (Icons.language_rounded, 'Website clicks', t.websiteClicks, p.websiteClicks),
      (Icons.chat_bubble_outline_rounded, 'Chats', t.chats, p.chats),
    ];
    return [
      GradientCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${_short(v.start)} – ${_short(v.end)}', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${t.views}', style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w800, height: 1)),
              const SizedBox(width: 8),
              const Padding(
                padding: EdgeInsets.only(bottom: 4),
                child: Text('people saw your profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
              ),
            ]),
            const SizedBox(height: 4),
            ChangeBadge(now: t.views, before: p.views, onDark: true),
            const SizedBox(height: AppSpacing.md),
            _Bars(values: [for (final d in v.daily) d.views]),
            const SizedBox(height: AppSpacing.md),
            Row(children: [
              Expanded(child: _Split(label: 'Google Search', value: t.searchViews)),
              Expanded(child: _Split(label: 'Google Maps', value: t.mapsViews)),
            ]),
          ],
        ),
      ),
      const SizedBox(height: AppSpacing.lg),
      SectionHeader(title: 'What they did · ${t.actions}'),
      const SizedBox(height: AppSpacing.sm),
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: AppSpacing.gutter,
        crossAxisSpacing: AppSpacing.gutter,
        childAspectRatio: 1.55,
        children: [
          for (final (icon, label, now, before) in tiles)
            AppCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [Icon(icon, size: 20, color: AppColors.violet), const Spacer(), ChangeBadge(now: now, before: before)]),
                  Text('$now', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, height: 1)),
                  Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13.5, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
        ],
      ),
      const SizedBox(height: AppSpacing.lg),
      const SectionHeader(title: 'What people searched'),
      const SizedBox(height: AppSpacing.sm),
      AppCard(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: v.keywords.isEmpty
            ? const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Not enough searches yet. Google shows search terms once enough people find you.', style: TextStyle(color: AppColors.muted)),
              )
            : Column(children: [
                for (final (i, k) in v.keywords.indexed) ...[
                  if (i > 0) const Divider(indent: 16, endIndent: 16),
                  ListTile(
                    dense: true,
                    leading: const Icon(Icons.search_rounded, color: AppColors.muted, size: 20),
                    title: Text(k.keyword, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    trailing: Text(k.label, style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.violet700)),
                  ),
                ],
              ]),
      ),
      const SizedBox(height: AppSpacing.sm),
      const Text(
        'From Google. Numbers run 2–3 days behind; search terms cover the last 3 whole months, and small counts show as "< N".',
        style: TextStyle(color: AppColors.muted, fontSize: 12.5),
      ),
    ];
  }
}

class _Split extends StatelessWidget {
  const _Split({required this.label, required this.value});
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('$value', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
        Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
      ]);
}

/// Daily bars, scaled to the busiest day.
class _Bars extends StatelessWidget {
  const _Bars({required this.values});
  final List<int> values;

  @override
  Widget build(BuildContext context) {
    final maxV = values.fold<int>(0, (m, v) => v > m ? v : m);
    return SizedBox(
      height: 64,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final v in values)
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: values.length > 40 ? 0.5 : 1.5),
                child: Container(
                  height: maxV == 0 ? 3 : 3 + 61 * (v / maxV),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: v == 0 ? 0.25 : 0.85), borderRadius: BorderRadius.circular(3)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
