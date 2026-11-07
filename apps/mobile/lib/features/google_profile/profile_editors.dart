import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/pickers.dart';
import '../../core/widgets/ui.dart';
import 'profile_repository.dart';

/// Opens an edit sheet above the bottom bar. Resolves true when Google changed.
Future<bool?> showProfileEditor(BuildContext context, Widget editor) => showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => editor,
    );

String hhmm(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

TimeOfDay parseTime(String s) {
  final p = s.split(':');
  final h = int.parse(p[0]);
  return TimeOfDay(hour: h == 24 ? 0 : h, minute: int.parse(p[1]));
}

/// "09:30" → "9:30 am"; "24:00" → "midnight".
String timeLabel(String s) {
  if (s == '24:00' || s == '00:00') return 'midnight';
  final t = parseTime(s);
  final h = t.hourOfPeriod == 0 ? 12 : t.hourOfPeriod;
  return '$h${t.minute == 0 ? '' : ':${t.minute.toString().padLeft(2, '0')}'} ${t.period == DayPeriod.am ? 'am' : 'pm'}';
}

/// Shared frame: title, body, a save button that confirms, then sends to Google.
class _EditorFrame extends ConsumerStatefulWidget {
  const _EditorFrame({required this.title, required this.field, required this.value, required this.child, this.subtitle, this.canSave = true});

  final String title;
  final String? subtitle;
  final String field;
  final Object Function() value;
  final Widget child;
  final bool canSave;

  @override
  ConsumerState<_EditorFrame> createState() => _EditorFrameState();
}

class _EditorFrameState extends ConsumerState<_EditorFrame> {
  bool _saving = false;

  Future<void> _save() async {
    final ok = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Update your Google profile?'),
            content: const Text('Customers will see this on Google Search and Maps. Google may take a few minutes, or review the change first.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Update')),
            ],
          ),
        ) ??
        false;
    if (!ok || !mounted) return;
    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(profileRepositoryProvider).update(widget.field, widget.value());
      ref.invalidate(gbpProfileProvider);
      if (!mounted) return;
      Navigator.of(context).pop(true);
      messenger.showSnackBar(const SnackBar(content: Text('Sent to Google. It can take a few minutes to show.')));
    } on ProfileException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      messenger.showSnackBar(const SnackBar(content: Text('Could not update right now. Please try again.')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.md, 12, AppSpacing.md, AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: AppSpacing.md),
                  Text(widget.title, style: Theme.of(context).textTheme.headlineSmall),
                  if (widget.subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(widget.subtitle!, style: const TextStyle(color: AppColors.muted, fontSize: 14.5)),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  widget.child,
                  const SizedBox(height: AppSpacing.md),
                  GradientButton(
                    label: 'Update on Google',
                    icon: Icons.cloud_upload_outlined,
                    busy: _saving,
                    onPressed: widget.canSave && !_saving ? _save : null,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}

// ── Text fields ──────────────────────────────────────────────────────────────

class DescriptionEditor extends ConsumerStatefulWidget {
  const DescriptionEditor({super.key, required this.current});
  final String current;

  @override
  ConsumerState<DescriptionEditor> createState() => _DescriptionEditorState();
}

class _DescriptionEditorState extends ConsumerState<DescriptionEditor> {
  late final _text = TextEditingController(text: widget.current);
  bool _drafting = false;

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _draft() async {
    setState(() => _drafting = true);
    try {
      _text.text = await ref.read(profileRepositoryProvider).draftDescription();
    } on ProfileException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _drafting = false);
    }
  }

  @override
  Widget build(BuildContext context) => _EditorFrame(
        title: 'Business description',
        subtitle: 'What you do and who you serve. No links or offers — Google removes those.',
        field: 'description',
        value: () => _text.text.trim(),
        canSave: _text.text.trim() != widget.current.trim(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _drafting ? null : _draft,
                icon: _drafting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.auto_awesome_rounded, size: 18),
                label: Text(_text.text.isEmpty ? 'Write with AI' : 'Improve with AI'),
              ),
            ),
            TextField(
              controller: _text,
              minLines: 5,
              maxLines: 12,
              maxLength: 750,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(hintText: 'We make…'),
            ),
          ],
        ),
      );
}

