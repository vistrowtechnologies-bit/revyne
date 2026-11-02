import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(myBusinessProvider).value;
    return Scaffold(
      appBar: AppBar(title: Text(business?.name ?? 'Home')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          EmptyState(
            icon: Icons.dashboard_outlined,
            title: 'Dashboard',
            body: 'Rating, review count, scans this week, pending replies and your Google Score will appear here.',
          ),
        ],
      ),
    );
  }
}
