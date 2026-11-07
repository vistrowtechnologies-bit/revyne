import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import '../get_reviews/review_link_card.dart';
import '../google_reviews/google_reviews_inbox.dart';
import '../google_reviews/google_reviews_repository.dart';
import '../home/dashboard.dart';
import 'reviews_repository.dart';

enum _Tab { google, private, visits }

/// Reviews: Google reviews (after connecting), private messages, page visits.
class ReviewsScreen extends ConsumerStatefulWidget {
  const ReviewsScreen({super.key});

  @override
  ConsumerState<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends ConsumerState<ReviewsScreen> {
  _Tab? _picked; // null → Google when linked, otherwise Private
  String? _linkedTab; // ?tab= from a notification, applied once per link

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // A "new private message" alert opens /reviews?tab=private.
    final tab = GoRouterState.of(context).uri.queryParameters['tab'];
    if (tab != null && tab != _linkedTab) {
      _linkedTab = tab;
      if (tab == 'private') _picked = _Tab.private;
      if (tab == 'google') _picked = _Tab.google;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(privateFeedbackProvider).value?.where((f) => f.isUnread).length ?? 0;
    final linked = ref.watch(myBusinessProvider).value?.isVerified ?? false;
    final waiting = linked ? ref.watch(googleReviewsProvider).value?.reviews.where((r) => r.needsReply).length : null;
    final tab = _picked ?? (linked ? _Tab.google : _Tab.private);

    Widget segment(_Tab t, IconData icon, String label, {int? badge}) {
      final selected = t == tab;
      return Expanded(
        child: GestureDetector(
          onTap: () => setState(() => _picked = t),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(vertical: 11),
            decoration: BoxDecoration(
              color: selected ? Colors.white : Colors.transparent,
              borderRadius: BorderRadius.circular(AppRadius.chip),
              boxShadow: selected ? AppShadows.card : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 17, color: selected ? AppColors.violet : AppColors.muted),
                const SizedBox(width: 6),
                Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: selected ? AppColors.violet : AppColors.muted)),
                if (badge != null && badge > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                    decoration: BoxDecoration(color: AppColors.violet, borderRadius: BorderRadius.circular(AppRadius.chip)),
                    child: Text('$badge', style: const TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.w800)),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.md),
              child: Text('Reviews', style: Theme.of(context).textTheme.headlineMedium),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: AppColors.violet100, borderRadius: BorderRadius.circular(AppRadius.chip)),
                child: Row(
                  children: [
                    segment(_Tab.google, linked ? Icons.star_rounded : Icons.lock_outline_rounded, 'Google', badge: waiting),
                    segment(_Tab.private, Icons.forum_outlined, 'Private', badge: unread),
                    segment(_Tab.visits, Icons.visibility_outlined, 'Visits'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Expanded(
              child: switch (tab) {
                _Tab.google => const GoogleReviewsInbox(),
                _Tab.private => const _FeedbackList(),
                _Tab.visits => const _VisitList(),
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedbackList extends ConsumerWidget {
  const _FeedbackList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedback = ref.watch(privateFeedbackProvider);
    return RefreshIndicator(
      onRefresh: () => ref.refresh(privateFeedbackProvider.future),
      child: feedback.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const _LoadError(),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 120),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(4, 4, 4, AppSpacing.gutter),
              child: Text(
                'Messages customers chose to send only to you from your review page.',
                style: TextStyle(color: AppColors.muted, fontSize: 14),
              ),
            ),
            if (items.isEmpty)
              const EmptyState(
                icon: Icons.mark_email_unread_outlined,
                title: 'No private messages yet',
                body: 'Every customer can message you privately from your review page. Only you see these.',
              ),
            for (final f in items) _FeedbackCard(feedback: f),
          ],
        ),
      ),
    );
  }
}

class _FeedbackCard extends ConsumerWidget {
  const _FeedbackCard({required this.feedback});

  final PrivateFeedback feedback;

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Delete this message?'),
            content: const Text('It will be removed for good. This can\'t be undone.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;
    if (!ok) return;
    try {
      await ref.read(reviewsRepositoryProvider).deleteFeedback(feedback.id);
      ref.invalidate(privateFeedbackProvider);
      ref.invalidate(dashboardStatsProvider);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not delete right now. Please try again.')));
      }
    }
  }

