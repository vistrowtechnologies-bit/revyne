import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../core/format.dart';
import '../../core/supabase/supabase_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../notifications/notifications_screen.dart';
import '../notifications/push_prompt.dart';
import '../profile/user_avatar.dart';
import '../reports/report_repository.dart';
import '../reports/report_screen.dart';
import '../business/business_repository.dart';
import '../reviews/reviews_repository.dart';
import '../activity/activity_screen.dart';
import '../google_profile/profile_repository.dart';
import '../google_reviews/google_reviews_repository.dart';
import '../insights/insights_repository.dart';
import 'dashboard.dart';
import 'home_sections.dart';
import '../../core/widgets/charts.dart';
import '../../core/widgets/skeleton.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(myBusinessProvider).value;
    final stats = ref.watch(dashboardStatsProvider);
    final user = ref.watch(supabaseProvider).auth.currentUser;
    final name = firstName(user?.userMetadata?['full_name'] as String?);

    Future<DashboardStats> refresh() {
      ref.invalidate(privateFeedbackProvider);
      ref.invalidate(reviewVisitsProvider);
      ref.invalidate(activityProvider);
      if (business?.isVerified ?? false) {
        ref.invalidate(googleReviewsProvider);
        ref.invalidate(gbpProfileProvider);
        ref.invalidate(insightsProvider(last28Days));
      }
      return ref.refresh(dashboardStatsProvider.future);
    }

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: refresh,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 120),
            children: [
              Row(
                children: [
                  const BrandMark(),
                  const Spacer(),
                  const NotificationBell(),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () => context.go(Routes.account),
                    child: const UserAvatar(size: 40),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                name == null ? greeting(DateTime.now()) : '${greeting(DateTime.now())}, $name',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 6),
              if (business != null)
                Row(
                  children: [
                    const Icon(Icons.storefront_outlined, size: 18, color: AppColors.muted),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        [business.name, business.city].whereType<String>().join(', '),
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.muted, fontSize: 15),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    business.isVerified
                        ? const StatusPill(label: 'On Google', background: AppColors.successSoft, foreground: AppColors.success, dot: true)
                        : const StatusPill(label: 'Not connected', background: AppColors.amberSoft, foreground: Color(0xFF8A5A00), dot: true),
                  ],
                ),
              const SizedBox(height: AppSpacing.lg),
              stats.when(
                loading: () => const HomeSkeleton(),
                error: (_, _) => const EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load your numbers", body: 'Pull down to try again.'),
                data: (s) => _Dashboard(stats: s, verified: business?.isVerified ?? false),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Dashboard extends StatelessWidget {
  const _Dashboard({required this.stats, required this.verified});

  final DashboardStats stats;
  final bool verified;

  @override
  Widget build(BuildContext context) {
    final s = stats;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        verified ? const GoogleKpis() : PageKpis(stats: s),
        const SizedBox(height: AppSpacing.lg),
        _WeekHero(stats: s),
        const PushPromptCard(),
        if (verified) ...[const NeedsReply(), const ScorePeek()],
        PrivateMessagesPeek(unread: s.unreadFeedback),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'Customer actions'),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            _QuickAction(icon: Icons.qr_code_2_rounded, label: 'Share QR', onTap: () => context.go(Routes.getReviews)),
            const SizedBox(width: AppSpacing.gutter),
            _QuickAction(icon: Icons.send_rounded, label: 'Ask on\nWhatsApp', onTap: () => context.go(Routes.getReviews)),
            const SizedBox(width: AppSpacing.gutter),
            _QuickAction(icon: Icons.forum_outlined, label: 'Messages', onTap: () => context.go('${Routes.reviews}?tab=private')),
          ],
        ),
        const RecentActivity(),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'Reports'),
        const SizedBox(height: AppSpacing.sm),
        AppCard(
          padding: const EdgeInsets.all(18),
          onTap: () => Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const ReportScreen())),
          child: Row(
            children: [
              const IconTile(Icons.description_outlined),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${monthLabel(DateTime(DateTime.now().year, DateTime.now().month - 1))} report',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 2),
                    const Text('Views, calls, reviews and more â€” share as PDF', style: TextStyle(color: AppColors.muted, fontSize: 14)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
        if (!verified) ...[
          const SizedBox(height: AppSpacing.lg),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconTile(Icons.lock_outline_rounded),
                    SizedBox(width: AppSpacing.gutter),
                    Expanded(child: Text('Google reviews & insights', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17))),
                  ],
                ),
                const SizedBox(height: AppSpacing.gutter),
                const Text(
                  'Unlock your Google reviews, AI replies you approve, and calls, directions and search insights by connecting your Google Business Profile.',
                  style: TextStyle(color: AppColors.muted, fontSize: 15),
                ),
                const SizedBox(height: AppSpacing.md),
                GradientButton(label: 'Connect Google Profile', icon: Icons.link_rounded, onPressed: () => context.go(Routes.google)),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

const _wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/// The gradient hero: who reached Google this week + a 7-day visits chart.
class _WeekHero extends StatelessWidget {
  const _WeekHero({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final s = stats;
    const weekday = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final delta = s.google7d - s.googlePrev7d;

    return GradientCard(
      onTap: () => context.go('${Routes.reviews}?tab=visits'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('THIS WEEK', style: TextStyle(color: Colors.white.withValues(alpha: 0.82), fontWeight: FontWeight.w800, fontSize: 12.5, letterSpacing: 1)),
              const Spacer(),
              if (s.google7d > 0 || s.googlePrev7d > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(AppRadius.chip)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(delta >= 0 ? Icons.trending_up_rounded : Icons.trending_down_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                      Text(weekDelta(s.google7d, s.googlePrev7d), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12.5)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              CountUp(s.google7d, style: const TextStyle(color: Colors.white, fontSize: 52, fontWeight: FontWeight.w800, height: 1)),
              const SizedBox(width: 10),
              const Padding(
                padding: EdgeInsets.only(bottom: 6),
                child: Text('went to Google', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          HeroBars(
            height: 68,
            highlightLast: true,
            semanticLabel: 'Review page visits per day this week',
            labels: [for (final d in s.daily) weekday[d.day.weekday - 1]],
            points: [
              for (final d in s.daily)
                ChartPoint(
                  value: d.visits,
                  title: '${_wd[d.day.weekday - 1]} ${d.day.day} ${_mo[d.day.month - 1]}',
                  lines: ['${d.visits} review page visit${d.visits == 1 ? '' : 's'}', '${d.google} went to Google'],
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Divider(color: Colors.white.withValues(alpha: 0.22), height: 1),
          const SizedBox(height: AppSpacing.gutter),
          Row(
            children: [
              const Icon(Icons.visibility_outlined, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text('${s.visits7d} review page visits', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              const Spacer(),
              if (s.avgRating30d != null) ...[
                const Icon(Icons.star_rounded, color: AppColors.star, size: 18),
                const SizedBox(width: 4),
                Text(s.avgRating30d!.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
              ],
            ],
          ),
          if (s.visitsTotal == 0) ...[
            const SizedBox(height: AppSpacing.sm),
            Text('Share your QR code to start getting visits.', style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
          ],
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: AppCard(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        onTap: onTap,
        child: Column(
          children: [
            IconTile(icon, size: 48),
            const SizedBox(height: 10),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, height: 1.25)),
          ],
        ),
      ),
    );
  }
}
