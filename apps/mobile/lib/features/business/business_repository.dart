import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import 'business.dart';

class BusinessRepository {
  BusinessRepository(this._client);

  final SupabaseClient _client;

  /// The owner's first business, or null if they haven't onboarded.
  /// Network/database errors are thrown, never turned into "no business" —
  /// otherwise an offline user would be sent back through onboarding.
  Future<Business?> fetchMine() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;
    final row = await _client
        .from('businesses')
        .select()
        .eq('owner_id', userId)
        .order('created_at')
        .limit(1)
        .maybeSingle();
    return row == null ? null : Business.fromJson(row);
  }

  /// Updates the RevYne-only preferences — the only columns owners may edit
  /// directly (businesses are created by gbp-connect).
  Future<Business> updatePreferences(String id, {required List<String> products, required List<String> reviewLanguages, required String replyTone}) async {
    final row = await _client
        .from('businesses')
        .update({'products': products, 'review_languages': reviewLanguages, 'reply_tone': replyTone})
        .eq('id', id)
        .select()
        .single();
    return Business.fromJson(row);
  }
}

final businessRepositoryProvider = Provider<BusinessRepository>((ref) => BusinessRepository(ref.watch(supabaseProvider)));

/// Server-side truth for "has this user onboarded?". Refetches when the user changes.
final myBusinessProvider = FutureProvider<Business?>((ref) async {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) return null;
  return ref.watch(businessRepositoryProvider).fetchMine();
});
