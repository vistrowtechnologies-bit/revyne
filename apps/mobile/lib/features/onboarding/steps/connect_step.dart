import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/ui.dart';
import '../../gbp/gbp_repository.dart';
import '../onboarding_controller.dart';

/// Step 1: connect the Google Business Profile — the only way in.
class ConnectStep extends ConsumerWidget {
  const ConnectStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(onboardingControllerProvider);
    final controller = ref.read(onboardingControllerProvider.notifier);

    const access = [
      (Icons.reviews_rounded, 'Read your Google reviews'),
      (Icons.reply_rounded, 'Post replies — only the ones you approve'),
      (Icons.photo_library_rounded, 'Publish posts, offers and photos you create'),
      (Icons.insights_rounded, 'Show calls, directions and searches insights'),
    ];

    final notice = switch (draft.status) {
      ConnectStatus.apiNotApproved => (
          Icons.hourglass_top_rounded,
          'Google is still reviewing RevYne',
          'Your account is connected. Google is reviewing RevYne\'s access to Business Profiles — '
              'once approved, tap "Check again" to finish setup.',
        ),
      ConnectStatus.ok => (
          Icons.search_off_rounded,
          'No Business Profile on this account',
          'This Google account doesn\'t manage any Business Profile. Connect the account that does.',
        ),
      ConnectStatus.missingScope => (
          Icons.lock_outline_rounded,
          'Permission needed',
          'RevYne needs permission to manage your Business Profile. Please connect again and allow access.',
        ),
      ConnectStatus.noRefreshToken => (
          Icons.refresh_rounded,
          'Reconnect needed',
          'Remove RevYne at myaccount.google.com/permissions, then connect again.',
        ),
      ConnectStatus.reconnect => (Icons.link_off_rounded, 'Please connect again', 'Your Google connection expired.'),
      _ => null,
    };

    return ListView(
      children: [
        Text('Connect your Google Business Profile', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        const Text(
          'Choose the Google account that manages your business on Google. It can be different from the one you signed in with.',
          style: TextStyle(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('RevYne will be able to:', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: AppSpacing.sm),
              for (final (icon, text) in access)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    children: [
                      Icon(icon, size: 20, color: AppColors.primary),
                      const SizedBox(width: AppSpacing.gutter),
                      Expanded(child: Text(text)),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.xs),
              const Text(
                'Nothing is changed on Google without your approval. You can disconnect anytime.',
                style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        if (notice != null) ...[
          const SizedBox(height: AppSpacing.md),
          AppCard(
            color: AppColors.warningContainer,
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(notice.$1, color: AppColors.onSurface),
                const SizedBox(width: AppSpacing.gutter),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(notice.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text(notice.$3, style: const TextStyle(fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        if (draft.error != null) ...[
          const SizedBox(height: AppSpacing.md),
          Text(draft.error!, style: const TextStyle(color: AppColors.error)),
        ],
        const SizedBox(height: AppSpacing.lg),
        GradientButton(
          label: draft.status == null ? 'Connect Google Business Profile' : 'Connect a different account',
          icon: Icons.storefront_rounded,
          busy: draft.busy,
          onPressed: controller.connect,
        ),
        if (draft.status == ConnectStatus.apiNotApproved) ...[
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton(onPressed: draft.busy ? null : controller.retry, child: const Text('Check again')),
        ],
      ],
    );
  }
}
