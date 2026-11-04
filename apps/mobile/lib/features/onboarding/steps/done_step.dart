import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../business/business_repository.dart';
import '../../get_reviews/review_link_card.dart';
import '../onboarding_controller.dart';

/// Step 4: connected and saved — show the QR/link, then open the app.
class DoneStep extends ConsumerWidget {
  const DoneStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(onboardingControllerProvider).business!;

    return ListView(
      children: [
        const Icon(Icons.celebration_rounded, size: 40, color: AppColors.primary),
        const SizedBox(height: AppSpacing.sm),
        Text('${business.name} is connected!', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        const Text(
          'Customers scan this QR code to share their experience and post it on Google themselves.',
          style: TextStyle(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.md),
        ReviewLinkCard(business: business),
        const SizedBox(height: AppSpacing.lg),
        FilledButton(
          // The business already exists; refreshing it lets the router open the app.
          onPressed: () => ref.invalidate(myBusinessProvider),
          child: const Text('Go to my dashboard'),
        ),
      ],
    );
  }
}
