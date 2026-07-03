import 'package:supabase_flutter/supabase_flutter.dart';

class Business {
  final String? id;
  final String? publicToken;
  String name;
  String category;
  String city;
  String googleUrl;
  String services;
  String language;
  String tone;

  Business({
    this.id,
    this.publicToken,
    this.name = '',
    this.category = '',
    this.city = '',
    this.googleUrl = '',
    this.services = '',
    this.language = 'English',
    this.tone = 'Professional',
  });

  factory Business.fromRow(Map<String, dynamic> row) => Business(
        id: row['id'] as String?,
        publicToken: row['public_token'] as String?,
        name: (row['name'] ?? '') as String,
        category: (row['category'] ?? '') as String,
        city: (row['city'] ?? '') as String,
        googleUrl: (row['google_review_url'] ?? '') as String,
        services: (row['services'] ?? '') as String,
        language: (row['language'] ?? 'English') as String,
        tone: (row['tone'] ?? 'Professional') as String,
      );
}

class DashboardStats {
  final int totalReviews;
  final double avgRating;
  final List<Map<String, dynamic>> recent;
  const DashboardStats({this.totalReviews = 0, this.avgRating = 0, this.recent = const []});
}

class BusinessService {
  static SupabaseClient get _db => Supabase.instance.client;

  /// Server-side source of truth for "has this user finished onboarding":
  /// a saved business row. No local flags that reset on reinstall.
  static Future<Business?> loadMyBusiness() async {
    final userId = _db.auth.currentUser?.id;
    if (userId == null) return null;
    final rows = await _db
        .from('businesses')
        .select()
        .eq('owner_id', userId)
        .order('created_at', ascending: false)
        .limit(1);
    if (rows.isEmpty) return null;
    return Business.fromRow(rows.first);
  }

  static Future<Business> saveBusiness(Business b) async {
    final userId = _db.auth.currentUser!.id;
    final payload = {
      'owner_id': userId,
      'name': b.name.trim(),
      'category': b.category.trim(),
      'city': b.city.trim().isEmpty ? null : b.city.trim(),
      'google_review_url': b.googleUrl.trim().isEmpty ? null : b.googleUrl.trim(),
      'services': b.services.trim().isEmpty ? null : b.services.trim(),
      'language': b.language,
      'tone': b.tone,
      'updated_at': DateTime.now().toIso8601String(),
    };

    final Map<String, dynamic> row;
    if (b.id != null) {
      row = await _db
          .from('businesses')
          .update(payload)
          .eq('id', b.id!)
          .select('id, public_token')
          .single();
    } else {
      row = await _db
          .from('businesses')
          .insert({...payload, 'public_reviews_enabled': true})
          .select('id, public_token')
          .single();
    }
    return Business(
      id: row['id'] as String?,
      publicToken: row['public_token'] as String?,
      name: b.name,
      category: b.category,
      city: b.city,
      googleUrl: b.googleUrl,
      services: b.services,
      language: b.language,
      tone: b.tone,
    );
  }

  static Future<DashboardStats> loadStats(String businessId) async {
    final rows = await _db
        .from('review_requests')
        .select('id, rating, customer_experience, created_at')
        .eq('business_id', businessId)
        .order('created_at', ascending: false)
        .limit(500);
    if (rows.isEmpty) return const DashboardStats();
    final total = rows.length;
    final avg = rows.fold<num>(0, (s, r) => s + ((r['rating'] ?? 0) as num)) / total;
    return DashboardStats(
      totalReviews: total,
      avgRating: (avg * 10).roundToDouble() / 10,
      recent: rows.take(5).toList(),
    );
  }

  /// Calls the existing generate-ai edge function for smart replies.
  static Future<List<String>> generateReplies({
    required Business business,
    required String reviewText,
    required int rating,
    String customerName = '',
  }) async {
    final res = await _db.functions.invoke('generate-ai', body: {
      'action': 'smart_replies',
      'rating': rating,
      'reviewText': reviewText,
      'customerName': customerName,
      'business': {
        'name': business.name,
        'category': business.category,
        'city': business.city,
        'language': business.language,
        'tone': business.tone,
      },
    });
    final data = res.data;
    if (data is Map && data['replies'] is List) {
      return (data['replies'] as List).whereType<String>().toList();
    }
    if (data is Map && data['error'] != null) {
      throw Exception(data['error'].toString());
    }
    return [];
  }
}
