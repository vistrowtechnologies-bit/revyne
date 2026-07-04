import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';

class PricingScreen extends StatefulWidget {
  const PricingScreen({super.key});

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> {
  UserProfile? _profile;
  bool _loading = true;
  String? _checkoutPlan;
  final Set<String> _selectedLanguages = {'Hindi', 'Tamil'};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _profile = await BusinessService.loadProfile();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _upgrade(String plan) async {
    setState(() => _checkoutPlan = plan);
    try {
      await BusinessService.startPlanCheckout(plan);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _checkoutPlan = null);
    }
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel subscription?'),
        content: const Text('Your plan stays active until the end of the current billing cycle.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep plan')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Cancel it')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await BusinessService.cancelSubscription();
      await _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cancellation scheduled')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _profile?.effectivePlan ?? 'free';
    final status = _profile?.planStatus ?? 'free';

    return Scaffold(
      appBar: AppBar(title: const Text('RevYne')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.margin),
                children: [
                  const Text('Elevate Your Presence', textAlign: TextAlign.center, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primaryContainer)),
                  const SizedBox(height: 6),
                  Text(
                    'Scale your Google Business Profile with AI-powered replies and multi-language support designed for Indian retailers.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 20),
                  _infoRow('Current Plan', plan.toUpperCase().replaceAll('_', ' '), pill: status == 'free' ? 'FREE' : 'ACTIVE'),
                  const SizedBox(height: 12),
                  _infoRow('Account Status', 'Verified', icon: Icons.check_circle_rounded, iconColor: AppColors.success),
                  const SizedBox(height: 12),
                  _infoRow('Next Renewal', _profile?.planCurrentEnd?.split('T').first ?? '-- -- ----'),
                  if (plan != 'free') ...[
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: _cancel,
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                      child: const Text('Cancel Subscription'),
                    ),
                  ],
                  const SizedBox(height: 24),
                  _freeCard(plan == 'free'),
                  const SizedBox(height: 16),
                  _proMonthlyCard(plan == 'pro'),
                  const SizedBox(height: 16),
                  _proMaxCard(plan == 'pro_max'),
                  const SizedBox(height: 16),
                  _proYearlyCard(plan == 'pro_yearly'),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.shield_rounded, size: 16, color: AppColors.primaryContainer),
                      SizedBox(width: 6),
                      Text('Secure payments by Razorpay', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _infoRow(String label, String value, {String? pill, IconData? icon, Color? iconColor}) {
    return AppCard(
      color: AppColors.surfaceContainerLow,
      borderColor: Colors.transparent,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(), style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (icon != null) ...[Icon(icon, size: 16, color: iconColor), const SizedBox(width: 6)],
                    Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
          if (pill != null) StatusPill(label: pill, background: AppColors.surfaceContainerHigh, foreground: AppColors.primaryContainer),
        ],
      ),
    );
  }

