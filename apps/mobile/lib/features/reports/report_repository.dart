import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../insights/insights_repository.dart';

class ReviewSummary {
  const ReviewSummary({required this.received, required this.replied, this.averageRating, this.byStars = const {}});
  final int received;
  final int replied;
  final double? averageRating;
  final Map<int, int> byStars; // 5 → count

  factory ReviewSummary.fromJson(Map<String, dynamic> j) => ReviewSummary(
        received: (j['received'] as num).toInt(),
        replied: (j['replied'] as num).toInt(),
        averageRating: (j['averageRating'] as num?)?.toDouble(),
        byStars: {
          for (final b in (j['byStars'] as List? ?? const [])) ((b as Map)['stars'] as num).toInt(): (b['count'] as num).toInt(),
        },
      );
}

class MonthlyReport {
  const MonthlyReport({
    required this.month,
    required this.businessName,
    required this.complete,
    this.city,
    this.linked = true,
    this.statsThrough,
    this.google,
    this.previousGoogle,
    this.reviews,
    this.ratingAverage,
    this.ratingTotal,
    this.postsPublished,
    this.offers = 0,
    this.events = 0,
    this.searches = const [],
    this.pageVisits,
    this.wentToGoogle,
    this.privateMessages,
  });

  final DateTime month; // first day
  final String businessName;
  final String? city;
  final bool linked;
  final bool complete; // false → month still running
  final DateTime? statsThrough; // last day Google stats cover
  final InsightTotals? google;
  final InsightTotals? previousGoogle;
  final ReviewSummary? reviews;
  final double? ratingAverage; // overall, now
  final int? ratingTotal;
  final int? postsPublished;
  final int offers;
  final int events;
  final List<SearchKeyword> searches;
  final int? pageVisits;
  final int? wentToGoogle;
  final int? privateMessages;

  factory MonthlyReport.fromJson(Map<String, dynamic> j) {
    Map<String, dynamic>? m(String k) => j[k] == null ? null : Map<String, dynamic>.from(j[k] as Map);
    final business = m('business')!;
    final posts = m('posts');
    final rating = m('rating');
    final revyne = m('revyne');
    return MonthlyReport(
      month: DateTime.parse('${j['month']}-01'),
      businessName: business['name'] as String,
      city: business['city'] as String?,
      linked: business['linked'] as bool? ?? true,
      complete: j['complete'] as bool? ?? true,
      statsThrough: j['statsThrough'] == null ? null : DateTime.parse(j['statsThrough'] as String),
      google: m('google') == null ? null : InsightTotals.fromJson(m('google')!),
      previousGoogle: m('previousGoogle') == null ? null : InsightTotals.fromJson(m('previousGoogle')!),
      reviews: m('reviews') == null ? null : ReviewSummary.fromJson(m('reviews')!),
      ratingAverage: (rating?['average'] as num?)?.toDouble(),
      ratingTotal: (rating?['total'] as num?)?.toInt(),
      postsPublished: (posts?['published'] as num?)?.toInt(),
      offers: (posts?['offers'] as num?)?.toInt() ?? 0,
      events: (posts?['events'] as num?)?.toInt() ?? 0,
      searches: [
        for (final k in (j['searches'] as List? ?? const []))
          SearchKeyword((k as Map)['keyword'] as String, count: (k['count'] as num?)?.toInt(), below: (k['below'] as num?)?.toInt()),
      ],
      pageVisits: (revyne?['pageVisits'] as num?)?.toInt(),
      wentToGoogle: (revyne?['wentToGoogle'] as num?)?.toInt(),
      privateMessages: (revyne?['privateMessages'] as num?)?.toInt(),
    );
  }
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
String monthLabel(DateTime m) => '${monthNames[m.month - 1]} ${m.year}';

class ReportRepository {
  ReportRepository(this._client);
  final SupabaseClient _client;

  Future<MonthlyReport> get(DateTime month) async {
    final key = '${month.year}-${month.month.toString().padLeft(2, '0')}';
    Map<String, dynamic> data;
    try {
      final res = await _client.functions.invoke('gbp-report', body: {'action': 'get', 'month': key});
      data = Map<String, dynamic>.from(res.data as Map);
    } on FunctionException catch (e) {
      final d = e.details;
      throw InsightsException(d is Map && d['error'] is String ? d['error'] as String : 'Could not load the report. Please try again.');
    }
    if (data['status'] != 'ok') throw InsightsException(data['message'] as String? ?? 'Could not load the report.');
    return MonthlyReport.fromJson(data);
  }
}

final reportRepositoryProvider = Provider<ReportRepository>((ref) => ReportRepository(ref.watch(supabaseProvider)));

/// Keyed by the first day of the month.
final monthlyReportProvider = FutureProvider.family<MonthlyReport, DateTime>(
  retry: (_, _) => null,
  (ref, month) => ref.watch(reportRepositoryProvider).get(month),
);
