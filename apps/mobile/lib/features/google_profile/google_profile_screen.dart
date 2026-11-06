import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../core/google/google_sign_in_service.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import '../gbp/gbp_repository.dart';
import '../google_reviews/google_reviews_repository.dart';
import '../google_content/content_repository.dart';
import '../google_content/content_sections.dart';
import '../insights/insights_repository.dart';
import '../insights/insights_screen.dart';
import 'profile_panel.dart';
import 'profile_repository.dart';

/// Google tab. Until Google approves RevYne's Business Profile API access this
/// shows what connecting unlocks; afterwards it becomes reviews, posts and insights.
class GoogleProfileScreen extends ConsumerStatefulWidget {
  const GoogleProfileScreen({super.key});

  @override
  ConsumerState<GoogleProfileScreen> createState() => _GoogleProfileScreenState();
}

class _GoogleProfileScreenState extends ConsumerState<GoogleProfileScreen> {
  bool _busy = false;

  /// Uses the stored Google connection when there is one (no second consent),
  /// otherwise runs the Google consent flow; then the owner picks a profile.
  Future<void> _connect() async {
    setState(() => _busy = true);
    String message;
    try {
      final repo = ref.read(gbpRepositoryProvider);
      var result = await repo.locations();
      if (result.status != ConnectStatus.ok || result.locations.isEmpty) result = await repo.connect();
      message = switch (result.status) {
        ConnectStatus.apiNotApproved =>
          'Your Google account is linked. Google is still reviewing RevYne — we\'ll finish setup once approved.',
        ConnectStatus.missingScope => 'Please allow RevYne to manage your Business Profile and try again.',
        ConnectStatus.ok when result.locations.isEmpty =>
          'This Google account doesn\'t manage a Business Profile. Try the account that does.',
        ConnectStatus.ok => await _pickAndLink(result.locations),
        _ => 'Could not connect right now. Please try again.',
      };
    } on GoogleCancelled {
      message = '';
    } on GbpException catch (e) {
      message = e.message;
    } catch (_) {
      message = 'Could not connect right now. Please try again.';
    }
    if (!mounted) return;
    setState(() => _busy = false);
    if (message.isNotEmpty) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  /// Shows the owner's Google profiles; links the chosen one. Returns the
  /// message to show ('' when the owner closed the sheet).
  Future<String> _pickAndLink(List<GbpLocationOption> locations) async {
    if (!mounted) return '';
    final choice = await showModalBottomSheet<GbpLocationOption>(
      context: context,
      useRootNavigator: true, // above the bottom bar, not inside the tab
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => LocationPickerSheet(locations: locations),
    );
    if (choice == null) return '';
    final result = await ref.read(gbpRepositoryProvider).claim(choice);
    switch (result.status) {
      case ConnectStatus.ok:
        ref.invalidate(myBusinessProvider);
        return '${choice.title} is now linked to RevYne.';
      case ConnectStatus.locationTaken:
        return 'This profile is already linked to another RevYne account.';
      case ConnectStatus.alreadyHasBusiness:
        return 'Your RevYne account is already linked to a Google profile.';
      case ConnectStatus.notFound:
        return 'Google no longer lists this profile for your account.';
      default:
        return 'Could not link right now. Please try again.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final business = ref.watch(myBusinessProvider).value;
    final verified = business?.isVerified ?? false;

    const unlocks = [
      (
        Icons.reviews_outlined,
        'Google reviews & AI replies',
        'Every review in one inbox. AI drafts a warm reply in your tone — it is posted only after you approve it.',
      ),
      (
        Icons.add_photo_alternate_outlined,
        'Posts & photos',
        'Share offers, festival updates and fresh photos to your Google profile from your phone.',
      ),
      (
        Icons.insights_outlined,
        'Calls, directions & searches',
        'See how many people called you, asked for directions or found you on Google each week.',
      ),
    ];

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(gbpProfileProvider);
            ref.invalidate(googleReviewsProvider);
            ref.invalidate(gbpPostsProvider);
            ref.invalidate(gbpPhotosProvider);
            ref.invalidate(scheduledPostsProvider);
            ref.invalidate(insightsProvider(last28Days));
            try {
              await ref.read(gbpProfileProvider.future);
            } catch (_) {
              // The panel shows the error itself.
            }
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
            children: [
              Text('Google Profile', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.lg),
              GradientCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.storefront_rounded, color: Colors.white),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(AppRadius.chip),
                          ),
                          child: Text(
                            verified ? 'Connected' : 'Not connected',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12.5),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      verified ? business!.name : 'Connect your Google Business Profile',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, height: 1.25),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      verified
                          ? [if (business!.city != null) business.city!, 'Linked to your Google Business Profile'].join(' · ')
                          : 'Use the Google account that manages your business on Google Maps.',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 15),
                    ),
                    if (!verified) ...[
                      const SizedBox(height: AppSpacing.md),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.violet),
                          onPressed: _busy ? null : _connect,
                          icon: _busy
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.link_rounded),
                          label: const Text('Connect Google Profile'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (verified) ...[
                const SizedBox(height: AppSpacing.lg),
                const SizedBox(height: AppSpacing.sm),
                const SectionHeader(title: 'Google stats'),
                const SizedBox(height: AppSpacing.sm),
                const InsightsCard(),
                const SizedBox(height: AppSpacing.lg),
                const GoogleProfilePanel(),
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'Google reviews'),
                const SizedBox(height: AppSpacing.sm),
                const _ReviewsShortcut(),
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'Posts'),
                const SizedBox(height: AppSpacing.sm),
                const PostsSection(),
                const SizedBox(height: AppSpacing.md),
                const SectionHeader(title: 'Photos'),
                const SizedBox(height: AppSpacing.sm),
                const PhotosSection(),
              ],
              if (!verified) ...[
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'What you unlock'),
                const SizedBox(height: AppSpacing.sm),
              ],
              for (final (icon, title, body) in verified ? const <(IconData, String, String)>[] : unlocks)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
                  child: AppCard(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        IconTile(icon),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text(body, style: const TextStyle(color: AppColors.muted, fontSize: 14.5)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Rating, review count and replies waiting, with a way into the inbox.
class _ReviewsShortcut extends ConsumerWidget {
  const _ReviewsShortcut();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(googleReviewsProvider);
    final value = page.value;
    final waiting = value?.reviews.where((r) => r.needsReply).length ?? 0;
    return AppCard(
      padding: const EdgeInsets.all(18),
      onTap: () => context.go(Routes.reviews),
      child: Row(
        children: [
          const IconTile(Icons.star_rounded),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value == null
                      ? (page.hasError ? 'Open your reviews inbox' : 'Loading reviews…')
                      : value.totalCount == 0
                      ? 'No Google reviews yet'
                      : '${value.averageRating?.toStringAsFixed(1) ?? '–'} ★ · ${value.totalCount} review${value.totalCount == 1 ? '' : 's'}',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
                const SizedBox(height: 2),
                Text(
                  value == null || value.totalCount == 0
                      ? 'Read and reply to Google reviews'
                      : (waiting > 0 ? '$waiting waiting for your reply' : 'All replied — nice work'),
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

/// Bottom sheet listing the Business Profiles the Google account manages.
class LocationPickerSheet extends StatelessWidget {
  const LocationPickerSheet({super.key, required this.locations});

  final List<GbpLocationOption> locations;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.75),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 4),
              child: Text('Choose your business', style: Theme.of(context).textTheme.headlineSmall),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Text(
                'Google profiles this account manages. RevYne links one business per account.',
                style: TextStyle(color: AppColors.muted, fontSize: 14.5),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.md),
                itemCount: locations.length,
                separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.gutter),
                itemBuilder: (context, i) {
                  final l = locations[i];
                  return AppCard(
                    padding: EdgeInsets.zero,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(AppRadius.card),
                      onTap: l.takenByOther ? null : () => Navigator.of(context).pop(l),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const IconTile(Icons.storefront_rounded),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    l.title.isEmpty ? 'Unnamed business' : l.title,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                  ),
                                  if (l.city != null || l.takenByOther) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      l.takenByOther ? 'Linked to another RevYne account' : l.city!,
                                      style: TextStyle(color: l.takenByOther ? AppColors.danger : AppColors.muted, fontSize: 14),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            if (!l.takenByOther) const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
