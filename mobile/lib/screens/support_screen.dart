import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<SupportTicket> _tickets = [];
  bool _loading = true;
  bool _submitting = false;
  String _category = 'general';
  final _subject = TextEditingController();
  final _message = TextEditingController();
  int? _expandedFaq;

  static const _categories = {
    'general': 'General question',
    'bug_report': 'Bug report',
    'login': 'Login or account access',
    'payment': 'Payment or subscription',
    'ai_generation': 'AI review / reply generation',
    'review_page': 'Public review page or QR code',
    'business_profile': 'Business profile setup',
  };

  static const _faqs = [
    ('How does AI Reply generate responses?', 'RevYne sends the review text and your business tone/language settings to our AI model, which drafts 2 professional replies you can copy or post directly.'),
    ('Can I link multiple Google Business accounts?', 'Currently one Google Business location can be connected per RevYne account. Disconnect and reconnect to switch locations.'),
    ('Is my business data secure?', 'Yes — RevYne uses Supabase with row-level security, so only you can access your business data. Google tokens are stored server-side and never exposed to the app.'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _tickets = await BusinessService.loadSupportTickets();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _submit() async {
    if (_subject.text.trim().isEmpty || _message.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add a subject and describe the issue')));
      return;
    }
    setState(() => _submitting = true);
    try {
      await BusinessService.createSupportTicket(category: _category, subject: _subject.text, message: _message.text);
      _subject.clear();
      _message.clear();
      await _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Support ticket created')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'resolved':
      case 'closed':
        return AppColors.success;
      case 'in_review':
        return const Color(0xFFB45309);
      default:
        return AppColors.primaryContainer;
    }
  }

  @override
  Widget build(BuildContext context) {
    const categoryTiles = [
      (Icons.rocket_launch_rounded, 'Getting Started'),
      (Icons.auto_awesome_rounded, 'AI Generation'),
      (Icons.credit_card_rounded, 'Billing & Subs'),
      (Icons.security_rounded, 'Security & Privacy'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('RevYne')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            const Text('How can we help you?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            TextField(decoration: const InputDecoration(hintText: 'Search for help articles…', prefixIcon: Icon(Icons.search_rounded))),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.2,
              children: [
                for (final (icon, label) in categoryTiles)
                  AppCard(
                    color: AppColors.surfaceContainerLow,
                    borderColor: Colors.transparent,
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(icon, color: AppColors.primaryContainer, size: 20),
                        const SizedBox(height: 6),
                        Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Frequently Asked Questions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            for (var i = 0; i < _faqs.length; i++)
              Theme(
                data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: Text(_faqs[i].$1, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  initiallyExpanded: _expandedFaq == i,
                  onExpansionChanged: (v) => setState(() => _expandedFaq = v ? i : null),
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_faqs[i].$2, style: const TextStyle(fontSize: 12.5, color: AppColors.onSurfaceVariant)),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Raise a Ticket', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  const Text('Need more help? Our team responds within 24 hours.', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 16),
                  const Text('Category', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _category,
                    items: [for (final e in _categories.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
                    onChanged: (v) => setState(() => _category = v ?? 'general'),
                  ),
                  const SizedBox(height: 14),
                  const Text('Subject', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  TextField(controller: _subject, decoration: const InputDecoration(hintText: 'Briefly describe the issue')),
                  const SizedBox(height: 14),
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  TextField(controller: _message, maxLines: 4, decoration: const InputDecoration(hintText: "Tell us more about what's happening…")),
                  const SizedBox(height: 10),
                  const Row(
                    children: [
                      Icon(Icons.info_outline_rounded, size: 14, color: AppColors.outline),
                      SizedBox(width: 6),
                      Expanded(child: Text('Bug reports, login, and payment issues are marked high priority automatically.', style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant, fontStyle: FontStyle.italic))),
                    ],
                  ),
                  const SizedBox(height: 14),
                  FilledButton(onPressed: _submitting ? null : _submit, child: Text(_submitting ? 'Submitting…' : 'Submit Ticket')),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Your Recent Tickets', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            if (_loading)
              const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
            else if (_tickets.isEmpty)
              const EmptyState(title: 'No tickets yet', body: 'When you raise a ticket, it will appear here with live status updates.')
            else
              for (final t in _tickets)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            StatusPill(label: _categories[t.category] ?? t.category, background: AppColors.surfaceContainerHigh, foreground: AppColors.onSurfaceVariant),
                            const Spacer(),
                            StatusPill(label: t.status.replaceAll('_', ' ').toUpperCase(), background: _statusColor(t.status).withValues(alpha: 0.15), foreground: _statusColor(t.status)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(t.subject, style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(t.message, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                        if (t.adminResponse != null && t.adminResponse!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: AppColors.primaryFixed, borderRadius: BorderRadius.circular(10)),
                            child: Text('Support reply: ${t.adminResponse}', style: const TextStyle(fontSize: 12)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
