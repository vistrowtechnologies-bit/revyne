/// Build-time configuration, injected with
/// `flutter run --dart-define-from-file=env/dev.json`.
/// See env/example.json for the expected keys.
class Env {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabasePublishableKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

  /// Web-type OAuth client. Passed to GoogleSignIn as serverClientId so the
  /// ID token audience matches Supabase's Google provider. Android clients are
  /// matched by package name + signing SHA-1 and never appear in code.
  static const googleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');

  static List<String> get missingKeys => [
        if (supabaseUrl.isEmpty) 'SUPABASE_URL',
        if (supabasePublishableKey.isEmpty) 'SUPABASE_PUBLISHABLE_KEY',
        if (googleWebClientId.isEmpty) 'GOOGLE_WEB_CLIENT_ID',
      ];
}
