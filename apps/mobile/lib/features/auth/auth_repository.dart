import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/env.dart';
import '../../core/supabase/supabase_providers.dart';

/// Thrown when the user closes the Google account picker; not an error to show.
class SignInCancelled implements Exception {}

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;
  bool _googleInitialized = false;

  Future<GoogleSignIn> _google() async {
    final google = GoogleSignIn.instance;
    if (!_googleInitialized) {
      await google.initialize(serverClientId: Env.googleWebClientId);
      _googleInitialized = true;
    }
    return google;
  }

  /// Native Google sign-in (Credential Manager) → Supabase session.
  /// Business Profile access (business.manage) is requested later, only when
  /// the owner connects their profile.
  Future<void> signInWithGoogle() async {
    final google = await _google();
    final GoogleSignInAccount account;
    try {
      account = await google.authenticate();
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) throw SignInCancelled();
      rethrow;
    }
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw const AuthException('Google did not return an ID token. Please try again.');
    }
    await _client.auth.signInWithIdToken(provider: OAuthProvider.google, idToken: idToken);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    try {
      await (await _google()).signOut();
    } catch (_) {
      // Supabase session is already gone; a stale Google session is harmless.
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(supabaseProvider)));