  Widget _featureRow(String label, bool included) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          children: [
            Icon(included ? Icons.check_circle_rounded : Icons.remove_circle_outline_rounded, size: 16, color: included ? AppColors.primaryContainer : AppColors.outline),
            const SizedBox(width: 8),
            Expanded(child: Text(label, style: TextStyle(fontSize: 13, color: included ? AppColors.onSurface : AppColors.outline))),
          ],
        ),
      );

  Widget _freeCard(bool current) => AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Free', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 6),
            const Text.rich(TextSpan(children: [
              TextSpan(text: '₹0', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              TextSpan(text: ' /forever', style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
            ])),
            const SizedBox(height: 4),
            const Text('Basic reputation management', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 14),
            _featureRow('20 AI replies per month', true),
            _featureRow('Google Maps sync', true),
            _featureRow('Language translation', false),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: null,
                style: FilledButton.styleFrom(backgroundColor: AppColors.surfaceContainerHigh, disabledBackgroundColor: AppColors.surfaceContainerHigh),
                child: Text(current ? 'Current Plan' : 'Included', style: const TextStyle(color: AppColors.onSurfaceVariant)),
              ),
            ),
          ],
        ),
      );

  Widget _proMonthlyCard(bool current) => AppCard(
        borderColor: AppColors.primaryContainer,
        borderWidth: 1.5,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(child: Text('Pro Monthly', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                StatusPill(label: 'POPULAR', background: AppColors.primaryFixed, foreground: AppColors.primaryContainer),
              ],
            ),
            const SizedBox(height: 6),
            const Text.rich(TextSpan(children: [
              TextSpan(text: '₹149', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              TextSpan(text: ' /mo', style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
            ])),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.primaryFixed, borderRadius: BorderRadius.circular(12)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('SELECT LANGUAGES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryContainer)),
                      StatusPill(label: '${_selectedLanguages.length}/5', background: Colors.white, foreground: AppColors.primaryContainer),
                    ],
                  ),
                  const SizedBox(height: 10),
                  for (final lang in indianLanguages.take(6))
                    CheckboxListTile(
                      value: _selectedLanguages.contains(lang),
                      onChanged: (v) => setState(() {
                        if (v == true && _selectedLanguages.length < 5) {
                          _selectedLanguages.add(lang);
                        } else {
                          _selectedLanguages.remove(lang);
                        }
                      }),
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      title: Text(lang, style: const TextStyle(fontSize: 13)),
                    ),
                  SizedBox(width: double.infinity, child: FilledButton(onPressed: () {}, child: const Text('Save Languages'))),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _featureRow('Unlimited AI Replies', true),
            _featureRow('Premium SEO Insights', true),
            _featureRow('Custom Business Tone', true),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: current || _checkoutPlan != null ? null : () => _upgrade('pro'),
                child: Text(current ? 'Current Plan' : (_checkoutPlan == 'pro' ? 'Opening…' : 'Upgrade Now')),
              ),
            ),
          ],
        ),
      );

  Widget _proMaxCard(bool current) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.inverseSurface, borderRadius: BorderRadius.circular(AppRadius.card)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusPill(label: 'BEST FOR SEO', background: Colors.white24, foreground: Colors.white),
                const Spacer(),
                StatusPill(label: 'NEW', background: AppColors.error, foreground: Colors.white),
              ],
            ),
            const SizedBox(height: 10),
            const Text('Pro Max', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 6),
            const Text.rich(TextSpan(children: [
              TextSpan(text: '₹199', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
              TextSpan(text: ' /mo', style: TextStyle(color: Colors.white70, fontSize: 13)),
            ])),
            const Text('Advanced local ranking tools', style: TextStyle(color: Colors.white70, fontSize: 12)),
            const SizedBox(height: 14),
            for (final f in const ['Competitor Analysis', '24/7 AI Monitoring', 'Review Generation Kit', 'Monthly SEO Report'])
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFFEA5FFE)),
                    const SizedBox(width: 8),
                    Text(f, style: const TextStyle(color: Colors.white, fontSize: 13)),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: const Color(0xFFEA5FFE), foregroundColor: AppColors.inverseSurface),
                onPressed: current || _checkoutPlan != null ? null : () => _upgrade('pro_max'),
                child: Text(current ? 'Current Plan' : (_checkoutPlan == 'pro_max' ? 'Opening…' : 'Go Pro Max')),
              ),
            ),
          ],
        ),
      );

  Widget _proYearlyCard(bool current) => AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(child: Text('Pro Yearly', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                StatusPill(label: 'SAVE 45%', background: AppColors.successContainer, foreground: AppColors.success),
              ],
            ),
            const SizedBox(height: 6),
            const Text.rich(TextSpan(children: [
              TextSpan(text: '₹999', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              TextSpan(text: ' /yr', style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
            ])),
            const Text('Best value for long-term growth', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 14),
            _featureRow('Everything in Pro Monthly', true),
            _featureRow('Priority 24h Support', true),
            _featureRow('1-on-1 SEO Consult', true),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: current || _checkoutPlan != null ? null : () => _upgrade('pro_yearly'),
                child: Text(current ? 'Current Plan' : (_checkoutPlan == 'pro_yearly' ? 'Opening…' : 'Select Yearly')),
              ),
            ),
          ],
        ),
      );
}
