import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import 'review_link_card.dart';

/// Get Reviews tab: QR/link for the counter + a WhatsApp request to one customer.
class GetReviewsScreen extends ConsumerWidget {
  const GetReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(myBusinessProvider).value;

    return Scaffold(
      appBar: AppBar(title: const Text('Get Reviews')),
      body: business == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                const Text('Your review QR code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: AppSpacing.xs),
                const Text(
                  'Put it on your counter, bill or packaging. Every customer sees the option to post on Google.',
                  style: TextStyle(color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: AppSpacing.md),
                ReviewLinkCard(business: business),
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'Ask a customer on WhatsApp'),
                const SizedBox(height: AppSpacing.sm),
                const _WhatsAppRequestForm(),
              ],
            ),
    );
  }
}

class _WhatsAppRequestForm extends ConsumerStatefulWidget {
  const _WhatsAppRequestForm();

  @override
  ConsumerState<_WhatsAppRequestForm> createState() => _WhatsAppRequestFormState();
}

class _WhatsAppRequestFormState extends ConsumerState<_WhatsAppRequestForm> {
  final _name = TextEditingController();
  final _phone = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  bool get _phoneValid => _phone.text.replaceAll(RegExp(r'\D'), '').length >= 10;

  Future<void> _send() async {
    final business = ref.read(myBusinessProvider).value;
    if (business == null || !_phoneValid) return;
    final ok = await openWhatsApp(reviewRequestMessage(business, customerName: _name.text), phone: _phone.text);
    if (!mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('WhatsApp is not installed.')));
    } else {
      _name.clear();
      _phone.clear();
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Customer name (optional)'),
          ),
          const SizedBox(height: AppSpacing.gutter),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(labelText: 'WhatsApp number', prefixText: '+91 '),
          ),
          const SizedBox(height: AppSpacing.md),
          FilledButton.icon(
            onPressed: _phoneValid ? _send : null,
            icon: const Icon(Icons.send_rounded),
            label: const Text('Send on WhatsApp'),
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'Opens WhatsApp with a ready message — you press send. Only message customers who visited you.',
            style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
