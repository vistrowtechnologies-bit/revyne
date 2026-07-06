import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';

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

  static const _businessManageScope = 'https://www.googleapis.com/auth/business.manage';

  /// Requests the business.manage scope via GoogleSignIn's native incremental
  /// authorization (Credential Manager) — no browser redirect involved, since
  /// Google blocks custom-scheme redirects for Android-type OAuth clients.
  /// The resulting access token is handed to gmb-connect's use_provider_token
  /// action, which verifies the scope and lists the account's GMB locations.
  static Future<List<GmbLocation>> startConnect() async {
    final googleSignIn = GoogleSignIn.instance;
    await googleSignIn.initialize(serverClientId: AppConfig.googleWebClientId);

    final account = await googleSignIn.attemptLightweightAuthentication() ?? await googleSignIn.authenticate();

    final authorization = await account.authorizationClient.authorizeScopes([_businessManageScope]);

    final result = await _callConnect({
      'action': 'use_provider_token',
      'provider_token': authorization.accessToken,
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
