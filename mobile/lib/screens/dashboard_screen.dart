import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../services/gmb_service.dart';
import '../widgets/ui.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.business, this.onOpenTab});

  final Business business;
  /// Lets Growth Actions / cards jump to another bottom-nav tab (0-4).
  final ValueChanged<int>? onOpenTab;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats _stats = const DashboardStats();
  UserProfile? _profile;
  GmbStatus _gmb = const GmbStatus(connected: false);
  int? _gmbHealthScore;
  bool _loading = true;

  String get _reviewUrl {
    final token = widget.business.publicToken;
    return token == null || token.isEmpty
        ? '${AppConfig.publicReviewBase}/#review'
        : '${AppConfig.publicReviewBase}/#review/$token';
  }

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        if (widget.business.id != null) BusinessService.loadStats(widget.business.id!) else Future.value(const DashboardStats()),
        BusinessService.loadProfile(),
        GmbService.getStatus(),
      ]);
      _stats = results[0] as DashboardStats;
      _profile = results[1] as UserProfile?;
      _gmb = results[2] as GmbStatus;
      if (_gmb.connected) {
        GmbService.getHealthScore().then((r) {
          if (mounted) setState(() => _gmbHealthScore = r.$1);
        }).catchError((_) {});
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _shareOnWhatsApp() async {
    final biz = widget.business.name.isEmpty ? 'our business' : widget.business.name;
    final msg = Uri.encodeComponent(
        'Hi! Thank you for visiting $biz. We\'d love your feedback! ⭐\n\nLeave us a Google review (takes 30 seconds): $_reviewUrl\n\nThank you! 🙏');
    final uri = Uri.parse('https://wa.me/?text=$msg');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.business;
    final plan = (_profile?.effectivePlan ?? 'free').toUpperCase().replaceAll('_', ' ');

    // Growth Actions progress
    final profileFields = [b.name, b.category, b.city, b.googleUrl, b.services];
    final profileDone = profileFields.where((f) => f.isNotEmpty).length;
    final weekReviews = _stats.recent.where((r) {
      final d = DateTime.tryParse((r['created_at'] ?? '').toString());
      if (d == null) return false;
      return DateTime.now().difference(d).inDays < 7;
    }).length;
    final gmbDone = _gmb.connected ? 1 : 0;
    final actions = [
      ('✏️', 'Complete Profile', profileDone, 5, 2),
      ('💬', 'Request Reviews', weekReviews.clamp(0, 5), 5, -1),
      ('📊', 'Connect Google', gmbDone, 1, 3),
      ('✦', 'Reply to Reviews', 0, 5, 1),
    ];
    final totalComplete = actions.where((a) => a.$3 >= a.$4).length;
    final overallPct = ((totalComplete / actions.length) * 100).round();

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            Row(
              children: [
                const Text('RevYne', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primaryContainer)),
                const Spacer(),
                const Icon(Icons.notifications_none_rounded, color: AppColors.onSurfaceVariant),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text('Welcome back, ${b.name.isEmpty ? 'there' : b.name} 👋',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                ),
                StatusPill(label: '$plan PLAN', background: AppColors.surfaceContainerHigh, foreground: AppColors.primaryContainer),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    label: 'Avg Rating',
                    value: _loading ? '…' : (_stats.totalReviews == 0 ? '—' : _stats.avgRating.toStringAsFixed(1)),
                    trailing: IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: _refresh,
                      icon: const Icon(Icons.refresh_rounded, size: 18, color: AppColors.primaryContainer),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: MetricTile(label: 'Reviews', value: _loading ? '…' : '${_stats.totalReviews}', caption: '+$weekReviews this week'),
                ),
                const SizedBox(width: 10),
                Expanded(child: MetricTile(label: 'AI Replies', value: _loading ? '…' : '0', caption: 'this month')),
              ],
            ),
            const SizedBox(height: 16),
            _gmbCard(),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome_rounded, color: AppColors.primaryContainer, size: 20),
                      const SizedBox(width: 8),
                      const Text('Growth Actions', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      Text('  $totalComplete of ${actions.length} done', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                      const Spacer(),
                      StatusPill(
                        label: '$overallPct%',
                        background: overallPct >= 75 ? AppColors.successContainer : AppColors.warningContainer,
                        foreground: overallPct >= 75 ? AppColors.success : const Color(0xFFB45309),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  for (final (icon, label, done, total, tabIndex) in actions)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: tabIndex >= 0 ? () => widget.onOpenTab?.call(tabIndex) : _shareOnWhatsApp,
                        child: Row(
                          children: [
                            Text(icon, style: const TextStyle(fontSize: 16)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            ),
                            Text(
                              done >= total ? 'Done' : '$done/$total',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: done >= total ? AppColors.success : AppColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ...[
                    for (final action in actions)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: action.$4 == 0 ? 0 : (action.$3 / action.$4).clamp(0, 1),
                            minHeight: 4,
                            backgroundColor: AppColors.surfaceContainerHigh,
                            valueColor: AlwaysStoppedAnimation(action.$3 >= action.$4 ? AppColors.success : AppColors.primaryContainer),
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              borderRadius: BorderRadius.circular(AppRadius.card),
              onTap: () => widget.onOpenTab?.call(1),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primaryContainer, AppColors.tertiaryContainer]),
                  borderRadius: BorderRadius.circular(AppRadius.card),
                ),
                child: Stack(
                  children: [
                    const Positioned(right: -6, top: -6, child: Icon(Icons.auto_awesome, color: Colors.white24, size: 64)),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Smart Reply Ready', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        const Text('Paste a real customer review and generate professional draft replies instantly.',
                            style: TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primaryContainer),
                            onPressed: () => widget.onOpenTab?.call(1),
                            child: const Text('Generate Reply'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              color: const Color(0xFFECFDF5),
              borderColor: Colors.transparent,
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(color: Color(0xFF25D366), shape: BoxShape.circle),
                    child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Request via WhatsApp', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                        Text('Send links directly to customers.', style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF25D366), minimumSize: const Size(0, 40)),
                    onPressed: _shareOnWhatsApp,
                    child: const Text('Request'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(colors: [
                        Color(0xFF4285F4), Color(0xFFEA4335), Color(0xFFFBBC05), Color(0xFF34A853), Color(0xFF4285F4),
                      ]),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                      child: QrImageView(data: _reviewUrl, size: 170),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10)),
                    child: Row(
                      children: [
                        Expanded(child: Text(_reviewUrl, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13))),
                        InkWell(
                          onTap: () async {
                            await Clipboard.setData(ClipboardData(text: _reviewUrl));
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review link copied')));
                            }
                          },
                          child: const Icon(Icons.copy_rounded, size: 18, color: AppColors.primaryContainer),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            await Clipboard.setData(ClipboardData(text: _reviewUrl));
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review link copied')));
                            }
                          },
                          child: const Text('Download'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        width: 52,
                        child: OutlinedButton(
                          onPressed: _shareOnWhatsApp,
                          style: OutlinedButton.styleFrom(padding: EdgeInsets.zero),
                          child: const Icon(Icons.print_outlined, size: 20),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SectionHeader(title: 'Recent Reviews', action: _stats.totalReviews > 5 ? 'View All' : null),
            const SizedBox(height: 10),
            if (_stats.recent.isEmpty)
              EmptyState(
                title: _loading ? 'Loading…' : 'No sessions yet',
                body: 'Once a customer scans your QR, generates a draft, and copies it — it\'ll appear here.',
              )
            else
              for (final r in _stats.recent)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: AppColors.primaryFixed,
                              child: Text('${r['rating'] ?? '-'}', style: const TextStyle(color: AppColors.primaryContainer, fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(width: 10),
                            Row(children: List.generate(5, (i) => Icon(
                              i < ((r['rating'] ?? 0) as num) ? Icons.star_rounded : Icons.star_outline_rounded,
                              size: 16, color: const Color(0xFFFBBC05)))),
                            const Spacer(),
                            Text((r['created_at'] ?? '').toString().split('T').first, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          (r['customer_experience'] ?? 'No message left').toString(),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => widget.onOpenTab?.call(1),
                                style: OutlinedButton.styleFrom(minimumSize: const Size(0, 38), padding: const EdgeInsets.symmetric(horizontal: 8)),
                                child: const Text('✦ Generate Reply', style: TextStyle(fontSize: 12)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextButton(
                                onPressed: () {},
                                style: TextButton.styleFrom(minimumSize: const Size(0, 38), foregroundColor: AppColors.onSurfaceVariant),
                                child: const Text('Ignore', style: TextStyle(fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Widget _gmbCard() {
    if (!_gmb.connected) {
      return InkWell(
        onTap: () => widget.onOpenTab?.call(3),
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: AppCard(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.g_mobiledata_rounded, color: Color(0xFF4285F4), size: 26),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Connect Google Business', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    Text('Track health score & reply to reviews with AI.', style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.outline),
            ],
          ),
        ),
      );
    }
    return InkWell(
      onTap: () => widget.onOpenTab?.call(3),
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: AppCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            ScoreRing(score: _gmbHealthScore, size: 64, strokeWidth: 6),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_gmb.locationName ?? 'Google Business', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 4),
                  const Row(
                    children: [
                      Icon(Icons.circle, size: 8, color: AppColors.success),
                      SizedBox(width: 6),
                      Text('Connected', style: TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
