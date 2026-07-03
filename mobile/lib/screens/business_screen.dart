import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';

class BusinessScreen extends StatefulWidget {
  const BusinessScreen({super.key, required this.business, required this.onSaved});

  final Business business;
  final ValueChanged<Business> onSaved;

  @override
  State<BusinessScreen> createState() => _BusinessScreenState();
}

class _BusinessScreenState extends State<BusinessScreen> {
  late final TextEditingController _name = TextEditingController(text: widget.business.name);
  late final TextEditingController _city = TextEditingController(text: widget.business.city);
  late final TextEditingController _googleUrl = TextEditingController(text: widget.business.googleUrl);
  late final TextEditingController _services = TextEditingController(text: widget.business.services);
  late String _category = widget.business.category;
  late String _tone = widget.business.tone;
  bool _saving = false;

  static const _tones = ['Professional', 'Friendly', 'Enthusiastic'];

  @override
  void dispose() {
    _name.dispose();
    _city.dispose();
    _googleUrl.dispose();
    _services.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty || _category.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Business name and category are required')));
      return;
    }
    setState(() => _saving = true);
    try {
      final saved = await BusinessService.saveBusiness(Business(
        id: widget.business.id,
        publicToken: widget.business.publicToken,
        name: _name.text,
        category: _category,
        city: _city.text,
        googleUrl: _googleUrl.text,
        services: _services.text,
        language: widget.business.language,
        tone: _tone,
      ));
      widget.onSaved(saved);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Business profile saved')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not save. Check your connection and try again.')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('My Business',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Business name *'),
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _category.isEmpty ? null : _category,
            decoration: const InputDecoration(labelText: 'Category *'),
            items: [for (final c in businessCategories) DropdownMenuItem(value: c, child: Text(c))],
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
            controller: _googleUrl,
            decoration: const InputDecoration(labelText: 'Google review URL'),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _services,
            decoration: const InputDecoration(labelText: 'Top services (comma separated)'),
          ),
          const SizedBox(height: 16),
          Text('Reply tone', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final t in _tones)
                ChoiceChip(
                  label: Text(t),
                  selected: _tone == t,
                  selectedColor: RevyneTheme.brand.withValues(alpha: 0.15),
                  onSelected: (_) => setState(() => _tone = t),
                ),
            ],
          ),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Saving…' : 'Save profile'),
          ),
        ],
      ),
    );
  }
}
