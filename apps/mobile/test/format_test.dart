import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/format.dart';
import 'package:revyne_app/features/business/business.dart';
import 'package:revyne_app/features/get_reviews/review_link_card.dart';
import 'package:revyne_app/features/reviews/reviews_repository.dart';

void main() {
  final now = DateTime(2026, 11, 4, 12);

  test('timeAgo covers minutes, hours, days and older dates', () {
    expect(timeAgo(now.subtract(const Duration(seconds: 20)), now: now), 'just now');
    expect(timeAgo(now.subtract(const Duration(minutes: 5)), now: now), '5m ago');
    expect(timeAgo(now.subtract(const Duration(hours: 3)), now: now), '3h ago');
    expect(timeAgo(now.subtract(const Duration(days: 2)), now: now), '2d ago');
    expect(timeAgo(DateTime(2026, 10, 12, 9), now: now), '12 Oct');
  });

  test('stars renders filled and empty stars', () {
    expect(stars(4), '★★★★☆');
  });

  test('review request message names the customer and includes the review link', () {
    final b = Business.fromJson({'id': 'b', 'owner_id': 'u', 'name': 'Sharma Sweets', 'public_slug': 'abc123def456'});
    final msg = reviewRequestMessage(b, customerName: ' Ravi ');
    expect(msg, startsWith('Namaste Ravi! Thank you for visiting Sharma Sweets.'));
    expect(msg, contains('/r/abc123def456'));
    expect(msg.toLowerCase(), isNot(anyOf(contains('star'), contains('★'), contains('rating'))), reason: 'never ask for a star rating');
    expect(reviewRequestMessage(b), startsWith('Namaste! Thank you'));
  });

  test('visits map copied / opened-Google timestamps to flags', () {
    final v = ReviewVisit.fromJson({
      'id': 's1',
      'created_at': '2026-11-04T10:00:00Z',
      'rating': 2,
      'highlights': ['Staff'],
      'draft': 'Waited long',
      'copied_at': '2026-11-04T10:01:00Z',
      'opened_google_at': null,
    });
    expect(v.copied, isTrue);
    expect(v.openedGoogle, isFalse);
    expect(v.text, 'Waited long');
  });
}
