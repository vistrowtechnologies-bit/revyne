import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import 'google_reviews_repository.dart';
import 'reply_sheet.dart';
import '../../core/widgets/skeleton.dart';

/// Google reviews inbox: rating summary, All / Needs reply filter, review cards.
class GoogleReviewsInbox extends ConsumerStatefulWidget {
  const GoogleReviewsInbox({super.key});

  @override
  ConsumerState<GoogleReviewsInbox> createState() => _GoogleReviewsInboxState();
}

class _GoogleReviewsInboxState extends ConsumerState<GoogleReviewsInbox> {
  bool _needsReplyOnly = false;
  final List<GoogleReview> _more = [];
  String? _nextToken;
  bool _loadingMore = false;
  GoogleReviewsPage? _seenFirst;

  Future<void> _refresh() async {
    _more.clear();
    _nextToken = null;
    _seenFirst = null;
    ref.invalidate(googleReviewsProvider);
    await ref.read(googleReviewsProvider.future).catchError((_) => const GoogleReviewsPage(reviews: []));
  }

  Future<void> _loadMore() async {
    if (_nextToken == null || _loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      final page = await ref.read(googleReviewsRepositoryProvider).list(pageToken: _nextToken);
      setState(() {
        _more.addAll(page.reviews);
        _nextToken = page.nextPageToken;
      });
    } on GoogleReviewsException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _open(GoogleReview review) async {
    final changed = await ReplySheet.show(context, review);
    if (changed == true) await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(googleReviewsProvider);
    return RefreshIndicator(
      onRefresh: _refresh,
      child: async.when(
        loading: () => ListView(padding: const EdgeInsets.all(AppSpacing.md), children: const [ListSkeleton(rows: 4, label: 'Loading Google reviews')]),
        error: (e, _) => _Blocked(error: e),
        data: (first) {
          if (!identical(first, _seenFirst)) {
            // A fresh first page (refresh or re-link): restart paging from it.
            _seenFirst = first;
            _more.clear();
            _nextToken = first.nextPageToken;
          }
          final all = [...first.reviews, ..._more];
          final waiting = all.where((r) => r.needsReply).length;
          final shown = _needsReplyOnly ? all.where((r) => r.needsReply).toList() : all;

          return ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 120),
            children: [
              if (all.isNotEmpty) ...[
                GoogleRatingSummary(page: first, waiting: waiting),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    SelectChip(label: 'All', selected: !_needsReplyOnly, onTap: () => setState(() => _needsReplyOnly = false)),
                    const SizedBox(width: AppSpacing.sm),
                    SelectChip(
                      label: waiting > 0 ? 'Needs reply · $waiting' : 'Needs reply',
                      selected: _needsReplyOnly,
                      onTap: () => setState(() => _needsReplyOnly = true),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.gutter),
              ],
              if (shown.isEmpty)
                EmptyState(
                  icon: _needsReplyOnly ? Icons.task_alt_rounded : Icons.reviews_outlined,
                  title: _needsReplyOnly ? 'All caught up' : 'No Google reviews yet',
                  body: _needsReplyOnly
                      ? 'You have replied to every review loaded here.'
                      : 'Share your QR poster or WhatsApp link — new reviews will show up here.',
                ),
              for (final r in shown) GoogleReviewCard(review: r, onTap: () => _open(r)),
              if (_nextToken != null) ...[
                const SizedBox(height: AppSpacing.sm),
                OutlinedButton(
                  onPressed: _loadingMore ? null : _loadMore,
                  child: Text(_loadingMore ? 'Loading…' : 'Load older reviews'),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

/// Average rating, total count and how many reviews wait for a reply.
class GoogleRatingSummary extends StatelessWidget {
  const GoogleRatingSummary({super.key, required this.page, required this.waiting});

  final GoogleReviewsPage page;
  final int waiting;

  @override
  Widget build(BuildContext context) {
    final avg = page.averageRating;
    return GradientCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Text(avg == null ? '–' : avg.toStringAsFixed(1),
              style: const TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.w800, height: 1)),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  for (var i = 1; i <= 5; i++)
                    Icon(
                      avg != null && i <= avg.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: AppColors.star,
                      size: 20,
                    ),
                ]),
                const SizedBox(height: 4),
                Text('${page.totalCount} Google review${page.totalCount == 1 ? '' : 's'}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
              ],
            ),
          ),
          if (waiting > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(14)),
              child: Column(children: [
                Text('$waiting', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                const Text('to reply', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
              ]),
            ),
        ],
      ),
    );
  }
}

class GoogleReviewCard extends StatelessWidget {
  const GoogleReviewCard({super.key, required this.review, required this.onTap});

  final GoogleReview review;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final r = review;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
      child: AppCard(
        padding: const EdgeInsets.all(18),
        borderColor: r.needsReply ? AppColors.violet200 : null,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                InitialsAvatar(r.reviewer),
                const SizedBox(width: AppSpacing.gutter),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.reviewer ?? 'Google user', maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text(timeAgo(r.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                    ],
                  ),
                ),
                if (r.rating > 0) Stars(r.rating, size: 17),
              ],
            ),
            if (r.displayComment.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.gutter),
              Text(r.displayComment, maxLines: 5, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15.5, height: 1.5)),
            ],
            const SizedBox(height: AppSpacing.gutter),
            if (r.needsReply)
              Row(children: [
                StatusPill(label: 'Needs reply', background: AppColors.violet50, foreground: AppColors.violet700, dot: true),
                Spacer(),
                Icon(Icons.auto_awesome_rounded, size: 18, color: AppColors.violet),
                SizedBox(width: 4),
                Text('Reply', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800)),
              ])
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.violet50, borderRadius: BorderRadius.circular(14)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('YOUR REPLY', style: TextStyle(color: AppColors.violet700, fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 0.6)),
                    const SizedBox(height: 4),
                    Text(r.reply!, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14.5, color: AppColors.ink)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Blocked extends StatelessWidget {
  const _Blocked({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    final e = error is GoogleReviewsException ? error as GoogleReviewsException : null;
    final (icon, title, body) = switch (e?.block) {
      ReviewsBlock.notLinked => (
          Icons.lock_outline_rounded,
          'Connect Google to see your reviews',
          'Read every Google review here and reply with AI drafts — nothing is posted until you approve it.',
        ),
      ReviewsBlock.reconnect => (Icons.link_off_rounded, 'Reconnect Google', 'Google access for your profile expired. Connect again to keep replying.'),
      ReviewsBlock.apiNotApproved => (Icons.hourglass_top_rounded, 'Reviews are on the way', '${e!.message} Your profile stays linked.'),
      null => (Icons.cloud_off_rounded, "Couldn't load reviews", e?.message ?? 'Pull down to try again.'),
    };
    final connect = e?.block == ReviewsBlock.notLinked || e?.block == ReviewsBlock.reconnect;
    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
      children: [
        EmptyState(icon: icon, title: title, body: body),
        if (connect) ...[
          const SizedBox(height: AppSpacing.md),
          GradientButton(label: 'Connect Google Profile', icon: Icons.link_rounded, onPressed: () => context.go(Routes.google)),
        ],
      ],
    );
  }
}
