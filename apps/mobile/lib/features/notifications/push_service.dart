import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/router.dart';
import '../../core/supabase/supabase_providers.dart';
import 'alert_notifier.dart';

/// App-wide messenger so a push can show a banner over any screen.
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Runs in a background isolate when a push arrives while the app is closed
/// or in the background: draws the alert with the RevYne logo.
@pragma('vm:entry-point')
Future<void> revyneBackgroundMessage(RemoteMessage message) async {
  await Firebase.initializeApp();
  await AlertNotifier.show(message.data);
}

/// Firebase push for review alerts. The phone's FCM token lives in
/// `device_tokens` (owner-only RLS) while the owner is signed in.
class PushService {
  PushService(this._client);
  final SupabaseClient _client;

  /// False when Firebase didn't start (e.g. missing google-services.json).
  static bool available = false;

  /// This phone's latest FCM token (firebase_messaging 17 delivers it via onRegistered).
  static String? token;
  static final _tokens = StreamController<String>.broadcast();

  /// Call once after Firebase.initializeApp(): starts token delivery.
  static Future<void> start() async {
    available = true;
    FirebaseMessaging.onBackgroundMessage(revyneBackgroundMessage);
    FirebaseMessaging.instance.onRegistered.listen((t) {
      token = t;
      _tokens.add(t);
    });
    try {
      await FirebaseMessaging.instance.register();
    } catch (e) {
      debugPrint('push token request failed (will retry on next start): $e');
    }
  }

  /// New or refreshed tokens.
  static Stream<String> get tokens => _tokens.stream;

  FirebaseMessaging get _fm => FirebaseMessaging.instance;

  Future<AuthorizationStatus> status() async =>
      available ? (await _fm.getNotificationSettings()).authorizationStatus : AuthorizationStatus.notDetermined;

  /// Shows Android's permission dialog (13+), then registers. Returns whether alerts are on.
  Future<bool> enable() async {
    if (!available) return false;
    final settings = await _fm.requestPermission();
    final on = settings.authorizationStatus == AuthorizationStatus.authorized || settings.authorizationStatus == AuthorizationStatus.provisional;
    if (on) await register();
    return on;
  }

  /// Saves this phone's token for the signed-in owner (no-op if signed out or not yet issued).
  Future<void> register([String? fresh]) async {
    final userId = _client.auth.currentUser?.id;
    final token = fresh ?? PushService.token;
    if (!available || userId == null) return;
    if (token == null) {
      await _fm.register(); // token arrives via onRegistered → PushBinder saves it
      return;
    }
    await _client.from('device_tokens').upsert({
      'token': token,
      'user_id': userId,
      'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    });
  }

  /// Call before signing out: stops alerts reaching this phone.
  static Future<void> unregister(SupabaseClient client) async {
    if (!available) return;
    try {
      final t = token;
      if (t != null) await client.from('device_tokens').delete().eq('token', t);
      await FirebaseMessaging.instance.unregister();
      token = null;
    } catch (e) {
      debugPrint('push unregister failed: $e');
    }
  }
}

final pushServiceProvider = Provider<PushService>((ref) => PushService(ref.watch(supabaseProvider)));

/// Whether review alerts are allowed on this phone (refresh after enabling).
final pushStatusProvider = FutureProvider<AuthorizationStatus>((ref) => ref.watch(pushServiceProvider).status());

/// Wires push into the running app: keeps the token registered while signed
/// in, opens the right screen on tap, and shows a banner in the foreground.
class PushBinder extends ConsumerStatefulWidget {
  const PushBinder({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<PushBinder> createState() => _PushBinderState();
}

class _PushBinderState extends ConsumerState<PushBinder> {
  final _subs = <StreamSubscription<dynamic>>[];

  @override
  void initState() {
    super.initState();
    if (!PushService.available) return;
    final fm = FirebaseMessaging.instance;
    _subs
      ..add(PushService.tokens.listen((t) async {
        // Save whenever a token is issued or refreshed, if alerts are allowed.
        try {
          if (await ref.read(pushServiceProvider).status() == AuthorizationStatus.authorized) {
            await ref.read(pushServiceProvider).register(t);
          }
        } catch (e) {
          debugPrint('push token save failed: $e');
        }
      }))
      ..add(FirebaseMessaging.onMessageOpenedApp.listen(_open))
      ..add(FirebaseMessaging.onMessage.listen(_foreground));
    fm.getInitialMessage().then((m) {
      if (m != null) _open(m);
    });
    // Alerts are drawn by AlertNotifier; taps (and app launches from a tap) route here.
    AlertNotifier.init(onTap: _go).then((_) => AlertNotifier.launchRoute()).then((r) {
      if (r != null) _go(r);
    });
    // Already allowed (e.g. reinstall, Android 12) → make sure the token is saved.
    _registerIfAllowed();
  }

  Future<void> _registerIfAllowed() async {
    try {
      final s = await ref.read(pushServiceProvider).status();
      if (s == AuthorizationStatus.authorized) await ref.read(pushServiceProvider).register();
    } catch (e) {
      debugPrint('push register failed: $e'); // alerts are optional; never crash for them
    }
  }

  void _go(String route) {
    if (route.startsWith('/') && mounted) ref.read(routerProvider).go(route);
  }

  void _open(RemoteMessage m) => _go(m.data['route'] as String? ?? '/home');

  /// App on screen: an in-app banner instead of a system alert.
  void _foreground(RemoteMessage m) {
    final title = m.data['title'] as String? ?? m.notification?.title;
    final body = m.data['body'] as String? ?? m.notification?.body;
    if (title == null) return;
    scaffoldMessengerKey.currentState
      ?..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text([title, body].whereType<String>().join('\n')),
        duration: const Duration(seconds: 6),
        // Flutter keeps snackbars with an action until tapped; this one should fade.
        persist: false,
        action: SnackBarAction(label: 'View', onPressed: () => _open(m)),
      ));
  }

  @override
  Widget build(BuildContext context) {
    // Register for whoever signs in on this phone.
    ref.listen<String?>(currentUserIdProvider, (prev, next) {
      if (next != null && next != prev) _registerIfAllowed();
    });
    return widget.child;
  }

  @override
  void dispose() {
    for (final s in _subs) {
      s.cancel();
    }
    super.dispose();
  }
}
