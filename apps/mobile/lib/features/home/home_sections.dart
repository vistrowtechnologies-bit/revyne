// Home dashboard sections, matching the web app: key numbers, reviews waiting
// for a reply, Google Score, recent private messages and recent activity.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/skeleton.dart';
import '../../core/widgets/ui.dart';
import '../activity/activity_screen.dart';
import '../google_profile/profile_repository.dart';
import '../google_reviews/google_reviews_repository.dart';
import '../insights/insights_repository.dart';
import '../insights/insights_screen.dart';
import '../reviews/reviews_repository.dart';
import 'dashboard.dart';

void pushScreen(BuildContext context, Widget screen) => Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => screen));

/// A number that counts up from 0 when it first appears.
class CountUp extends StatelessWidget {
  const CountUp(this.value, {super.key, this.style});
  final int value;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (still) return Text(_n(value), style: style);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.toDouble()),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (_, v, _) => Text(_n(v.round()), style: style),
    );
  }

  static String _n(int n) {
    final s = n.toString();
    final b = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
      b.write(s[i]);
    }
    return b.toString();
  }
}

// ── Key numbers ─────────────────────────────────────────────────────────────

class _Kpi extends StatelessWidget {
  const _Kpi({required this.icon, required this.label, required this.value, this.sub, this.badge, this.onTap});
  final IconData icon;
  final String label;
  final Widget value;
  final String? sub;
  final Widget? badge;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => AppCard(
        padding: const EdgeInsets.all(16),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [IconTile(icon, size: 36), const Spacer(), ?badge]),
            const SizedBox(height: 14),
            DefaultTextStyle.merge(style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, height: 1.1, color: AppColors.ink), child: value),
            const SizedBox(height: 4),
            Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 13.5, fontWeight: FontWeight.w600)),
            Text(sub ?? ' ', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
          ],
        ),
      );
}

/// Two tiles per row on a phone.
class _KpiGrid extends StatelessWidget {
  const _KpiGrid(this.tiles);
  final List<Widget> tiles;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          for (var i = 0; i < tiles.length; i += 2) ...[
            if (i > 0) const SizedBox(height: 12),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [Expanded(child: tiles[i]), const SizedBox(width: 12), Expanded(child: i + 1 < tiles.length ? tiles[i + 1] : const SizedBox())],
              ),
            ),
          ],
        ],
      );
}

const _dash = Text('–', style: TextStyle(color: AppColors.muted));

/// Once Google is linked: rating, replies waiting, views, calls & directions.
class GoogleKpis extends ConsumerWidget {
  const GoogleKpis({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gr = ref.watch(googleReviewsProvider);
    final ins = ref.watch(insightsProvider(last28Days)).value;
    final fb = ref.watch(privateFeedbackProvider).value;
    final page = gr.value;
    final waiting = page?.reviews.where((r) => r.needsReply).length;
    final unread = fb?.where((f) => f.isUnread).length ?? 0;
    final t = ins?.totals;
    final p = ins?.previous;
    void stats() => pushScreen(context, const InsightsScreen());
    return _KpiGrid([
      _Kpi(
        icon: Icons.star_rounded,
        label: 'Google rating',
        value: page?.averageRating == null
            ? _dash
            : Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                Text(page!.averageRating!.toStringAsFixed(1)),
                const SizedBox(width: 4),
                const Text('★', style: TextStyle(fontSize: 18, color: AppColors.star)),
              ]),
        sub: page != null ? '${page.totalCount} review${page.totalCount == 1 ? '' : 's'}' : (gr.hasError ? 'Not available' : null),
        onTap: () => context.go('${Routes.reviews}?tab=google'),
      ),
      _Kpi(
        icon: Icons.rate_review_outlined,
        label: 'Waiting for a reply',
        value: waiting == null ? _dash : Text('$waiting'),
        sub: unread > 0 ? '+ $unread private message${unread == 1 ? '' : 's'}' : 'Google reviews',
        onTap: () => context.go('${Routes.reviews}?tab=google'),
      ),
      _Kpi(
        icon: Icons.visibility_outlined,
        label: 'Profile views',
        value: t == null ? _dash : CountUp(t.views),
        sub: 'Last 28 days on Google',
        badge: t != null && p != null ? ChangeBadge(now: t.views, before: p.views) : null,
        onTap: stats,
      ),
      _Kpi(
        icon: Icons.call_outlined,
        label: 'Calls & directions',
        value: t == null ? _dash : CountUp(t.calls + t.directions),
        sub: t == null ? 'Last 28 days' : '${t.calls} calls · ${t.directions} directions',
        badge: t != null && p != null ? ChangeBadge(now: t.calls + t.directions, before: p.calls + p.directions) : null,
        onTap: stats,
      ),
    ]);
  }
}

