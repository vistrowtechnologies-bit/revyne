import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class GmbLocation {
  final String locationId;
  final String locationName;
  final String accountName;
  const GmbLocation({required this.locationId, required this.locationName, this.accountName = ''});

  factory GmbLocation.fromJson(Map<String, dynamic> json) => GmbLocation(
        locationId: json['locationId'] as String? ?? '',
        locationName: json['locationName'] as String? ?? '',
        accountName: json['accountName'] as String? ?? '',
      );
}

class GmbStatus {
  final bool connected;
  final String? locationId;
  final String? locationName;
  const GmbStatus({required this.connected, this.locationId, this.locationName});
}

/// Talks to the existing `gmb-connect` / `gmb-api` Supabase edge functions —
/// the same backend the web app uses, so no server changes are needed here.
class GmbService {
  static SupabaseClient get _db => Supabase.instance.client;
  static String? _pendingCodeVerifier;

  static Future<Map<String, dynamic>?> _callConnect(Map<String, dynamic> body) async {
    final res = await _db.functions.invoke('gmb-connect', body: body);
    if (res.data is Map) return Map<String, dynamic>.from(res.data as Map);
    return null;
  }

  static Future<Map<String, dynamic>?> _callApi(Map<String, dynamic> body) async {
    final res = await _db.functions.invoke('gmb-api', body: body);
    if (res.data is Map) return Map<String, dynamic>.from(res.data as Map);
    return null;
  }

  static Future<GmbStatus> getStatus() async {
    final result = await _callConnect({'action': 'get_status'});
    if (result?['connected'] == true) {
      return GmbStatus(
        connected: true,
        locationId: result?['location_id'] as String?,
        locationName: result?['location_name'] as String?,
      );
    }
    return const GmbStatus(connected: false);
  }

  static String _base64UrlNoPad(List<int> bytes) => base64Url.encode(bytes).replaceAll('=', '');

  /// Starts the Google OAuth (PKCE) flow in the system browser. The redirect
  /// lands on io.revyne.app://gmb-callback and is picked up by the app_links
  /// listener wired in main.dart, which calls [handleOAuthCallback].
  static Future<void> startConnect({required String googleClientId}) async {
    final verifierBytes = List<int>.generate(32, (_) => Random.secure().nextInt(256));
    final codeVerifier = _base64UrlNoPad(verifierBytes);
    _pendingCodeVerifier = codeVerifier;
    final codeChallenge = _base64UrlNoPad(sha256.convert(utf8.encode(codeVerifier)).bytes);

    final redirectUri = 'io.revyne.app://gmb-callback';
    final params = {
      'client_id': googleClientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': 'https://www.googleapis.com/auth/business.manage',
      'code_challenge': codeChallenge,
      'code_challenge_method': 'S256',
      'state': 'gmb',
      'access_type': 'offline',
      'prompt': 'consent',
    };
    final uri = Uri.https('accounts.google.com', '/o/oauth2/v2/auth', params);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  /// Returns the connected location(s). Empty list = no GMB account found.
  static Future<List<GmbLocation>> handleOAuthCallback(String code) async {
    final verifier = _pendingCodeVerifier;
    _pendingCodeVerifier = null;
    if (verifier == null) throw Exception('OAuth session expired. Please try connecting again.');

    final result = await _callConnect({
      'action': 'exchange_token',
      'code': code,
      'code_verifier': verifier,
      'redirect_uri': 'io.revyne.app://gmb-callback',
    });
    final locations = (result?['locations'] as List?) ?? [];
    return locations.map((l) => GmbLocation.fromJson(Map<String, dynamic>.from(l as Map))).toList();
  }

  static Future<void> selectLocation(GmbLocation location) => _callConnect({
        'action': 'select_location',
        'location_id': location.locationId,
        'location_name': location.locationName,
        'account_name': location.accountName,
      });

  static Future<void> disconnect() => _callConnect({'action': 'disconnect'});

  static Future<List<Map<String, dynamic>>> listReviews() async {
    final result = await _callApi({'action': 'list_reviews'});
    final reviews = (result?['reviews'] as List?) ?? [];
    return reviews.map((r) => Map<String, dynamic>.from(r as Map)).toList();
  }

  static Future<Map<String, dynamic>?> getProfile() async {
    final result = await _callApi({'action': 'get_profile'});
    return result?['profile'] as Map<String, dynamic>?;
  }

  static Future<(int? score, Map<String, dynamic> details)> getHealthScore() async {
    final result = await _callApi({'action': 'health_score'});
    final score = result?['score'] as int?;
    final details = (result?['details'] as Map?) ?? {};
    return (score, Map<String, dynamic>.from(details));
  }

  static Future<bool> createLocalPost({required String text, required String postType}) async {
    final result = await _callApi({'action': 'create_local_post', 'post_type': postType, 'summary': text});
    return result?['posted'] == true;
  }

  static Future<void> postReply({required String reviewName, required String comment}) => _callApi({
        'action': 'post_reply',
        'review_name': reviewName,
        'comment': comment,
      });

  static Future<void> deleteReply(String reviewName) => _callApi({'action': 'delete_reply', 'review_name': reviewName});

  static Future<List<String>> optimizeDescription({
    required String currentDescription,
    required String businessName,
    required String category,
    required String city,
    required String services,
    required String keywords,
  }) async {
    final result = await _callApi({
      'action': 'optimize_profile',
      'current_description': currentDescription,
      'business_name': businessName,
      'business_category': category,
      'city': city,
      'services': services,
      'keywords': keywords,
    });
    final list = (result?['descriptions'] as List?) ?? [];
    return list.whereType<String>().toList();
  }

  static Future<String> generateReplyDraft({
    required String reviewText,
    required int rating,
    required Map<String, String> business,
  }) async {
    final res = await _db.functions.invoke('generate-ai', body: {
      'action': 'smart_replies',
      'rating': rating,
      'reviewText': reviewText,
      'business': business,
    });
    final data = res.data;
    if (data is Map && data['replies'] is List && (data['replies'] as List).isNotEmpty) {
      return (data['replies'] as List).first as String;
    }
    return '';
  }
}
