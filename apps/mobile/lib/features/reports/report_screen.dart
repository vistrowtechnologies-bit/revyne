import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../insights/insights_repository.dart';
import '../insights/insights_screen.dart' show ChangeBadge;
import 'report_pdf.dart';
import 'report_repository.dart';
import '../../core/widgets/skeleton.dart';

/// Monthly report: Google stats, reviews, RevYne review page, posts, searches.
/// Opens on last month (the latest complete one); share as PDF.
class ReportScreen extends ConsumerStatefulWidget {
  const ReportScreen({super.key});

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  late DateTime _month = () {
    final now = DateTime.now();
    return DateTime(now.year, now.month - 1, 1);
  }();
  bool _sharing = false;

  DateTime get _thisMonth => DateTime(DateTime.now().year, DateTime.now().month, 1);
  DateTime get _oldest => DateTime(_thisMonth.year, _thisMonth.month - 17, 1);

  void _shift(int by) => setState(() => _month = DateTime(_month.year, _month.month + by, 1));

  Future<void> _share(MonthlyReport r) async {
    setState(() => _sharing = true);
    try {
      final bytes = await buildReportPdf(r);
      final slug = r.businessName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-').replaceAll(RegExp(r'^-|-$'), '');
      await Printing.sharePdf(bytes: bytes, filename: '$slug-${r.month.year}-${r.month.month.toString().padLeft(2, '0')}.pdf');
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(monthlyReportProvider(_month));
    return Scaffold(
      appBar: AppBar(title: const Text('Monthly report')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(monthlyReportProvider(_month));
          try {
            await ref.read(monthlyReportProvider(_month).future);
          } catch (_) {}
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl),
          children: [
            AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: Row(children: [
                IconButton(
                  tooltip: 'Previous month',
                  onPressed: _month.isAfter(_oldest) ? () => _shift(-1) : null,
                  icon: const Icon(Icons.chevron_left_rounded),
                ),
                Expanded(
                  child: Column(children: [
                    Text(monthLabel(_month), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                    if (_month == _thisMonth) const Text('So far this month', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
                  ]),
                ),
                IconButton(
                  tooltip: 'Next month',
                  onPressed: _month.isBefore(_thisMonth) ? () => _shift(1) : null,
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ]),
            ),
            const SizedBox(height: AppSpacing.md),
            ...async.when(
              loading: () => [const StatsSkeleton()],
              error: (e, _) => [EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load the report", body: e is InsightsException ? e.message : 'Pull down to try again.')],
              data: (r) => _content(r),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _content(MonthlyReport r) {
    final g = r.google;
    final pg = r.previousGoogle;

    Widget stat(String label, String value, {int? now, int? before}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(children: [
            Expanded(child: Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 14.5, fontWeight: FontWeight.w600))),
            if (now != null && before != null) ...[ChangeBadge(now: now, before: before), const SizedBox(width: 8)],
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          ]),
        );

    Widget card(String title, IconData icon, List<Widget> rows) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
          child: AppCard(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(icon, size: 20, color: AppColors.violet),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ]),
              const SizedBox(height: 6),
              ...rows,
            ]),
          ),
        );

    final nothing = g == null && r.reviews == null && (r.pageVisits ?? 0) == 0 && (r.postsPublished ?? 0) == 0;

    return [
      if (g != null)
        GradientCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('On Google', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${g.views}', style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w800, height: 1)),
              const SizedBox(width: 8),
              const Padding(
                padding: EdgeInsets.only(bottom: 4),
                child: Text('people saw your profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
              ),
            ]),
            if (pg != null) ...[const SizedBox(height: 4), ChangeBadge(now: g.views, before: pg.views, onDark: true)],
            const SizedBox(height: AppSpacing.md),
            Row(children: [
              for (final (label, value) in [('Calls', g.calls), ('Directions', g.directions), ('Website', g.websiteClicks)])
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('$value', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                    Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
                  ]),
                ),
            ]),
          ]),
        ),
      if (g != null) const SizedBox(height: AppSpacing.gutter),
      if (g != null)
        card('Where they found you', Icons.travel_explore_rounded, [
          stat('Google Search', '${g.searchViews}', now: g.searchViews, before: pg?.searchViews),
          stat('Google Maps', '${g.mapsViews}', now: g.mapsViews, before: pg?.mapsViews),
          stat('Chats', '${g.chats}'),
        ]),
      if (r.reviews != null)
        card('Reviews', Icons.star_rounded, [
          stat('New Google reviews', '${r.reviews!.received}'),
          if (r.reviews!.averageRating != null) stat('Average rating this month', '${r.reviews!.averageRating} ★'),
          stat('Replied', '${r.reviews!.replied} of ${r.reviews!.received}'),
          if (r.ratingAverage != null) stat('Overall rating now', '${r.ratingAverage!.toStringAsFixed(1)} ★ · ${r.ratingTotal}'),
        ]),
      if (r.pageVisits != null)
        card('Your RevYne review page', Icons.qr_code_2_rounded, [
          stat('Opened your review link', '${r.pageVisits}'),
          stat('Went on to Google', '${r.wentToGoogle}'),
          stat('Private messages to you', '${r.privateMessages}'),
        ]),
      if (r.postsPublished != null)
        card('Posts', Icons.campaign_outlined, [
          stat('Published', '${r.postsPublished}'),
          if (r.offers + r.events > 0) stat('Offers · Events', '${r.offers} · ${r.events}'),
        ]),
      if (r.searches.isNotEmpty)
        card('Top searches', Icons.search_rounded, [for (final k in r.searches) stat(k.keyword, k.label)]),
      if (nothing)
        const EmptyState(icon: Icons.insert_chart_outlined_rounded, title: 'Nothing to report yet', body: 'Activity for this month will show here.'),
      const SizedBox(height: AppSpacing.sm),
      Text(
        r.statsThrough == null
            ? 'Google stats for this month aren\'t available yet — they run 2–3 days behind.'
            : 'Google figures up to ${r.statsThrough!.day} ${monthNames[r.statsThrough!.month - 1]}.${r.complete ? '' : ' Search terms appear once the month ends.'}',
        style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
      ),
      const SizedBox(height: AppSpacing.md),
      GradientButton(label: 'Share as PDF', icon: Icons.ios_share_rounded, busy: _sharing, onPressed: _sharing ? null : () => _share(r)),
    ];
  }
}
