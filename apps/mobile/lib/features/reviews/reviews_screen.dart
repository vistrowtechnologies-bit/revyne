import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

class ReviewsScreen extends StatelessWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reviews')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          EmptyState(
            icon: Icons.star_outline_rounded,
            title: 'Reviews inbox',
            body: 'Your latest Google reviews, AI reply drafts and private feedback will appear here.',
          ),
        ],
      ),
    );
  }
}