/// Before Google is linked: numbers from the RevYne review page.
class PageKpis extends StatelessWidget {
  const PageKpis({super.key, required this.stats});
  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final d = stats;
    return _KpiGrid([
      _Kpi(icon: Icons.visibility_outlined, label: 'Review page visits', value: CountUp(d.visits7d), sub: 'This week', onTap: () => context.go('${Routes.reviews}?tab=visits')),
      _Kpi(icon: Icons.open_in_new_rounded, label: 'Went to Google', value: CountUp(d.google7d), sub: weekDelta(d.google7d, d.googlePrev7d), onTap: () => context.go('${Routes.reviews}?tab=visits')),
      _Kpi(icon: Icons.star_rounded, label: 'Average rating', value: d.avgRating30d == null ? _dash : Text(d.avgRating30d!.toStringAsFixed(1)), sub: 'Last 30 days'),
      _Kpi(icon: Icons.forum_outlined, label: 'Unread messages', value: Text('${d.unreadFeedback}'), sub: 'Private, only you see these', onTap: () => context.go('${Routes.reviews}?tab=private')),
    ]);
  }
}

// ── Sections ────────────────────────────────────────────────────────────────

class HomeSection extends StatelessWidget {
  const HomeSection({super.key, required this.title, required this.child, this.action, this.onAction});
  final String title;
  final Widget child;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(height: 36, child: SectionHeader(title: title, action: action, onAction: onAction)),
            const SizedBox(height: 4),
            child,
          ],
        ),
      );
}

class NeedsReply extends ConsumerWidget {
  const NeedsReply({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gr = ref.watch(googleReviewsProvider);
    final waiting = gr.value?.reviews.where((r) => r.needsReply).toList() ?? const <GoogleReview>[];
    void open() => context.go('${Routes.reviews}?tab=google');
    return HomeSection(
      title: 'Needs your reply',
      action: waiting.isNotEmpty ? 'See all' : 'Reviews',
      onAction: open,
      child: gr.when(
        loading: () => const ListSkeleton(rows: 2, label: 'Loading reviews'),
        error: (e, _) => EmptyState(icon: Icons.reviews_outlined, title: "Reviews aren't available right now", body: e.toString()),
        data: (_) => waiting.isEmpty
            ? AppCard(
                padding: const EdgeInsets.all(18),
                child: Row(children: [
                  const IconTile(Icons.task_alt_rounded, background: AppColors.successSoft, foreground: AppColors.success),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('All caught up', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text("You've replied to every recent Google review.", style: TextStyle(color: AppColors.muted, fontSize: 14)),
                    ]),
                  ),
                ]),
              )
            : AppCard(
                padding: EdgeInsets.zero,
                child: Column(children: [
                  for (final (i, r) in waiting.take(3).indexed) ...[
                    if (i > 0) const Divider(height: 1, indent: 68),
                    InkWell(
                      onTap: open,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          InitialsAvatar(r.reviewer, size: 40),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Flexible(child: Text(r.reviewer ?? 'Google user', overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15))),
                                if (r.rating > 0) ...[const SizedBox(width: 6), Stars(r.rating, size: 14)],
                                const Spacer(),
                                Text(timeAgo(r.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                              ]),
                              const SizedBox(height: 2),
                              Text(r.displayComment.isEmpty ? 'Rating only — no written review.' : r.displayComment,
                                  maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 14)),
                              const SizedBox(height: 6),
                              Row(children: [
                                Icon(Icons.auto_awesome_rounded, size: 15, color: AppColors.violet),
                                const SizedBox(width: 4),
                                Text('Reply with AI', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800, fontSize: 13.5)),
                              ]),
                            ]),
                          ),
                        ]),
                      ),
                    ),
                  ],
                ]),
              ),
      ),
    );
  }
}

