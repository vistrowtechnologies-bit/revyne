// Touchable charts, like the web app's Recharts ones: press or drag across a
// chart to see that day's numbers. Drawn in place, no chart package.
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// One day on a chart. [title] and [lines] show in the tooltip.
class ChartPoint {
  const ChartPoint({required this.value, required this.title, this.lines = const []});
  final int value;
  final String title;
  final List<String> lines;
}

/// Shared touch handling: which point the finger is over, if any.
mixin _Touch<T extends StatefulWidget> on State<T> {
  int? active;
  int get count;

  void _at(Offset p, double width) {
    if (count == 0) return;
    final i = (p.dx / width * count).floor().clamp(0, count - 1);
    if (i != active) setState(() => active = i);
  }

  Widget touch(Widget child) => LayoutBuilder(
        builder: (context, c) => GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: (d) => _at(d.localPosition, c.maxWidth),
          onHorizontalDragStart: (d) => _at(d.localPosition, c.maxWidth),
          onHorizontalDragUpdate: (d) => _at(d.localPosition, c.maxWidth),
          onHorizontalDragEnd: (_) => setState(() => active = null),
          onTapUp: (_) => Future.delayed(const Duration(seconds: 2), () {
            if (mounted) setState(() => active = null);
          }),
          child: child,
        ),
      );
}

class _Tooltip extends StatelessWidget {
  const _Tooltip({required this.point, required this.fraction});
  final ChartPoint point;
  final double fraction; // 0–1 across the chart

  @override
  Widget build(BuildContext context) => Positioned(
        left: 0,
        right: 0,
        bottom: null,
        top: -54,
        child: Align(
        alignment: Alignment(fraction * 2 - 1, 0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFF1B1530),
            borderRadius: BorderRadius.circular(10),
            boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(point.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12.5)),
              for (final l in point.lines) Text(l, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
            ],
          ),
        ),
      ),
      );
}

/// White bars for the gradient hero card. Press a bar to see the day.
class HeroBars extends StatefulWidget {
  const HeroBars({super.key, required this.points, this.height = 110, this.labels, this.highlightLast = false, this.semanticLabel});
  final List<ChartPoint> points;
  final double height;
  final List<String>? labels; // under each bar (e.g. weekday letters)
  final bool highlightLast;
  final String? semanticLabel;

  @override
  State<HeroBars> createState() => _HeroBarsState();
}

class _HeroBarsState extends State<HeroBars> with _Touch {
  @override
  int get count => widget.points.length;

  double _alpha(int i, ChartPoint p) {
    if (active != null) return i == active ? 1 : 0.35;
    if (widget.highlightLast) return i == widget.points.length - 1 ? 1 : 0.45;
    return p.value == 0 ? 0.3 : 0.85;
  }

  @override
  Widget build(BuildContext context) {
    final pts = widget.points;
    final maxV = pts.fold<int>(0, (m, p) => math.max(m, p.value));
    final thin = pts.length > 40;
    const tipSpace = 0.0;
    return Semantics(
      label: widget.semanticLabel,
      child: SizedBox(
        height: widget.height + tipSpace + (widget.labels != null ? 20 : 0),
        child: touch(Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              top: tipSpace,
              child: Column(children: [
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      for (final (i, p) in pts.indexed)
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.symmetric(horizontal: thin ? 0.6 : (pts.length > 10 ? 1.5 : 5)),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeOutCubic,
                              height: maxV == 0 ? 4 : 4 + (widget.height - 4) * p.value / maxV,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: _alpha(i, p)),
                                borderRadius: BorderRadius.circular(thin ? 2 : 7),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                if (widget.labels != null) ...[
                  const SizedBox(height: 6),
                  Row(children: [
                    for (final l in widget.labels!)
                      Expanded(child: Text(l, textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12, fontWeight: FontWeight.w700))),
                  ]),
                ],
              ]),
            ),
            if (active != null) _Tooltip(point: pts[active!], fraction: (active! + 0.5) / pts.length),
          ],
        )),
      ),
    );
  }
}

/// A soft area chart in the palette colour. Press or drag to read a day.
class TrendArea extends StatefulWidget {
  const TrendArea({super.key, required this.points, this.height = 150, this.firstLabel, this.lastLabel, this.semanticLabel});
  final List<ChartPoint> points;
  final double height;
  final String? firstLabel;
  final String? lastLabel;
  final String? semanticLabel;

  @override
  State<TrendArea> createState() => _TrendAreaState();
}

class _TrendAreaState extends State<TrendArea> with _Touch {
  @override
  int get count => widget.points.length;

  @override
  Widget build(BuildContext context) {
    const tipSpace = 0.0;
    return Semantics(
      label: widget.semanticLabel,
      child: Column(children: [
        SizedBox(
          height: widget.height + tipSpace,
          child: touch(Stack(clipBehavior: Clip.none, children: [
            Positioned.fill(
              top: tipSpace,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOutCubic,
                builder: (_, t, _) => CustomPaint(painter: _AreaPainter(widget.points, active, t, AppColors.violet, AppColors.line)),
              ),
            ),
            if (active != null) _Tooltip(point: widget.points[active!], fraction: (active! + 0.5) / widget.points.length),
          ])),
        ),
        if (widget.firstLabel != null || widget.lastLabel != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(children: [
              Text(widget.firstLabel ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              const Spacer(),
              Text(widget.lastLabel ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ]),
          ),
      ]),
    );
  }
}

class _AreaPainter extends CustomPainter {
  _AreaPainter(this.points, this.active, this.t, this.color, this.grid);
  final List<ChartPoint> points;
  final int? active;
  final double t; // 0–1 grow-in
  final Color color;
  final Color grid;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    final maxV = math.max(1, points.fold<int>(0, (m, p) => math.max(m, p.value)));
    final gp = Paint()
      ..color = grid
      ..strokeWidth = 1;
    for (var i = 0; i <= 3; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gp);
    }
    final step = size.width / points.length;
    Offset at(int i) => Offset(step * (i + 0.5), size.height - (size.height - 4) * points[i].value / maxV * t);
    final line = Path()..moveTo(at(0).dx, at(0).dy);
    for (var i = 1; i < points.length; i++) {
      final a = at(i - 1), b = at(i);
      final mx = (a.dx + b.dx) / 2;
      line.cubicTo(mx, a.dy, mx, b.dy, b.dx, b.dy);
    }
    final area = Path.from(line)
      ..lineTo(at(points.length - 1).dx, size.height)
      ..lineTo(at(0).dx, size.height)
      ..close();
    canvas.drawPath(
      area,
      Paint()
        ..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [color.withValues(alpha: 0.28), color.withValues(alpha: 0.02)])
            .createShader(Offset.zero & size),
    );
    canvas.drawPath(
      line,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round,
    );
    if (active != null) {
      final p = at(active!);
      canvas.drawLine(Offset(p.dx, 0), Offset(p.dx, size.height), Paint()..color = color.withValues(alpha: 0.35));
      canvas.drawCircle(p, 6, Paint()..color = Colors.white);
      canvas.drawCircle(
        p,
        6,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3,
      );
    }
  }

  @override
  bool shouldRepaint(_AreaPainter old) => old.active != active || old.t != t || old.points != points || old.color != color;
}
