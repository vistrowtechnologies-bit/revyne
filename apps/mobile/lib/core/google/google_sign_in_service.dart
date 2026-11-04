import 'package:google_sign_in/google_sign_in.dart';

import '../config/env.dart';

/// Thrown when the user closes a Google account picker or consent screen.
class GoogleCancelled implements Exception {}

/// Single initialisation of the native Google Sign-In (Credential Manager)
/// client, shared by app login and Business Profile connect.
class GoogleSignInService {
  static Future<GoogleSignIn>? _instance;

  static Future<GoogleSignIn> instance() => _instance ??= () async {
        final google = GoogleSignIn.instance;
        await google.initialize(serverClientId: Env.googleWebClientId);
        return google;
      }();

  /// Shows the account picker. Maps a user cancel to [GoogleCancelled].
  static Future<GoogleSignInAccount> pickAccount() async {
    try {
      return await (await instance()).authenticate();
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) throw GoogleCancelled();
      rethrow;
    }
  }
}
