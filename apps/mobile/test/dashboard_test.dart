import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/format.dart';
import 'package:revyne_app/features/home/dashboard.dart';

void main() {
  test('parses the stats function output, including a missing average', () {
    final s = DashboardStats.fromJson({
      'visits_7d': 10,
      'visits_prev_7d': 4,
      'google_7d': 3,
      'avg_rating_30d': null,
      'unread_feedback': 1,
    });
    expect(s.visits7d, 10);
    expect(s.googlePrev7d, 0);
    expect(s.avgRating30d, isNull);
    expect(s.googleRate7d, 30);
    expect(s.daily, isEmpty);
  });

  test('parses the 7-day series in order', () {
    final s = DashboardStats.fromJson({
      'daily_7d': [
        {'day': '2026-11-03', 'visits': 0, 'google': 0},
        {'day': '2026-11-04', 'visits': 10, 'google': 2},
      ],
    });
    expect(s.daily.map((d) => d.visits), [0, 10]);
    expect(s.daily.last.day.weekday, DateTime.wednesday);
  });

  test('google rate is unknown with no visits', () {
    expect(const DashboardStats().googleRate7d, isNull);
  });

  test('week delta wording', () {
    expect(weekDelta(5, 2), '+3 vs last week');
    expect(weekDelta(1, 4), '−3 vs last week');
    expect(weekDelta(3, 3), 'same as last week');
    expect(weekDelta(2, 0), 'new this week');
  });

  test('greeting follows the time of day and first name is extracted', () {
    expect(greeting(DateTime(2026, 11, 4, 9)), 'Good morning');
    expect(greeting(DateTime(2026, 11, 4, 14)), 'Good afternoon');
    expect(greeting(DateTime(2026, 11, 4, 20)), 'Good evening');
    expect(firstName('  Pranav Nair '), 'Pranav');
    expect(firstName(null), isNull);
  });
}