class ScorePeek extends ConsumerWidget {
  const ScorePeek({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = ref.watch(gbpProfileProvider);
    if (p.hasError) return const SizedBox.shrink();
    final v = p.value;
    return HomeSection(
      title: 'Google Score',
      action: 'Improve',
      onAction: () => context.go(Routes.google),
      child: AppCard(
        padding: const EdgeInsets.all(18),
        onTap: () => context.go(Routes.google),
        child: v == null
            ? const SkeletonPulse(
                label: 'Loading your Google Score',
                child: Row(children: [
                  Sk(width: 64, height: 64, radius: 32),
                  SizedBox(width: 16),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [SkLine(0.7, height: 15), SizedBox(height: 8), SkLine(0.4, height: 12)])),
                ]),
              )
            : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  ScoreRing(score: v.score, size: 64),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(v.score >= 80 ? 'Strong profile' : v.score >= 55 ? 'Good — a few quick wins left' : 'Room to grow',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text(v.tasks.isEmpty ? 'Nothing left to fix' : '${v.tasks.length} way${v.tasks.length == 1 ? '' : 's'} to improve',
                          style: const TextStyle(color: AppColors.muted, fontSize: 13.5)),
                    ]),
                  ),
                ]),
                for (final t in v.tasks.take(2)) ...[
                  const SizedBox(height: 12),
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.successSoft, borderRadius: BorderRadius.circular(AppRadius.chip)),
                      child: Text('+${t.max - t.earned}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 12)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(t.label, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14))),
                  ]),
                ],
              ]),
      ),
    );
  }
}

class PrivateMessagesPeek extends ConsumerWidget {
  const PrivateMessagesPeek({super.key, required this.unread});
  final int unread;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = (ref.watch(privateFeedbackProvider).value ?? const <PrivateFeedback>[]).take(2).toList();
    if (items.isEmpty) return const SizedBox.shrink();
    void open() => context.go('${Routes.reviews}?tab=private');
    return HomeSection(
      title: unread > 0 ? 'Private messages · $unread new' : 'Private messages',
      action: 'All',
      onAction: open,
      child: AppCard(
        padding: EdgeInsets.zero,
        child: Column(children: [
          for (final (i, f) in items.indexed) ...[
            if (i > 0) const Divider(height: 1, indent: 68),
            InkWell(
              onTap: open,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  InitialsAvatar(f.contactName, size: 40),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(
                          child: Text(f.contactName ?? 'Customer',
                              overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: f.isUnread ? FontWeight.w800 : FontWeight.w700, fontSize: 15)),
                        ),
                        Text(timeAgo(f.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                        if (f.isUnread) ...[
                          const SizedBox(width: 6),
                          Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.magenta, shape: BoxShape.circle)),
                        ],
                      ]),
                      const SizedBox(height: 2),
                      Text('"${f.message}"', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 14)),
                    ]),
                  ),
                ]),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}

class RecentActivity extends ConsumerWidget {
  const RecentActivity({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final all = ref.watch(activityProvider).value;
    if (all == null) return const SizedBox.shrink();
    final items = all.take(4).toList();
    return HomeSection(
      title: 'Recent activity',
      action: items.isEmpty ? null : 'Activity log',
      onAction: () => pushScreen(context, const ActivityScreen()),
      child: items.isEmpty
          ? const AppCard(
              padding: EdgeInsets.all(18),
              child: Text('Replies, profile edits, posts and photos you make through RevYne will show up here.', style: TextStyle(color: AppColors.muted, fontSize: 14)),
            )
          : AppCard(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Column(children: [
                for (final e in items)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Row(children: [
                      IconTile(e.display.$1, size: 34),
                      const SizedBox(width: 12),
                      Expanded(child: Text(e.display.$2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5))),
                      const SizedBox(width: 8),
                      Text(timeAgo(e.at), style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                    ]),
                  ),
              ]),
            ),
    );
  }
}
