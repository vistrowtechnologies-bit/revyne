import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/tokens.dart';

/// Bottom navigation: Home · Reviews · [Get Reviews] · Google · Account.
/// Get Reviews is the raised gradient button — the app's main action.
class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _go(int index) => navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex);

  @override
  Widget build(BuildContext context) {
    final current = navigationShell.currentIndex;

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

    return Scaffold(
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
                decoration: const BoxDecoration(
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
                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: current == 2 ? AppColors.violet : AppColors.muted),
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
    );
  }
}
