import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class Business {
  final String? id;
  final String? publicToken;
  String name;
  String category;
  String city;
  String googleUrl;
  String services;
  String serviceTypes;
  String keywords;
  String language;
  String tone;
  String mobile;
  bool proMax;

  Business({
    this.id,
    this.publicToken,
    this.name = '',
    this.category = '',
    this.city = '',
    this.googleUrl = '',
    this.services = '',
    this.serviceTypes = '',
    this.keywords = '',
    this.language = 'English',
    this.tone = 'Professional',
    this.mobile = '',
    this.proMax = false,
  });

  factory Business.fromRow(Map<String, dynamic> row) => Business(
        id: row['id'] as String?,
        publicToken: row['public_token'] as String?,
        name: (row['name'] ?? '') as String,
        category: (row['category'] ?? '') as String,
        city: (row['city'] ?? '') as String,
        googleUrl: (row['google_review_url'] ?? '') as String,
        services: (row['services'] ?? '') as String,
        serviceTypes: (row['service_types'] ?? '') as String,
        keywords: (row['keywords'] ?? '') as String,
        language: (row['language'] ?? 'English') as String,
        tone: (row['tone'] ?? 'Professional') as String,
        mobile: (row['mobile'] ?? '') as String,
        proMax: (row['owner_plan'] == 'pro_max' || row['owner_plan'] == 'pro_yearly'),
      );
}

class UserProfile {
  String name;
  String email;
  String mobile;
  String plan;
  String planStatus;
  String? subscriptionId;
  String? planCurrentEnd;
  bool isAdmin;

  UserProfile({
    this.name = '',
    this.email = '',
    this.mobile = '',
    this.plan = 'free',
    this.planStatus = 'free',
    this.subscriptionId,
    this.planCurrentEnd,
    this.isAdmin = false,
  });

  factory UserProfile.fromRow(Map<String, dynamic> row) => UserProfile(
        name: (row['full_name'] ?? '') as String,
        email: (row['email'] ?? '') as String,
        mobile: (row['mobile'] ?? '') as String,
        plan: (row['plan'] ?? 'free') as String,
        planStatus: (row['plan_status'] ?? 'free') as String,
        subscriptionId: row['razorpay_subscription_id'] as String?,
        planCurrentEnd: row['plan_current_end'] as String?,
        isAdmin: (row['is_admin'] ?? false) as bool,
      );

  bool get isUsablePaidPlan {
    if (plan == 'free') return false;
    if (['active', 'authenticated'].contains(planStatus)) return true;
    if (planStatus == 'cancel_requested') {
      if (planCurrentEnd == null) return true;
      return DateTime.parse(planCurrentEnd!).isAfter(DateTime.now());
    }
    return false;
  }

  String get effectivePlan => isUsablePaidPlan ? plan : 'free';
}

class DashboardStats {
  final int totalReviews;
  final double avgRating;
  final List<Map<String, dynamic>> recent;
  const DashboardStats({this.totalReviews = 0, this.avgRating = 0, this.recent = const []});
}

class SupportTicket {
  final String id;
  final String subject;
  final String category;
  final String priority;
  final String status;
  final String message;
  final String? adminResponse;
  final DateTime? createdAt;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.category,
    required this.priority,
    required this.status,
    required this.message,
    this.adminResponse,
    this.createdAt,
  });

  factory SupportTicket.fromRow(Map<String, dynamic> row) => SupportTicket(
        id: row['id'] as String,
        subject: (row['subject'] ?? '') as String,
        category: (row['category'] ?? 'general') as String,
        priority: (row['priority'] ?? 'normal') as String,
        status: (row['status'] ?? 'open') as String,
        message: (row['message'] ?? '') as String,
        adminResponse: row['admin_response'] as String?,
        createdAt: row['created_at'] != null ? DateTime.tryParse(row['created_at'] as String) : null,
      );
}

class PaymentEvent {
  final String eventName;
  final String? plan;
  final String? status;
  final DateTime? createdAt;
  final Map<String, dynamic>? payload;

  PaymentEvent({required this.eventName, this.plan, this.status, this.createdAt, this.payload});

  factory PaymentEvent.fromRow(Map<String, dynamic> row) => PaymentEvent(
        eventName: (row['event_name'] ?? '') as String,
        plan: row['plan'] as String?,
        status: row['status'] as String?,
        createdAt: row['created_at'] != null ? DateTime.tryParse(row['created_at'] as String) : null,
        payload: row['payload'] as Map<String, dynamic>?,
      );

