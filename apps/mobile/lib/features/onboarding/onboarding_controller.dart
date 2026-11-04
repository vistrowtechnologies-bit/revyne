import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/google/google_sign_in_service.dart';
import '../../core/supabase/supabase_providers.dart';
import '../business/business.dart';
import '../business/business_repository.dart';
import '../gbp/gbp_repository.dart';
import 'options.dart';

enum OnboardingStep { connect, chooseLocation, preferences, done }

class OnboardingDraft {
  const OnboardingDraft({
    this.step = OnboardingStep.connect,
    this.busy = false,
    this.status,
    this.locations = const [],
    this.claiming,
    this.business,
    this.products = const [],
    this.replyTone = 'friendly',
    this.reviewLanguages = const ['en', 'hi'],
    this.error,
  });

  final OnboardingStep step;
  final bool busy;

  /// Last outcome from Google, used to explain why we can't continue yet.
  final ConnectStatus? status;
  final List<GbpLocationOption> locations;

  /// Location currently being claimed.
  final String? claiming;

  /// Created by gbp-connect once a location is claimed.
  final Business? business;
  final List<String> products;
  final String replyTone;
  final List<String> reviewLanguages;
  final String? error;

  OnboardingDraft copyWith({
    OnboardingStep? step,
    bool? busy,
    ConnectStatus? status,
    bool clearStatus = false,
    List<GbpLocationOption>? locations,
    String? claiming,
    bool clearClaiming = false,
    Business? business,
    List<String>? products,
    String? replyTone,
    List<String>? reviewLanguages,
    String? error,
    bool clearError = false,
  }) =>
      OnboardingDraft(
        step: step ?? this.step,
        busy: busy ?? this.busy,
        status: clearStatus ? null : (status ?? this.status),
        locations: locations ?? this.locations,
        claiming: clearClaiming ? null : (claiming ?? this.claiming),
        business: business ?? this.business,
        products: products ?? this.products,
        replyTone: replyTone ?? this.replyTone,
        reviewLanguages: reviewLanguages ?? this.reviewLanguages,
        error: clearError ? null : (error ?? this.error),
      );
}

class OnboardingController extends Notifier<OnboardingDraft> {
  @override
  OnboardingDraft build() {
    ref.watch(currentUserIdProvider); // fresh draft for each signed-in user
    return const OnboardingDraft();
  }

  GbpRepository get _gbp => ref.read(gbpRepositoryProvider);

  /// Opens Google's account picker + consent, then lists the owner's locations.
  Future<void> connect() => _run(_gbp.connect);

  /// Re-checks with the stored connection (e.g. after Google approves our access).
  Future<void> retry() => _run(_gbp.locations);

  Future<void> _run(Future<ConnectResult> Function() call) async {
    if (state.busy) return;
    state = state.copyWith(busy: true, clearError: true, clearStatus: true);
    try {
      _apply(await call());
    } on GoogleCancelled {
      state = state.copyWith(busy: false);
    } on GbpException catch (e) {
      state = state.copyWith(busy: false, error: e.message);
    } catch (_) {
      state = state.copyWith(busy: false, error: 'Could not connect to Google. Check your connection and try again.');
    }
  }

  void _apply(ConnectResult result) {
    if (result.status == ConnectStatus.alreadyHasBusiness) {
      // Owner already finished onboarding (e.g. on another device) — open the app.
      state = state.copyWith(busy: false);
      ref.invalidate(myBusinessProvider);
      return;
    }
    final hasLocations = result.status == ConnectStatus.ok && result.locations.isNotEmpty;
    state = state.copyWith(
      busy: false,
      status: result.status,
      locations: result.locations,
      step: hasLocations ? OnboardingStep.chooseLocation : OnboardingStep.connect,
    );
  }

  Future<void> claim(GbpLocationOption option) async {
    if (state.claiming != null || option.takenByOther) return;
    state = state.copyWith(claiming: option.location, clearError: true);
    try {
      final result = await _gbp.claim(option);
      switch (result.status) {
        case ConnectStatus.ok when result.business != null:
          final b = result.business!;
          state = state.copyWith(
            clearClaiming: true,
            business: b,
            products: b.products,
            replyTone: b.replyTone,
            reviewLanguages: b.reviewLanguages,
            step: OnboardingStep.preferences,
          );
        case ConnectStatus.alreadyHasBusiness:
          state = state.copyWith(clearClaiming: true);
          ref.invalidate(myBusinessProvider);
        case ConnectStatus.locationTaken:
          state = state.copyWith(clearClaiming: true, error: 'This business is already connected to another RevYne account.');
        case ConnectStatus.apiNotApproved || ConnectStatus.reconnect:
          state = state.copyWith(clearClaiming: true, status: result.status, step: OnboardingStep.connect);
        default:
          state = state.copyWith(clearClaiming: true, error: 'Google could not confirm you manage this business. Try reconnecting.');
      }
    } on GbpException catch (e) {
      state = state.copyWith(clearClaiming: true, error: e.message);
    } catch (_) {
      state = state.copyWith(clearClaiming: true, error: 'Could not connect this business. Please try again.');
    }
  }

  void goTo(OnboardingStep step) => state = state.copyWith(step: step, clearError: true);

  /// Adds a product/service; returns false if it's empty, a duplicate or over the limit.
  bool addProduct(String raw) {
    final value = raw.trim();
    if (value.isEmpty || value.length > 60 || state.products.length >= maxProducts) return false;
    if (state.products.any((p) => p.toLowerCase() == value.toLowerCase())) return false;
    state = state.copyWith(products: [...state.products, value]);
    return true;
  }

  void removeProduct(String value) => state = state.copyWith(products: state.products.where((p) => p != value).toList());

  void setTone(String tone) => state = state.copyWith(replyTone: tone);

  /// Toggles a review language, always keeping between 1 and [maxReviewLanguages].
  void toggleLanguage(String code) {
    final current = state.reviewLanguages;
    if (current.contains(code)) {
      if (current.length == 1) return;
      state = state.copyWith(reviewLanguages: current.where((c) => c != code).toList());
    } else if (current.length < maxReviewLanguages) {
      state = state.copyWith(reviewLanguages: [...current, code]);
    }
  }

  Future<void> savePreferences() async {
    final business = state.business;
    if (business == null || state.busy) return;
    state = state.copyWith(busy: true, clearError: true);
    try {
      final updated = await ref.read(businessRepositoryProvider).updatePreferences(
            business.id,
            products: state.products,
            reviewLanguages: state.reviewLanguages,
            replyTone: state.replyTone,
          );
      state = state.copyWith(busy: false, business: updated, step: OnboardingStep.done);
    } catch (_) {
      state = state.copyWith(busy: false, error: 'Could not save. Check your connection and try again.');
    }
  }
}

final onboardingControllerProvider = NotifierProvider<OnboardingController, OnboardingDraft>(OnboardingController.new);
