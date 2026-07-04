import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  UserProfile? _profile;
  List<PaymentEvent> _events = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([BusinessService.loadProfile(), BusinessService.loadPaymentEvents()]);
      _profile = results[0] as UserProfile?;
      _events = results[1] as List<PaymentEvent>;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  ({String title, Color color}) _summaryFor(PaymentEvent e) {
    switch (e.eventName) {
      case 'payment.captured':
        return (title: 'Payment received', color: AppColors.success);
      case 'subscription.activated':
      case 'subscription.authenticated':
        return (title: 'Subscription active', color: AppColors.success);
      case 'subscription.charged':
        return (title: 'Subscription renewed', color: AppColors.success);
      case 'subscription.cancel_requested':
        return (title: 'Cancellation scheduled', color: const Color(0xFFB45309));
      case 'subscription.cancelled':
      case 'subscription.completed':
      case 'subscription.expired':
        return (title: 'Subscription ended', color: AppColors.onSurfaceVariant);
      default:
        return (title: e.eventName.replaceAll('_', ' '), color: AppColors.onSurfaceVariant);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _profile?.effectivePlan ?? 'free';

    return Scaffold(
      appBar: AppBar(title: const Text('Order History'), actions: [
        IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
      ]),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.margin),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: AppCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('CURRENT PLAN', style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              Text(plan.toUpperCase().replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              const SizedBox(height: 6),
                              StatusPill(label: plan == 'free' ? 'FREE' : 'ACTIVE', background: AppColors.primaryFixed, foreground: AppColors.primaryContainer),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('NEXT BILLING', style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              Text(_profile?.planCurrentEnd?.split('T').first ?? '—', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              const SizedBox(height: 6),
                              Text(plan == 'free' ? 'No active plan' : 'Auto-renew on', style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (plan != 'free')
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Manage Subscription', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 6),
                          const Text('Your plan includes AI replies and priority Google profile support.',
                              style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                          const SizedBox(height: 14),
                          SizedBox(width: double.infinity, child: FilledButton(onPressed: () {}, child: const Text('Upgrade Plan'))),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () async {
                                try {
                                  await BusinessService.cancelSubscription();
                                  _load();
                                } catch (e) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
                                  }
                                }
                              },
                              style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                              child: const Text('Cancel Subscription'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),
                  const Text('Payment History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  if (_events.isEmpty)
                    const EmptyState(
                      title: 'No invoices yet',
                      body: 'Your subscription payments will appear here after Razorpay confirms them.',
                    )
                  else
                    for (final e in _events)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: AppCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10)),
                                child: const Icon(Icons.receipt_long_rounded, color: AppColors.primaryContainer, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(_summaryFor(e).title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                    Text(e.createdAt?.toString().split(' ').first ?? '', style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  StatusPill(label: e.status ?? 'received', background: AppColors.successContainer, foreground: AppColors.success),
                                  const SizedBox(height: 4),
                                  Text(e.amountLabel, style: const TextStyle(fontWeight: FontWeight.w700)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.outlineVariant, style: BorderStyle.solid),
                      borderRadius: BorderRadius.circular(AppRadius.card),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.support_agent_rounded, color: AppColors.outline, size: 28),
                        const SizedBox(height: 10),
                        const Text('Need help with billing?', style: TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Our support team is available 24/7 for payment queries.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        const SizedBox(height: 8),
                        TextButton(onPressed: () {}, child: const Text('Contact RevYne Support')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
