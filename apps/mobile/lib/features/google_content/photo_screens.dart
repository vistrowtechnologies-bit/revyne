// All photos on the Google profile (24 per page) and a full-size viewer.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/skeleton.dart';
import '../activity/activity_screen.dart';
import '../google_profile/profile_repository.dart';
import 'content_repository.dart';

/// Confirms, deletes on Google and refreshes. True when the photo was deleted.
Future<bool> deletePhoto(BuildContext context, WidgetRef ref, GbpPhoto p) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Delete this photo?'),
      content: const Text('It will be removed from your Google profile.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(context, true), style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('Delete')),
      ],
    ),
  );
  if (ok != true || !context.mounted) return false;
  final messenger = ScaffoldMessenger.of(context);
  try {
    await ref.read(contentRepositoryProvider).deletePhoto(p.name);
    ref.invalidate(gbpPhotosProvider);
    ref.invalidate(gbpProfileProvider);
    ref.invalidate(activityProvider);
    messenger.showSnackBar(const SnackBar(content: Text('Photo deleted. Google can take a little while to update everywhere.')));
    return true;
  } on ContentException catch (e) {
    messenger.showSnackBar(SnackBar(content: Text(e.message)));
    return false;
  }
}

void openPhoto(BuildContext context, GbpPhoto p) =>
    Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => PhotoViewerScreen(photo: p)));

/// Square photo tiles with a bin on each. Tap a tile to see it full size.
class PhotoGrid extends ConsumerWidget {
  const PhotoGrid({super.key, required this.photos, this.onDeleted});
  final List<GbpPhoto> photos;
  final void Function(GbpPhoto)? onDeleted;

  @override
  Widget build(BuildContext context, WidgetRef ref) => GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 6,
        crossAxisSpacing: 6,
        children: [
          for (final photo in photos)
            Stack(
              fit: StackFit.expand,
              children: [
                Material(
                  color: AppColors.violet50,
                  borderRadius: BorderRadius.circular(12),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => openPhoto(context, photo),
                    onLongPress: () async {
                      if (await deletePhoto(context, ref, photo)) onDeleted?.call(photo);
                    },
                    child: Ink.image(
                      image: NetworkImage(photo.thumbnailUrl ?? photo.url),
                      fit: BoxFit.cover,
                      onImageError: (_, _) {},
                    ),
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
                      onTap: () async {
                        if (await deletePhoto(context, ref, photo)) onDeleted?.call(photo);
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(6),
                        child: Icon(Icons.delete_outline_rounded, size: 17, color: Colors.white, semanticLabel: 'Delete photo'),
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      );
}

class AllPhotosScreen extends ConsumerStatefulWidget {
  const AllPhotosScreen({super.key});

  @override
  ConsumerState<AllPhotosScreen> createState() => _AllPhotosScreenState();
}

class _AllPhotosScreenState extends ConsumerState<AllPhotosScreen> {
  final List<GbpPhoto> _more = [];
  final Set<String> _gone = {};
  String? _next;
  bool _started = false;
  bool _busy = false;

  Future<void> _loadMore() async {
    if (_next == null || _busy) return;
    setState(() => _busy = true);
    try {
      final page = await ref.read(contentRepositoryProvider).photos(pageToken: _next);
      setState(() {
        _more.addAll(page.photos);
        _next = page.nextPageToken;
      });
    } on ContentException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final first = ref.watch(gbpPhotosProvider);
    final page = first.value;
    if (page != null && !_started) {
      _started = true;
      _next = page.nextPageToken;
    }
    final seen = {...?page?.photos.map((p) => p.name)};
    final photos = [...?page?.photos, ..._more.where((p) => !seen.contains(p.name))].where((p) => !_gone.contains(p.name)).toList();
    return Scaffold(
      appBar: AppBar(title: Text(page == null ? 'Photos' : '${page.total} photo${page.total == 1 ? '' : 's'} on Google')),
      body: first.when(
        loading: () => ListView(padding: const EdgeInsets.all(AppSpacing.md), children: const [
          SkeletonPulse(label: 'Loading photos', child: Column(children: [Sk(height: 120, radius: 12), SizedBox(height: 6), Sk(height: 120, radius: 12)])),
        ]),
        error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(e is ContentException ? e.message : "Couldn't load photos."))),
        data: (_) => ListView(
          padding: EdgeInsets.fromLTRB(AppSpacing.md, 4, AppSpacing.md, 24 + MediaQuery.paddingOf(context).bottom),
          children: [
            const Text('Newest first. Tap a photo to see it full size.', style: TextStyle(color: AppColors.muted, fontSize: 14)),
            const SizedBox(height: 12),
            PhotoGrid(photos: photos, onDeleted: (p) => setState(() => _gone.add(p.name))),
            if (_next != null) ...[
              const SizedBox(height: 14),
              Center(
                child: OutlinedButton.icon(
                  onPressed: _busy ? null : _loadMore,
                  icon: _busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.expand_more_rounded),
                  label: const Text('Show more'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class PhotoViewerScreen extends ConsumerWidget {
  const PhotoViewerScreen({super.key, required this.photo});
  final GbpPhoto photo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cat = PhotoCategory.values.where((c) => c.api == photo.category).firstOrNull?.label;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(cat ?? 'Photo'),
        actions: [
          IconButton(
            tooltip: 'Open in browser',
            icon: const Icon(Icons.open_in_new_rounded),
            onPressed: () => launchUrl(Uri.parse(photo.url), mode: LaunchMode.externalApplication),
          ),
          IconButton(
            tooltip: 'Delete photo',
            icon: const Icon(Icons.delete_outline_rounded),
            onPressed: () async {
              if (await deletePhoto(context, ref, photo) && context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
      body: InteractiveViewer(
        maxScale: 5,
        child: Center(
          child: Image.network(
            photo.url,
            fit: BoxFit.contain,
            loadingBuilder: (_, child, p) => p == null ? child : const Center(child: CircularProgressIndicator(color: Colors.white)),
            errorBuilder: (_, _, _) => const Icon(Icons.broken_image_outlined, color: Colors.white54, size: 48),
          ),
        ),
      ),
    );
  }
}
