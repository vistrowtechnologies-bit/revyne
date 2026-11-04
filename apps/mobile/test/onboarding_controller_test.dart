import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/google/google_sign_in_service.dart';
import 'package:revyne_app/core/supabase/supabase_providers.dart';
import 'package:revyne_app/features/business/business.dart';
import 'package:revyne_app/features/business/business_repository.dart';
import 'package:revyne_app/features/gbp/gbp_repository.dart';
import 'package:revyne_app/features/onboarding/onboarding_controller.dart';
import 'package:revyne_app/features/onboarding/options.dart';

Business business({List<String> products = const []}) => Business.fromJson({
      'id': 'b1',
      'owner_id': 'user-1',
      'name': 'Sharma Sweets',
      'public_slug': 'abc123def456',
      'gbp_location': 'locations/1',
      'verified_at': '2026-11-04T10:00:00Z',
      'products': products,
    });

const shop = GbpLocationOption(account: 'accounts/9', location: 'locations/1', title: 'Sharma Sweets', city: 'Mumbai');
const taken = GbpLocationOption(account: 'accounts/9', location: 'locations/2', title: 'Branch', takenByOther: true);

class FakeGbp implements GbpRepository {
  ConnectResult next = const ConnectResult(ConnectStatus.ok, locations: [shop, taken]);
  ConnectResult claimResult = ConnectResult(ConnectStatus.ok, business: business());
  Object? throwOnConnect;
  int claims = 0;

  @override
  Future<ConnectResult> connect() async {
    if (throwOnConnect != null) throw throwOnConnect!;
    return next;
  }

  @override
  Future<ConnectResult> locations() async => next;

  @override
  Future<ConnectResult> claim(GbpLocationOption option) async {
    claims++;
    return claimResult;
  }
}

class FakeBusinesses implements BusinessRepository {
  Map<String, Object>? saved;

  @override
  Future<Business?> fetchMine() async => null;

  @override
  Future<Business> updatePreferences(String id, {required List<String> products, required List<String> reviewLanguages, required String replyTone}) async {
    saved = {'id': id, 'products': products, 'languages': reviewLanguages, 'tone': replyTone};
    return business(products: products);
  }
}

void main() {
  late FakeGbp gbp;
  late FakeBusinesses businesses;
  late ProviderContainer container;
  OnboardingController ctrl() => container.read(onboardingControllerProvider.notifier);
  OnboardingDraft draft() => container.read(onboardingControllerProvider);

  setUp(() {
    gbp = FakeGbp();
    businesses = FakeBusinesses();
    container = ProviderContainer(overrides: [
      currentUserIdProvider.overrideWithValue('user-1'),
      gbpRepositoryProvider.overrideWithValue(gbp),
      businessRepositoryProvider.overrideWithValue(businesses),
    ]);
  });
  tearDown(() => container.dispose());

  test('connecting with locations moves to choose-location', () async {
    await ctrl().connect();
    expect(draft().step, OnboardingStep.chooseLocation);
    expect(draft().locations, hasLength(2));
  });

  test('before Google approves our access, the owner stays on connect with that status', () async {
    gbp.next = const ConnectResult(ConnectStatus.apiNotApproved);
    await ctrl().connect();
    expect(draft().step, OnboardingStep.connect);
    expect(draft().status, ConnectStatus.apiNotApproved);
    expect(draft().busy, isFalse);
  });

  test('an account with no Business Profile stays on connect', () async {
    gbp.next = const ConnectResult(ConnectStatus.ok);
    await ctrl().connect();
    expect(draft().step, OnboardingStep.connect);
    expect(draft().status, ConnectStatus.ok);
  });

  test('cancelling the Google picker is not an error', () async {
    gbp.throwOnConnect = GoogleCancelled();
    await ctrl().connect();
    expect(draft().error, isNull);
    expect(draft().busy, isFalse);
  });

  test('a location connected to another account cannot be claimed', () async {
    await ctrl().connect();
    await ctrl().claim(taken);
    expect(gbp.claims, 0);
  });

  test('claiming a location creates the business and moves to preferences', () async {
    await ctrl().connect();
    await ctrl().claim(shop);
    expect(draft().business?.isVerified, isTrue);
    expect(draft().step, OnboardingStep.preferences);
  });

  test('a location taken in the meantime shows an error', () async {
    gbp.claimResult = const ConnectResult(ConnectStatus.locationTaken);
    await ctrl().connect();
    await ctrl().claim(shop);
    expect(draft().step, OnboardingStep.chooseLocation);
    expect(draft().error, contains('another RevYne account'));
  });

  test('products are trimmed, de-duplicated and capped', () {
    expect(ctrl().addProduct('  Kaju katli '), isTrue);
    expect(ctrl().addProduct('kaju KATLI'), isFalse);
    for (var i = 0; i < maxProducts + 5; i++) {
      ctrl().addProduct('Item $i');
    }
    expect(draft().products.length, maxProducts);
  });

  test('review languages stay between 1 and the maximum', () {
    ctrl().toggleLanguage('hi');
    ctrl().toggleLanguage('en');
    expect(draft().reviewLanguages, ['en']);
    for (final (code, _) in reviewLanguageOptions) {
      ctrl().toggleLanguage(code);
    }
    expect(draft().reviewLanguages.length, lessThanOrEqualTo(maxReviewLanguages));
  });

  test('saving preferences updates the business and finishes', () async {
    await ctrl().connect();
    await ctrl().claim(shop);
    ctrl().addProduct('Kaju katli');
    ctrl().setTone('warm');
    await ctrl().savePreferences();
    expect(businesses.saved, containsPair('tone', 'warm'));
    expect(businesses.saved!['products'], ['Kaju katli']);
    expect(draft().step, OnboardingStep.done);
  });
}
