import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/theme/theme.dart';
import 'package:revyne_app/core/widgets/range_calendar.dart';

/// Opens the calendar for Oct 2026 (allowed: 1 Sep – 20 Oct) and returns the result holder.
Future<List<DateTimeRange?>> open(WidgetTester tester) async {
  final result = <DateTimeRange?>[];
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.5;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(MaterialApp(
    theme: RevyneTheme.light(),
    home: Builder(
      builder: (context) => TextButton(
        onPressed: () async => result.add(await showRangeCalendar(context, first: DateTime(2026, 9, 1), last: DateTime(2026, 10, 20))),
        child: const Text('open'),
      ),
    ),
  ));
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
  return result;
}

void main() {
  testWidgets('tap start then end, see the summary, and return the range', (tester) async {
    final result = await open(tester);
    expect(find.text('October 2026'), findsOneWidget);
    expect(find.text('Tap a start date'), findsOneWidget);

    await tester.tap(find.text('5'));
    await tester.pump();
    expect(find.text('5 Oct – tap an end date'), findsOneWidget);

    await tester.tap(find.text('12'));
    await tester.pump();
    expect(find.text('5 Oct – 12 Oct'), findsOneWidget);
    expect(find.text('8 days'), findsOneWidget);

    await tester.tap(find.text('Show stats'));
    await tester.pumpAndSettle();
    expect(result.single, DateTimeRange(start: DateTime(2026, 10, 5), end: DateTime(2026, 10, 12)));
  });

  testWidgets('an earlier second tap becomes the new start; days after the last allowed one do nothing', (tester) async {
    await open(tester);
    await tester.tap(find.text('12'));
    await tester.pump();
    await tester.tap(find.text('5'));
    await tester.pump();
    expect(find.text('5 Oct – tap an end date'), findsOneWidget);

    await tester.tap(find.text('25')); // after 20 Oct: not allowed
    await tester.pump();
    expect(find.text('5 Oct – tap an end date'), findsOneWidget);
  });

  testWidgets('presets fill the range, clipped to what Google has', (tester) async {
    await open(tester);
    await tester.tap(find.text('Last month'));
    await tester.pump();
    expect(find.text('1 Sep – 30 Sep'), findsOneWidget);
    await tester.tap(find.text('This month'));
    await tester.pump();
    expect(find.text('1 Oct – 20 Oct'), findsOneWidget);
  });

  testWidgets('Clear appears once something is picked and returns the cleared marker', (tester) async {
    final result = await open(tester);
    expect(find.text('Clear'), findsNothing); // nothing picked yet
    await tester.tap(find.text('7'));
    await tester.pump();
    await tester.tap(find.text('Clear'));
    await tester.pumpAndSettle();
    expect(identical(result.single, RangeCalendar.cleared), isTrue);
  });

  testWidgets('a single day is a valid range', (tester) async {
    final result = await open(tester);
    await tester.tap(find.text('7'));
    await tester.pump();
    await tester.tap(find.text('Show stats'));
    await tester.pumpAndSettle();
    expect(result.single, DateTimeRange(start: DateTime(2026, 10, 7), end: DateTime(2026, 10, 7)));
  });
}
