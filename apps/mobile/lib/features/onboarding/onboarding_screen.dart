import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../auth/auth_repository.dart';
import 'onboarding_controller.dart';
import 'steps/choose_location_step.dart';
import 'steps/connect_step.dart';
import 'steps/done_step.dart';
import 'steps/preferences_step.dart';

/// Connect-only onboarding: connect Google Business Profile → choose
/// location → products, tone and review languages → QR ready.
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final step = ref.watch(onboardingControllerProvider.select((d) => d.step));
    final controller = ref.read(onboardingControllerProvider.notifier);
    final previous = switch (step) {
      OnboardingStep.chooseLocation => OnboardingStep.connect,
      _ => null,
    };

    return PopScope(
      canPop: previous == null,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && previous != null) controller.goTo(previous);
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Set up your business'),
          leading: previous != null
              ? IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => controller.goTo(previous))
              : null,
          actions: [
            if (step != OnboardingStep.done)
              IconButton(
                tooltip: 'Sign out',
                onPressed: () => ref.read(authRepositoryProvider).signOut(),
                icon: const Icon(Icons.logout_rounded),
              ),
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                StepDots(count: OnboardingStep.values.length, current: step.index + 1),
                const SizedBox(height: AppSpacing.lg),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: KeyedSubtree(
                      key: ValueKey(step),
                      child: switch (step) {
                        OnboardingStep.connect => const ConnectStep(),
                        OnboardingStep.chooseLocation => const ChooseLocationStep(),
                        OnboardingStep.preferences => const PreferencesStep(),
                        OnboardingStep.done => const DoneStep(),
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
