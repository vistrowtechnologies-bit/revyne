import 'package:flutter/material.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';

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
  late final TextEditingController _keywords = TextEditingController(text: widget.business.keywords);
  late final TextEditingController _serviceType = TextEditingController(text: widget.business.serviceTypes);
  late final TextEditingController _mobile = TextEditingController(text: widget.business.mobile);
  late String _category = widget.business.category;
  late String _tone = widget.business.tone;
  bool _saving = false;
  bool _savingMobile = false;
  bool _showError = false;
  final Set<String> _selectedLanguages = {'English'};

  static const _tones = ['Professional', 'Friendly', 'Enthusiastic'];

  bool get _proMax => widget.business.proMax;

  @override
  void dispose() {
    _name.dispose();
    _city.dispose();
    _googleUrl.dispose();
    _keywords.dispose();
    _serviceType.dispose();
    _mobile.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty || _category.isEmpty || _googleUrl.text.trim().isEmpty) {
      setState(() => _showError = true);
      return;
    }
    setState(() {
      _showError = false;
      _saving = true;
    });
    try {
      final saved = await BusinessService.saveBusiness(Business(
        id: widget.business.id,
        publicToken: widget.business.publicToken,
        name: _name.text,
        category: _category,
        city: _city.text,
        googleUrl: _googleUrl.text,
        keywords: _keywords.text,
        serviceTypes: _serviceType.text,
        language: widget.business.language,
        tone: _tone,
        mobile: widget.business.mobile,
        proMax: widget.business.proMax,
      ));
      widget.onSaved(saved);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Business profile saved')));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save. Check your connection and try again.')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _saveMobile() async {
    final digits = _mobile.text.trim();
    if (!RegExp(r'^\d{10}$').hasMatch(digits)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid 10-digit mobile number')));
      return;
    }
    setState(() => _savingMobile = true);
    try {
      await BusinessService.saveProfileContactInfo(name: '', mobile: digits);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Mobile number saved')));
    } finally {
      if (mounted) setState(() => _savingMobile = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.margin),
        children: [
          if (_showError)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.errorContainer, borderRadius: BorderRadius.circular(14)),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.onErrorContainer, size: 20),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text('Please fill required fields (*) before saving',
                        style: TextStyle(color: AppColors.onErrorContainer, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.surfaceContainerHigh,
                  child: Text(
                    widget.business.name.isNotEmpty ? widget.business.name[0].toUpperCase() : 'R',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.primaryContainer),
                  ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: AppColors.primaryContainer, shape: BoxShape.circle),
                    child: const Icon(Icons.edit_rounded, size: 14, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(onPressed: () {}, child: const Text('Upload Picture')),
          ),
          const SizedBox(height: 12),
          const Text('Business Name*', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(controller: _name, decoration: const InputDecoration(hintText: 'e.g. Acme Solutions'), textCapitalization: TextCapitalization.words),
          const SizedBox(height: 16),
          const Text('Category*', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _category.isEmpty ? null : _category,
            decoration: const InputDecoration(hintText: 'Select Category'),
            items: [for (final c in businessCategories) DropdownMenuItem(value: c, child: Text(c))],
            onChanged: (v) => setState(() => _category = v ?? ''),
          ),
          const SizedBox(height: 16),
          const Text('City', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(controller: _city, decoration: const InputDecoration(hintText: 'Enter City'), textCapitalization: TextCapitalization.words),
          const SizedBox(height: 16),
          Row(
            children: const [
              Text('Google Review URL*', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              SizedBox(width: 6),
              Icon(Icons.info_outline_rounded, size: 15, color: AppColors.outline),
            ],
          ),
          const SizedBox(height: 8),
          TextField(controller: _googleUrl, decoration: const InputDecoration(hintText: 'https://g.page/r/…'), keyboardType: TextInputType.url),
          const SizedBox(height: 16),
          const Text('Keywords', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(controller: _keywords, maxLines: 2, decoration: const InputDecoration(hintText: 'Service, Quality, Fast Delivery…')),
          const SizedBox(height: 20),
          AppCard(
            borderColor: _proMax ? AppColors.primaryContainer : AppColors.outlineVariant,
            borderWidth: _proMax ? 1.5 : 1,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('Pro Max Personalization', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.primaryContainer)),
                    ),
                    StatusPill(
                      label: _proMax ? 'ENABLED' : 'PRO MAX',
                      background: _proMax ? AppColors.primaryContainer : AppColors.surfaceContainerHigh,
                      foreground: _proMax ? Colors.white : AppColors.onSurfaceVariant,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Opacity(
                  opacity: _proMax ? 1 : 0.5,
                  child: IgnorePointer(
                    ignoring: !_proMax,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: AppColors.primaryFixed, borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.check_circle_rounded, color: AppColors.primaryContainer, size: 16),
                              SizedBox(width: 6),
                              Text('5 Main Services Unlocked', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                            ],
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _serviceType,
                            decoration: const InputDecoration(hintText: 'Service Type (e.g. Web Development)', filled: true, fillColor: Colors.white),
                          ),
                          const SizedBox(height: 6),
                          const Text('Specify the core services you want AI to emphasize in replies.',
                              style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            color: AppColors.surfaceContainerLow,
            borderColor: Colors.transparent,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(child: Text('Language Support', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15))),
                    if (_proMax)
                      const Row(
                        children: [
                          Icon(Icons.check_circle_rounded, color: AppColors.primaryContainer, size: 14),
                          SizedBox(width: 4),
                          Text('Pro Max', style: TextStyle(fontSize: 12, color: AppColors.primaryContainer, fontWeight: FontWeight.w600)),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final lang in (_proMax ? indianLanguages : const ['English', 'Hindi']))
                      SelectChip(
                        label: lang,
                        dense: true,
                        selected: _selectedLanguages.contains(lang),
                        onTap: () => setState(() {
                          if (_selectedLanguages.contains(lang)) {
                            _selectedLanguages.remove(lang);
                          } else {
                            _selectedLanguages.add(lang);
                          }
                        }),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                if (_proMax)
                  const Row(
                    children: [
                      Icon(Icons.check_rounded, color: AppColors.success, size: 16),
                      SizedBox(width: 6),
                      Text('All 24 Indian languages included', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  )
                else
                  Row(
                    children: [
                      const Text('Free plan: English & Hindi only. ', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                      TextButton(
                        onPressed: () {},
                        style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                        child: const Text('Upgrade', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Default Reply Tone', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          Row(
            children: [
              for (final t in _tones)
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: t != _tones.last ? 8 : 0),
                    child: OutlinedButton(
                      onPressed: () => setState(() => _tone = t),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: _tone == t ? AppColors.primaryFixed : Colors.white,
                        side: BorderSide(color: _tone == t ? AppColors.primaryContainer : AppColors.outlineVariant),
                        foregroundColor: _tone == t ? AppColors.primaryContainer : AppColors.onSurface,
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                      ),
                      child: FittedBox(child: Text(t, style: const TextStyle(fontSize: 13))),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          const Text('Mobile Number', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _mobile,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(prefixText: '+91  ', hintText: '98765 43210'),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 52,
                child: FilledButton(onPressed: _savingMobile ? null : _saveMobile, child: Text(_savingMobile ? '…' : 'Save')),
              ),
            ],
          ),
          const SizedBox(height: 28),
          FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Update Profile')),
        ],
      ),
    );
  }
}
