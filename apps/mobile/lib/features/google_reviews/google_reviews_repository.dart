import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../business/business_repository.dart';

/// A Google review of the owner's linked business (read live, not stored).
class GoogleReview {
  const GoogleReview({
    required this.id,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.reviewer,
    this.photoUrl,
    this.reply,
    this.repliedAt,
  });

  final String id;
  final String? reviewer; // null when anonymous
  final String? photoUrl;
  final int rating; // 0 when Google sends none
  final String comment;
  final DateTime createdAt;
  final String? reply;
  final DateTime? repliedAt;

  bool get needsReply => reply == null || reply!.isEmpty;

  /// Google shows translated reviews as "(Translated by Google) … (Original) …".
  /// The owner sees the translation first; the original stays available.
  String get displayComment {
    final m = RegExp(r'^\(Translated by Google\)\s*([\s\S]*?)\s*\(Original\)').firstMatch(comment);
    return (m?.group(1) ?? comment).trim();
  }

  factory GoogleReview.fromJson(Map<String, dynamic> json) {
    final reply = json['reply'] as Map?;
    return GoogleReview(
      id: json['id'] as String,
      reviewer: json['reviewer'] as String?,
      photoUrl: json['photoUrl'] as String?,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      reply: reply?['comment'] as String?,
      repliedAt: reply?['updatedAt'] == null ? null : DateTime.parse(reply!['updatedAt'] as String),
    );
  }
}

class GoogleReviewsPage {
  const GoogleReviewsPage({required this.reviews, this.averageRating, this.totalCount = 0, this.nextPageToken});

  final List<GoogleReview> reviews;
  final double? averageRating;
  final int totalCount;
  final String? nextPageToken;

  factory GoogleReviewsPage.fromJson(Map<String, dynamic> json) => GoogleReviewsPage(
        reviews: [for (final r in (json['reviews'] as List? ?? const [])) GoogleReview.fromJson(Map<String, dynamic>.from(r as Map))],
        averageRating: (json['averageRating'] as num?)?.toDouble(),
        totalCount: (json['totalReviewCount'] as num?)?.toInt() ?? 0,
        nextPageToken: json['nextPageToken'] as String?,
      );
}

/// Expected, non-error outcomes the gbp-reviews function reports.
enum ReviewsBlock { notLinked, reconnect, apiNotApproved }

class GoogleReviewsException implements Exception {
  const GoogleReviewsException(this.message, {this.block});
  final String message;
  final ReviewsBlock? block;
  @override
  String toString() => message;
}

class GoogleReviewsRepository {
  GoogleReviewsRepository(this._client);

  final SupabaseClient _client;

  Future<Map<String, dynamic>> _call(Map<String, dynamic> body) async {
    Map<String, dynamic> data;
    try {
      final res = await _client.functions.invoke('gbp-reviews', body: body);
      data = Map<String, dynamic>.from(res.data as Map);
    } on FunctionException catch (e) {
      final details = e.details;
      final message = details is Map && details['error'] is String ? details['error'] as String : null;
      throw GoogleReviewsException(message ?? 'Could not reach Google right now. Please try again.');
    }
    switch (data['status']) {
      case 'ok':
        return data;
      case 'not_linked':
        throw const GoogleReviewsException('Link your Google Business Profile to see reviews.', block: ReviewsBlock.notLinked);
      case 'reconnect':
        throw const GoogleReviewsException('Google access expired. Please connect your Google profile again.', block: ReviewsBlock.reconnect);
      case 'api_not_approved':
        throw GoogleReviewsException(
          data['reason'] == 'service_disabled'
              ? 'RevYne\'s reviews access is being switched on. Please check back soon.'
              : 'Google has not switched on reviews access for RevYne yet.',
          block: ReviewsBlock.apiNotApproved,
        );
      default:
        throw GoogleReviewsException(data['message'] as String? ?? 'Something went wrong. Please try again.');
    }
  }

  Future<GoogleReviewsPage> list({String? pageToken}) async =>
      GoogleReviewsPage.fromJson(await _call({'action': 'list', 'pageToken': ?pageToken}));

  Future<String> draft(String reviewId) async => (await _call({'action': 'draft', 'reviewId': reviewId}))['draft'] as String;

  Future<void> reply(String reviewId, String comment) => _call({'action': 'reply', 'reviewId': reviewId, 'comment': comment});

  Future<void> deleteReply(String reviewId) => _call({'action': 'unreply', 'reviewId': reviewId});
}

final googleReviewsRepositoryProvider =
    Provider<GoogleReviewsRepository>((ref) => GoogleReviewsRepository(ref.watch(supabaseProvider)));

/// First page of the linked business's Google reviews (newest activity first).
/// No automatic retry: Riverpod 3 would otherwise keep retrying a failed load
/// (spinner forever); the owner sees the reason and pulls to refresh instead.
final googleReviewsProvider = FutureProvider<GoogleReviewsPage>(retry: (_, _) => null, (ref) async {
  final business = await ref.watch(myBusinessProvider.future);
  if (business == null || !business.isVerified) {
    throw const GoogleReviewsException('Link your Google Business Profile to see reviews.', block: ReviewsBlock.notLinked);
  }
  return ref.watch(googleReviewsRepositoryProvider).list();
});
