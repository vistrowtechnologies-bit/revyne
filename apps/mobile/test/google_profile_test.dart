import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/google_profile/profile_editors.dart';
import 'package:revyne_app/features/google_profile/profile_panel.dart';
import 'package:revyne_app/features/google_profile/profile_repository.dart';

final json = {
  'profile': {
    'title': 'Swamy Kripa',
    'description': '',
    'phone': '+91 88559 67773',
    'website': '',
    'primaryCategory': 'Metal fabricator',
    'additionalCategories': [],
    'hours': [
      for (final d in ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']) {'day': d, 'open': '08:00', 'close': '20:00'},
    ],
    'splitHours': false,
    'specialHours': [
      {'date': '2026-11-08', 'closed': true},
    ],
    'openStatus': 'OPEN',
    'hasPendingEdits': true,
  },
  'score': {
    'score': 49,
    'items': [
      {'key': 'rating', 'label': 'Rating (5.0★)', 'earned': 20, 'max': 20, 'tip': null, 'action': 'get_reviews'},
      {'key': 'description', 'label': 'Business description', 'earned': 0, 'max': 10, 'tip': 'Add a description', 'action': 'description'},
      {'key': 'website', 'label': 'Website', 'earned': 0, 'max': 6, 'tip': 'Add a website', 'action': 'website'},
      {'key': 'reviews', 'label': 'Number of reviews (2)', 'earned': 3, 'max': 20, 'tip': 'Aim for 100+', 'action': 'get_reviews'},
      {'key': 'categories', 'label': 'Extra categories', 'earned': 0, 'max': 4, 'tip': 'Add categories', 'action': null},
    ],
  },
};

void main() {
  test('parses the profile, holiday hours and score tasks (biggest gain first)', () {
    final v = ProfileView.fromJson(json);
    expect(v.profile.hours, hasLength(6));
    expect(v.profile.specialHours.single.closed, isTrue);
    expect(v.profile.hasPendingEdits, isTrue);
    expect(v.tasks.map((t) => t.key), ['reviews', 'description', 'website', 'categories']);
    expect(v.items.firstWhere((i) => i.key == 'categories').action, ScoreAction.none);
  });

  test('time labels read naturally', () {
    expect(timeLabel('08:00'), '8 am');
    expect(timeLabel('18:30'), '6:30 pm');
    expect(timeLabel('12:00'), '12 pm');
    expect(timeLabel('24:00'), 'midnight');
  });

  testWidgets('score card and details show tasks, missing fields and the pending note', (tester) async {
    final v = ProfileView.fromJson(json);
    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(
        home: Scaffold(body: ListView(children: [ScoreCard(view: v), ProfileDetails(profile: v.profile)])),
      ),
    ));
    expect(find.text('49'), findsOneWidget);
    expect(find.text('4 ways to improve'), findsOneWidget);
    expect(find.text('+17'), findsOneWidget); // reviews: 20 - 3
    expect(find.text('Show all 4'), findsOneWidget);
    expect(find.text('6 days a week · 8 am – 8 pm'), findsOneWidget);
    expect(find.text('1 date set'), findsOneWidget);
    expect(find.textContaining('Google is reviewing'), findsOneWidget);
    expect(find.text('Metal fabricator'), findsOneWidget);
  });
}
