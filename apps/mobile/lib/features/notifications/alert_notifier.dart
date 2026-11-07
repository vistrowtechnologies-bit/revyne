import 'dart:ui' show Color;

import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Draws RevYne's review alerts on the phone: the white RevYne mark as the
/// status-bar icon (Android requires one colour) and the full-colour logo as
/// the picture. The server sends data-only pushes so the app, not Firebase,
/// draws them — Firebase's own notifications can't show a colour logo.
class AlertNotifier {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  /// [onTap] gets the screen route of a tapped alert (foreground isolate only).
  static Future<void> init({void Function(String route)? onTap}) async {
    if (_ready && onTap == null) return;
    await _plugin.initialize(
      settings: const InitializationSettings(android: AndroidInitializationSettings('ic_stat_revyne')),
      onDidReceiveNotificationResponse: onTap == null
          ? null
          : (r) {
              final route = r.payload;
              if (route != null && route.startsWith('/')) onTap(route);
            },
    );
    _ready = true;
  }

  /// Shows one alert from a push's data: title, body, route, tag.
  static Future<void> show(Map<String, dynamic> data) async {
    await init();
    final title = data['title'] as String?;
    if (title == null) return;
    final body = data['body'] as String? ?? '';
    // Reviews carry a tag (one alert per review); private messages don't, so each gets its own.
    final given = data['tag'] as String?;
    final tag = given != null && given.isNotEmpty ? given : '$title$body';
    await _plugin.show(
      id: tag.hashCode & 0x7fffffff,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          'reviews', // created in MainActivity at high importance
          'Review alerts',
          channelDescription: 'New Google reviews and private messages from customers',
          importance: Importance.high,
          priority: Priority.high,
          icon: 'ic_stat_revyne',
          largeIcon: const DrawableResourceAndroidBitmap('ic_notification_large'),
          color: const Color(0xFF6334E2),
          styleInformation: BigTextStyleInformation(body),
          tag: tag,
        ),
      ),
      payload: data['route'] as String? ?? '/home',
    );
  }

  /// Route of the alert that launched the app from closed, if any.
  static Future<String?> launchRoute() async {
    final d = await _plugin.getNotificationAppLaunchDetails();
    return d?.didNotificationLaunchApp == true ? d!.notificationResponse?.payload : null;
  }
}
