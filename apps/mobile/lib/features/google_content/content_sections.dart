import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import '../google_profile/profile_repository.dart';
import 'content_repository.dart';
import 'create_post_screen.dart';
import '../../core/widgets/skeleton.dart';

Future<bool> _confirm(BuildContext context, String title, String body, String action, {bool danger = false}) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: danger ? TextButton.styleFrom(foregroundColor: AppColors.danger) : null,
            child: Text(action),
          ),
        ],
      ),
    ) ??
    false;

/// Opens the create-post screen; refreshes posts and score after posting.
Future<void> startNewPost(BuildContext context, WidgetRef ref) async {
  final messenger = ScaffoldMessenger.of(context);
  final result = await CreatePostScreen.open(context);
  if (result == 'posted') {
    ref.invalidate(gbpProfileProvider);
    messenger.showSnackBar(const SnackBar(content: Text('Posted. Google checks posts first — usually a few minutes.')));
  } else if (result == 'scheduled') {
    messenger.showSnackBar(const SnackBar(content: Text('Scheduled. RevYne will post it at the time you picked.')));
  }
}

/// Pick → choose where it belongs → upload → send to Google.
Future<void> startAddPhoto(BuildContext context, WidgetRef ref) async {
  final messenger = ScaffoldMessenger.of(context);
  final photo = await pickPhoto(context);
  if (photo == null || !context.mounted) return;
  final category = await showModalBottomSheet<PhotoCategory>(
    context: context,
    useRootNavigator: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.memory(photo.bytes, height: 160, width: double.infinity, fit: BoxFit.cover)),
          const SizedBox(height: AppSpacing.md),
          Text('What does it show?', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.sm),
          Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
            for (final c in PhotoCategory.values) SelectChip(label: c.label, selected: false, onTap: () => Navigator.pop(context, c)),
          ]),
          const SizedBox(height: AppSpacing.sm),
          const Text('Tapping a type adds the photo to your Google profile.', style: TextStyle(color: AppColors.muted, fontSize: 13.5)),
        ]),
      ),
    ),
  );
  if (category == null) return;
  messenger.showSnackBar(const SnackBar(content: Text('Uploading photo…')));
  try {
    final repo = ref.read(contentRepositoryProvider);
    final business = await ref.read(myBusinessProvider.future);
    final path = await repo.upload(business!.id, photo.bytes, png: photo.png);
    await repo.addPhoto(path, category);
    ref.invalidate(gbpPhotosProvider);
    ref.invalidate(gbpProfileProvider);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(const SnackBar(content: Text('Photo added to Google. It may take a little while to appear.')));
  } on ContentException catch (e) {
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(e.message)));
  }
}

class PostsSection extends ConsumerWidget {
  const PostsSection({super.key});

  Future<void> _delete(BuildContext context, WidgetRef ref, GbpPost p) async {
    if (!await _confirm(context, 'Delete this post?', 'It will be removed from your Google profile.', 'Delete', danger: true)) return;
    try {
      await ref.read(contentRepositoryProvider).deletePost(p.name);
      ref.invalidate(gbpPostsProvider);
      ref.invalidate(gbpProfileProvider);
    } on ContentException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref, ScheduledPost s) async {
    if (!await _confirm(context, 'Cancel this scheduled post?', 'It won\'t be posted on Google.', 'Cancel post', danger: true)) return;
    try {
      await ref.read(contentRepositoryProvider).cancelScheduled(s.id);
      ref.invalidate(scheduledPostsProvider);
    } on ContentException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(gbpPostsProvider);
    final scheduled = ref.watch(scheduledPostsProvider).value ?? const [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GradientButton(label: 'Create a post', icon: Icons.edit_note_rounded, onPressed: () => startNewPost(context, ref)),
        const SizedBox(height: AppSpacing.gutter),
        for (final s in scheduled) _ScheduledCard(item: s, onCancel: s.status == 'pending' ? () => _cancel(context, ref, s) : null),
        posts.when(
          loading: () => const ListSkeleton(rows: 2, avatar: false, label: 'Loading posts'),
          error: (e, _) => Text(e is ContentException ? e.message : "Couldn't load posts.", style: const TextStyle(color: AppColors.muted)),
          data: (items) => items.isEmpty
              ? const EmptyState(
                  icon: Icons.campaign_outlined,
                  title: 'No posts yet',
                  body: 'A weekly update or festival offer keeps your profile fresh on Google.',
                )
              : Column(children: [for (final p in items.take(5)) _PostCard(post: p, onDelete: () => _delete(context, ref, p))]),
        ),
      ],
    );
  }
}

