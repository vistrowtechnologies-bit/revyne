import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

/// Google's own photo for this account (from Google sign-in), sized up.
String? googlePhotoUrl(User? user) {
  final m = user?.userMetadata;
  final url = (m?['avatar_url'] ?? m?['picture']) as String?;
  if (url == null || url.isEmpty) return null;
  // Google serves 96px by default ("=s96-c"); ask for a sharper one.
  return url.replaceFirst(RegExp(r'=s\d+-c$'), '=s256-c');
}

/// The owner's photo: their uploaded one, else their Google photo (profiles.avatar_url).
final myPhotoUrlProvider = FutureProvider<String?>((ref) async {
  final client = ref.watch(supabaseProvider);
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) return null;
  final row = await client.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
  final url = row?['avatar_url'] as String?;
  return (url == null || url.isEmpty) ? googlePhotoUrl(client.auth.currentUser) : url;
});

/// Round profile photo with initials as the fallback (no photo, offline, broken link).
class UserAvatar extends ConsumerWidget {
  const UserAvatar({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = ref.watch(supabaseProvider).auth.currentUser?.userMetadata?['full_name'] as String?;
    final url = ref.watch(myPhotoUrlProvider).value;
    final initials = InitialsAvatar(name, size: size);
    if (url == null) return initials;
    return ClipOval(
      child: Image.network(
        url.replaceFirst(RegExp(r'=s\d+-c$'), '=s256-c'),
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => initials,
        loadingBuilder: (_, child, progress) => progress == null ? child : initials,
      ),
    );
  }
}

/// Sheet to take/choose a new photo, or go back to the Google one.
Future<void> changeProfilePhoto(BuildContext context, WidgetRef ref) async {
  final client = ref.read(supabaseProvider);
  final user = client.auth.currentUser;
  if (user == null) return;
  final google = googlePhotoUrl(user);
  final current = ref.read(myPhotoUrlProvider).value;
  final usingOwn = current != null && current != google && current.contains('/avatars/');

  final choice = await showModalBottomSheet<String>(
    context: context,
    useRootNavigator: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.sm),
            child: Align(alignment: Alignment.centerLeft, child: Text('Profile photo', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
          ),
          ListTile(leading: const Icon(Icons.photo_camera_outlined), title: const Text('Take a photo'), onTap: () => Navigator.pop(context, 'camera')),
          ListTile(leading: const Icon(Icons.photo_library_outlined), title: const Text('Choose from gallery'), onTap: () => Navigator.pop(context, 'gallery')),
          if (google != null && usingOwn)
            ListTile(leading: const Icon(Icons.account_circle_outlined), title: const Text('Use my Google photo'), onTap: () => Navigator.pop(context, 'google')),
        ]),
      ),
    ),
  );
  if (choice == null || !context.mounted) return;
  final messenger = ScaffoldMessenger.of(context);

  try {
    String? newUrl;
    if (choice == 'google') {
      newUrl = user.userMetadata?['avatar_url'] as String?;
    } else {
      final file = await ImagePicker().pickImage(
        source: choice == 'camera' ? ImageSource.camera : ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
        preferredCameraDevice: CameraDevice.front,
      );
      if (file == null) return;
      final png = file.name.toLowerCase().endsWith('.png');
      final rnd = Random.secure();
      final id = List.generate(16, (_) => 'abcdefghijklmnopqrstuvwxyz0123456789'[rnd.nextInt(36)]).join();
      final path = '${user.id}/$id.${png ? 'png' : 'jpg'}';
      await client.storage.from('avatars').uploadBinary(path, await file.readAsBytes(),
          fileOptions: FileOptions(contentType: png ? 'image/png' : 'image/jpeg'));
      newUrl = client.storage.from('avatars').getPublicUrl(path);
    }
    await client.from('profiles').update({'avatar_url': newUrl}).eq('id', user.id);
    // Remove the previous uploaded photo (best effort).
    if (usingOwn) {
      final old = RegExp(r'/avatars/(.+)$').firstMatch(current)?.group(1);
      if (old != null) {
        try {
          await client.storage.from('avatars').remove([old]);
        } catch (_) {}
      }
    }
    ref.invalidate(myPhotoUrlProvider);
    messenger.showSnackBar(SnackBar(content: Text(choice == 'google' ? 'Using your Google photo.' : 'Profile photo updated.')));
  } on StorageException catch (_) {
    messenger.showSnackBar(const SnackBar(content: Text('Could not upload the photo. Please try a smaller one.')));
  } catch (_) {
    messenger.showSnackBar(const SnackBar(content: Text('Could not change the photo right now. Please try again.')));
  }
}
