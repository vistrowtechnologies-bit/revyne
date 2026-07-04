import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';

/// 3-step onboarding: business details → top products → connect Google.
/// Completion is defined by the business row existing in Supabase —
/// no local flags, so it can never wrongly reappear.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onFinished});

  final ValueChanged<Business> onFinished;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 1;
  bool _saving = false;
  String? _error;
  final _name = TextEditingController();
  final _city = TextEditingController();
  final _googleUrl = TextEditingController();
  final _productInput = TextEditingController();
  String _category = '';
  bool _consent = false;
  final List<String> _products = [];
  Business? _savedBusiness;

  @override
  void dispose() {
    _name.dispose();
    _city.dispose();
    _googleUrl.dispose();
    _productInput.dispose();
    super.dispose();
  }

  Future<void> _finish({bool skipped = false}) async {
    setState(() => _saving = true);
    try {
      final saved = await BusinessService.saveBusiness(Business(
        id: _savedBusiness?.id,
        publicToken: _savedBusiness?.publicToken,
        name: _name.text,
        category: _category,
        city: _city.text,
        googleUrl: _googleUrl.text,
        services: _products.join(', '),
      ));
      widget.onFinished(saved);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save your business. Check your connection and try again.')),
        );
        setState(() => _saving = false);
      }
    }
  }

  void _addProduct() {
    final tag = _productInput.text.trim();
    if (tag.isEmpty || _products.length >= 5 || _products.contains(tag)) return;
    setState(() {
      _products.add(tag);
      _productInput.clear();
    });
  }

  void _next() {
    if (_step == 1) {
      if (_name.text.trim().isEmpty || _category.isEmpty) {
        setState(() => _error = 'Business name and type are required.');
        return;
      }
      setState(() {
        _error = null;
        _step = 2;
      });
    } else if (_step == 2) {
      setState(() => _step = 3);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RevYne'),
        automaticallyImplyLeading: _step > 1,
        leading: _step > 1
            ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() => _step -= 1))
            : null,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          children: [
            StepDots(labels: const ['Business', 'Products', 'Google'], currentStep: _step),
            const SizedBox(height: 28),
            if (_step == 1) ..._stepBusiness() else if (_step == 2) ..._stepProducts() else ..._stepGoogle(),
          ],
        ),
      ),
    );
  }

  List<Widget> _stepBusiness() => [
        const Text('Tell us about your business',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.onSurface)),
        const SizedBox(height: 6),
        Text('This personalises your review link, QR code, and AI replies.',
            style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 20),
        AppCard(
          child: Column(
            children: [
              TextField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Business Name *'),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _category.isEmpty ? null : _category,
                decoration: const InputDecoration(labelText: 'Business Type *'),
                items: [for (final c in businessCategories) DropdownMenuItem(value: c, child: Text(c))],
                onChanged: (v) => setState(() => _category = v ?? ''),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _city,
                decoration: const InputDecoration(labelText: 'City (Optional)'),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: () => setState(() => _consent = !_consent),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(value: _consent, onChanged: (v) => setState(() => _consent = v ?? false)),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text('I allow RevYne to collect and display my Google reviews on my behalf.',
                            style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
        ],
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: _next,
          label: const Text('Continue'),
          icon: const Icon(Icons.arrow_forward_rounded, size: 18),
          iconAlignment: IconAlignment.end,
        ),
        const SizedBox(height: 16),
        Text(
          'By continuing, you agree to our Terms of Service and Privacy Policy.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
        ),
      ];

  List<Widget> _stepProducts() {
    final catMeta = _category;
    return [
      const Text('What do you offer?', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      Text('Add up to 5 top products or services — these personalise your AI-generated reviews.',
          style: TextStyle(color: Colors.grey.shade600)),
      const SizedBox(height: 20),
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [for (final p in _products) RemovableTag(label: p, onRemove: () => setState(() => _products.remove(p)))],
            ),
            if (_products.isNotEmpty) const SizedBox(height: 12),
            if (_products.length < 5)
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _productInput,
                      decoration: const InputDecoration(hintText: 'e.g. WiFi, Latte, Outdoor'),
                      onSubmitted: (_) => _addProduct(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton(onPressed: _addProduct, child: const Text('Add')),
                ],
              ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.primaryFixed, borderRadius: BorderRadius.circular(14)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.lightbulb_outline_rounded, color: AppColors.primaryContainer, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Mentioning specific offerings helps the AI write more authentic and convincing responses for your customers.',
                      style: const TextStyle(fontSize: 13, color: AppColors.primaryContainer),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 24),
      Row(
        children: [
          SizedBox(
            width: 56,
            height: 52,
            child: OutlinedButton(
              onPressed: () => setState(() => _step = 1),
              style: OutlinedButton.styleFrom(padding: EdgeInsets.zero),
              child: const Icon(Icons.arrow_back_rounded),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: FilledButton.icon(
              onPressed: _next,
              label: const Text('Continue'),
              icon: const Icon(Icons.arrow_forward_rounded, size: 18),
              iconAlignment: IconAlignment.end,
            ),
          ),
        ],
      ),
      const SizedBox(height: 12),
      Center(
        child: TextButton(onPressed: _next, child: const Text('Skip this step')),
      ),
      if (catMeta.isEmpty) const SizedBox.shrink(),
    ];
  }

  List<Widget> _stepGoogle() {
    const features = [
      (Icons.bar_chart_rounded, AppColors.primaryContainer, AppColors.primaryFixed, 'Health Score', 'Track your online reputation strength.'),
      (Icons.star_rounded, Color(0xFFA200BA), Color(0xFFFCE7FF), 'Reviews Inbox', 'Centralize customer feedback instantly.'),
      (Icons.campaign_rounded, Color(0xFF4648D4), Color(0xFFE4E3FF), 'Post Updates', 'Schedule posts to Google effortlessly.'),
      (Icons.auto_awesome_rounded, AppColors.primaryContainer, AppColors.primaryFixed, 'AI Replies', 'Smart, context-aware review responses.'),
    ];

    return [
      const Text('Connect Google Business', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      Text('Sync your profile to unlock professional growth tools and AI automation.',
          style: TextStyle(color: Colors.grey.shade600)),
      const SizedBox(height: 20),
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.05,
        children: [
          for (final (icon, iconColor, iconBg, title, desc) in features)
            AppCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
                    child: Icon(icon, color: iconColor, size: 18),
                  ),
                  const SizedBox(height: 10),
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(desc, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                ],
              ),
            ),
        ],
      ),
      const SizedBox(height: 16),
      AppCard(
        color: AppColors.surfaceContainerLow,
        borderColor: Colors.transparent,
        padding: const EdgeInsets.all(14),
        child: const Row(
          children: [
            Icon(Icons.verified_user_rounded, color: AppColors.primaryContainer, size: 20),
            SizedBox(width: 10),
            Expanded(
              child: Text.rich(
                TextSpan(children: [
                  TextSpan(text: '100% Safe & Secure', style: TextStyle(fontWeight: FontWeight.w700)),
                  TextSpan(text: ' — RevYne never posts without your explicit approval.'),
                ]),
                style: TextStyle(fontSize: 12.5, color: AppColors.onSurface),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 28),
      FilledButton.icon(
        onPressed: _saving ? null : () => _finish(),
        icon: _saving
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.g_mobiledata_rounded),
        label: Text(_saving ? 'Saving…' : 'Connect with Google'),
      ),
      const SizedBox(height: 12),
      Center(
        child: TextButton(
          onPressed: _saving ? null : () => _finish(skipped: true),
          child: const Text('Skip & go to dashboard →'),
        ),
      ),
    ];
  }
}
