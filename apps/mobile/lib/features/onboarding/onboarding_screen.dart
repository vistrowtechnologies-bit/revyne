import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../auth/auth_repository.dart';

/// Onboarding entry. Steps (language → find business via Places → confirm →
/// products & tone → QR ready) are built next in Phase 1.
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Set up your business'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          StepDots(count: 4, current: 1),
          SizedBox(height: AppSpacing.lg),
          EmptyState(
            icon: Icons.search_rounded,
            title: 'Find your business on Google',
            body: 'Search for your business and we will fill in your name, address, category and review link.',
          ),
        ],
      ),
    );
  }
}
