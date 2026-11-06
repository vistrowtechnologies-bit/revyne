import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../business/business_repository.dart';

class InsightTotals {
  const InsightTotals({this.searchViews = 0, this.mapsViews = 0, this.calls = 0, this.directions = 0, this.websiteClicks = 0, this.chats = 0});

  final int searchViews;
  final int mapsViews;
  final int calls;
  final int directions;
  final int websiteClicks;
  final int chats;

  int get views => searchViews + mapsViews;
  int get actions => calls + directions + websiteClicks + chats;

  factory InsightTotals.fromJson(Map<String, dynamic> j) {
    int n(String k) => (j[k] as num?)?.toInt() ?? 0;
    return InsightTotals(
      searchViews: n('searchViews'),
      mapsViews: n('mapsViews'),
      calls: n('calls'),
      directions: n('directions'),
      websiteClicks: n('websiteClicks'),
      chats: n('chats'),
    );
  }
}

class InsightDay {
  const InsightDay(this.date, this.views, this.actions);
  final DateTime date;
  final int views;
  final int actions;
}

class SearchKeyword {
  const SearchKeyword(this.keyword, {this.count, this.below});
  final String keyword;
  final int? count; // exact count
  final int? below; // Google hides small counts: "fewer than N"

  String get label => count != null ? '$count' : below != null ? '< $below' : '–';
}

class Insights {
  const Insights({required this.days, required this.start, required this.end, required this.totals, required this.previous, required this.daily, required this.keywords});

  final int days;
  final DateTime start;
  final DateTime end;
  final InsightTotals totals;
  final InsightTotals previous;
  final List<InsightDay> daily;
  final List<SearchKeyword> keywords;

  factory Insights.fromJson(Map<String, dynamic> j) {
    final range = Map<String, dynamic>.from(j['range'] as Map);
    return Insights(
      days: (range['days'] as num).toInt(),
      start: DateTime.parse(range['start'] as String),
      end: DateTime.parse(range['end'] as String),
      totals: InsightTotals.fromJson(Map<String, dynamic>.from(j['totals'] as Map)),
      previous: InsightTotals.fromJson(Map<String, dynamic>.from(j['previous'] as Map)),
      daily: [
        for (final d in j['daily'] as List)
          InsightDay(DateTime.parse((d as Map)['date'] as String), (d['views'] as num).toInt(), (d['actions'] as num).toInt()),
      ],
      keywords: [
        for (final k in (j['keywords'] as List? ?? const []))
          SearchKeyword((k as Map)['keyword'] as String, count: (k['count'] as num?)?.toInt(), below: (k['below'] as num?)?.toInt()),
      ],
    );
  }
}

/// Percentage change, or null when there is nothing to compare against.
int? percentChange(int now, int before) => before == 0 ? null : (((now - before) / before) * 100).round();

class InsightsException implements Exception {
  const InsightsException(this.message);
  final String message;
  @override
  String toString() => message;
}

class InsightsRepository {
  InsightsRepository(this._client);
  final SupabaseClient _client;

  Future<Insights> get(StatsRange range) async {
    String iso(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    Map<String, dynamic> data;
    try {
      final res = await _client.functions.invoke('gbp-insights', body: {
        'action': 'get',
        if (range.start != null && range.end != null) ...{'start': iso(range.start!), 'end': iso(range.end!)} else 'days': range.days,
      });
      data = Map<String, dynamic>.from(res.data as Map);
    } on FunctionException catch (e) {
      final d = e.details;
      throw InsightsException(d is Map && d['error'] is String ? d['error'] as String : 'Could not reach Google right now. Please try again.');
    }
    return switch (data['status']) {
      'ok' => Insights.fromJson(data),
      'not_linked' => throw const InsightsException('Link your Google Business Profile first.'),
      'reconnect' => throw const InsightsException('Google access expired. Please connect your Google profile again.'),
      'api_not_approved' => throw const InsightsException('Google has not switched on stats for RevYne yet.'),
      _ => throw InsightsException(data['message'] as String? ?? 'Something went wrong. Please try again.'),
    };
  }
}

final insightsRepositoryProvider = Provider<InsightsRepository>((ref) => InsightsRepository(ref.watch(supabaseProvider)));

/// Last N days, or a custom start–end (inclusive) when both are set.
typedef StatsRange = ({int days, DateTime? start, DateTime? end});

const last28Days = (days: 28, start: null, end: null);

/// Stats for a range. No automatic retry (errors are shown).
final insightsProvider = FutureProvider.family<Insights, StatsRange>(retry: (_, _) => null, (ref, range) async {
  final b = await ref.watch(myBusinessProvider.future);
  if (b == null || !b.isVerified) throw const InsightsException('Link your Google Business Profile first.');
  return ref.watch(insightsRepositoryProvider).get(range);
});
