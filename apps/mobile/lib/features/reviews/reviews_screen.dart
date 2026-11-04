import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../get_reviews/review_link_card.dart';
import 'reviews_repository.dart';

/// Reviews tab: private feedback and review-page visits. Google reviews join
/// here once the Business Profile is connected (Phase 3).
class ReviewsScreen extends ConsumerWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(privateFeedbackProvider).value?.where((f) => f.isUnread).length ?? 0;

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Reviews'),
          bottom: TabBar(
            labelColor: AppColors.primary,
            indicatorColor: AppColors.primary,
            tabs: [
              Tab(text: unread > 0 ? 'Private feedback ($unread)' : 'Private feedback'),
              const Tab(text: 'Page visits'),
            ],
          ),
        ),
        body: const TabBarView(children: [_FeedbackList(), _VisitList()]),
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
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            if (items.isEmpty)
              const EmptyState(
                icon: Icons.mark_email_unread_outlined,
                title: 'No private feedback yet',
                body: 'Customers can message you privately from your review page. Only you see these.',
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

  Future<void> _markRead(WidgetRef ref) async {
    if (!feedback.isUnread) return;
    await ref.read(reviewsRepositoryProvider).markRead(feedback.id);
    ref.invalidate(privateFeedbackProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final f = feedback;
    final phone = f.contact?.replaceAll(RegExp(r'[^\d+]'), '') ?? '';
    final isPhone = phone.replaceAll('+', '').length >= 10;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
      child: AppCard(
        color: f.isUnread ? AppColors.surfaceContainerLow : null,
        padding: const EdgeInsets.all(AppSpacing.md),
        onTap: () => _markRead(ref),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (f.rating != null) Text(stars(f.rating!), style: const TextStyle(color: AppColors.googleStar, fontSize: 16)),
                const Spacer(),
                if (f.isUnread) const StatusPill(label: 'NEW', background: AppColors.primary, foreground: Colors.white),
                const SizedBox(width: AppSpacing.sm),
                Text(timeAgo(f.createdAt), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(f.message),
            if (f.contactName != null || f.contact != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                [f.contactName, f.contact].whereType<String>().join(' · '),
                style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
              ),
            ],
            if (isPhone) ...[
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: () => launchUrl(Uri.parse('tel:$phone')),
                    icon: const Icon(Icons.call_rounded, size: 18),
                    label: const Text('Call'),
                  ),
                  TextButton.icon(
                    onPressed: () => openWhatsApp('Hi${f.contactName == null ? '' : ' ${f.contactName}'}, thank you for your feedback.', phone: phone),
                    icon: const Icon(Icons.chat_rounded, size: 18),
                    label: const Text('WhatsApp'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
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
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            if (items.isEmpty)
              const EmptyState(
                icon: Icons.qr_code_2_rounded,
                title: 'No visits yet',
                body: 'When customers open your review link or QR code, their visits show up here.',
              ),
            for (final v in items)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
                child: AppCard(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (v.rating != null) Text(stars(v.rating!), style: const TextStyle(color: AppColors.googleStar, fontSize: 16)),
                          const Spacer(),
                          Text(timeAgo(v.createdAt), style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                        ],
                      ),
                      if (v.highlights.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(v.highlights.join(' · '), style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
                      ],
                      if (v.text != null && v.text!.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text('"${v.text}"', maxLines: 4, overflow: TextOverflow.ellipsis),
                      ],
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        v.openedGoogle ? 'Went to Google to post' : (v.copied ? 'Copied the review' : 'Did not finish'),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: v.openedGoogle ? AppColors.success : AppColors.onSurfaceVariant,
                        ),
                      ),
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
