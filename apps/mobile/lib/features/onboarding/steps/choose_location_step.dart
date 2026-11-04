import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../onboarding_controller.dart';

/// Step 2: pick which of the owner's Google locations to use.
class ChooseLocationStep extends ConsumerWidget {
  const ChooseLocationStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(onboardingControllerProvider);
    final controller = ref.read(onboardingControllerProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Choose your business', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        const Text('These are the Business Profiles your Google account manages.', style: TextStyle(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: AppSpacing.md),
        Expanded(
          child: ListView(
            children: [
              for (final l in draft.locations)
                Card(
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: ListTile(
                    enabled: !l.takenByOther && draft.claiming == null,
                    leading: const Icon(Icons.storefront_rounded, color: AppColors.primary),
                    title: Text(l.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(l.takenByOther ? 'Already connected to another RevYne account' : (l.city ?? '')),
                    trailing: draft.claiming == l.location
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.chevron_right_rounded),
                    onTap: () => controller.claim(l),
                  ),
                ),
            ],
          ),
        ),
        if (draft.error != null) ...[
          Text(draft.error!, style: const TextStyle(color: AppColors.error)),
          const SizedBox(height: AppSpacing.sm),
        ],
        TextButton(onPressed: () => controller.goTo(OnboardingStep.connect), child: const Text('Use a different Google account')),
      ],
    );
  }
}
