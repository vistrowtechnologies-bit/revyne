import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/ui.dart';
import '../onboarding_controller.dart';
import '../options.dart';

/// Step 3: products/services, reply tone and the customer review languages.
class PreferencesStep extends ConsumerStatefulWidget {
  const PreferencesStep({super.key});

  @override
  ConsumerState<PreferencesStep> createState() => _PreferencesStepState();
}

class _PreferencesStepState extends ConsumerState<PreferencesStep> {
  final _product = TextEditingController();

  @override
  void dispose() {
    _product.dispose();
    super.dispose();
  }

  void _addProduct() {
    if (ref.read(onboardingControllerProvider.notifier).addProduct(_product.text)) _product.clear();
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(onboardingControllerProvider);
    final controller = ref.read(onboardingControllerProvider.notifier);
    final atLimit = draft.products.length >= maxProducts;

    return ListView(
      children: [
        Text('What do customers come to you for?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        const Text(
          'Customers can tap these when writing their review, so it reflects their real visit.',
          style: TextStyle(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _product,
          enabled: !atLimit,
          textCapitalization: TextCapitalization.sentences,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _addProduct(),
          decoration: InputDecoration(
            hintText: atLimit ? 'Limit of $maxProducts reached' : 'e.g. Kaju katli, Haircut, Eye test',
            suffixIcon: IconButton(onPressed: atLimit ? null : _addProduct, icon: const Icon(Icons.add_rounded)),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final p in draft.products)
              InputChip(
                label: Text(p),
                onDeleted: () => controller.removeProduct(p),
                backgroundColor: AppColors.primarySoft,
                side: BorderSide.none,
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'How should replies sound?'),
        const SizedBox(height: AppSpacing.sm),
        for (final (value, label, example) in replyToneOptions)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: AppCard(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.gutter),
              color: draft.replyTone == value ? AppColors.primarySoft : null,
              onTap: () => controller.setTone(value),
              child: Row(
                children: [
                  Icon(
                    draft.replyTone == value ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: AppSpacing.gutter),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
                        Text('"$example"', style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: AppSpacing.md),
        const SectionHeader(title: 'Review languages for customers'),
        Text(
          '${draft.reviewLanguages.length} selected (up to $maxReviewLanguages)',
          style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final (code, label) in reviewLanguageOptions)
              SelectChip(
                label: label,
                selected: draft.reviewLanguages.contains(code),
                onTap: () => controller.toggleLanguage(code),
              ),
          ],
        ),
        if (draft.error != null) ...[
          const SizedBox(height: AppSpacing.md),
          Text(draft.error!, style: const TextStyle(color: AppColors.error)),
        ],
        const SizedBox(height: AppSpacing.lg),
        FilledButton(
          onPressed: draft.busy ? null : controller.savePreferences,
          child: draft.busy
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Save and finish'),
        ),
      ],
    );
  }
}
