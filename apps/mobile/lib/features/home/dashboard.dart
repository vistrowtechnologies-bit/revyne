import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_providers.dart';
import '../business/business_repository.dart';

/// Numbers from `get_dashboard_stats` (review-page visits + private feedback).
class DashboardStats {
  const DashboardStats({
    this.visits7d = 0,
    this.visitsPrev7d = 0,
    this.google7d = 0,
    this.googlePrev7d = 0,
    this.avgRating30d,
    this.rated30d = 0,
    this.visitsTotal = 0,
    this.googleTotal = 0,
    this.unreadFeedback = 0,
    this.daily = const [],
  });

  final int visits7d;
  final int visitsPrev7d;
  final int google7d;
  final int googlePrev7d;
  final double? avgRating30d;
  final int rated30d;
  final int visitsTotal;
  final int googleTotal;
  final int unreadFeedback;

  /// Last 7 days (India time), oldest first.
  final List<DayCount> daily;

  /// Share of this week's visitors who went on to Google, 0–100.
  int? get googleRate7d => visits7d == 0 ? null : (google7d * 100 / visits7d).round();

  factory DashboardStats.fromJson(Map<String, dynamic> j) {
    int i(String k) => (j[k] as num?)?.toInt() ?? 0;
    return DashboardStats(
      visits7d: i('visits_7d'),
      visitsPrev7d: i('visits_prev_7d'),
      google7d: i('google_7d'),
      googlePrev7d: i('google_prev_7d'),
      avgRating30d: (j['avg_rating_30d'] as num?)?.toDouble(),
      rated30d: i('rated_30d'),
      visitsTotal: i('visits_total'),
      googleTotal: i('google_total'),
      unreadFeedback: i('unread_feedback'),
      daily: [
        for (final d in (j['daily_7d'] as List? ?? const []))
          DayCount(
            DateTime.parse((d as Map)['day'] as String),
            (d['visits'] as num?)?.toInt() ?? 0,
            (d['google'] as num?)?.toInt() ?? 0,
          ),
      ],
    );
  }
}

class DayCount {
  const DayCount(this.day, this.visits, this.google);
  final DateTime day;
  final int visits;
  final int google;
}

/// "+3 vs last week", "−2 vs last week", "same as last week", or "new this week".
String weekDelta(int current, int previous) {
  if (current == previous) return 'same as last week';
  if (previous == 0) return 'new this week';
  final d = current - previous;
  return '${d > 0 ? '+' : '−'}${d.abs()} vs last week';
}

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final business = await ref.watch(myBusinessProvider.future);
  if (business == null) return const DashboardStats();
  final data = await ref.watch(supabaseProvider).rpc('get_dashboard_stats', params: {'p_business_id': business.id});
  return DashboardStats.fromJson(Map<String, dynamic>.from(data as Map));
});