  Future<void> _markRead(WidgetRef ref) async {
    if (!feedback.isUnread) return;
    await ref.read(reviewsRepositoryProvider).markRead(feedback.id);
    ref.invalidate(privateFeedbackProvider);
    ref.invalidate(dashboardStatsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final f = feedback;
    final phone = f.contact?.replaceAll(RegExp(r'[^\d+]'), '') ?? '';
    final isPhone = phone.replaceAll('+', '').length >= 10;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
      child: AppCard(
        padding: const EdgeInsets.all(18),
        borderColor: f.isUnread ? AppColors.violet200 : null,
        onTap: () => _markRead(ref),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                InitialsAvatar(f.contactName),
                const SizedBox(width: AppSpacing.gutter),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(f.contactName ?? 'Customer', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text(timeAgo(f.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                    ],
                  ),
                ),
                if (f.rating != null) Stars(f.rating!, size: 17),
                if (f.isUnread) ...[
                  const SizedBox(width: 8),
                  Container(width: 9, height: 9, decoration: BoxDecoration(color: AppColors.magenta, shape: BoxShape.circle)),
                ],
                SizedBox(
                  width: 36,
                  height: 36,
                  child: IconButton(
                    tooltip: 'Delete message',
                    padding: EdgeInsets.zero,
                    onPressed: () => _delete(context, ref),
                    icon: const Icon(Icons.delete_outline_rounded, size: 20, color: AppColors.muted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.gutter),
            Text('"${f.message}"', style: const TextStyle(fontSize: 15.5, height: 1.5)),
            if (isPhone) ...[
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  _PillAction(
                    icon: Icons.chat_outlined,
                    label: 'Reply on WhatsApp',
                    onTap: () => openWhatsApp('Hi${f.contactName == null ? '' : ' ${f.contactName}'}, thank you for your feedback.', phone: phone),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _PillAction(icon: Icons.call_outlined, label: 'Call', onTap: () => launchUrl(Uri.parse('tel:$phone'))),
                ],
              ),
            ] else if (f.contact != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(f.contact!, style: const TextStyle(color: AppColors.muted, fontSize: 13.5)),
            ],
          ],
        ),
      ),
    );
  }
}

class _PillAction extends StatelessWidget {
  const _PillAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.violet50,
        borderRadius: BorderRadius.circular(AppRadius.chip),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.chip),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: AppColors.violet),
                const SizedBox(width: 6),
                Text(label, style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
      );
}

class _VisitList extends ConsumerWidget {
  const _VisitList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visits = ref.watch(reviewVisitsProvider);
    return RefreshIndicator(
      onRefresh: () => ref.refresh(reviewVisitsProvider.future),
      child: visits.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const _LoadError(),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 120),
          children: [
            if (items.isEmpty)
              const EmptyState(
                icon: Icons.qr_code_2_rounded,
                title: 'No visits yet',
                body: 'When customers open your review link or scan your QR code, their visits show up here.',
              ),
            for (final v in items)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
                child: AppCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (v.rating != null) Stars(v.rating!, size: 18) else const Text('No rating', style: TextStyle(color: AppColors.muted)),
                          const Spacer(),
                          Text(timeAgo(v.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                        ],
                      ),
                      if (v.highlights.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            for (final h in v.highlights)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: AppColors.violet50, borderRadius: BorderRadius.circular(AppRadius.chip)),
                                child: Text(h, style: TextStyle(color: AppColors.violet700, fontSize: 12.5, fontWeight: FontWeight.w700)),
                              ),
                          ],
                        ),
                      ],
                      if (v.text != null && v.text!.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.gutter),
                        Text('"${v.text}"', maxLines: 4, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, height: 1.5)),
                      ],
                      const SizedBox(height: AppSpacing.gutter),
                      v.openedGoogle
                          ? const StatusPill(label: 'Went to Google', background: AppColors.successSoft, foreground: AppColors.success, dot: true)
                          : v.copied
                              ? StatusPill(label: 'Copied the review', background: AppColors.violet50, foreground: AppColors.violet700)
                              : StatusPill(label: 'Did not finish', background: AppColors.violet50, foreground: AppColors.muted),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError();

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load", body: 'Pull down to try again.'),
        ],
      );
}
