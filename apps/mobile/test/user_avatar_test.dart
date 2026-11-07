import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/profile/user_avatar.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

User user(Map<String, dynamic> meta) => User(
      id: 'u1',
      appMetadata: const {},
      userMetadata: meta,
      aud: 'authenticated',
      createdAt: '2026-11-01T00:00:00Z',
    );

void main() {
  test('Google photo comes from sign-in data, asked at a sharper size', () {
    expect(googlePhotoUrl(user({'avatar_url': 'https://lh3.googleusercontent.com/a/abc=s96-c'})),
        'https://lh3.googleusercontent.com/a/abc=s256-c');
    expect(googlePhotoUrl(user({'picture': 'https://lh3.googleusercontent.com/a/xyz'})), 'https://lh3.googleusercontent.com/a/xyz');
    expect(googlePhotoUrl(user({})), isNull);
    expect(googlePhotoUrl(null), isNull);
  });
}
