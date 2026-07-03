import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';

/// 3-step onboarding: business details → Google review link → done.
/// Completion is defined by the business row existing in Supabase —
/// no local flags, so it can never wrongly reappear.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onFinished});

  final ValueChanged<Business> onFinished;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0;
  bool _saving = false;
  final _name = TextEditingController();
  final _city = TextEditingController();
  final _googleUrl = TextEditingController();
  final _services = TextEditingController();
  String _category = '';

  @override
  void dispose() {
    _name.dispose();
    _city.dispose();
    _googleUrl.dispose();
    _services.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    setState(() => _saving = true);
    try {
      final saved = await BusinessService.saveBusiness(Business(
        name: _name.text,
        category: _category,
        city: _city.text,
        googleUrl: _googleUrl.text,
        services: _services.text,
      ));
      widget.onFinished(saved);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save your business. Check your connection and try again.')),
        );
        setState(() => _saving = false);
      }
    }
  }

  void _next() {
    if (_step == 0) {
      if (_name.text.trim().isEmpty || _category.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Business name and category are required')),
        );
        return;
      }
      setState(() => _step = 1);
    } else {
      _finish();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Set up your business (${_step + 1}/2)'),
        leading: _step > 0
            ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() => _step = 0))
            : null,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            LinearProgressIndicator(
              value: (_step + 1) / 2,
              backgroundColor: const Color(0xFFEDE9FE),
              color: RevyneTheme.brand,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 28),
            if (_step == 0) ..._stepBusiness() else ..._stepGoogle(),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: _saving ? null : _next,
              child: Text(_saving
                  ? 'Saving…'
                  : _step == 0
                      ? 'Continue'
                      : 'Finish setup'),
            ),
            if (_step == 1)
              TextButton(
                onPressed: _saving ? null : _finish,
                child: const Text('Skip for now — I\'ll add it later'),
              ),
          ],
        ),
      ),
    );
  }

  List<Widget> _stepBusiness() => [
        Text('Tell us about your business',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text('This personalises your review link, QR code, and AI replies.',
            style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 24),
        TextField(
          controller: _name,
          decoration: const InputDecoration(labelText: 'Business name *'),
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _category.isEmpty ? null : _category,
          decoration: const InputDecoration(labelText: 'Category *'),
          items: [
            for (final c in businessCategories) DropdownMenuItem(value: c, child: Text(c)),
          ],
          onChanged: (v) => setState(() => _category = v ?? ''),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _city,
          decoration: const InputDecoration(labelText: 'City'),
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _services,
          decoration: const InputDecoration(
            labelText: 'Top services (comma separated)',
            hintText: 'e.g. haircut, facial, bridal makeup',
          ),
        ),
      ];

  List<Widget> _stepGoogle() => [
        Text('Your Google review link',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(
          'Customers are sent here after writing their review. '
          'Find it in Google Business Profile → "Ask for reviews".',
          style: TextStyle(color: Colors.grey.shade600),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _googleUrl,
          decoration: const InputDecoration(
            labelText: 'Google review URL',
            hintText: 'https://g.page/r/…',
          ),
          keyboardType: TextInputType.url,
        ),
      ];
}
