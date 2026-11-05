import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../business/business_repository.dart';

const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const weekDayLabels = {
  'MONDAY': 'Monday',
  'TUESDAY': 'Tuesday',
  'WEDNESDAY': 'Wednesday',
  'THURSDAY': 'Thursday',
  'FRIDAY': 'Friday',
  'SATURDAY': 'Saturday',
  'SUNDAY': 'Sunday',
};

class DayHours {
  const DayHours(this.day, this.open, this.close);
  final String day; // MONDAY…
  final String open; // "HH:MM"
  final String close;

  Map<String, dynamic> toJson() => {'day': day, 'open': open, 'close': close};
  factory DayHours.fromJson(Map<String, dynamic> j) => DayHours(j['day'] as String, j['open'] as String, j['close'] as String);
}

class SpecialDay {
  const SpecialDay({required this.date, required this.closed, this.open, this.close});
  final String date; // YYYY-MM-DD
  final bool closed;
  final String? open;
  final String? close;

  Map<String, dynamic> toJson() => {'date': date, 'closed': closed, 'open': ?open, 'close': ?close};
  factory SpecialDay.fromJson(Map<String, dynamic> j) =>
      SpecialDay(date: j['date'] as String, closed: j['closed'] as bool? ?? false, open: j['open'] as String?, close: j['close'] as String?);
}

class GbpProfile {
  const GbpProfile({
    required this.title,
    required this.description,
    required this.phone,
    required this.website,
    required this.hours,
    required this.specialHours,
    this.primaryCategory,
    this.additionalCategories = const [],
    this.splitHours = false,
    this.openStatus = 'OPEN',
    this.hasPendingEdits = false,
    this.mapsUri,
  });

  final String title;
  final String description;
  final String phone;
  final String website;
  final List<DayHours> hours;
  final List<SpecialDay> specialHours;
  final String? primaryCategory;
  final List<String> additionalCategories;
  final bool splitHours;
  final String openStatus;
  final bool hasPendingEdits;
  final String? mapsUri;

  factory GbpProfile.fromJson(Map<String, dynamic> j) => GbpProfile(
        title: j['title'] as String? ?? '',
        description: j['description'] as String? ?? '',
        phone: j['phone'] as String? ?? '',
        website: j['website'] as String? ?? '',
        hours: [for (final h in (j['hours'] as List? ?? const [])) DayHours.fromJson(Map<String, dynamic>.from(h as Map))],
        specialHours: [for (final s in (j['specialHours'] as List? ?? const [])) SpecialDay.fromJson(Map<String, dynamic>.from(s as Map))],
        primaryCategory: j['primaryCategory'] as String?,
        additionalCategories: (j['additionalCategories'] as List?)?.cast<String>() ?? const [],
        splitHours: j['splitHours'] as bool? ?? false,
        openStatus: j['openStatus'] as String? ?? 'OPEN',
        hasPendingEdits: j['hasPendingEdits'] as bool? ?? false,
        mapsUri: j['mapsUri'] as String?,
      );
}

/// Where a score task takes the owner.
enum ScoreAction { description, hours, phone, website, getReviews, reply, photos, posts, none }

class ScoreItem {
  const ScoreItem({required this.key, required this.label, required this.earned, required this.max, this.tip, this.action = ScoreAction.none});
  final String key;
  final String label;
  final int earned;
  final int max;
  final String? tip;
  final ScoreAction action;

  bool get done => earned >= max;

  factory ScoreItem.fromJson(Map<String, dynamic> j) => ScoreItem(
        key: j['key'] as String,
        label: j['label'] as String,
        earned: (j['earned'] as num).toInt(),
        max: (j['max'] as num).toInt(),
        tip: j['tip'] as String?,
        action: switch (j['action']) {
          'description' => ScoreAction.description,
          'hours' => ScoreAction.hours,
          'phone' => ScoreAction.phone,
          'website' => ScoreAction.website,
          'get_reviews' => ScoreAction.getReviews,
          'reply' => ScoreAction.reply,
          'photos' => ScoreAction.photos,
          'posts' => ScoreAction.posts,
          _ => ScoreAction.none,
        },
      );
}

class ProfileView {
  const ProfileView({required this.profile, required this.score, required this.items});
  final GbpProfile profile;
  final int score;
  final List<ScoreItem> items;

  /// Open tasks, biggest gain first.
  List<ScoreItem> get tasks => items.where((i) => !i.done).toList()..sort((a, b) => (b.max - b.earned).compareTo(a.max - a.earned));

  factory ProfileView.fromJson(Map<String, dynamic> j) {
    final score = Map<String, dynamic>.from(j['score'] as Map);
    return ProfileView(
      profile: GbpProfile.fromJson(Map<String, dynamic>.from(j['profile'] as Map)),
      score: (score['score'] as num).toInt(),
      items: [for (final i in (score['items'] as List)) ScoreItem.fromJson(Map<String, dynamic>.from(i as Map))],
    );
  }
}

class ProfileException implements Exception {
  const ProfileException(this.message, {this.blocked = false});
  final String message;
  final bool blocked; // not linked / reconnect / API off — not a passing error
  @override
  String toString() => message;
}

class ProfileRepository {
  ProfileRepository(this._client);
  final SupabaseClient _client;

  Future<Map<String, dynamic>> _call(Map<String, dynamic> body) async {
    Map<String, dynamic> data;
    try {
      final res = await _client.functions.invoke('gbp-profile', body: body);
      data = Map<String, dynamic>.from(res.data as Map);
    } on FunctionException catch (e) {
      final details = e.details;
      throw ProfileException(details is Map && details['error'] is String ? details['error'] as String : 'Could not reach Google right now. Please try again.');
    }
    return switch (data['status']) {
      'ok' => data,
      'not_linked' => throw const ProfileException('Link your Google Business Profile first.', blocked: true),
      'reconnect' => throw const ProfileException('Google access expired. Please connect your Google profile again.', blocked: true),
      'api_not_approved' => throw const ProfileException('Google has not switched on profile access for RevYne yet.', blocked: true),
      _ => throw ProfileException(data['message'] as String? ?? 'Something went wrong. Please try again.'),
    };
  }

  Future<ProfileView> get() async => ProfileView.fromJson(await _call({'action': 'get'}));

  /// Sends one field to Google and returns the refreshed profile.
  Future<ProfileView> update(String field, Object value) async =>
      ProfileView.fromJson(await _call({'action': 'update', 'field': field, 'value': value}));

  Future<String> draftDescription() async => (await _call({'action': 'draft_description'}))['draft'] as String;
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) => ProfileRepository(ref.watch(supabaseProvider)));

/// The linked profile + Google Score. No automatic retry (see googleReviewsProvider).
final gbpProfileProvider = FutureProvider<ProfileView>(retry: (_, _) => null, (ref) async {
  final business = await ref.watch(myBusinessProvider.future);
  if (business == null || !business.isVerified) throw const ProfileException('Link your Google Business Profile first.', blocked: true);
  return ref.watch(profileRepositoryProvider).get();
});
