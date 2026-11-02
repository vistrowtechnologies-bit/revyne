import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

class GoogleProfileScreen extends StatelessWidget {
  const GoogleProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Google Profile')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          EmptyState(
            icon: Icons.storefront_outlined,
            title: 'Connect your Google Business Profile',
            body: 'Replies, posts, photos and insights unlock here once Google approves API access (Phase 3).',
          ),
        ],
      ),
    );
  }
}
