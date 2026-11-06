import 'package:flutter/material.dart';

/// RevYne's time picker: always a 12-hour clock dial with AM/PM, whatever the
/// phone's 24-hour setting (the 24-hour dial's two rings confuse owners).
/// Clears text focus first so the keyboard doesn't pop back up afterwards.
Future<TimeOfDay?> pickTime(BuildContext context, {required TimeOfDay initial, String? title}) {
  FocusScope.of(context).unfocus();
  return showTimePicker(
    context: context,
    initialTime: initial,
    initialEntryMode: TimePickerEntryMode.dial,
    helpText: title ?? 'Pick a time',
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: false),
      child: child!,
    ),
  );
}

/// Start–end range on a calendar (full screen on phones).
Future<DateTimeRange?> pickDateRange(BuildContext context,
    {required DateTime first, required DateTime last, DateTimeRange? initial, String? title}) {
  FocusScope.of(context).unfocus();
  return showDateRangePicker(
    context: context,
    firstDate: first,
    lastDate: last,
    initialDateRange: initial,
    helpText: title ?? 'Pick dates',
    saveText: 'Show',
  );
}

/// RevYne's date picker (calendar view), with the same focus handling.
Future<DateTime?> pickDate(BuildContext context, {required DateTime first, required DateTime last, DateTime? initial, String? title}) {
  FocusScope.of(context).unfocus();
  return showDatePicker(
    context: context,
    firstDate: first,
    lastDate: last,
    initialDate: initial ?? first,
    helpText: title ?? 'Pick a date',
  );
}
