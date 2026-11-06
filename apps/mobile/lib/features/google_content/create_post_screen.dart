import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/pickers.dart';
import '../../core/widgets/ui.dart';
import '../business/business_repository.dart';
import 'content_repository.dart';

/// Picks a photo from camera or gallery, sized for Google (≤2048px, JPEG).
Future<({Uint8List bytes, bool png})?> pickPhoto(BuildContext context) async {
  final source = await showModalBottomSheet<ImageSource>(
    context: context,
    useRootNavigator: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(leading: const Icon(Icons.photo_camera_outlined), title: const Text('Take a photo'), onTap: () => Navigator.pop(context, ImageSource.camera)),
          ListTile(leading: const Icon(Icons.photo_library_outlined), title: const Text('Choose from gallery'), onTap: () => Navigator.pop(context, ImageSource.gallery)),
        ]),
      ),
    ),
  );
  if (source == null) return null;
  final file = await ImagePicker().pickImage(source: source, maxWidth: 2048, maxHeight: 2048, imageQuality: 85);
  if (file == null) return null;
  final bytes = await file.readAsBytes();
  return (bytes: bytes, png: file.name.toLowerCase().endsWith('.png'));
}

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  /// Resolves to 'posted', 'scheduled', or null when closed without sending.
  static Future<String?> open(BuildContext context) =>
      Navigator.of(context, rootNavigator: true).push<String>(MaterialPageRoute(builder: (_) => const CreatePostScreen()));

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _form = PostForm();
  final _brief = TextEditingController();
  final _text = TextEditingController();
  final _title = TextEditingController();
  final _coupon = TextEditingController();
  final _terms = TextEditingController();
  final _link = TextEditingController();
  ({Uint8List bytes, bool png})? _photo;
  bool _drafting = false;
  bool _posting = false;
  DateTime? _scheduleAt; // null → post now

  Future<void> _pickSchedule() async {
    final now = DateTime.now();
    final date = await pickDate(context, first: now, last: now.add(const Duration(days: 90)), initial: _scheduleAt ?? now, title: 'Publish on');
    if (date == null || !mounted) return;
    final time = await pickTime(context, initial: TimeOfDay.fromDateTime(_scheduleAt ?? now.add(const Duration(hours: 1))), title: 'Publish at');
    if (time == null) return;
    final at = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    if (at.isBefore(DateTime.now().add(const Duration(minutes: 10)))) return _toast('Pick a time at least 10 minutes from now.');
    setState(() => _scheduleAt = at);
  }

  String _when(DateTime d) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    return '${days[d.weekday - 1]} ${d.day} ${months[d.month - 1]}, $h:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'am' : 'pm'}';
  }

  @override
  void dispose() {
    for (final c in [_brief, _text, _title, _coupon, _terms, _link]) {
      c.dispose();
    }
    super.dispose();
  }

  void _toast(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _draft() async {
    if (_brief.text.trim().isEmpty) return _toast('Write a line about what you want to share.');
    setState(() => _drafting = true);
    try {
      _text.text = await ref.read(contentRepositoryProvider).draftPost(_form.type, _brief.text, title: _title.text.trim());
      setState(() {});
    } on ContentException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _drafting = false);
    }
  }

  Future<void> _pickDate({required bool start}) async {
    final now = DateTime.now();
    final first = start ? now : (_form.startDate ?? now);
    final picked = await pickDate(
      context,
      first: DateTime(first.year, first.month, first.day),
      last: now.add(const Duration(days: 365)),
      initial: (start ? _form.startDate : _form.endDate) ?? first,
      title: start ? 'Starts on' : 'Ends on',
    );
    if (picked == null) return;
    setState(() {
      if (start) {
        _form.startDate = picked;
        if (_form.endDate != null && _form.endDate!.isBefore(picked)) _form.endDate = picked;
      } else {
        _form.endDate = picked;
      }
    });
  }

  Future<void> _post() async {
    _form
      ..summary = _text.text
      ..title = _title.text
      ..couponCode = _coupon.text
      ..terms = _terms.text
      ..buttonUrl = _link.text;
    if (_form.summary.trim().isEmpty) return _toast('Write the post text, or use AI to draft it.');
    final at = _scheduleAt;
    final ok = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(at == null ? 'Post this on Google?' : 'Schedule this post?'),
            content: Text(at == null
                ? 'It appears on your Google profile in Search and Maps. Google checks posts first — usually a few minutes.'
                : 'RevYne will post it on your Google profile on ${_when(at)} (within 5 minutes of that time). You can cancel it until then.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.pop(context, true), child: Text(at == null ? 'Post' : 'Schedule')),
            ],
          ),
        ) ??
        false;
    if (!ok || !mounted) return;
    setState(() => _posting = true);
    try {
      final repo = ref.read(contentRepositoryProvider);
      String? path;
      if (_photo != null) {
        final business = await ref.read(myBusinessProvider.future);
        path = await repo.upload(business!.id, _photo!.bytes, png: _photo!.png);
      }
      if (at == null) {
        await repo.createPost(_form, mediaPath: path);
        ref.invalidate(gbpPostsProvider);
      } else {
        await repo.schedulePost(_form, at, mediaPath: path);
        ref.invalidate(scheduledPostsProvider);
      }
      if (!mounted) return;
      Navigator.of(context).pop(at == null ? 'posted' : 'scheduled');
    } on ContentException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not post right now. Please try again.');
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  String _date(DateTime? d) => d == null ? 'Pick date' : '${d.day}/${d.month}/${d.year}';

  @override
  Widget build(BuildContext context) {
    final t = _form.type;
    return Scaffold(
      appBar: AppBar(title: const Text('New Google post')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl),
        children: [
          Wrap(spacing: AppSpacing.sm, children: [
            for (final type in PostType.values) SelectChip(label: type.label, selected: t == type, onTap: () => setState(() => _form.type = type)),
          ]),
          const SizedBox(height: 6),
          Text(
            switch (t) {
              PostType.update => 'News, new work, or anything customers should know.',
              PostType.offer => 'A discount or deal, with dates. Only offer what you will honour.',
              PostType.event => 'Something happening on set dates.',
            },
            style: const TextStyle(color: AppColors.muted, fontSize: 14),
          ),
          if (t != PostType.update) ...[
            const SizedBox(height: AppSpacing.md),
            TextField(controller: _title, maxLength: 58, decoration: InputDecoration(hintText: t == PostType.offer ? 'Offer title, e.g. Diwali offer' : 'Event title')),
            Row(children: [
              Expanded(child: OutlinedButton.icon(onPressed: () => _pickDate(start: true), icon: const Icon(Icons.event_rounded, size: 18), label: Text('From ${_date(_form.startDate)}'))),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: OutlinedButton.icon(onPressed: () => _pickDate(start: false), icon: const Icon(Icons.event_rounded, size: 18), label: Text('To ${_date(_form.endDate)}'))),
            ]),
          ],
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'Write it with AI'),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _brief,
            maxLines: 2,
            maxLength: 600,
            decoration: const InputDecoration(hintText: 'In a line: e.g. new designs of safety grills are ready'),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: _drafting ? null : _draft,
              icon: _drafting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.auto_awesome_rounded, size: 18),
              label: Text(_text.text.isEmpty ? 'Write with AI' : 'Rewrite with AI'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          const SectionHeader(title: 'Post text'),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _text,
            minLines: 4,
            maxLines: 12,
            maxLength: 1500,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(hintText: 'What customers will read. No phone numbers or links — use a button.'),
          ),
          const SizedBox(height: AppSpacing.md),
          const SectionHeader(title: 'Photo'),
          const SizedBox(height: AppSpacing.sm),
          if (_photo == null)
            OutlinedButton.icon(
              onPressed: () async {
                final p = await pickPhoto(context);
                if (p != null) setState(() => _photo = p);
              },
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('Add a photo (recommended)'),
            )
          else
            Stack(children: [
              ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.memory(_photo!.bytes, height: 200, width: double.infinity, fit: BoxFit.cover)),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: Colors.black54),
                  onPressed: () => setState(() => _photo = null),
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                ),
              ),
            ]),
          const SizedBox(height: AppSpacing.lg),
          if (t == PostType.offer) ...[
            const SectionHeader(title: 'Offer details (optional)'),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _coupon, maxLength: 58, decoration: const InputDecoration(hintText: 'Coupon code')),
            TextField(controller: _terms, maxLines: 3, maxLength: 500, decoration: const InputDecoration(hintText: 'Terms and conditions')),
          ] else ...[
            const SectionHeader(title: 'Button'),
            const SizedBox(height: AppSpacing.sm),
            Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
              for (final b in PostButton.values) SelectChip(label: b.label, selected: _form.button == b, onTap: () => setState(() => _form.button = b)),
            ]),
            if (_form.button.needsLink) ...[
              const SizedBox(height: AppSpacing.sm),
              TextField(controller: _link, keyboardType: TextInputType.url, decoration: const InputDecoration(hintText: 'Link, e.g. instagram.com/yourshop', prefixIcon: Icon(Icons.link_rounded))),
            ],
          ],
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'When'),
          const SizedBox(height: AppSpacing.sm),
          Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
            SelectChip(label: 'Post now', selected: _scheduleAt == null, onTap: () => setState(() => _scheduleAt = null)),
            SelectChip(label: _scheduleAt == null ? 'Schedule' : _when(_scheduleAt!), selected: _scheduleAt != null, onTap: _pickSchedule),
          ]),
          const SizedBox(height: AppSpacing.lg),
          GradientButton(
            label: _scheduleAt == null ? 'Post on Google' : 'Schedule post',
            icon: _scheduleAt == null ? Icons.send_rounded : Icons.schedule_send_rounded,
            busy: _posting,
            onPressed: _posting ? null : _post,
          ),
        ],
      ),
    );
  }
}
