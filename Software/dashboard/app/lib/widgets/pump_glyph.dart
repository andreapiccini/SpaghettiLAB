import 'dart:math' as math;

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class PumpGlyph extends StatefulWidget {
  const PumpGlyph({super.key, required this.running, required this.profile});

  final bool running;
  final AnimationProfile profile;

  @override
  State<PumpGlyph> createState() => _PumpGlyphState();
}

class _PumpGlyphState extends State<PumpGlyph> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: pumpPeriod(widget.profile));
    if (widget.running) _controller.repeat();
  }

  @override
  void didUpdateWidget(PumpGlyph oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _controller.duration = pumpPeriod(widget.profile);
    }
    if (widget.running && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.running && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.running ? TokenColors.ok : TokenColors.offline;
    return DecoratedBox(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color.withValues(alpha: widget.running ? 0.22 : 0.08),
            color.withValues(alpha: 0),
          ],
        ),
      ),
      child: RotationTransition(
        turns: _controller,
        child: CustomPaint(
          size: const Size(52, 52),
          painter: _ImpellerPainter(color: color, glow: widget.running),
        ),
      ),
    );
  }
}

class _ImpellerPainter extends CustomPainter {
  _ImpellerPainter({required this.color, required this.glow});

  final Color color;
  final bool glow;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2;
    if (glow) {
      canvas.drawCircle(center, radius, Paint()..color = color.withValues(alpha: 0.18));
    }
    canvas.drawCircle(
      center,
      radius - 2,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
    final blade = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    for (var i = 0; i < 3; i++) {
      final path = Path()
        ..moveTo(center.dx, center.dy)
        ..arcTo(
          Rect.fromCircle(center: center, radius: radius * 0.72),
          -math.pi / 2 + i * 2 * math.pi / 3,
          1.4,
          false,
        )
        ..close();
      canvas.drawPath(path, blade);
    }
    canvas.drawCircle(center, radius * 0.16, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_ImpellerPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.glow != glow;
}