class TextValueEditor extends StatefulWidget {
  const TextValueEditor.phone({super.key, required this.current})
      : field = 'phone',
        title = 'Phone number',
        subtitle = 'The number customers call from Google.',
        hint = '98765 43210',
        keyboard = TextInputType.phone,
        icon = Icons.call_outlined;

  const TextValueEditor.website({super.key, required this.current})
      : field = 'website',
        title = 'Website',
        subtitle = 'Your website, or a social media page like Instagram or Facebook.',
        hint = 'yourshop.in',
        keyboard = TextInputType.url,
        icon = Icons.language_rounded;

  final String current;
  final String field;
  final String title;
  final String subtitle;
  final String hint;
  final TextInputType keyboard;
  final IconData icon;

  @override
  State<TextValueEditor> createState() => _TextValueEditorState();
}

class _TextValueEditorState extends State<TextValueEditor> {
  late final _text = TextEditingController(text: widget.field == 'phone' ? widget.current.replaceFirst(RegExp(r'^\+91\s*'), '') : widget.current);

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _EditorFrame(
        title: widget.title,
        subtitle: widget.subtitle,
        field: widget.field,
        value: () => _text.text.trim(),
        canSave: widget.field == 'website' || _text.text.trim().isNotEmpty,
        child: TextField(
          controller: _text,
          keyboardType: widget.keyboard,
          autofocus: true,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: widget.hint,
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 12, right: 8),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(widget.icon),
                if (widget.field == 'phone') ...[
                  const SizedBox(width: 8),
                  const Text('+91', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink)),
                ],
              ]),
            ),
          ),
        ),
      );
}

// ── Weekly hours ─────────────────────────────────────────────────────────────

class HoursEditor extends StatefulWidget {
  const HoursEditor({super.key, required this.current, this.splitHours = false});
  final List<DayHours> current;
  final bool splitHours;

  @override
  State<HoursEditor> createState() => _HoursEditorState();
}

class _HoursEditorState extends State<HoursEditor> {
  late final Map<String, DayHours?> _days = {
    for (final d in weekDays) d: widget.current.where((h) => h.day == d).firstOrNull,
  };

  Future<void> _pick(String day, {required bool open}) async {
    final current = _days[day]!;
    final picked = await pickTime(context,
        initial: parseTime(open ? current.open : current.close), title: '${weekDayLabels[day]} · ${open ? 'opens' : 'closes'} at');
    if (picked == null) return;
    setState(() => _days[day] = open ? DayHours(day, hhmm(picked), current.close) : DayHours(day, current.open, hhmm(picked)));
  }

  void _copyMondayToAll() {
    final monday = _days['MONDAY'];
    setState(() {
      for (final d in weekDays.skip(1)) {
        if (d != 'SUNDAY' || _days['SUNDAY'] != null) _days[d] = monday == null ? null : DayHours(d, monday.open, monday.close);
      }
    });
  }

  @override
  Widget build(BuildContext context) => _EditorFrame(
        title: 'Opening hours',
        subtitle: widget.splitHours
            ? 'Your Google hours have breaks in some days. Saving here sets one opening time per day.'
            : 'Turn a day off to show it as closed.',
        field: 'hours',
        value: () => [for (final d in weekDays) if (_days[d] != null) _days[d]!.toJson()],
        child: Column(
          children: [
            for (final d in weekDays)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    SizedBox(width: 96, child: Text(weekDayLabels[d]!, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
                    Switch(
                      value: _days[d] != null,
                      onChanged: (on) => setState(() => _days[d] = on ? DayHours(d, '09:00', '18:00') : null),
                    ),
                    const SizedBox(width: 4),
                    if (_days[d] == null)
                      const Text('Closed', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600))
                    else ...[
                      _TimeChip(label: timeLabel(_days[d]!.open), onTap: () => _pick(d, open: true)),
                      const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text('–')),
                      _TimeChip(label: timeLabel(_days[d]!.close), onTap: () => _pick(d, open: false)),
                    ],
                  ],
                ),
              ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: _copyMondayToAll,
                icon: const Icon(Icons.copy_rounded, size: 18),
                label: const Text('Copy Monday to other open days'),
              ),
            ),
          ],
        ),
      );
}

