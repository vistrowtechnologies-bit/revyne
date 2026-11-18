import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../business/business_repository.dart';

enum PostType {
  update('STANDARD', 'Update'),
  offer('OFFER', 'Offer'),
  event('EVENT', 'Event');

  const PostType(this.api, this.label);
  final String api;
  final String label;

  static PostType parse(String? v) => values.firstWhere((t) => t.api == v, orElse: () => update);
}

enum PostButton {
  none('NONE', 'No button', needsLink: false),
  call('CALL', 'Call now', needsLink: false),
  learnMore('LEARN_MORE', 'Learn more'),
  order('ORDER', 'Order online'),
  book('BOOK', 'Book'),
  shop('SHOP', 'Shop');

  const PostButton(this.api, this.label, {this.needsLink = true});
  final String api;
  final String label;
  final bool needsLink;
}

/// Where a photo shows on the Google profile.
enum PhotoCategory {
  exterior('EXTERIOR', 'Outside'),
  interior('INTERIOR', 'Inside'),
  product('PRODUCT', 'Products'),
  atWork('AT_WORK', 'At work'),
  teams('TEAMS', 'Team'),
  cover('COVER', 'Cover photo'),
  logo('LOGO', 'Logo');

  const PhotoCategory(this.api, this.label);
  final String api;
  final String label;
}

class GbpPost {
  const GbpPost({required this.name, required this.type, required this.summary, required this.state, required this.createdAt, this.title, this.photoUrl, this.searchUrl});

  final String name;
  final PostType type;
  final String summary;
  final String? title;
  final String state; // LIVE | PROCESSING | REJECTED
  final DateTime createdAt;
  final String? photoUrl;
  final String? searchUrl;

  factory GbpPost.fromJson(Map<String, dynamic> j) => GbpPost(
        name: j['name'] as String,
        type: PostType.parse(j['type'] as String?),
        summary: j['summary'] as String? ?? '',
        title: j['title'] as String?,
        state: j['state'] as String? ?? 'PROCESSING',
        createdAt: DateTime.parse(j['createdAt'] as String),
        photoUrl: j['photoUrl'] as String?,
        searchUrl: j['searchUrl'] as String?,
      );
}

/// A post waiting for (or that failed at) its scheduled time.
class ScheduledPost {
  const ScheduledPost({required this.id, required this.type, required this.summary, required this.publishAt, required this.status, this.title, this.error});

  final String id;
  final PostType type;
  final String summary;
  final String? title;
  final DateTime publishAt;
  final String status; // pending | publishing | failed
  final String? error;

  factory ScheduledPost.fromJson(Map<String, dynamic> j) {
    final post = Map<String, dynamic>.from(j['post'] as Map);
    return ScheduledPost(
      id: j['id'] as String,
      type: PostType.parse(post['type'] as String?),
      summary: post['summary'] as String? ?? '',
      title: (post['title'] as String?)?.isEmpty ?? true ? null : post['title'] as String,
      publishAt: DateTime.parse(j['publish_at'] as String).toLocal(),
      status: j['status'] as String,
      error: j['error'] as String?,
    );
  }
}

class GbpPhoto {
  const GbpPhoto({required this.name, required this.url, this.thumbnailUrl, this.category});
  final String name;
  final String url;
  final String? thumbnailUrl;
  final String? category;

  factory GbpPhoto.fromJson(Map<String, dynamic> j) =>
      GbpPhoto(name: j['name'] as String, url: j['url'] as String, thumbnailUrl: j['thumbnailUrl'] as String?, category: j['category'] as String?);
}

class PhotoPage {
  const PhotoPage(this.photos, this.total, [this.nextPageToken]);
  final List<GbpPhoto> photos;
  final int total;
  final String? nextPageToken; // more photos after this page
}

/// What the owner fills in on the create-post screen.
class PostForm {
  PostForm({this.type = PostType.update, this.summary = '', this.title = '', this.startDate, this.endDate, this.couponCode = '', this.terms = '', this.button = PostButton.call, this.buttonUrl = ''});

  PostType type;
  String summary;
  String title;
  DateTime? startDate;
  DateTime? endDate;
  String couponCode;
  String terms;
  PostButton button;
  String buttonUrl;

  static String _iso(DateTime? d) => d == null ? '' : '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Map<String, dynamic> toJson() => {
        'type': type.api,
        'summary': summary.trim(),
        if (type != PostType.update) ...{'title': title.trim(), 'startDate': _iso(startDate), 'endDate': _iso(endDate)},
        if (type == PostType.offer) ...{'couponCode': couponCode.trim(), 'terms': terms.trim()},
        if (type != PostType.offer) ...{'button': button.api, if (button.needsLink) 'buttonUrl': buttonUrl.trim()},
      };
}

class ContentException implements Exception {
  const ContentException(this.message);
  final String message;
  @override
  String toString() => message;
}

class ContentRepository {
  ContentRepository(this._client);
  final SupabaseClient _client;

