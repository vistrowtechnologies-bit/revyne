import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/config/env.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business.dart';
import '../business/business_repository.dart';
import 'poster_pdf.dart';
import 'review_link_card.dart';

/// Get Reviews: printable counter poster + a WhatsApp request to one customer.
class GetReviewsScreen extends ConsumerWidget {
  const GetReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(myBusinessProvider).value;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: business == null
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
                children: [
                  Text('Get Reviews', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 6),
                  const Text(
                    'Ask every customer — happy or not — to share their experience. They post it on Google themselves.',
                    style: TextStyle(color: AppColors.muted, fontSize: 15),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _PosterCard(business: business),
                  const SizedBox(height: AppSpacing.lg),
                  const SectionHeader(title: 'Ask a customer on WhatsApp'),
                  const SizedBox(height: AppSpacing.sm),
                  _WhatsAppRequestForm(business: business),
                ],
              ),
      ),
    );
  }
}

class _PosterCard extends StatefulWidget {
  const _PosterCard({required this.business});

  final Business business;

  @override
  State<_PosterCard> createState() => _PosterCardState();
}

class _PosterCardState extends State<_PosterCard> {
  PdfPageFormat _format = PdfPageFormat.a5;
  bool _busy = false;

  Future<void> _download() async {
    setState(() => _busy = true);
    try {
      final bytes = await buildReviewPoster(widget.business, format: _format);
      final size = _format == PdfPageFormat.a4 ? 'A4' : 'A5';
      await Printing.sharePdf(bytes: bytes, filename: 'revyne-poster-$size.pdf');
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not create the poster. Please try again.')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.business;
    final link = Env.reviewLink(b.publicSlug);

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Poster preview — mirrors the printed PDF.
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(18)),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
              child: Column(
                children: [
                  Text(b.name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                  if (b.city != null) Text(b.city!, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                  const SizedBox(height: 14),
                  Text(
                    'Share your experience\non Google',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.violet, height: 1.25),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(border: Border.all(color: AppColors.line, width: 1.5), borderRadius: BorderRadius.circular(16)),
                    child: QrImageView(data: link, size: 150, backgroundColor: Colors.white),
                  ),
                  const SizedBox(height: 10),
                  const Text('Scan with your phone camera', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  const SizedBox(height: 10),
                  const BrandMark(size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              for (final (label, format) in [('A5', PdfPageFormat.a5), ('A4', PdfPageFormat.a4)]) ...[
                SelectChip(label: label, selected: _format == format, onTap: () => setState(() => _format = format)),
                const SizedBox(width: AppSpacing.sm),
              ],
              const Spacer(),
              IconButton(
                tooltip: 'Copy link',
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: link));
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review link copied')));
                },
                icon: Icon(Icons.link_rounded, color: AppColors.violet),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          GradientButton(label: 'Download poster PDF', icon: Icons.download_rounded, busy: _busy, onPressed: _download),
        ],
      ),
    );
  }
}

class _WhatsAppRequestForm extends StatefulWidget {
  const _WhatsAppRequestForm({required this.business});

  final Business business;

  @override
  State<_WhatsAppRequestForm> createState() => _WhatsAppRequestFormState();
}

class _WhatsAppRequestFormState extends State<_WhatsAppRequestForm> {
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
    if (!_phoneValid) return;
    final ok = await openWhatsApp(reviewRequestMessage(widget.business, customerName: _name.text), phone: _phone.text);
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
            onChanged: (_) => setState(() {}),
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(hintText: 'Customer name (optional)', prefixIcon: Icon(Icons.person_outline_rounded)),
          ),
          const SizedBox(height: AppSpacing.gutter),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            onChanged: (_) => setState(() {}),
            // +91 sits inside the icon slot so it shows even before the
            // field is focused (prefixText only appears on focus).
            decoration: const InputDecoration(
              hintText: 'WhatsApp number',
              prefixIcon: Padding(
                padding: EdgeInsets.only(left: 12, right: 8),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.phone_outlined),
                  SizedBox(width: 8),
                  Text('+91', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink)),
                ]),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.violet50, borderRadius: BorderRadius.circular(14)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MESSAGE PREVIEW', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: AppColors.violet700, letterSpacing: 0.8)),
                const SizedBox(height: 6),
                Text(reviewRequestMessage(widget.business, customerName: _name.text), style: const TextStyle(fontSize: 14.5, height: 1.45)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          GradientButton(label: 'Open in WhatsApp', icon: Icons.send_rounded, onPressed: _phoneValid ? _send : null),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'You press send in your own WhatsApp. Only message customers who visited you.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, color: AppColors.muted),
          ),
        ],
      ),
    );
  }
}
