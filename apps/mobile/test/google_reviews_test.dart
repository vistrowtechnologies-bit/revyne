import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/google_reviews/google_reviews_inbox.dart';
import 'package:revyne_app/features/google_reviews/google_reviews_repository.dart';

void main() {
  final json = {
    'reviews': [
      {'id': 'r1abcdefgh', 'reviewer': 'Priya Sharma', 'rating': 5, 'comment': 'Great work', 'createdAt': '2026-11-01T10:00:00Z', 'reply': null},
      {
        'id': 'r2abcdefgh',
        'reviewer': null,
        'rating': 3,
        'comment': '(Translated by Google) Good but late\n\n(Original)\nअच्छा पर देर से',
        'createdAt': '2026-10-20T10:00:00Z',
        'reply': {'comment': 'Thank you', 'updatedAt': '2026-10-21T10:00:00Z'},
      },
    ],
    'averageRating': 4.3,
    'totalReviewCount': 12,
    'nextPageToken': 'next',
  };

  test('parses a reviews page and reply state', () {
    final page = GoogleReviewsPage.fromJson(json);
    expect(page.totalCount, 12);
    expect(page.averageRating, 4.3);
    expect(page.nextPageToken, 'next');
    expect(page.reviews.first.needsReply, isTrue);
    expect(page.reviews.last.needsReply, isFalse);
    expect(page.reviews.last.reply, 'Thank you');
  });

  test('shows the Google translation and keeps the original', () {
    final r = GoogleReviewsPage.fromJson(json).reviews.last;
    expect(r.displayComment, 'Good but late');
    expect(r.comment, contains('अच्छा पर देर से'));
    expect(GoogleReviewsPage.fromJson(json).reviews.first.displayComment, 'Great work');
  });

  testWidgets('inbox lists a single already-replied review', (tester) async {
    final page = GoogleReviewsPage.fromJson({...json, 'reviews': [json['reviews']! is List ? (json['reviews'] as List).last : null]});
    await tester.pumpWidget(ProviderScope(
      overrides: [googleReviewsProvider.overrideWith((ref) async => page)],
      child: const MaterialApp(home: Scaffold(body: GoogleReviewsInbox())),
    ));
    await tester.pumpAndSettle();
    expect(find.text('No Google reviews yet'), findsNothing);
    expect(find.text('YOUR REPLY'), findsOneWidget);
  });

  testWidgets('review card shows reviewer, reply status and anonymous fallback', (tester) async {
    final page = GoogleReviewsPage.fromJson(json);
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: ListView(children: [
          GoogleRatingSummary(page: page, waiting: 1),
          for (final r in page.reviews) GoogleReviewCard(review: r, onTap: () {}),
        ]),
      ),
    ));
    expect(find.text('4.3'), findsOneWidget);
    expect(find.text('12 Google reviews'), findsOneWidget);
    expect(find.text('Priya Sharma'), findsOneWidget);
    expect(find.text('Needs reply'), findsOneWidget);
    expect(find.text('Google user'), findsOneWidget);
    expect(find.text('YOUR REPLY'), findsOneWidget);
  });
}
