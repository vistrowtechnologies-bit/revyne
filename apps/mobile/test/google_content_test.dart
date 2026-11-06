import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/google_content/content_repository.dart';

void main() {
  test('update post sends text and button, never offer or date fields', () {
    final f = PostForm(summary: ' New grills ready ', button: PostButton.learnMore, buttonUrl: ' instagram.com/x ');
    expect(f.toJson(), {'type': 'STANDARD', 'summary': 'New grills ready', 'button': 'LEARN_MORE', 'buttonUrl': 'instagram.com/x'});
  });

  test('call button needs no link', () {
    expect(PostForm(summary: 'Hi').toJson(), {'type': 'STANDARD', 'summary': 'Hi', 'button': 'CALL'});
  });

  test('offer sends title, dates, coupon and terms but no button', () {
    final f = PostForm(type: PostType.offer, summary: 'Diwali deal', title: 'Diwali offer', startDate: DateTime(2026, 11, 6), endDate: DateTime(2026, 11, 15), couponCode: 'DIWALI');
    final j = f.toJson();
    expect(j['startDate'], '2026-11-06');
    expect(j['endDate'], '2026-11-15');
    expect(j['couponCode'], 'DIWALI');
    expect(j.containsKey('button'), isFalse);
  });

  test('event sends dates and button', () {
    final j = PostForm(type: PostType.event, summary: 'Open house', title: 'Open house', startDate: DateTime(2026, 12, 1), endDate: DateTime(2026, 12, 1)).toJson();
    expect(j['type'], 'EVENT');
    expect(j['button'], 'CALL');
  });

  test('parses a scheduled post into local time with its form fields', () {
    final s = ScheduledPost.fromJson({
      'id': '6b1c0e0a-1111-2222-3333-444455556666',
      'post': {'type': 'OFFER', 'summary': 'Diwali deal', 'title': 'Diwali offer'},
      'publish_at': '2026-11-08T04:30:00Z',
      'status': 'failed',
      'error': 'Google access expired.',
    });
    expect(s.type, PostType.offer);
    expect(s.title, 'Diwali offer');
    expect(s.publishAt.isUtc, isFalse);
    expect(s.publishAt.toUtc(), DateTime.utc(2026, 11, 8, 4, 30));
    expect(s.error, 'Google access expired.');
    final noTitle = ScheduledPost.fromJson({'id': 'x', 'post': {'type': 'STANDARD', 'summary': 's', 'title': ''}, 'publish_at': '2026-11-08T04:30:00Z', 'status': 'pending'});
    expect(noTitle.title, isNull);
  });

  test('parses posts from the server', () {
    final p = GbpPost.fromJson({'name': 'accounts/1/locations/2/localPosts/3', 'type': 'OFFER', 'summary': 's', 'title': 'Diwali', 'state': 'LIVE', 'createdAt': '2026-11-06T10:00:00Z'});
    expect(p.type, PostType.offer);
    expect(p.state, 'LIVE');
    expect(p.photoUrl, isNull);
  });
}
