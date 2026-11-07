import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/activity/activity_screen.dart';

String text(String kind, [String? detail]) => ActivityEntry(kind, detail, DateTime(2026, 11, 6)).display.$2;

void main() {
  test('activity lines read naturally', () {
    expect(text('reply_posted'), 'Replied to a Google review');
    expect(text('profile_edit', 'hours'), 'Updated opening hours on Google');
    expect(text('profile_edit', 'specialHours'), 'Updated holiday hours on Google');
    expect(text('profile_edit', 'unknown'), 'Updated profile details on Google');
    expect(text('post_created', 'STANDARD'), 'Posted an update on Google');
    expect(text('post_created', 'OFFER'), 'Posted an offer on Google');
    expect(text('post_created', 'scheduled EVENT'), 'Published a scheduled post on Google');
    expect(text('post_scheduled', 'OFFER'), 'Scheduled an offer');
    expect(text('photo_added', 'PRODUCT'), 'Added a product photo on Google');
    expect(text('photo_added', 'EXTERIOR'), 'Added an outside photo on Google');
    expect(text('photo_added', 'AT_WORK'), 'Added an at-work photo on Google');
    expect(text('photo_added'), 'Added a photo on Google');
  });

  test('day labels: today, yesterday, then weekday and date', () {
    final now = DateTime(2026, 11, 7, 12);
    expect(dayLabel(DateTime(2026, 11, 7, 9), now), 'Today');
    expect(dayLabel(DateTime(2026, 11, 6, 23), now), 'Yesterday');
    expect(dayLabel(DateTime(2026, 11, 5, 10), now), 'Thu 5 Nov');
    expect(dayLabel(DateTime(2025, 12, 31), now), 'Wed 31 Dec 2025');
  });
}
