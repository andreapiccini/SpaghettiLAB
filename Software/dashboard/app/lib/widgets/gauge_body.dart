import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class GaugeBody extends StatelessWidget {
  const GaugeBody({
    super.key,
    required this.value,
    required this.unit,
    this.min = 0,
    this.max = 40,
    this.valueSize,
    this.unitSize,
    this.showUnit = true,
    this.decimals = 1,
    this.valueColor,
    this.compact = false,
  });

  final double value;
  final String? unit;
  final double min;
  final double max;
  final double? valueSize;
  final double? unitSize;
  final bool showUnit;
  final int decimals;
  final Color? valueColor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final t = ((value - min) / (max - min)).clamp(0.0, 1.0);
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxW = constraints.maxWidth.isFinite ? constraints.maxWidth : 160.0;
        final maxH = constraints.maxHeight.isFinite ? constraints.maxHeight : 160.0;
        final side = math.min(maxW, maxH);
        if (side <= 0) return const SizedBox.shrink();
        final stroke = compact ? (side * 0.14).clamp(8.0, 13.0) : (side * 0.12).clamp(8.0, 16.0);
        final resolvedValueSize = compact
            ? (side * 0.18).clamp(12.0, 18.0)
            : (valueSize ?? (side * 0.28).clamp(22.0, 42.0));
        final resolvedUnitSize = compact
            ? (side * 0.1).clamp(8.0, 12.0)
            : (unitSize ?? (side * 0.13).clamp(11.0, 18.0));
        final hole = (side - stroke * 2 - 6).clamp(12.0, side);
        return Center(
          child: SizedBox(
            width: side,
            height: side,
            child: Stack(
              alignment: Alignment.center,
              children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: t),
                  duration: const Duration(milliseconds: 420),
                  curve: Curves.easeOutCubic,
                  builder: (context, progress, _) {
                    return CustomPaint(
                      size: Size.square(side),
                      painter: _ArcPainter(
                        progress: progress,
                        track: theme.dividerColor.withValues(alpha: 0.7),
                        fill: theme.colorScheme.primary,
                        glow: TokenColors.accentGlow,
                        strokeWidth: stroke,
                      ),
                    );
                  },
                ),
                SizedBox(
                  width: compact ? hole * 0.72 : hole * 0.86,
                  height: compact ? hole * 0.4 : hole * 0.48,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          value.toStringAsFixed(decimals.clamp(0, 3)),
                          style: theme.textTheme.displayLarge?.copyWith(
                            fontSize: resolvedValueSize,
                            height: 1,
                            color: valueColor,
                          ),
                        ),
                        if (showUnit && unit != null && unit!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(left: 3),
                            child: Text(
                              unit!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontSize: resolvedUnitSize,
                                height: 1,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ArcPainter extends CustomPainter {
  _ArcPainter({
    required this.progress,
    required this.track,
    required this.fill,
    required this.glow,
    required this.strokeWidth,
  });

  final double progress;
  final Color track;
  final Color fill;
  final Color glow;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final inset = strokeWidth / 2 + 2;
    final arc = (Offset.zero & size).deflate(inset);
    const start = math.pi * 0.75;
    const sweep = math.pi * 1.5;
    canvas.drawArc(
      arc,
      start,
      sweep,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..color = track,
    );
    final shader = SweepGradient(
      startAngle: start,
      endAngle: start + sweep,
      colors: [fill, glow, fill],
    ).createShader(arc);
    canvas.drawArc(
      arc,
      start,
      sweep * progress,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..shader = shader
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 0.4),
    );
  }

  @override
  bool shouldRepaint(_ArcPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.strokeWidth != strokeWidth;
}

class SparklineBody extends StatelessWidget {
  const SparklineBody({
    super.key,
    required this.value,
    this.unit,
    this.samples,
    this.valueSize,
    this.unitSize,
    this.showUnit = true,
    this.decimals = 0,
    this.valueColor,
  });

  final double value;
  final String? unit;
  final List<double>? samples;
  final double? valueSize;
  final double? unitSize;
  final bool showUnit;
  final int decimals;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: CustomPaint(
            painter: _SparkPainter(
              seed: value,
              samples: samples,
              color: theme.colorScheme.primary,
              fill: TokenColors.accentGlow,
            ),
            child: const SizedBox.expand(),
          ),
        ),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value.toStringAsFixed(decimals.clamp(0, 3)),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: valueSize,
                  color: valueColor,
                ),
              ),
              if (showUnit && unit != null && unit!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(
                    unit!,
                    style: theme.textTheme.bodySmall?.copyWith(fontSize: unitSize),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SparkPainter extends CustomPainter {
  _SparkPainter({required this.seed, required this.color, required this.fill, this.samples});

  final double seed;
  final List<double>? samples;
  final Color color;
  final Color fill;

  @override
  void paint(Canvas canvas, Size size) {
    final pts = _points(size);
    if (pts.length < 2) return;
    final line = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (var i = 1; i < pts.length; i++) {
      final prev = pts[i - 1];
      final cur = pts[i];
      line.quadraticBezierTo(prev.dx, prev.dy, (prev.dx + cur.dx) / 2, (prev.dy + cur.dy) / 2);
    }
    line.lineTo(pts.last.dx, pts.last.dy);
    final area = Path.from(line)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(
      area,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [fill.withValues(alpha: 0.28), fill.withValues(alpha: 0)],
        ).createShader(Offset.zero & size),
    );
    canvas.drawPath(
      line,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.4
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  List<Offset> _points(Size size) {
    final series = samples;
    if (series != null && series.length >= 2) {
      var minV = series.first;
      var maxV = series.first;
      for (final v in series) {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      final span = (maxV - minV).abs() < 0.001 ? 1.0 : maxV - minV;
      return [
        for (var i = 0; i < series.length; i++)
          Offset(
            size.width * i / (series.length - 1),
            size.height * (1 - ((series[i] - minV) / span * 0.76 + 0.12)),
          ),
      ];
    }
    const n = 16;
    return [
      for (var i = 0; i < n; i++)
        Offset(
          size.width * i / (n - 1),
          size.height * (1 - (math.sin((seed / 40) + i * 0.55) * 0.32 + 0.52).clamp(0.12, 0.88)),
        ),
    ];
  }

  @override
  bool shouldRepaint(_SparkPainter oldDelegate) =>
      oldDelegate.seed != seed || oldDelegate.samples != samples;
}
