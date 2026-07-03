import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../services/business_service.dart';
import 'business_screen.dart';
import 'dashboard_screen.dart';
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

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(business: widget.business),
      SmartReplyScreen(business: widget.business),
      BusinessScreen(business: widget.business, onSaved: widget.onBusinessChanged),
      _ProfileTab(business: widget.business),
    ];

    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        indicatorColor: RevyneTheme.brand.withValues(alpha: 0.12),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: 'AI Reply'),
          NavigationDestination(
              icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Business'),
          NavigationDestination(
              icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final name = (user?.userMetadata?['full_name'] ?? user?.email ?? 'Your profile').toString();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: RevyneTheme.brand,
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'R',
              style: const TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 12),
          Center(child: Text(name, style: Theme.of(context).textTheme.titleLarge)),
          if (user?.email != null)
            Center(child: Text(user!.email!, style: TextStyle(color: Colors.grey.shade600))),
          const SizedBox(height: 32),
          Card(
            child: ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: Text(business.name.isEmpty ? 'Business not set' : business.name),
              subtitle: Text(business.category),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.tonal(
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
            },
            child: const Text('Log out'),
          ),
        ],
      ),
    );
  }
}
