import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/supabase/supabase_providers.dart';
import '../core/theme/tokens.dart';
import '../features/account/account_screen.dart';
import '../features/auth/sign_in_screen.dart';
import '../features/business/business_repository.dart';
import '../features/get_reviews/get_reviews_screen.dart';
import '../features/google_profile/google_profile_screen.dart';
import '../features/home/home_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/reviews/reviews_screen.dart';
import '../features/shell/home_shell.dart';

class Routes {
  static const signIn = '/sign-in';
  static const loading = '/loading';
  static const loadError = '/load-error';
  static const onboarding = '/onboarding';
  static const home = '/home';
  static const reviews = '/reviews';
  static const getReviews = '/get-reviews';
  static const google = '/google';
  static const account = '/account';
}

/// Gate: signed out → sign-in; business unknown → loading/error;
/// no business → onboarding; otherwise the 5-tab app.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(currentUserIdProvider, (_, _) => refresh.value++);
  ref.listen(myBusinessProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  const gateRoutes = {Routes.signIn, Routes.loading, Routes.loadError, Routes.onboarding};

  return GoRouter(
    initialLocation: Routes.home,
    refreshListenable: refresh,
    redirect: (context, state) {
      final location = state.matchedLocation;
      String? goTo(String target) => location == target ? null : target;

      if (ref.read(currentUserIdProvider) == null) return goTo(Routes.signIn);

      final business = ref.read(myBusinessProvider);
      if (!business.hasValue) {
        return business.hasError ? goTo(Routes.loadError) : goTo(Routes.loading);
      }
      if (business.value == null) return goTo(Routes.onboarding);
      return gateRoutes.contains(location) ? Routes.home : null;
    },
    routes: [
      GoRoute(path: Routes.signIn, builder: (_, _) => const SignInScreen()),
      GoRoute(path: Routes.loading, builder: (_, _) => const _LoadingScreen()),
      GoRoute(path: Routes.loadError, builder: (_, _) => const _LoadErrorScreen()),
      GoRoute(path: Routes.onboarding, builder: (_, _) => const OnboardingScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, _, navigationShell) => HomeShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: Routes.home, builder: (_, _) => const HomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: Routes.reviews, builder: (_, _) => const ReviewsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: Routes.getReviews, builder: (_, _) => const GetReviewsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: Routes.google, builder: (_, _) => const GoogleProfileScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: Routes.account, builder: (_, _) => const AccountScreen())]),
        ],
      ),
    ],
  );
});

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  /// Continues the Android splash (theme gradient + logo) while the account loads.
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Container(
          decoration: BoxDecoration(gradient: AppColors.brandGradient),
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: Image.asset('assets/brand/logo.png', width: 104, height: 104),
              ),
              const SizedBox(height: AppSpacing.md),
              const Text('RevYne', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
              const SizedBox(height: AppSpacing.xl),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
              ),
            ],
          ),
        ),
      );
}

/// Shown when the business can't be loaded (e.g. offline) — never falls
/// through to onboarding, which would create a duplicate business.
class _LoadErrorScreen extends ConsumerWidget {
  const _LoadErrorScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.outline),
              const SizedBox(height: AppSpacing.md),
              const Text("Couldn't load your account", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'Check your internet connection and try again.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton(onPressed: () => ref.invalidate(myBusinessProvider), child: const Text('Try again')),
            ],
          ),
        ),
      ),
    );
  }
}
