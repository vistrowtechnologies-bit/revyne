import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/format.dart';
import '../../core/supabase/supabase_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

/// One saved alert (kept 30 days on the server).
class AppNotification {
  const AppNotification({required this.id, required this.kind, required this.title, required this.body, required this.route, required this.createdAt, this.readAt});

  final int id;
  final String kind; // review | message | post | profile | system
  final String title;
  final String body;
  final String route;
  final DateTime createdAt;
  final DateTime? readAt;

  bool get unread => readAt == null;

  IconData get icon => switch (kind) {
        'review' => Icons.star_rounded,
        'message' => Icons.forum_outlined,
        'post' => Icons.campaign_outlined,
        'profile' => Icons.storefront_outlined,
        _ => Icons.notifications_none_rounded,
      };

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: (j['id'] as num).toInt(),
        kind: j['kind'] as String? ?? 'system',
        title: j['title'] as String? ?? '',
        body: j['body'] as String? ?? '',
        route: j['route'] as String? ?? '/home',
        createdAt: DateTime.parse(j['created_at'] as String),
        readAt: j['read_at'] == null ? null : DateTime.parse(j['read_at'] as String),
      );
}

final notificationsProvider = FutureProvider<List<AppNotification>>(retry: (_, _) => null, (ref) async {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) return const [];
  final rows = await ref
      .watch(supabaseProvider)
      .from('notifications')
      .select('id,kind,title,body,route,created_at,read_at')
      .order('created_at', ascending: false)
      .limit(60);
  return rows.map(AppNotification.fromJson).toList();
});

final unreadNotificationsProvider = Provider<int>((ref) => ref.watch(notificationsProvider).value?.where((n) => n.unread).length ?? 0);

/// Bell for the Home header, with an unread badge.
class NotificationBell extends ConsumerWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadNotificationsProvider);
    return IconButton(
      tooltip: 'Notifications',
      onPressed: () => Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
      icon: Badge(
        isLabelVisible: unread > 0,
        label: Text(unread > 9 ? '9+' : '$unread'),
        backgroundColor: AppColors.magenta,
        child: Icon(Icons.notifications_none_rounded, color: AppColors.ink, size: 26),
      ),
    );
  }
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _open(BuildContext context, WidgetRef ref, AppNotification n) async {
    final client = ref.read(supabaseProvider);
    if (n.unread) {
      await client.from('notifications').update({'read_at': DateTime.now().toUtc().toIso8601String()}).eq('id', n.id);
      ref.invalidate(notificationsProvider);
    }
    if (!context.mounted) return;
    Navigator.of(context).pop();
    GoRouter.of(context).go(n.route);
  }

  Future<void> _markAllRead(WidgetRef ref) async {
    await ref
        .read(supabaseProvider)
        .from('notifications')
        .update({'read_at': DateTime.now().toUtc().toIso8601String()})
        .isFilter('read_at', null);
    ref.invalidate(notificationsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    final unread = ref.watch(unreadNotificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0) TextButton(onPressed: () => _markAllRead(ref), child: const Text('Mark all read')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(notificationsProvider);
          try {
            await ref.read(notificationsProvider.future);
          } catch (_) {}
        },
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => ListView(children: const [
            Padding(
              padding: EdgeInsets.all(AppSpacing.md),
              child: EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load notifications", body: 'Pull down to try again.'),
            ),
          ]),
          data: (items) => items.isEmpty
              ? ListView(children: const [
                  Padding(
                    padding: EdgeInsets.all(AppSpacing.md),
                    child: EmptyState(
                      icon: Icons.notifications_none_rounded,
                      title: 'No notifications yet',
                      body: 'New Google reviews, private messages and scheduled posts will show up here.',
                    ),
                  ),
                ])
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl),
                  itemCount: items.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    if (i == items.length) {
                      return const Padding(
                        padding: EdgeInsets.only(top: AppSpacing.sm),
                        child: Text('Notifications are kept for 30 days.',
                            textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
                      );
                    }
                    final n = items[i];
                    return AppCard(
                      padding: const EdgeInsets.all(14),
                      borderColor: n.unread ? AppColors.violet200 : null,
                      onTap: () => _open(context, ref, n),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        IconTile(n.icon),
                        const SizedBox(width: AppSpacing.gutter),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Expanded(
                                child: Text(n.title,
                                    style: TextStyle(fontWeight: n.unread ? FontWeight.w800 : FontWeight.w700, fontSize: 15)),
                              ),
                              Text(timeAgo(n.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                            ]),
                            if (n.body.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(n.body, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 14)),
                            ],
                          ]),
                        ),
                        if (n.unread) ...[
                          const SizedBox(width: 8),
                          Container(
                            margin: const EdgeInsets.only(top: 6),
                            width: 9,
                            height: 9,
                            decoration: BoxDecoration(color: AppColors.magenta, shape: BoxShape.circle),
                          ),
                        ],
                      ]),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
