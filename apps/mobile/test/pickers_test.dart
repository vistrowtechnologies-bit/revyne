import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/theme/theme.dart';
import 'package:revyne_app/core/widgets/pickers.dart';

void main() {
  testWidgets('time picker is a 12-hour dial with AM/PM even when the phone uses 24-hour time', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: RevyneTheme.light(),
      builder: (context, child) => MediaQuery(data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true), child: child!),
      home: Builder(
        builder: (context) => TextButton(
          onPressed: () => pickTime(context, initial: const TimeOfDay(hour: 16, minute: 44), title: 'Publish at'),
          child: const Text('open'),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.text('Publish at'), findsOneWidget);
    expect(find.text('AM'), findsOneWidget);
    expect(find.text('PM'), findsOneWidget);
    expect(find.text('4'), findsWidgets); // 16:44 shows as 4 (PM), not 16
    expect(find.text('16'), findsNothing);
    expect(find.text('00'), findsNothing); // no inner 24-hour ring
  });
}
