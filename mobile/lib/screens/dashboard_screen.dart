import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../services/business_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.business});

  final Business business;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats _stats = const DashboardStats();
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
    if (widget.business.id == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    try {
      _stats = await BusinessService.loadStats(widget.business.id!);
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
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Welcome back${b.name.isEmpty ? '' : ', ${b.name}'} 👋',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _MetricCard(
                    label: 'Average rating',
                    value: _loading
                        ? '…'
                        : _stats.totalReviews == 0
                            ? '—'
                            : _stats.avgRating.toStringAsFixed(1),
                    icon: Icons.star_rounded,
                    color: const Color(0xFFFBBC05),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MetricCard(
                    label: 'Reviews collected',
                    value: _loading ? '…' : '${_stats.totalReviews}',
                    icon: Icons.reviews_rounded,
                    color: RevyneTheme.brand,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Text('Your Review QR',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text('Customers scan this to leave a Google review',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFEDE9FE), width: 2),
                      ),
                      child: QrImageView(data: _reviewUrl, size: 190),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              await Clipboard.setData(ClipboardData(text: _reviewUrl));
                              if (context.mounted) {
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(const SnackBar(content: Text('Review link copied')));
                              }
                            },
                            icon: const Icon(Icons.copy_rounded, size: 18),
                            label: const Text('Copy link'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: _shareOnWhatsApp,
                            icon: const Icon(Icons.share_rounded, size: 18),
                            label: const Text('WhatsApp'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Recent review sessions',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            if (_stats.recent.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    _loading ? 'Loading…' : 'No sessions yet. Share your QR to start collecting reviews.',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                ),
              )
            else
              for (final r in _stats.recent)
                Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    leading: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFFBBC05), size: 20),
                        Text('${r['rating'] ?? '-'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      ],
                    ),
                    title: Text(
                      (r['customer_experience'] ?? 'No message left').toString(),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      (r['created_at'] ?? '').toString().split('T').first,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value, required this.icon, required this.color});

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }
}
