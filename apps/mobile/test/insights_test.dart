import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/insights/insights_repository.dart';

void main() {
  test('parses totals, previous period, daily series and keywords', () {
    final v = Insights.fromJson({
      'range': {'start': '2026-10-08', 'end': '2026-11-04', 'days': 28},
      'totals': {'searchViews': 120, 'mapsViews': 80, 'calls': 9, 'directions': 6, 'websiteClicks': 0, 'chats': 1},
      'previous': {'searchViews': 100, 'mapsViews': 60, 'calls': 12},
      'daily': [
        {'date': '2026-11-03', 'views': 7, 'actions': 1},
        {'date': '2026-11-04', 'views': 9, 'actions': 0},
      ],
      'keywords': [
        {'keyword': 'fabrication moshi', 'count': 42, 'below': null},
        {'keyword': 'gate fabricator', 'count': null, 'below': 15},
      ],
    });
    expect(v.totals.views, 200);
    expect(v.totals.actions, 16);
    expect(v.previous.views, 160);
    expect(v.daily.last.views, 9);
    expect(v.keywords.first.label, '42');
    expect(v.keywords.last.label, '< 15');
  });

  test('percent change is null with nothing to compare', () {
    expect(percentChange(200, 160), 25);
    expect(percentChange(9, 12), -25);
    expect(percentChange(5, 0), isNull);
  });
}
