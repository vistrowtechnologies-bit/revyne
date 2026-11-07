import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/core/theme/palettes.dart';
import 'package:revyne_app/core/widgets/ui.dart';

/// Mirrors app.dart's _PaletteScope: const widgets must repaint in the new colours.
class _Scope extends StatefulWidget {
  const _Scope({required this.child});
  final Widget child;
  @override
  State<_Scope> createState() => _ScopeState();
}

class _ScopeState extends State<_Scope> {
  @override
  void initState() {
    super.initState();
    BrandPalette.notifier.addListener(_changed);
  }

  void _changed() {
    setState(() {});
    void dirty(Element e) {
      e.markNeedsBuild();
      e.visitChildren(dirty);
    }

    (context as Element).visitChildren(dirty);
  }

  @override
  void dispose() {
    BrandPalette.notifier.removeListener(_changed);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

void main() {
  testWidgets('a const IconTile picks up the new palette', (tester) async {
    BrandPalette.notifier.value = BrandPalette.royal;
    await tester.pumpWidget(const MaterialApp(home: _Scope(child: Center(child: IconTile(Icons.star)))));
    Color iconColor() => tester.widget<Icon>(find.byIcon(Icons.star)).color!;
    expect(iconColor(), BrandPalette.royal.primary);

    BrandPalette.notifier.value = BrandPalette.ocean;
    await tester.pump();
    expect(iconColor(), BrandPalette.ocean.primary);

    BrandPalette.notifier.value = BrandPalette.royal;
    await tester.pump();
  });
}
