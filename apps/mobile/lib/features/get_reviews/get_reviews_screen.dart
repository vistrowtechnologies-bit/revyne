import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

class GetReviewsScreen extends StatelessWidget {
  const GetReviewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Get Reviews')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          EmptyState(
            icon: Icons.qr_code_2_rounded,
            title: 'QR code & WhatsApp requests',
            body: 'Your QR poster, WhatsApp review requests and review-page settings will appear here.',
          ),
        ],
      ),
    );
  }
}
