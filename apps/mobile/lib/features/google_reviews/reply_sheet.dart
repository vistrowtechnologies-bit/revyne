import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';
import 'google_reviews_repository.dart';

/// Reply to one Google review. AI only drafts; the owner edits, then confirms
/// before anything is posted publicly. Pops `true` when Google changed.
class ReplySheet extends ConsumerStatefulWidget {
  const ReplySheet({super.key, required this.review});

  final GoogleReview review;

  static Future<bool?> show(BuildContext context, GoogleReview review) => showModalBottomSheet<bool>(
        context: context,
        useRootNavigator: true,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
        builder: (_) => ReplySheet(review: review),
      );

  @override
  ConsumerState<ReplySheet> createState() => _ReplySheetState();
}

class _ReplySheetState extends ConsumerState<ReplySheet> {
  late final _text = TextEditingController(text: widget.review.reply ?? '');
  bool _drafting = false;
  bool _posting = false;
  bool _showOriginal = false;

  GoogleReviewsRepository get _repo => ref.read(googleReviewsRepositoryProvider);

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  void _toast(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  Future<void> _draft() async {
    setState(() => _drafting = true);
    try {
      _text.text = await _repo.draft(widget.review.id);
    } on GoogleReviewsException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not write a draft right now. You can write the reply yourself.');
    } finally {
      if (mounted) setState(() => _drafting = false);
    }
  }

  Future<bool> _confirm(String title, String body, String action, {bool danger = false}) async =>
      await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(title),
          content: Text(body),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              style: danger ? TextButton.styleFrom(foregroundColor: AppColors.danger) : null,
              child: Text(action),
            ),
          ],
        ),
      ) ??
      false;

  Future<void> _post() async {
    final comment = _text.text.trim();
    if (comment.isEmpty) return _toast('Write a reply first.');
    final ok = await _confirm(
      'Post this reply on Google?',
      'Everyone who sees your Google profile will see it. You can edit or delete it later.',
      'Post reply',
    );
    if (!ok || !mounted) return;
    setState(() => _posting = true);
    try {
      await _repo.reply(widget.review.id, comment);
      if (!mounted) return;
      Navigator.of(context).pop(true);
      _toast('Reply posted on Google.');
    } on GoogleReviewsException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not post right now. Please try again.');
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  Future<void> _delete() async {
    final ok = await _confirm('Delete your reply?', 'It will be removed from your Google profile.', 'Delete', danger: true);
    if (!ok || !mounted) return;
    setState(() => _posting = true);
    try {
      await _repo.deleteReply(widget.review.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
      _toast('Reply deleted.');
    } on GoogleReviewsException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not delete right now. Please try again.');
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.review;
    final translated = r.displayComment != r.comment.trim();
    final busy = _drafting || _posting;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, 12, AppSpacing.md, AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2))),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    InitialsAvatar(r.reviewer),
                    const SizedBox(width: AppSpacing.gutter),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r.reviewer ?? 'Google user', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                          Text(timeAgo(r.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                        ],
                      ),
                    ),
                    if (r.rating > 0) Stars(r.rating, size: 18),
                  ],
                ),
                const SizedBox(height: AppSpacing.gutter),
                Text(
                  r.comment.trim().isEmpty ? 'Rating only — no written review.' : (_showOriginal ? r.comment.trim() : r.displayComment),
                  style: TextStyle(fontSize: 15.5, height: 1.5, color: r.comment.trim().isEmpty ? AppColors.muted : AppColors.ink),
                ),
                if (translated)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () => setState(() => _showOriginal = !_showOriginal),
                      child: Text(_showOriginal ? 'Show translation' : 'Show original'),
                    ),
                  ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    const Expanded(child: SectionHeader(title: 'Your reply')),
                    TextButton.icon(
                      onPressed: busy ? null : _draft,
                      icon: _drafting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.auto_awesome_rounded, size: 18),
                      label: Text(_text.text.isEmpty ? 'Draft with AI' : 'New AI draft'),
                    ),
                  ],
                ),
                TextField(
                  controller: _text,
                  minLines: 4,
                  maxLines: 10,
                  maxLength: 1500,
                  enabled: !_posting,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(hintText: 'Thank them and respond to what they said'),
                ),
                const Text(
                  'Check the draft before posting — RevYne never posts without your approval.',
                  style: TextStyle(color: AppColors.muted, fontSize: 13),
                ),
                const SizedBox(height: AppSpacing.md),
                GradientButton(
                  label: r.needsReply ? 'Post reply on Google' : 'Update reply',
                  icon: Icons.send_rounded,
                  busy: _posting,
                  onPressed: busy || _text.text.trim().isEmpty ? null : _post,
                ),
                if (!r.needsReply) ...[
                  const SizedBox(height: AppSpacing.sm),
                  TextButton(
                    onPressed: busy ? null : _delete,
                    style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                    child: const Text('Delete reply'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
