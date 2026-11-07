import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'ui.dart';

const _months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const _short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);
String _label(DateTime d) => '${d.day} ${_short[d.month - 1]}';

/// Bottom-sheet range calendar: quick presets, one month at a time, start and
/// end as filled circles joined by a soft band. Days outside [first]–[last]
/// can't be picked. Resolves to null when dismissed.
Future<DateTimeRange?> showRangeCalendar(BuildContext context,
    {required DateTime first, required DateTime last, DateTimeRange? initial, String title = 'Pick dates'}) {
  FocusScope.of(context).unfocus();
  return showModalBottomSheet<DateTimeRange>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (_) => RangeCalendar(first: _day(first), last: _day(last), initial: initial, title: title),
  );
}

class RangeCalendar extends StatefulWidget {
  const RangeCalendar({super.key, required this.first, required this.last, this.initial, this.title = 'Pick dates'});

  /// Returned when the owner taps Clear: go back to the default range.
  static final cleared = DateTimeRange(start: DateTime(1970), end: DateTime(1970));

  final DateTime first;
  final DateTime last;
  final DateTimeRange? initial;
  final String title;

  @override
  State<RangeCalendar> createState() => _RangeCalendarState();
}

class _RangeCalendarState extends State<RangeCalendar> {
  late DateTime? _start = widget.initial == null ? null : _day(widget.initial!.start);
  late DateTime? _end = widget.initial == null ? null : _day(widget.initial!.end);
  late DateTime _month = DateTime((_end ?? widget.last).year, (_end ?? widget.last).month);

  bool _allowed(DateTime d) => !d.isBefore(widget.first) && !d.isAfter(widget.last);

  void _tap(DateTime d) {
    setState(() {
      if (_start == null || _end != null) {
        _start = d;
        _end = null;
      } else if (d.isBefore(_start!)) {
        _start = d;
      } else {
        _end = d;
      }
    });
  }

  DateTime _clamp(DateTime d) => d.isBefore(widget.first) ? widget.first : (d.isAfter(widget.last) ? widget.last : d);

  /// Presets that still have at least one allowed day.
  List<(String, DateTime, DateTime)> get _presets {
    final l = widget.last;
    final thisStart = DateTime(l.year, l.month);
    final lastStart = DateTime(l.year, l.month - 1);
    final lastEnd = DateTime(l.year, l.month, 0);
    final threeStart = DateTime(l.year, l.month - 3);
    return [
      ('This month', thisStart, l),
      ('Last month', lastStart, lastEnd),
      ('Last 3 months', threeStart, lastEnd),
    ].where((p) => !p.$3.isBefore(widget.first) && !p.$2.isAfter(widget.last)).map((p) => (p.$1, _clamp(p.$2), _clamp(p.$3))).toList();
  }

  void _usePreset(DateTime s, DateTime e) => setState(() {
        _start = s;
        _end = e;
        _month = DateTime(e.year, e.month);
      });

  bool get _canPrev => DateTime(_month.year, _month.month).isAfter(DateTime(widget.first.year, widget.first.month));
  bool get _canNext => DateTime(_month.year, _month.month).isBefore(DateTime(widget.last.year, widget.last.month));

