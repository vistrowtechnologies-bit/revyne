import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import '../google_profile/profile_repository.dart';
import 'content_repository.dart';
import 'create_post_screen.dart';

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
  final posted = await CreatePostScreen.open(context);
  if (posted == true) {
    ref.invalidate(gbpProfileProvider);
    messenger.showSnackBar(const SnackBar(content: Text('Posted. Google checks posts first — usually a few minutes.')));
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(gbpPostsProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GradientButton(label: 'Create a post', icon: Icons.edit_note_rounded, onPressed: () => startNewPost(context, ref)),
        const SizedBox(height: AppSpacing.gutter),
        posts.when(
          loading: () => const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator())),
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

class PhotosSection extends ConsumerWidget {
  const PhotosSection({super.key});

  Future<void> _delete(BuildContext context, WidgetRef ref, GbpPhoto p) async {
    if (!await _confirm(context, 'Delete this photo?', 'It will be removed from your Google profile.', 'Delete', danger: true)) return;
    try {
      await ref.read(contentRepositoryProvider).deletePhoto(p.name);
      ref.invalidate(gbpPhotosProvider);
      ref.invalidate(gbpProfileProvider);
    } on ContentException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(gbpPhotosProvider);
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            Expanded(
              child: Text(
                page.value == null ? 'Photos' : '${page.value!.total} photo${page.value!.total == 1 ? '' : 's'} on Google',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
            TextButton.icon(onPressed: () => startAddPhoto(context, ref), icon: const Icon(Icons.add_a_photo_outlined, size: 18), label: const Text('Add')),
          ]),
          const SizedBox(height: AppSpacing.sm),
          page.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator())),
            error: (e, _) => Text(e is ContentException ? e.message : "Couldn't load photos.", style: const TextStyle(color: AppColors.muted)),
            data: (p) => p.photos.isEmpty
                ? const Text('Add photos of your shop, work and team — profiles with photos get more calls.', style: TextStyle(color: AppColors.muted))
                : GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    padding: EdgeInsets.zero, // no system bottom inset inside a card
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 6,
                    crossAxisSpacing: 6,
                    children: [
                      for (final photo in p.photos.take(9))
                        GestureDetector(
                          onLongPress: () => _delete(context, ref, photo),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              photo.thumbnailUrl ?? photo.url,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => Container(color: AppColors.violet50, child: const Icon(Icons.image_outlined, color: AppColors.muted)),
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
          if ((page.value?.photos.length ?? 0) > 0)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text('Press and hold a photo to delete it.', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
            ),
        ],
      ),
    );
  }
}
