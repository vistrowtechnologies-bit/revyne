import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../config.dart';
import '../services/business_service.dart';

class SmartReplyScreen extends StatefulWidget {
  const SmartReplyScreen({super.key, required this.business});

  final Business business;

  @override
  State<SmartReplyScreen> createState() => _SmartReplyScreenState();
}

class _SmartReplyScreenState extends State<SmartReplyScreen> {
  final _customerName = TextEditingController();
  final _reviewText = TextEditingController();
  int _rating = 5;
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
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Paste the customer review first')));
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
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not generate replies. Try again.')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Smart Reply',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Paste a real customer review — get professional reply drafts.',
              style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 20),
          TextField(
            controller: _customerName,
            decoration: const InputDecoration(labelText: 'Customer name (optional)'),
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('Rating:', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              for (var i = 1; i <= 5; i++)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: () => setState(() => _rating = i),
                  icon: Icon(
                    i <= _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                    color: const Color(0xFFFBBC05),
                    size: 28,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _reviewText,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Customer review',
              hintText: 'Paste the review text here…',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: _generating ? null : _generate,
            icon: _generating
                ? const SizedBox(
                    width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.auto_awesome),
            label: Text(_generating ? 'Generating…' : 'Generate Smart Replies'),
          ),
          const SizedBox(height: 20),
          for (final reply in _replies)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(reply),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          await Clipboard.setData(ClipboardData(text: reply));
                          if (context.mounted) {
                            ScaffoldMessenger.of(context)
                                .showSnackBar(const SnackBar(content: Text('Reply copied')));
                          }
                        },
                        icon: const Icon(Icons.copy_rounded, size: 16),
                        label: const Text('Copy'),
                        style: OutlinedButton.styleFrom(foregroundColor: RevyneTheme.brand),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
