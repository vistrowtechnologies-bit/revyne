import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/widgets/ui.dart';
import 'package:revyne_app/features/business/business.dart';
import 'package:revyne_app/features/gbp/gbp_repository.dart';
import 'package:revyne_app/features/google_profile/google_profile_screen.dart';

// Widgets are pumped with the default theme to keep tests independent of the
// app theme.
Widget wrap(Widget child) => MaterialApp(home: Scaffold(body: Center(child: child)));

void main() {
  testWidgets('ScoreRing shows the score and a dash when unknown', (tester) async {
    await tester.pumpWidget(wrap(const Row(children: [ScoreRing(score: 72), ScoreRing(score: null)])));
    expect(find.text('72'), findsOneWidget);
    expect(find.text('–'), findsOneWidget);
  });

  testWidgets('InitialsAvatar shows up to two initials, or a person icon', (tester) async {
    await tester.pumpWidget(wrap(const Column(children: [
      InitialsAvatar('priya sharma verma'),
      InitialsAvatar(null),
    ])));
    expect(find.text('PS'), findsOneWidget);
    expect(find.byIcon(Icons.person_rounded), findsOneWidget);
  });

  testWidgets('Stars fills exactly the rating', (tester) async {
    await tester.pumpWidget(wrap(const Stars(3)));
    expect(find.byIcon(Icons.star_rounded), findsNWidgets(3));
    expect(find.byIcon(Icons.star_outline_rounded), findsNWidgets(2));
  });

  testWidgets('LocationPickerSheet returns the tapped profile and blocks taken ones', (tester) async {
    GbpLocationOption? picked;
    await tester.pumpWidget(MaterialApp(
      home: Builder(
        builder: (context) => TextButton(
          onPressed: () async => picked = await showModalBottomSheet<GbpLocationOption>(
            context: context,
            builder: (_) => const LocationPickerSheet(locations: [
              GbpLocationOption(account: 'accounts/1', location: 'locations/1', title: 'Sharma Sweets', city: 'Pune'),
              GbpLocationOption(account: 'accounts/1', location: 'locations/2', title: 'Taken Cafe', takenByOther: true),
            ]),
          ),
          child: const Text('open'),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.text('Linked to another RevYne account'), findsOneWidget);

    await tester.tap(find.text('Taken Cafe'));
    await tester.pumpAndSettle();
    expect(find.text('Choose your business'), findsOneWidget); // still open

    await tester.tap(find.text('Sharma Sweets'));
    await tester.pumpAndSettle();
    expect(picked?.location, 'locations/1');
  });

  test('Business.fromJson applies defaults for optional fields', () {
    final b = Business.fromJson({
      'id': 'b1',
      'owner_id': 'u1',
      'name': 'Sharma Sweets',
      'public_slug': 'sharma-sweets-x1',
    });
    expect(b.reviewLanguages, ['en']);
    expect(b.replyTone, 'friendly');
    expect(b.products, isEmpty);
    expect(b.googleReviewUrl, isNull);
    expect(b.isVerified, isFalse);
  });
}
