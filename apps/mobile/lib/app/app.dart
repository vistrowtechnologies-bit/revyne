import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/palettes.dart';
import '../core/theme/theme.dart';
import '../features/notifications/push_service.dart';
import 'router.dart';

class RevyneApp extends ConsumerWidget {
  const RevyneApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return PushBinder(
      child: _PaletteScope(
        builder: () => MaterialApp.router(
          title: 'RevYne',
          debugShowCheckedModeBanner: false,
          theme: RevyneTheme.light(),
          scaffoldMessengerKey: scaffoldMessengerKey,
          routerConfig: router,
        ),
      ),
    );
  }
}

/// Redraws the whole app when the owner picks another app colour.
///
/// Widgets read brand colours straight from AppColors, and `const` widgets
/// (and the kept-alive tabs) are skipped by a normal rebuild, so after the
/// theme changes every element is marked dirty — the same thing hot reload
/// does. Screen, tabs, scroll positions and form input are all kept.
class _PaletteScope extends StatefulWidget {
  const _PaletteScope({required this.builder});
  final Widget Function() builder;

  @override
  State<_PaletteScope> createState() => _PaletteScopeState();
}

class _PaletteScopeState extends State<_PaletteScope> {
  @override
  void initState() {
    super.initState();
    BrandPalette.notifier.addListener(_changed);
  }

  void _changed() {
    if (!mounted) return;
    setState(() {}); // new MaterialApp theme
    void dirty(Element e) {
      e.markNeedsBuild();
      e.visitChildren(dirty);
    }

    (context as Element).visitChildren(dirty);
  }

  @override
  void dispose() {
    BrandPalette.notifier.removeListener(_changed);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.builder();
}
