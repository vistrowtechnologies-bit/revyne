import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../business/business_repository.dart';

/// A message a customer chose to send privately from the review page.
class PrivateFeedback {
  const PrivateFeedback({
    required this.id,
    required this.message,
    required this.createdAt,
    this.rating,
    this.contactName,
    this.contact,
    this.readAt,
  });

  final String id;
  final String message;
  final DateTime createdAt;
  final int? rating;
  final String? contactName;
  final String? contact;
  final DateTime? readAt;

  bool get isUnread => readAt == null;

  factory PrivateFeedback.fromJson(Map<String, dynamic> json) => PrivateFeedback(
        id: json['id'] as String,
        message: json['message'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
        rating: json['rating'] as int?,
        contactName: json['contact_name'] as String?,
        contact: json['contact'] as String?,
        readAt: json['read_at'] == null ? null : DateTime.parse(json['read_at'] as String),
      );
}

/// One customer visit to the review page.
class ReviewVisit {
  const ReviewVisit({
    required this.id,
    required this.createdAt,
    this.rating,
    this.highlights = const [],
    this.language,
    this.text,
    this.copied = false,
    this.openedGoogle = false,
  });

  final String id;
  final DateTime createdAt;
  final int? rating;
  final List<String> highlights;
  final String? language;
  final String? text;
  final bool copied;
  final bool openedGoogle;

  factory ReviewVisit.fromJson(Map<String, dynamic> json) => ReviewVisit(
        id: json['id'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
        rating: json['rating'] as int?,
        highlights: (json['highlights'] as List?)?.cast<String>() ?? const [],
        language: json['language'] as String?,
        text: json['draft'] as String?,
        copied: json['copied_at'] != null,
        openedGoogle: json['opened_google_at'] != null,
      );
}

class ReviewsRepository {
  ReviewsRepository(this._client);

  final SupabaseClient _client;

  Future<List<PrivateFeedback>> feedback(String businessId) async {
    final rows = await _client
        .from('private_feedback')
        .select('id,message,created_at,rating,contact_name,contact,read_at')
        .eq('business_id', businessId)
        .order('created_at', ascending: false)
        .limit(100);
    return rows.map(PrivateFeedback.fromJson).toList();
  }

  Future<List<ReviewVisit>> visits(String businessId) async {
    final rows = await _client
        .from('review_sessions')
        .select('id,created_at,rating,highlights,language,draft,copied_at,opened_google_at')
        .eq('business_id', businessId)
        .order('created_at', ascending: false)
        .limit(100);
    return rows.map(ReviewVisit.fromJson).toList();
  }

  /// Permanently removes a private message (owner-only RLS).
  Future<void> deleteFeedback(String feedbackId) => _client.from('private_feedback').delete().eq('id', feedbackId);

  Future<void> markRead(String feedbackId) =>
      _client.from('private_feedback').update({'read_at': DateTime.now().toUtc().toIso8601String()}).eq('id', feedbackId);
}

final reviewsRepositoryProvider = Provider<ReviewsRepository>((ref) => ReviewsRepository(ref.watch(supabaseProvider)));

final privateFeedbackProvider = FutureProvider<List<PrivateFeedback>>((ref) async {
  final business = await ref.watch(myBusinessProvider.future);
  if (business == null) return const [];
  return ref.watch(reviewsRepositoryProvider).feedback(business.id);
});

final reviewVisitsProvider = FutureProvider<List<ReviewVisit>>((ref) async {
  final business = await ref.watch(myBusinessProvider.future);
  if (business == null) return const [];
  return ref.watch(reviewsRepositoryProvider).visits(business.id);
});
