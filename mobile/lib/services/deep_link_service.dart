import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';

/// Listens for the io.revyne.app://gmb-callback deep link used by the
/// Google Business OAuth flow (a second, separate OAuth grant from the
/// Supabase login — supabase_flutter handles its own login-callback link).
class DeepLinkService {
  static final ValueNotifier<Uri?> gmbCallback = ValueNotifier<Uri?>(null);

  // Kept alive for the app's lifetime — intentionally never cancelled.
  // ignore: unused_field
  static StreamSubscription<Uri>? _sub;

  static Future<void> init() async {
    final appLinks = AppLinks();

    final initial = await appLinks.getInitialLink();
    if (initial != null && initial.host == 'gmb-callback') {
      gmbCallback.value = initial;
    }

    _sub = appLinks.uriLinkStream.listen((uri) {
      if (uri.host == 'gmb-callback') {
        gmbCallback.value = uri;
      }
    });
  }

  static void consumeGmbCallback() => gmbCallback.value = null;
}