class _TimeChip extends StatelessWidget {
  const _TimeChip({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.violet50,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Text(label, style: TextStyle(color: AppColors.violet700, fontWeight: FontWeight.w700, fontSize: 14)),
          ),
        ),
      );
}

// ── Holiday hours ────────────────────────────────────────────────────────────

class HolidayHoursEditor extends StatefulWidget {
  const HolidayHoursEditor({super.key, required this.current});
  final List<SpecialDay> current;

  @override
  State<HolidayHoursEditor> createState() => _HolidayHoursEditorState();
}

class _HolidayHoursEditorState extends State<HolidayHoursEditor> {
  late final List<SpecialDay> _days = [...widget.current]..sort((a, b) => a.date.compareTo(b.date));

  static String _iso(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  static String _pretty(String iso) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final d = DateTime.parse(iso);
    return '${days[d.weekday - 1]}, ${d.day} ${months[d.month - 1]} ${d.year}';
  }

  Future<void> _add() async {
    final now = DateTime.now();
    final picked = await pickDate(context, first: now, last: now.add(const Duration(days: 365)), title: 'Holiday date');
    if (picked == null) return;
    final iso = _iso(picked);
    if (_days.any((d) => d.date == iso)) return;
    setState(() => _days
      ..add(SpecialDay(date: iso, closed: true))
      ..sort((a, b) => a.date.compareTo(b.date)));
  }

  Future<void> _pick(int i, {required bool open}) async {
    final d = _days[i];
    final picked = await pickTime(context,
        initial: parseTime((open ? d.open : d.close) ?? (open ? '10:00' : '14:00')), title: open ? 'Opens at' : 'Closes at');
    if (picked == null) return;
    setState(() => _days[i] = SpecialDay(
          date: d.date,
          closed: false,
          open: open ? hhmm(picked) : d.open ?? '10:00',
          close: open ? d.close ?? '14:00' : hhmm(picked),
        ));
  }

  @override
  Widget build(BuildContext context) => _EditorFrame(
        title: 'Holiday hours',
        subtitle: 'Festivals and holidays when you close or keep different hours. Google shows these instead of your usual hours.',
        field: 'specialHours',
        value: () => [for (final d in _days) d.toJson()],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_days.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.sm),
                child: Text('No holiday hours set.', style: TextStyle(color: AppColors.muted)),
              ),
            for (var i = 0; i < _days.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: AppCard(
                  padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(child: Text(_pretty(_days[i].date), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15))),
                        IconButton(
                          tooltip: 'Remove',
                          onPressed: () => setState(() => _days.removeAt(i)),
                          icon: const Icon(Icons.delete_outline_rounded, color: AppColors.muted),
                        ),
                      ]),
                      Row(children: [
                        SelectChip(
                          label: 'Closed',
                          selected: _days[i].closed,
                          onTap: () => setState(() => _days[i] = SpecialDay(date: _days[i].date, closed: true)),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        SelectChip(
                          label: 'Open',
                          selected: !_days[i].closed,
                          onTap: () => setState(() => _days[i] = SpecialDay(date: _days[i].date, closed: false, open: '10:00', close: '14:00')),
                        ),
                      ]),
                      if (!_days[i].closed) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Row(children: [
                          _TimeChip(label: timeLabel(_days[i].open!), onTap: () => _pick(i, open: true)),
                          const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text('–')),
                          _TimeChip(label: timeLabel(_days[i].close!), onTap: () => _pick(i, open: false)),
                        ]),
                      ],
                    ],
                  ),
                ),
              ),
            OutlinedButton.icon(onPressed: _add, icon: const Icon(Icons.add_rounded), label: const Text('Add a date')),
          ],
        ),
      );
}
