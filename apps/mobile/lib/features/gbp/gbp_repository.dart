import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/google/google_sign_in_service.dart';
import '../../core/supabase/supabase_providers.dart';
import '../business/business.dart';

const businessManageScope = 'https://www.googleapis.com/auth/business.manage';

/// Outcomes the gbp-connect function reports (see its header comment).
enum ConnectStatus {
  ok,
  apiNotApproved,
  missingScope,
  noRefreshToken,
  reconnect,
  alreadyHasBusiness,
  locationTaken,
  notFound;

  static ConnectStatus parse(String? value) => switch (value) {
        'ok' => ok,
        'api_not_approved' => apiNotApproved,
        'missing_scope' => missingScope,
        'no_refresh_token' => noRefreshToken,
        'already_has_business' => alreadyHasBusiness,
        'location_taken' => locationTaken,
        'not_found' => notFound,
        _ => reconnect,
      };
}

class GbpLocationOption {
  const GbpLocationOption({required this.account, required this.location, required this.title, this.city, this.takenByOther = false});

  final String account;
  final String location;
  final String title;
  final String? city;
  final bool takenByOther;

  factory GbpLocationOption.fromJson(Map<String, dynamic> json) => GbpLocationOption(
        account: json['account'] as String,
        location: json['location'] as String,
        title: json['title'] as String? ?? '',
        city: json['city'] as String?,
        takenByOther: json['takenByOther'] as bool? ?? false,
      );
}

class ConnectResult {
  const ConnectResult(this.status, {this.locations = const [], this.business});

  final ConnectStatus status;
  final List<GbpLocationOption> locations;
  final Business? business;

  factory ConnectResult.fromJson(Map<String, dynamic> json) => ConnectResult(
        ConnectStatus.parse(json['status'] as String?),
        locations: [
          for (final l in (json['locations'] as List? ?? const [])) GbpLocationOption.fromJson(Map<String, dynamic>.from(l as Map)),
        ],
        business: json['business'] == null ? null : Business.fromJson(Map<String, dynamic>.from(json['business'] as Map)),
      );
}

class GbpException implements Exception {
  const GbpException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Connects the owner's Google Business Profile. The Google account chosen
/// here may differ from the one used to sign in to RevYne.
class GbpRepository {
  GbpRepository(this._client);

  final SupabaseClient _client;

  Future<ConnectResult> _call(Map<String, dynamic> body) async {
    try {
      final res = await _client.functions.invoke('gbp-connect', body: body);
      return ConnectResult.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on FunctionException catch (e) {
      final details = e.details;
      final message = details is Map && details['error'] is String ? details['error'] as String : null;
      throw GbpException(message ?? 'Could not reach Google right now. Please try again.');
    }
  }

  /// Account picker → consent for business.manage (offline) → server stores
  /// the refresh token and returns the locations. Throws [GoogleCancelled].
  Future<ConnectResult> connect() async {
    final account = await GoogleSignInService.pickAccount();
    final auth = await account.authorizationClient.authorizeServer([businessManageScope]);
    if (auth == null) throw const GbpException('Google did not grant access. Please try again.');
    return _call({'action': 'exchange', 'serverAuthCode': auth.serverAuthCode});
  }

  Future<ConnectResult> locations() => _call({'action': 'locations'});

  Future<ConnectResult> claim(GbpLocationOption option) =>
      _call({'action': 'claim', 'account': option.account, 'location': option.location});
}

final gbpRepositoryProvider = Provider<GbpRepository>((ref) => GbpRepository(ref.watch(supabaseProvider)));
