import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import '../../core/widgets/skeleton.dart';

/// One thing done through RevYne (from `owner_actions`; drafts are left out).
class ActivityEntry {
  const ActivityEntry(this.kind, this.detail, this.at);
  final String kind;
  final String? detail;
  final DateTime at;

  static const _fields = {
    'description': 'description',
    'hours': 'opening hours',
    'specialHours': 'holiday hours',
    'phone': 'phone number',
    'website': 'website',
  };
  static const _photoTypes = {
    'COVER': 'cover',
    'PROFILE': 'profile',
    'LOGO': 'logo',
    'EXTERIOR': 'outside',
    'INTERIOR': 'inside',
    'PRODUCT': 'product',
    'AT_WORK': 'at-work',
    'TEAMS': 'team',
  };
  static const _postTypes = {'STANDARD': 'update', 'OFFER': 'offer', 'EVENT': 'event'};

  /// "an update" / "an offer" / "an event" / "a post".
  String _post(String? d) {
    final noun = _postTypes[(d ?? '').split(' ').last] ?? 'post';
    return noun == 'post' ? 'a post' : 'an $noun';
  }

  String _photo(String? d) {
    final t = _photoTypes[d];
    if (t == null) return 'a photo';
    return '${'aeiou'.contains(t[0]) ? 'an' : 'a'} $t photo';
  }

  /// Plain-language line, e.g. "Updated opening hours on Google".
  (IconData, String) get display => switch (kind) {
        'reply_posted' => (Icons.reply_rounded, 'Replied to a Google review'),
        'reply_deleted' => (Icons.delete_outline_rounded, 'Deleted a review reply'),
        'profile_edit' => (Icons.edit_outlined, 'Updated ${_fields[detail] ?? 'profile details'} on Google'),
        'post_created' when (detail ?? '').startsWith('scheduled') => (Icons.schedule_send_rounded, 'Published a scheduled post on Google'),
        'post_created' => (Icons.campaign_outlined, 'Posted ${_post(detail)} on Google'),
        'post_deleted' => (Icons.delete_outline_rounded, 'Deleted a Google post'),
        'post_scheduled' => (Icons.event_available_rounded, 'Scheduled ${_post(detail)}'),
        'post_schedule_cancelled' => (Icons.event_busy_rounded, 'Cancelled a scheduled post'),
        'photo_added' => (Icons.add_photo_alternate_outlined, 'Added ${_photo(detail)} on Google'),
        'photo_deleted' => (Icons.hide_image_outlined, 'Deleted a photo'),
        _ => (Icons.history_rounded, 'Changed something on Google'),
      };
}

const _shown = [
  'reply_posted',
  'reply_deleted',
  'profile_edit',
  'post_created',
  'post_deleted',
  'post_scheduled',
  'post_schedule_cancelled',
  'photo_added',
  'photo_deleted',
];

final activityProvider = FutureProvider<List<ActivityEntry>>(retry: (_, _) => null, (ref) async {
  final b = await ref.watch(myBusinessProvider.future);
  if (b == null) return const [];
  final rows = await ref
      .watch(supabaseProvider)
      .from('owner_actions')
      .select('kind,detail,created_at')
      .eq('business_id', b.id)
      .inFilter('kind', _shown)
      .order('created_at', ascending: false)
      .limit(150);
  return [for (final r in rows) ActivityEntry(r['kind'] as String, r['detail'] as String?, DateTime.parse(r['created_at'] as String).toLocal())];
});

String dayLabel(DateTime d, DateTime now) {
  final day = DateTime(d.year, d.month, d.day);
  final today = DateTime(now.year, now.month, now.day);
  final diff = today.difference(day).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${days[d.weekday - 1]} ${d.day} ${months[d.month - 1]}${d.year == now.year ? '' : ' ${d.year}'}';
}

String _clock(DateTime d) {
  final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
  return '$h:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'am' : 'pm'}';
}

class ActivityScreen extends ConsumerWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(activityProvider);
    final now = DateTime.now();
    return Scaffold(
      appBar: AppBar(title: const Text('Activity log')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(activityProvider);
          try {
            await ref.read(activityProvider.future);
          } catch (_) {}
        },
        child: async.when(
          loading: () => ListView(padding: const EdgeInsets.all(AppSpacing.md), children: const [ListSkeleton(rows: 4, label: 'Loading activity')]),
          error: (_, _) => ListView(children: const [
            Padding(
              padding: EdgeInsets.all(AppSpacing.md),
              child: EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load activity", body: 'Pull down to try again.'),
            ),
          ]),
          data: (items) {
            if (items.isEmpty) {
              return ListView(children: const [
                Padding(
                  padding: EdgeInsets.all(AppSpacing.md),
                  child: EmptyState(
                    icon: Icons.history_rounded,
                    title: 'Nothing yet',
                    body: 'Replies, profile edits, posts and photos you make through RevYne will be listed here.',
                  ),
                ),
              ]);
            }
            final children = <Widget>[
              const Padding(
                padding: EdgeInsets.fromLTRB(4, 0, 4, AppSpacing.sm),
                child: Text('Everything changed on your Google profile through RevYne.', style: TextStyle(color: AppColors.muted, fontSize: 14)),
              ),
            ];
            String? lastDay;
            for (final e in items) {
              final label = dayLabel(e.at, now);
              if (label != lastDay) {
                lastDay = label;
                children
                  ..add(const SizedBox(height: AppSpacing.sm))
                  ..add(SectionHeader(title: label))
                  ..add(const SizedBox(height: 6));
              }
              final (icon, text) = e.display;
              children.add(Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(children: [
                    IconTile(icon),
                    const SizedBox(width: AppSpacing.gutter),
                    Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
                    Text(_clock(e.at), style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                  ]),
                ),
              ));
            }
            return ListView(padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl), children: children);
          },
        ),
      ),
    );
  }
}
