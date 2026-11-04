import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/google/google_sign_in_service.dart';
import '../../core/supabase/supabase_providers.dart';

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;

  /// Native Google sign-in (Credential Manager) → Supabase session.
  /// Business Profile access (business.manage) is requested separately, when
  /// the owner connects their profile. Throws [GoogleCancelled] on cancel.
  Future<void> signInWithGoogle() async {
    final account = await GoogleSignInService.pickAccount();
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw const AuthException('Google did not return an ID token. Please try again.');
    }
    await _client.auth.signInWithIdToken(provider: OAuthProvider.google, idToken: idToken);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    try {
      await (await GoogleSignInService.instance()).signOut();
    } catch (_) {
      // Supabase session is already gone; a stale Google session is harmless.
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(supabaseProvider)));