  @override
  Widget build(BuildContext context) {
    final start = _start;
    final end = _end ?? _start;
    final days = start == null ? 0 : end!.difference(start).inDays + 1;
    final summary = start == null
        ? 'Tap a start date'
        : _end == null
            ? '${_label(start)} – tap an end date'
            : start == end
                ? _label(start)
                : '${_label(start)} – ${_label(end!)}';

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, 12, AppSpacing.md, AppSpacing.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: AppSpacing.md),
            Row(children: [
              Expanded(child: Text(widget.title, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700, fontSize: 13.5))),
              // Clears the picked dates and tells the caller to go back to its default range.
              if (_start != null || widget.initial != null)
                TextButton.icon(
                  onPressed: () => Navigator.pop(context, RangeCalendar.cleared),
                  icon: const Icon(Icons.close_rounded, size: 18),
                  label: const Text('Clear'),
                  style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                ),
            ]),
            const SizedBox(height: 2),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(child: Text(summary, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, height: 1.2))),
              if (_end != null && days > 1)
                Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Text('$days days', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800)),
                ),
            ]),
            const SizedBox(height: AppSpacing.md),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                for (final (label, s, e) in _presets) ...[
                  SelectChip(label: label, selected: _start == s && _end == e, onTap: () => _usePreset(s, e)),
                  const SizedBox(width: AppSpacing.sm),
                ],
              ]),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(children: [
              IconButton(
                tooltip: 'Previous month',
                onPressed: _canPrev ? () => setState(() => _month = DateTime(_month.year, _month.month - 1)) : null,
                icon: const Icon(Icons.chevron_left_rounded),
              ),
              Expanded(
                child: Text('${_months[_month.month - 1]} ${_month.year}',
                    textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ),
              IconButton(
                tooltip: 'Next month',
                onPressed: _canNext ? () => setState(() => _month = DateTime(_month.year, _month.month + 1)) : null,
                icon: const Icon(Icons.chevron_right_rounded),
              ),
            ]),
            const SizedBox(height: 4),
            _MonthGrid(month: _month, start: start, end: _end, allowed: _allowed, onTap: _tap),
            const SizedBox(height: AppSpacing.md),
            Row(children: [
              Expanded(
                child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
              ),
              const SizedBox(width: AppSpacing.gutter),
              Expanded(
                flex: 2,
                child: GradientButton(
                  label: 'Show stats',
                  onPressed: start == null ? null : () => Navigator.pop(context, DateTimeRange(start: start, end: end!)),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({required this.month, required this.start, required this.end, required this.allowed, required this.onTap});

  final DateTime month;
  final DateTime? start;
  final DateTime? end;
  final bool Function(DateTime) allowed;
  final void Function(DateTime) onTap;

  @override
  Widget build(BuildContext context) {
    final first = DateTime(month.year, month.month);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final lead = first.weekday % 7; // Sunday-first weeks
    final cells = lead + daysInMonth;
    final rows = (cells / 7).ceil();
    final today = _day(DateTime.now());

    return Column(children: [
      Row(children: [
        for (final w in const ['S', 'M', 'T', 'W', 'T', 'F', 'S'])
          Expanded(child: Center(child: Text(w, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700, fontSize: 12.5)))),
      ]),
      const SizedBox(height: 6),
      for (var r = 0; r < rows; r++)
        Row(children: [
          for (var c = 0; c < 7; c++)
            Expanded(
              child: () {
                final n = r * 7 + c - lead + 1;
                if (n < 1 || n > daysInMonth) return const SizedBox(height: 44);
                return _DayCell(date: DateTime(month.year, month.month, n), start: start, end: end, today: today, allowed: allowed, onTap: onTap);
              }(),
            ),
        ]),
    ]);
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({required this.date, required this.start, required this.end, required this.today, required this.allowed, required this.onTap});

  final DateTime date;
  final DateTime? start;
  final DateTime? end;
  final DateTime today;
  final bool Function(DateTime) allowed;
  final void Function(DateTime) onTap;

  @override
  Widget build(BuildContext context) {
    final ok = allowed(date);
    final isStart = start != null && date == start;
    final isEnd = end != null && date == end;
    final endpoint = isStart || isEnd;
    final inside = start != null && end != null && date.isAfter(start!) && date.isBefore(end!);
    final hasBand = start != null && end != null && start != end && (inside || endpoint);

    return GestureDetector(
      onTap: ok ? () => onTap(date) : null,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: 44,
        child: Stack(alignment: Alignment.center, children: [
          if (hasBand)
            Positioned.fill(
              top: 4,
              bottom: 4,
              left: isStart ? 22 : 0,
              right: isEnd ? 22 : 0,
              child: ColoredBox(color: AppColors.violet100),
            ),
          Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: endpoint ? AppColors.violet : null,
              border: !endpoint && date == today ? Border.all(color: AppColors.violet, width: 1.5) : null,
              boxShadow: endpoint ? AppShadows.glow : null,
            ),
            child: Text(
              '${date.day}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: endpoint ? FontWeight.w800 : FontWeight.w600,
                color: endpoint ? Colors.white : (ok ? (inside ? AppColors.violet700 : AppColors.ink) : AppColors.line),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
