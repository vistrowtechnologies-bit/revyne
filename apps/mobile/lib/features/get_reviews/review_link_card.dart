import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config/env.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import '../business/business.dart';

/// Message shared with customers on WhatsApp. Asks for honest feedback only —
/// no incentives, no pressure (Google review policy).
String reviewRequestMessage(Business business, {String? customerName}) {
  final greeting = customerName == null || customerName.trim().isEmpty ? 'Hi' : 'Hi ${customerName.trim()}';
  return '$greeting, thank you for visiting ${business.name}! '
      'We\'d love to hear about your experience: ${Env.reviewLink(business.publicSlug)}';
}

/// Opens WhatsApp with [text], optionally to an Indian mobile number.
Future<bool> openWhatsApp(String text, {String? phone}) {
  final digits = phone?.replaceAll(RegExp(r'\D'), '') ?? '';
  final to = digits.isEmpty ? '' : (digits.length == 10 ? '91$digits' : digits);
  return launchUrl(Uri.parse('https://wa.me/$to?text=${Uri.encodeComponent(text)}'), mode: LaunchMode.externalApplication);
}

/// QR code + link for the business's customer review page, with copy/share.
class ReviewLinkCard extends StatelessWidget {
  const ReviewLinkCard({super.key, required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    final link = Env.reviewLink(business.publicSlug);

    return AppCard(
      child: Column(
        children: [
          QrImageView(data: link, size: 200, backgroundColor: Colors.white),
          const SizedBox(height: AppSpacing.sm),
          SelectableText(link, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: link));
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
                  },
                  icon: const Icon(Icons.copy_rounded),
                  label: const Text('Copy'),
                ),
              ),
              const SizedBox(width: AppSpacing.gutter),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () async {
                    final ok = await openWhatsApp(reviewRequestMessage(business));
                    if (!ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('WhatsApp is not installed.')));
                    }
                  },
                  icon: const Icon(Icons.share_rounded),
                  label: const Text('WhatsApp'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
