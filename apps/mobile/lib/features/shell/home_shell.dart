import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

/// Bottom navigation: Home · Reviews · [Get Reviews] · Google · Account.
/// Get Reviews is the raised gradient button — the app's main action.
///
/// Android Back: returns to the previously visited tab, then to Home, and on
/// Home needs a second press to exit. (Tabs keep no route history of their
/// own, so without this Back closed the app from any tab.) Sheets and pushed
/// screens sit above the shell and still close first.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final List<int> _history = [];
  DateTime? _lastBackOnHome;

  StatefulNavigationShell get _shell => widget.navigationShell;

  void _go(int index) {
    final current = _shell.currentIndex;
    if (index != current) {
      _history
        ..remove(index)
        ..add(current);
    }
    _shell.goBranch(index, initialLocation: index == current);
  }

  void _onBack() {
    if (_history.isNotEmpty) {
      _shell.goBranch(_history.removeLast());
      setState(() {});
      return;
    }
    if (_shell.currentIndex != 0) {
      _shell.goBranch(0);
      return;
    }
    final now = DateTime.now();
    if (_lastBackOnHome != null && now.difference(_lastBackOnHome!) < const Duration(seconds: 2)) {
      SystemNavigator.pop();
      return;
    }
    _lastBackOnHome = now;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(const SnackBar(content: Text('Press back again to exit'), duration: Duration(seconds: 2)));
  }

  /// Desktop / wide browser: left sidebar + centred content column.
  Widget _wide(BuildContext context) {
    final current = _shell.currentIndex;
    Widget nav(int index, IconData icon, IconData activeIcon, String label) {
      final selected = current == index;
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        child: Material(
          color: selected ? AppColors.violet50 : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => _go(index),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(children: [
                Icon(selected ? activeIcon : icon, color: selected ? AppColors.violet : AppColors.muted, size: 22),
                const SizedBox(width: 14),
                Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: selected ? AppColors.violet : AppColors.ink)),
              ]),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Row(children: [
        Container(
          width: 248,
          decoration: BoxDecoration(color: Colors.white, border: Border(right: BorderSide(color: AppColors.line))),
          child: SafeArea(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Padding(padding: EdgeInsets.fromLTRB(24, 24, 24, 20), child: Align(alignment: Alignment.centerLeft, child: BrandMark())),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Material(
                  borderRadius: BorderRadius.circular(999),
                  child: Ink(
                    decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(999), boxShadow: AppShadows.glow),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: () => _go(2),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 13),
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text('Get Reviews', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                        ]),
                      ),
                    ),
                  ),
                ),
              ),
              nav(0, Icons.home_outlined, Icons.home_rounded, 'Home'),
              nav(1, Icons.chat_bubble_outline_rounded, Icons.chat_bubble_rounded, 'Reviews'),
              nav(3, Icons.storefront_outlined, Icons.storefront_rounded, 'Google'),
              nav(4, Icons.person_outline_rounded, Icons.person_rounded, 'Account'),
            ]),
          ),
        ),
        Expanded(
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 760), child: _shell),
          ),
        ),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.sizeOf(context).width >= 900) return _wide(context);
    final current = _shell.currentIndex;
    final navigationShell = _shell;

    Widget item(int index, IconData icon, IconData activeIcon, String label) {
      final selected = current == index;
      return Expanded(
        child: InkResponse(
          onTap: () => _go(index),
          radius: 36,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(selected ? activeIcon : icon, color: selected ? AppColors.violet : AppColors.outline, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: selected ? AppColors.violet : AppColors.muted),
              ),
            ],
          ),
        ),
      );
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBack();
      },
      child: Scaffold(
        body: navigationShell,
        extendBody: true,
        bottomNavigationBar: SafeArea(
          top: false,
          child: SizedBox(
            height: 84,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                Container(
                  height: 70,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: AppColors.line)),
                    boxShadow: [BoxShadow(color: Color(0x0F2B1174), blurRadius: 20, offset: Offset(0, -4))],
                  ),
                  child: Row(
                    children: [
                      item(0, Icons.home_outlined, Icons.home_rounded, 'Home'),
                      item(1, Icons.chat_bubble_outline_rounded, Icons.chat_bubble_rounded, 'Reviews'),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 34),
                          child: Text(
                            'Get Reviews',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: current == 2 ? AppColors.violet : AppColors.muted,
                            ),
                          ),
                        ),
                      ),
                      item(3, Icons.storefront_outlined, Icons.storefront_rounded, 'Google'),
                      item(4, Icons.person_outline_rounded, Icons.person_rounded, 'Account'),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 34,
                  child: GestureDetector(
                    onTap: () => _go(2),
                    child: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        gradient: AppColors.brandGradient,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: AppShadows.glow,
                      ),
                      child: const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 28),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
