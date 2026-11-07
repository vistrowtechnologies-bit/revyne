import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business.dart';
import '../business/business_repository.dart';
import '../onboarding/options.dart';

/// Edit the RevYne-only preferences: products, reply tone, review languages.
class BusinessSettingsSheet extends ConsumerStatefulWidget {
  const BusinessSettingsSheet({super.key, required this.business});

  final Business business;

  static Future<void> show(BuildContext context, Business business) => showModalBottomSheet(
        context: context,
        useRootNavigator: true, // above the bottom bar, not inside the tab
        isScrollControlled: true,
        backgroundColor: AppColors.bg,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
        builder: (_) => BusinessSettingsSheet(business: business),
      );

  @override
  ConsumerState<BusinessSettingsSheet> createState() => _BusinessSettingsSheetState();
}

class _BusinessSettingsSheetState extends ConsumerState<BusinessSettingsSheet> {
  late List<String> _products = [...widget.business.products];
  late String _tone = widget.business.replyTone;
  late List<String> _languages = [...widget.business.reviewLanguages];
  final _product = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _product.dispose();
    super.dispose();
  }

  void _addProduct() {
    final v = _product.text.trim();
    if (v.isEmpty || v.length > 60 || _products.length >= maxProducts) return;
    if (_products.any((p) => p.toLowerCase() == v.toLowerCase())) return;
    setState(() => _products = [..._products, v]);
    _product.clear();
  }

  void _toggleLanguage(String code) {
    setState(() {
      if (_languages.contains(code)) {
        if (_languages.length > 1) _languages = _languages.where((c) => c != code).toList();
      } else if (_languages.length < maxReviewLanguages) {
        _languages = [..._languages, code];
      }
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(businessRepositoryProvider).updatePreferences(
            widget.business.id,
            products: _products,
            reviewLanguages: _languages,
            replyTone: _tone,
          );
      ref.invalidate(myBusinessProvider);
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save. Check your connection.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.88,
      maxChildSize: 0.95,
      builder: (context, scroll) => ListView(
        controller: scroll,
        padding: EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.lg + MediaQuery.viewInsetsOf(context).bottom),
        children: [
          Center(
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: AppSpacing.md),
          Text('Business settings', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'Products & services'),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _product,
            onSubmitted: (_) => _addProduct(),
            decoration: InputDecoration(
              hintText: 'Add a product, e.g. Kaju katli',
              suffixIcon: IconButton(onPressed: _addProduct, icon: Icon(Icons.add_rounded, color: AppColors.violet)),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final p in _products)
                InputChip(
                  label: Text(p),
                  onDeleted: () => setState(() => _products = _products.where((x) => x != p).toList()),
                  backgroundColor: AppColors.violet50,
                  side: BorderSide.none,
                  shape: const StadiumBorder(),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'Reply tone'),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final (value, label, _) in replyToneOptions)
                SelectChip(label: label, selected: _tone == value, onTap: () => setState(() => _tone = value)),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'Review languages for customers'),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final (code, label) in reviewLanguageOptions)
                SelectChip(label: label, selected: _languages.contains(code), onTap: () => _toggleLanguage(code)),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          GradientButton(label: 'Save changes', busy: _saving, onPressed: _save),
        ],
      ),
    );
  }
}
