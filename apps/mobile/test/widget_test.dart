import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/theme/theme.dart';
import 'package:revyne_app/core/widgets/ui.dart';
import 'package:revyne_app/features/business/business.dart';

void main() {
  testWidgets('ScoreRing shows the score and a dash when unknown', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: RevyneTheme.light(),
      home: const Scaffold(body: Row(children: [ScoreRing(score: 72), ScoreRing(score: null)])),
    ));
    expect(find.text('72'), findsOneWidget);
    expect(find.text('–'), findsOneWidget);
  });

  test('Business.fromJson applies defaults for optional fields', () {
    final b = Business.fromJson({
      'id': 'b1',
      'owner_id': 'u1',
      'name': 'Sharma Sweets',
      'public_slug': 'sharma-sweets-x1',
    });
    expect(b.reviewLanguages, ['en']);
    expect(b.replyTone, 'friendly');
    expect(b.products, isEmpty);
    expect(b.googleReviewUrl, isNull);
  });
}