String _scheduledLabel(DateTime d) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
  return '${days[d.weekday - 1]} ${d.day} ${months[d.month - 1]}, $h:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'am' : 'pm'}';
}

class _ScheduledCard extends StatelessWidget {
  const _ScheduledCard({required this.item, this.onCancel});
  final ScheduledPost item;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final failed = item.status == 'failed';
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
      child: AppCard(
        padding: const EdgeInsets.fromLTRB(16, 12, 4, 14),
        borderColor: failed ? AppColors.danger.withValues(alpha: 0.35) : AppColors.violet200,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              failed
                  ? const StatusPill(label: 'Not posted', background: AppColors.dangerSoft, foreground: AppColors.danger, dot: true)
                  : StatusPill(
                      label: item.status == 'publishing' ? 'Posting now' : 'Scheduled',
                      background: AppColors.violet50,
                      foreground: AppColors.violet700,
                      dot: true,
                    ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text('${item.type.label} · ${_scheduledLabel(item.publishAt)}',
                    overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
              ),
              if (onCancel != null) IconButton(tooltip: 'Cancel', onPressed: onCancel, icon: const Icon(Icons.close_rounded, color: AppColors.muted)),
            ]),
            if (item.title != null) Text(item.title!, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            Text(item.summary, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14.5, height: 1.45)),
            if (failed && item.error != null) ...[
              const SizedBox(height: 6),
              Text(item.error!, style: const TextStyle(color: AppColors.danger, fontSize: 13.5)),
            ],
          ],
        ),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.onDelete});
  final GbpPost post;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final p = post;
    final (label, bg, fg) = switch (p.state) {
      'LIVE' => ('Live', AppColors.successSoft, AppColors.success),
      'REJECTED' => ('Rejected by Google', AppColors.dangerSoft, AppColors.danger),
      _ => ('Google is checking', AppColors.amberSoft, const Color(0xFF8A5A00)),
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.gutter),
      child: AppCard(
        padding: EdgeInsets.zero,
        onTap: p.searchUrl == null ? null : () => launchUrl(Uri.parse(p.searchUrl!), mode: LaunchMode.externalApplication),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (p.photoUrl != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.card)),
                child: Image.network(p.photoUrl!, height: 150, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox.shrink()),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 4, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    StatusPill(label: label, background: bg, foreground: fg, dot: true),
                    const SizedBox(width: AppSpacing.sm),
                    Text('${p.type.label} · ${timeAgo(p.createdAt)}', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                    const Spacer(),
                    IconButton(tooltip: 'Delete', onPressed: onDelete, icon: const Icon(Icons.delete_outline_rounded, color: AppColors.muted)),
                  ]),
                  if (p.title != null) Text(p.title!, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  Text(p.summary, maxLines: 4, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14.5, height: 1.45)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Google's owner-side photo list can keep showing a deleted photo for a while
// (it isn't public any more). Remember deletes for a day so they stay hidden.
const _deletedKey = 'revyne-deleted-photos';

class DeletedPhotos extends Notifier<Map<String, int>> {
  @override
  Map<String, int> build() {
    _load();
    return const {};
  }

  Future<void> _load() async {
    try {
      final raw = (await SharedPreferences.getInstance()).getString(_deletedKey);
      if (raw == null) return;
      final now = DateTime.now().millisecondsSinceEpoch;
      final all = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      state = {for (final e in all.entries) if (now - (e.value as num).toInt() < 86400000) e.key: (e.value as num).toInt()};
    } catch (_) {}
  }

  Future<void> remember(String name) async {
    state = {...state, name: DateTime.now().millisecondsSinceEpoch};
    try {
      (await SharedPreferences.getInstance()).setString(_deletedKey, jsonEncode(state));
    } catch (_) {}
  }
}

final deletedPhotosProvider = NotifierProvider<DeletedPhotos, Map<String, int>>(DeletedPhotos.new);

class PhotosSection extends ConsumerWidget {
  const PhotosSection({super.key});

  Future<void> _delete(BuildContext context, WidgetRef ref, GbpPhoto p) async {
    if (!await _confirm(context, 'Delete this photo?', 'It will be removed from your Google profile.', 'Delete', danger: true)) return;
    try {
      await ref.read(contentRepositoryProvider).deletePhoto(p.name);
      await ref.read(deletedPhotosProvider.notifier).remember(p.name);
      ref.invalidate(gbpPhotosProvider);
      ref.invalidate(gbpProfileProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Photo deleted. Google can take a little while to update everywhere.')));
      }
    } on ContentException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(gbpPhotosProvider);
    final deleted = ref.watch(deletedPhotosProvider);
    final visible = (page.value?.photos ?? const <GbpPhoto>[]).where((p) => !deleted.containsKey(p.name)).toList();
    final hidden = (page.value?.photos.length ?? 0) - visible.length;
    final total = page.value == null ? 0 : (page.value!.total - hidden).clamp(0, 1 << 30);
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            Expanded(
              child: Text(
                page.value == null ? 'Photos' : '$total photo${total == 1 ? '' : 's'} on Google',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
            TextButton.icon(onPressed: () => startAddPhoto(context, ref), icon: const Icon(Icons.add_a_photo_outlined, size: 18), label: const Text('Add')),
          ]),
          const SizedBox(height: AppSpacing.sm),
          page.when(
            loading: () => const _PhotosSkeleton(),
            error: (e, _) => Text(e is ContentException ? e.message : "Couldn't load photos.", style: const TextStyle(color: AppColors.muted)),
            data: (_) => visible.isEmpty
                ? const Text('Add photos of your shop, work and team — profiles with photos get more calls.', style: TextStyle(color: AppColors.muted))
                : GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    padding: EdgeInsets.zero, // no system bottom inset inside a card
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 6,
                    crossAxisSpacing: 6,
                    children: [
                      for (final photo in visible.take(9))
                        GestureDetector(
                          onLongPress: () => _delete(context, ref, photo),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  photo.thumbnailUrl ?? photo.url,
                                  fit: BoxFit.cover,
                                  loadingBuilder: (_, child, progress) => progress == null ? child : Container(color: AppColors.violet100),
                                  errorBuilder: (_, _, _) => Container(color: AppColors.violet50, child: const Icon(Icons.image_outlined, color: AppColors.muted)),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 4,
                                child: Material(
                                  color: Colors.black.withValues(alpha: 0.5),
                                  shape: const CircleBorder(),
                                  child: InkWell(
                                    customBorder: const CircleBorder(),
                                    onTap: () => _delete(context, ref, photo),
                                    child: const Padding(
                                      padding: EdgeInsets.all(6),
                                      child: Icon(Icons.delete_outline_rounded, size: 17, color: Colors.white, semanticLabel: 'Delete photo'),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
          ),
          if (visible.isNotEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text('Use the bin on a photo to delete it.', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
            ),
        ],
      ),
    );
  }
}

class _PhotosSkeleton extends StatelessWidget {
  const _PhotosSkeleton();

  @override
  Widget build(BuildContext context) => SkeletonPulse(
        label: 'Loading photos',
        child: GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 6,
          crossAxisSpacing: 6,
          children: [for (var i = 0; i < 6; i++) const Sk(height: 100, radius: 12)],
        ),
      );
}