  Future<Map<String, dynamic>> _call(Map<String, dynamic> body) async {
    Map<String, dynamic> data;
    try {
      final res = await _client.functions.invoke('gbp-content', body: body);
      data = Map<String, dynamic>.from(res.data as Map);
    } on FunctionException catch (e) {
      final d = e.details;
      throw ContentException(d is Map && d['error'] is String ? d['error'] as String : 'Could not reach Google right now. Please try again.');
    }
    return switch (data['status']) {
      'ok' => data,
      'not_linked' => throw const ContentException('Link your Google Business Profile first.'),
      'reconnect' => throw const ContentException('Google access expired. Please connect your Google profile again.'),
      'api_not_approved' => throw const ContentException('Google has not switched on this feature for RevYne yet.'),
      _ => throw ContentException(data['message'] as String? ?? 'Something went wrong. Please try again.'),
    };
  }

  Future<List<GbpPost>> posts() async =>
      [for (final p in (await _call({'action': 'posts'}))['posts'] as List) GbpPost.fromJson(Map<String, dynamic>.from(p as Map))];

  Future<String> draftPost(PostType type, String brief, {String? title}) async =>
      (await _call({'action': 'post_draft', 'type': type.api, 'brief': brief, if (title != null && title.isNotEmpty) 'title': title}))['draft'] as String;

  Future<GbpPost> createPost(PostForm form, {String? mediaPath}) async =>
      GbpPost.fromJson(Map<String, dynamic>.from((await _call({'action': 'post_create', 'post': form.toJson(), 'mediaPath': ?mediaPath}))['post'] as Map));

  Future<void> deletePost(String name) => _call({'action': 'post_delete', 'name': name});

  Future<void> schedulePost(PostForm form, DateTime publishAt, {String? mediaPath}) => _call({
        'action': 'post_schedule',
        'post': form.toJson(),
        'publishAt': publishAt.toUtc().toIso8601String(),
        'mediaPath': ?mediaPath,
      });

  Future<void> cancelScheduled(String id) => _call({'action': 'schedule_cancel', 'id': id});

  /// Upcoming posts, plus ones that failed in the last week (owner-only RLS).
  Future<List<ScheduledPost>> scheduled(String businessId) async {
    final weekAgo = DateTime.now().toUtc().subtract(const Duration(days: 7)).toIso8601String();
    final rows = await _client
        .from('scheduled_posts')
        .select('id,post,publish_at,status,error')
        .eq('business_id', businessId)
        .or('status.in.(pending,publishing),and(status.eq.failed,publish_at.gte.$weekAgo)')
        .order('publish_at');
    return rows.map(ScheduledPost.fromJson).toList();
  }

  /// One page of photos (24). Photos deleted through RevYne are already left out.
  Future<PhotoPage> photos({String? pageToken}) async {
    final d = await _call({'action': 'photos', 'pageToken': ?pageToken});
    return PhotoPage(
      [for (final p in d['photos'] as List) GbpPhoto.fromJson(Map<String, dynamic>.from(p as Map))],
      (d['total'] as num).toInt(),
      d['nextPageToken'] as String?,
    );
  }

  Future<void> addPhoto(String mediaPath, PhotoCategory category) => _call({'action': 'photo_add', 'mediaPath': mediaPath, 'category': category.api});

  Future<void> deletePhoto(String name) => _call({'action': 'photo_delete', 'name': name});

  /// Uploads a picked photo to the private bucket; returns its path for Google.
  Future<String> upload(String businessId, Uint8List bytes, {required bool png}) async {
    final rnd = Random.secure();
    final id = List.generate(20, (_) => 'abcdefghijklmnopqrstuvwxyz0123456789'[rnd.nextInt(36)]).join();
    final path = '$businessId/$id.${png ? 'png' : 'jpg'}';
    try {
      await _client.storage.from('gbp-media').uploadBinary(path, bytes, fileOptions: FileOptions(contentType: png ? 'image/png' : 'image/jpeg'));
    } on StorageException catch (e) {
      throw ContentException(e.statusCode == '413' ? 'That photo is too large (5 MB max).' : 'Could not upload the photo. Please try again.');
    }
    return path;
  }
}

final contentRepositoryProvider = Provider<ContentRepository>((ref) => ContentRepository(ref.watch(supabaseProvider)));

Future<void> _requireLinked(Ref ref) async {
  final b = await ref.watch(myBusinessProvider.future);
  if (b == null || !b.isVerified) throw const ContentException('Link your Google Business Profile first.');
}

final gbpPostsProvider = FutureProvider<List<GbpPost>>(retry: (_, _) => null, (ref) async {
  await _requireLinked(ref);
  return ref.watch(contentRepositoryProvider).posts();
});

final scheduledPostsProvider = FutureProvider<List<ScheduledPost>>(retry: (_, _) => null, (ref) async {
  final b = await ref.watch(myBusinessProvider.future);
  if (b == null || !b.isVerified) return const [];
  return ref.watch(contentRepositoryProvider).scheduled(b.id);
});

final gbpPhotosProvider =FutureProvider<PhotoPage>(retry: (_, _) => null, (ref) async {
  await _requireLinked(ref);
  return ref.watch(contentRepositoryProvider).photos();
});
