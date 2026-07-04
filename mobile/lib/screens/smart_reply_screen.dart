import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../config.dart';
import '../services/business_service.dart';
import '../widgets/ui.dart';

class SmartReplyScreen extends StatefulWidget {
  const SmartReplyScreen({super.key, required this.business});

  final Business business;

  @override
  State<SmartReplyScreen> createState() => _SmartReplyScreenState();
}

class _SmartReplyScreenState extends State<SmartReplyScreen> {
  final _customerName = TextEditingController();
  final _reviewText = TextEditingController();
  int _rating = 3;
  bool _generating = false;
  List<String> _replies = [];

  @override
  void dispose() {
    _customerName.dispose();
    _reviewText.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    if (_reviewText.text.trim().length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paste the customer review first')));
      return;
    }
    setState(() {
      _generating = true;
      _replies = [];
    });
    try {
      final replies = await BusinessService.generateReplies(
        business: widget.business,
        reviewText: _reviewText.text.trim(),
        rating: _rating,
        customerName: _customerName.text.trim(),
      );
      setState(() => _replies = replies);
      if (replies.isEmpty && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not generate replies. Try again.')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.margin),
        children: [
          const Text('Smart Reply', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Draft professional responses in seconds using AI.', style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 20),
          const Text('Customer Name (Optional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(controller: _customerName, decoration: const InputDecoration(hintText: 'e.g. Rahul Sharma')),
          const SizedBox(height: 18),
          const Text('Rating Received', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              for (var i = 1; i <= 5; i++)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: () => setState(() => _rating = i),
                  icon: Icon(i <= _rating ? Icons.star_rounded : Icons.star_outline_rounded, color: const Color(0xFFFBBC05), size: 28),
                ),
              const SizedBox(width: 6),
              Text('$_rating / 5 Stars', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant)),
            ],
          ),
          const SizedBox(height: 18),
          const Text('Review Text', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(
            controller: _reviewText,
            maxLines: 5,
            decoration: const InputDecoration(hintText: "Paste the customer's review here…", alignLabelWithHint: true),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: _generating ? null : _generate,
            icon: _generating
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.auto_awesome, size: 18),
            label: Text(_generating ? 'Generating…' : 'Generate Smart Replies'),
          ),
          if (_replies.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('AI SUGGESTIONS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.onSurfaceVariant, letterSpacing: 0.6)),
            const SizedBox(height: 10),
            for (final reply in _replies)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  color: AppColors.primaryFixed,
                  borderColor: Colors.transparent,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(reply, style: const TextStyle(fontSize: 14, height: 1.4)),
                      const SizedBox(height: 10),
                      const Divider(color: Color(0x33842BD2)),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () async {
                            await Clipboard.setData(ClipboardData(text: reply));
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reply copied')));
                            }
                          },
                          icon: const Icon(Icons.copy_rounded, size: 16),
                          label: const Text('Copy'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

/// Guest-mode upsell — shown as a modal bottom sheet after 5 free replies.
Future<void> showGuestLimitSheet(BuildContext context, VoidCallback onSignIn) {
  return showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (context) => Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.outlineVariant, borderRadius: BorderRadius.circular(4))),
          const SizedBox(height: 20),
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(color: AppColors.primaryFixed, shape: BoxShape.circle),
            child: const Icon(Icons.lock_rounded, color: AppColors.primaryContainer, size: 30),
          ),
          const SizedBox(height: 16),
          const Text('Used 5 free replies', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            'Sign in with Google to get unlimited AI replies and manage your business reviews effortlessly.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade600),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: AppColors.onSurface),
            onPressed: onSignIn,
            icon: const Icon(Icons.login_rounded),
            label: const Text('Continue with Google'),
          ),
          const SizedBox(height: 8),
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Maybe later')),
        ],
      ),
    ),
  );
}
