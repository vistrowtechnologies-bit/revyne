// "What Google changed": each detail Google updated itself, the owner's version
// next to Google's, with Keep mine / Use Google's. Same as the web app.
import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/skeleton.dart';
import '../../core/widgets/ui.dart';
import '../activity/activity_screen.dart';
import 'profile_repository.dart';

Future<void> showGoogleChanges(BuildContext context) => showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => const GoogleChangesSheet(),
    );

class GoogleChangesSheet extends ConsumerStatefulWidget {
  const GoogleChangesSheet({super.key});

  @override
  ConsumerState<GoogleChangesSheet> createState() => _GoogleChangesSheetState();
}

class _GoogleChangesSheetState extends ConsumerState<GoogleChangesSheet> {
  String? _busy;

  Future<void> _apply(GoogleChange c, {required bool keep}) async {
    final value = keep ? c.mine : c.google;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(keep ? 'Send your version to Google?' : "Use Google's version?"),
        content: Text('${c.label}: customers will see "${value.length > 160 ? value.substring(0, 160) : value}" on Google Search and Maps.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text(keep ? 'Keep mine' : "Use Google's")),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _busy = c.field);
    try {
      await ref.read(profileRepositoryProvider).update(c.field, (keep ? c.mineValue : c.googleValue) ?? value);
      messenger.showSnackBar(SnackBar(content: Text(keep ? 'Sent your version to Google. It can take a few minutes to show.' : "Using Google's version.")));
      ref.invalidate(gbpProfileProvider);
      ref.invalidate(activityProvider);
      ref.invalidate(googleChangesProvider);
    } on ProfileException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(googleChangesProvider);
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (context, scroll) => ListView(
        controller: scroll,
        padding: EdgeInsets.fromLTRB(AppSpacing.md, 12, AppSpacing.md, 24 + MediaQuery.paddingOf(context).bottom),
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: AppSpacing.md),
          Text('What Google changed', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text(
            'Google sometimes updates your profile itself, often from suggestions by the public. Check each one and keep the right version.',
            style: TextStyle(color: AppColors.muted, fontSize: 14.5),
          ),
          const SizedBox(height: AppSpacing.md),
          ...async.when(
            loading: () => [const CardSkeleton(lines: 4, label: "Loading Google's changes")],
            error: (e, _) => [
              EmptyState(icon: Icons.cloud_off_rounded, title: "Couldn't load Google's changes", body: e is ProfileException ? e.message : 'Please try again.'),
            ],
            data: (d) => [
              if (d.changes.isEmpty)
                const EmptyState(icon: Icons.task_alt_rounded, title: 'Nothing to check', body: 'Your details on Google match yours. The note can take a little while to disappear.'),
              for (final c in d.changes) ...[
                _ChangeCard(change: c, busy: _busy, onKeep: () => _apply(c, keep: true), onUseGoogle: () => _apply(c, keep: false)),
                const SizedBox(height: 12),
              ],
              if (d.mapsUri != null)
                Center(
                  child: TextButton.icon(
                    onPressed: () => launchUrl(Uri.parse(d.mapsUri!), mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.map_outlined, size: 18),
                    label: const Text('See it on Google Maps'),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChangeCard extends StatelessWidget {
  const _ChangeCard({required this.change, required this.busy, required this.onKeep, required this.onUseGoogle});
  final GoogleChange change;
  final String? busy;
  final VoidCallback onKeep;
  final VoidCallback onUseGoogle;

  @override
  Widget build(BuildContext context) {
    final c = change;
    final pin = c.field == 'latlng';
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(c.label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          if (c.mine.isNotEmpty || c.google.isNotEmpty) ...[
            const SizedBox(height: 10),
            _Version(tag: 'Yours', value: c.mine, pin: pin, google: false),
            const SizedBox(height: 8),
            _Version(tag: "Google's version", value: c.google, pin: pin, google: true),
          ],
          const SizedBox(height: 12),
          if (c.editable)
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: busy != null ? null : onKeep,
                  icon: busy == c.field ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.undo_rounded, size: 18),
                  label: const Text('Keep mine'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(onPressed: busy != null ? null : onUseGoogle, icon: const Icon(Icons.check_rounded, size: 18), label: const Text("Use Google's")),
              ),
            ])
          else
            Text.rich(
              TextSpan(
                style: const TextStyle(color: AppColors.muted, fontSize: 13.5),
                children: [
                  TextSpan(text: pin ? '${pinNote(c)} ' : "This can't be changed from RevYne yet. "),
                  TextSpan(
                    text: 'Open Google Business Profile',
                    style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w700),
                    recognizer: TapGestureRecognizer()..onTap = () => launchUrl(Uri.parse('https://business.google.com/'), mode: LaunchMode.externalApplication),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Version extends StatelessWidget {
  const _Version({required this.tag, required this.value, required this.pin, required this.google});
  final String tag;
  final String value;
  final bool pin;
  final bool google;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: google ? AppColors.amberSoft : AppColors.violet50,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tag.toUpperCase(), style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: AppColors.muted, letterSpacing: 0.6)),
            const SizedBox(height: 4),
            Text(value.isEmpty ? 'Not set' : value, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: AppColors.ink)),
            if (pin && value.isNotEmpty && value != 'Not set') ...[
              const SizedBox(height: 8),
              PinMap(query: value),
            ],
          ],
        ),
      );
}

/// "Google moved your pin about 6 m" — distance between the two pins.
String pinNote(GoogleChange c) {
  ({double lat, double lng})? ll(Object? v) {
    if (v is! Map) return null;
    final a = v['latitude'], b = v['longitude'];
    return a is num && b is num ? (lat: a.toDouble(), lng: b.toDouble()) : null;
  }

  final a = ll(c.mineValue), b = ll(c.googleValue);
  if (a == null || b == null) return 'Google changed your map pin. If the spot is wrong, fix it in Google Business Profile.';
  double rad(double d) => d * math.pi / 180;
  final h = math.pow(math.sin(rad(b.lat - a.lat) / 2), 2) + math.cos(rad(a.lat)) * math.cos(rad(b.lat)) * math.pow(math.sin(rad(b.lng - a.lng) / 2), 2);
  final m = 2 * 6371000 * math.asin(math.sqrt(h));
  final dist = m < 1000 ? '${math.max(1, m.round())} m' : '${(m / 1000).toStringAsFixed(1)} km';
  return m < 30
      ? 'Google moved your map pin by about $dist — almost the same spot, so this is usually fine.'
      : 'Google moved your map pin by about $dist. If the new spot is wrong, move it back in Google Business Profile.';
}

/// A small Google map centred on one pin, inside the app, with a link that
/// opens the Google Maps app.
class PinMap extends StatefulWidget {
  const PinMap({super.key, required this.query});
  final String query;

  @override
  State<PinMap> createState() => _PinMapState();
}

class _PinMapState extends State<PinMap> {
  late final WebViewController _web = WebViewController()
    ..setJavaScriptMode(JavaScriptMode.unrestricted)
    ..setBackgroundColor(const Color(0xFFEFEFF4))
    ..setNavigationDelegate(NavigationDelegate(
      // Keep the embed in place; anything it tries to open goes to the Maps app.
      onNavigationRequest: (r) {
        if (r.url.startsWith('https://maps.google.com/maps?') && r.url.contains('output=embed')) return NavigationDecision.navigate;
        if (r.isMainFrame) launchUrl(Uri.parse(r.url), mode: LaunchMode.externalApplication);
        return r.isMainFrame ? NavigationDecision.prevent : NavigationDecision.navigate;
      },
    ))
    ..loadRequest(Uri.parse('https://maps.google.com/maps?q=${Uri.encodeQueryComponent(widget.query)}&z=17&output=embed'));

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              height: 170,
              // A preview: swipes scroll the sheet; "Open in Google Maps" for more.
              child: WebViewWidget(controller: _web),
            ),
          ),
          TextButton.icon(
            style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), visualDensity: VisualDensity.compact),
            onPressed: () => launchUrl(Uri.parse('https://www.google.com/maps?q=${Uri.encodeQueryComponent(widget.query)}'), mode: LaunchMode.externalApplication),
            icon: const Icon(Icons.open_in_new_rounded, size: 16),
            label: const Text('Open in Google Maps'),
          ),
        ],
      );
}
