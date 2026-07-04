import 'package:flutter/material.dart';

import '../services/business_service.dart';
import 'business_screen.dart';
import 'dashboard_screen.dart';
import 'gmb_screen.dart';
import 'profile_screen.dart';
import 'smart_reply_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.business, required this.onBusinessChanged});

  final Business business;
  final ValueChanged<Business> onBusinessChanged;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;

  void _openTab(int index) => setState(() => _tab = index);

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(business: widget.business, onOpenTab: _openTab),
      SmartReplyScreen(business: widget.business),
      BusinessScreen(business: widget.business, onSaved: widget.onBusinessChanged),
      GmbScreen(business: widget.business),
      ProfileScreen(business: widget.business, onOpenBusinessTab: () => _openTab(2)),
    ];

    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: _openTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: 'AI Reply'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Business'),
          NavigationDestination(icon: Icon(Icons.g_mobiledata_outlined), selectedIcon: Icon(Icons.g_mobiledata_rounded), label: 'Google'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
