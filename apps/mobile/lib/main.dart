import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'core/config/env.dart';
import 'core/theme/palettes.dart';
import 'features/notifications/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final missing = Env.missingKeys;
  if (missing.isNotEmpty) {
    runApp(_MissingConfigApp(missing));
    return;
  }

  await Supabase.initialize(url: Env.supabaseUrl, publishableKey: Env.supabasePublishableKey);
  await BrandPalette.load(); // the owner's chosen app colour
  // Push alerts are optional: the app must still start if Firebase can't.
  try {
    await Firebase.initializeApp();
    await PushService.start();
  } catch (e) {
    debugPrint('Firebase unavailable, review alerts off: $e');
  }
  runApp(const ProviderScope(child: RevyneApp()));
}

/// Shown when the app was built without `--dart-define-from-file=env/<env>.json`.
class _MissingConfigApp extends StatelessWidget {
  const _MissingConfigApp(this.missing);

  final List<String> missing;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Missing build config: ${missing.join(', ')}.\n'
              'Run with --dart-define-from-file=env/dev.json',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
