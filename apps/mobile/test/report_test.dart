import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/reports/report_pdf.dart';
import 'package:revyne_app/features/reports/report_repository.dart';

final sample = {
  'business': {'name': 'Swamy Kripa', 'city': 'Pune', 'linked': true},
  'month': '2026-10',
  'complete': true,
  'statsThrough': '2026-10-31',
  'google': {'searchViews': 20, 'mapsViews': 32, 'calls': 0, 'directions': 41, 'websiteClicks': 0, 'chats': 0},
  'previousGoogle': {'searchViews': 18, 'mapsViews': 31, 'calls': 1, 'directions': 48},
  'reviews': {
    'received': 2,
    'averageRating': 5,
    'replied': 1,
    'byStars': [
      {'stars': 5, 'count': 2},
    ],
  },
  'rating': {'average': 5.0, 'total': 1},
  'posts': {'published': 1, 'offers': 0, 'events': 0},
  'searches': [
    {'keyword': 'fabrication', 'count': null, 'below': 15},
  ],
  'revyne': {'pageVisits': 10, 'wentToGoogle': 2, 'privateMessages': 2},
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('parses every report section', () {
    final r = MonthlyReport.fromJson(sample);
    expect(monthLabel(r.month), 'October 2026');
    expect(r.google!.views, 52);
    expect(r.previousGoogle!.views, 49);
    expect(r.reviews!.received, 2);
    expect(r.reviews!.byStars[5], 2);
    expect(r.ratingAverage, 5.0);
    expect(r.postsPublished, 1);
    expect(r.searches.single.label, '< 15');
    expect(r.wentToGoogle, 2);
  });

  test('sections Google could not provide stay null', () {
    final r = MonthlyReport.fromJson({
      'business': {'name': 'X', 'linked': false},
      'month': '2026-11',
      'complete': false,
      'revyne': {'pageVisits': 0, 'wentToGoogle': 0, 'privateMessages': 0},
    });
    expect(r.google, isNull);
    expect(r.reviews, isNull);
    expect(r.statsThrough, isNull);
    expect(r.complete, isFalse);
  });

  test('builds a one-page PDF', () async {
    final bytes = await buildReportPdf(MonthlyReport.fromJson(sample));
    expect(String.fromCharCodes(bytes.take(5)), '%PDF-');
    expect(bytes.length, greaterThan(5000));
  });
}
