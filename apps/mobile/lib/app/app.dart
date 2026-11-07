import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/theme.dart';
import '../features/notifications/push_service.dart';
import 'router.dart';

class RevyneApp extends ConsumerWidget {
  const RevyneApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PushBinder(
      child: MaterialApp.router(
        title: 'RevYne',
        debugShowCheckedModeBanner: false,
        theme: RevyneTheme.light(),
        scaffoldMessengerKey: scaffoldMessengerKey,
        routerConfig: ref.watch(routerProvider),
      ),
    );
  }
}