  String get amountLabel {
    final amount = payload?['payload']?['payment']?['entity']?['amount'];
    if (amount is num) return 'Rs ${(amount / 100).toStringAsFixed(2)}';
    if (plan == 'pro') return 'Rs 149.00';
    if (plan == 'pro_max') return 'Rs 199.00';
    if (plan == 'pro_yearly') return 'Rs 999.00';
    return '-';
  }
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
      'service_types': b.serviceTypes.trim().isEmpty ? null : b.serviceTypes.trim(),
      'keywords': b.keywords.trim().isEmpty ? null : b.keywords.trim(),
      'language': b.language,
      'tone': b.tone,
      'mobile': b.mobile.trim().isEmpty ? null : b.mobile.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    final Map<String, dynamic> row;
    if (b.id != null) {
      row = await _db.from('businesses').update(payload).eq('id', b.id!).select('id, public_token').single();
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
      serviceTypes: b.serviceTypes,
      keywords: b.keywords,
      language: b.language,
      tone: b.tone,
      mobile: b.mobile,
      proMax: b.proMax,
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

  static Future<UserProfile?> loadProfile() async {
    final userId = _db.auth.currentUser?.id;
    if (userId == null) return null;
    final row = await _db
        .from('profiles')
        .select('full_name,email,mobile,plan,plan_status,razorpay_subscription_id,plan_current_end,is_admin')
        .eq('id', userId)
        .maybeSingle();
    if (row == null) return null;
    return UserProfile.fromRow(row);
  }

  static Future<void> saveProfileContactInfo({required String name, required String mobile}) async {
    final user = _db.auth.currentUser!;
    await _db.from('profiles').upsert({
      'id': user.id,
      'full_name': name.trim().isEmpty ? null : name.trim(),
      'email': user.email,
      'mobile': mobile.trim().isEmpty ? null : mobile.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    });
  }

  static Future<List<PaymentEvent>> loadPaymentEvents() async {
    final userId = _db.auth.currentUser?.id;
    if (userId == null) return [];
    final rows = await _db
        .from('payment_events')
        .select('event_name,plan,status,created_at,payload')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(25);
    return rows.map((r) => PaymentEvent.fromRow(r)).toList();
  }

  /// Opens the existing create-razorpay-subscription edge function's hosted
  /// checkout link in the system browser — same flow the web app uses for
  /// the shortUrl case, avoids needing the native Razorpay SDK plugin.
  static Future<void> startPlanCheckout(String plan) async {
    final res = await _db.functions.invoke('create-razorpay-subscription', body: {'plan': plan});
    final data = res.data;
    if (data is Map && data['shortUrl'] != null) {
      await launchUrl(Uri.parse(data['shortUrl'] as String), mode: LaunchMode.externalApplication);
    } else if (data is Map && data['error'] != null) {
      throw Exception(data['error'].toString());
    } else {
      throw Exception('Could not create checkout');
    }
  }

  static Future<void> cancelSubscription() async {
    final res = await _db.functions.invoke('cancel-razorpay-subscription', body: {});
    final data = res.data;
    if (data is Map && data['error'] != null) throw Exception(data['error'].toString());
  }

  static Future<List<SupportTicket>> loadSupportTickets() async {
    final userId = _db.auth.currentUser?.id;
    if (userId == null) return [];
    final rows = await _db
        .from('support_tickets')
        .select('id,subject,category,priority,status,message,admin_response,created_at')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(20);
    return rows.map((r) => SupportTicket.fromRow(r)).toList();
  }

  static Future<void> createSupportTicket({
    required String category,
    required String subject,
    required String message,
  }) async {
    final user = _db.auth.currentUser!;
    await _db.from('support_tickets').insert({
      'user_id': user.id,
      'subject': subject.trim(),
      'category': category,
      'priority': _ticketPriority(category),
      'status': 'open',
      'message': message.trim(),
      'customer_email': user.email,
    });
  }

  static String _ticketPriority(String category) {
    if (category == 'bug_report' || category == 'payment' || category == 'login') return 'high';
    if (category == 'ai_generation' || category == 'review_page') return 'medium';
    return 'normal';
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
