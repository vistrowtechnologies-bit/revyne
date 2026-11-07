import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import 'push_service.dart';

const _dismissedKey = 'push_prompt_dismissed';

final _promptDismissedProvider = FutureProvider<bool>((ref) async => (await SharedPreferences.getInstance()).getBool(_dismissedKey) ?? false);

/// Turns review alerts on, explaining when Android won't ask again.
Future<void> turnOnAlerts(BuildContext context, WidgetRef ref) async {
  final messenger = ScaffoldMessenger.of(context);
  final on = await ref.read(pushServiceProvider).enable();
  ref.invalidate(pushStatusProvider);
  messenger.showSnackBar(SnackBar(
    content: Text(on
        ? 'Review alerts are on. We\'ll tell you when a new review or message arrives.'
        : 'Notifications are off for RevYne. Turn them on in your phone\'s Settings → Apps → RevYne → Notifications.'),
  ));
}

/// Home card asking to turn on review alerts; hidden once on or dismissed.
class PushPromptCard extends ConsumerWidget {
  const PushPromptCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!PushService.available) return const SizedBox.shrink();
    final status = ref.watch(pushStatusProvider).value;
    final dismissed = ref.watch(_promptDismissedProvider).value ?? true;
    if (status == null || status == AuthorizationStatus.authorized || dismissed) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.lg),
      child: AppCard(
        padding: const EdgeInsets.fromLTRB(18, 16, 8, 14),
        borderColor: AppColors.violet200,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const IconTile(Icons.notifications_active_outlined),
              const SizedBox(width: AppSpacing.md),
              const Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Get alerts for new reviews', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  SizedBox(height: 2),
                  Text('Know the moment a customer reviews you on Google or messages you — reply while it\'s fresh.',
                      style: TextStyle(color: AppColors.muted, fontSize: 14)),
                ]),
              ),
              IconButton(
                tooltip: 'Not now',
                onPressed: () async {
                  await (await SharedPreferences.getInstance()).setBool(_dismissedKey, true);
                  ref.invalidate(_promptDismissedProvider);
                },
                icon: const Icon(Icons.close_rounded, color: AppColors.muted),
              ),
            ]),
            const SizedBox(height: AppSpacing.sm),
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: GradientButton(label: 'Turn on alerts', icon: Icons.notifications_rounded, onPressed: () => turnOnAlerts(context, ref)),
            ),
          ],
        ),
      ),
    );
  }
}
