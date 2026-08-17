import 'dart:math' as math;

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import '../theme/spaghetti_theme.dart';

/// Widget tests call [WidgetTester.pumpAndSettle]; a repeating ticker never settles.
bool _loopingFxEnabled() {
  return !WidgetsBinding.instance.runtimeType.toString().contains('TestWidgetsFlutterBinding');
}

class HumidityDrops extends StatefulWidget {
  const HumidityDrops({super.key, required this.percent, required this.profile});

  final double percent;
  final AnimationProfile profile;

  @override
  State<HumidityDrops> createState() => _HumidityDropsState();
}

class _HumidityDropsState extends State<HumidityDrops> with SingleTickerProviderStateMixin {
  Ticker? _ticker;
  Duration _elapsed = const Duration(milliseconds: 1400);

  @override
  void initState() {
    super.initState();
    if (_loopingFxEnabled()) {
      _ticker = createTicker((elapsed) {
        setState(() => _elapsed = elapsed);
      })..start();
    }
  }

  @override
  void dispose() {
    _ticker?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        painter: _DropsPainter(
          seconds: _elapsed.inMicroseconds / 1e6,
          percent: widget.percent,
          period: _period(widget.profile),
        ),
        child: const SizedBox.expand(),
      ),
    );
  }

  static double _period(AnimationProfile profile) {
    return switch (profile) {
      AnimationProfile.subtle => 4.8,
      AnimationProfile.standard => 3.4,
      AnimationProfile.rich => 2.4,
    };
  }
}

class _DropsPainter extends CustomPainter {
  _DropsPainter({required this.seconds, required this.percent, required this.period});

  final double seconds;
  final double percent;
  final double period;

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;
    final count = 10 + (percent / 14).round();
    final density = (percent / 100).clamp(0.25, 1.0);
    for (var i = 0; i < count; i++) {
      final s = 4.2 + (i % 4) * 1.7;
      final speed = 0.55 + (i % 5) * 0.12;
      final phase = i * 0.173;
      final fall = (seconds / period * speed + phase) % 1.0;
      final lane = count == 1 ? 0.5 : i / (count - 1);
      final sway = math.sin(seconds / period * math.pi * 2 + i * 1.3) * 0.028;
      final x = size.width * (0.08 + lane * 0.84 + sway);
      final pad = s * 2.8;
      final travel = size.height + pad * 2;
      final y = -pad + travel * fall;
      if (y < -pad || y > size.height + pad) continue;
      _drop(canvas, Offset(x, y), s, const Color(0xFF3F77DA).withValues(alpha: 0.22 + density * 0.42));
    }
  }

  void _drop(Canvas canvas, Offset c, double s, Color color) {
    final path = Path()
      ..moveTo(c.dx, c.dy - s * 1.15)
      ..cubicTo(c.dx + s * 0.85, c.dy - s * 0.2, c.dx + s * 0.7, c.dy + s * 0.45, c.dx, c.dy + s * 0.85)
      ..cubicTo(c.dx - s * 0.7, c.dy + s * 0.45, c.dx - s * 0.85, c.dy - s * 0.2, c.dx, c.dy - s * 1.15);
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _DropsPainter oldDelegate) =>
      oldDelegate.seconds != seconds || oldDelegate.percent != percent || oldDelegate.period != period;
}

class SprinklerFx extends StatefulWidget {
  const SprinklerFx({super.key, required this.active, required this.profile});

  final bool active;
  final AnimationProfile profile;

  @override
  State<SprinklerFx> createState() => _SprinklerFxState();
}

class _SprinklerFxState extends State<SprinklerFx> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: _period(widget.profile));
    if (widget.active && _loopingFxEnabled()) {
      _controller.repeat();
    } else {
      _controller.value = 0;
    }
  }

  @override
  void didUpdateWidget(SprinklerFx oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _controller.duration = _period(widget.profile);
    }
    if (widget.active && _loopingFxEnabled() && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.active && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  static Duration _period(AnimationProfile profile) {
    return switch (profile) {
      AnimationProfile.subtle => const Duration(milliseconds: 2800),
      AnimationProfile.standard => const Duration(milliseconds: 2000),
      AnimationProfile.rich => const Duration(milliseconds: 1500),
    };
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _SprinklerPainter(t: _controller.value, active: widget.active),
            child: const SizedBox.expand(),
          );
        },
      ),
    );
  }
}

class _SprinklerPainter extends CustomPainter {
  _SprinklerPainter({required this.t, required this.active});

  final double t;
  final bool active;

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;
    final origin = Offset(size.width * 0.22, size.height * 0.78);
    final swing = active ? math.sin(t * math.pi * 2) * 0.7 : 0.0;
    const color = Color(0xFF3F77DA);
    final metal = color.withValues(alpha: active ? 0.9 : 0.55);

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(origin.dx, origin.dy + 18), width: 22, height: 8),
        const Radius.circular(3),
      ),
      Paint()..color = metal.withValues(alpha: 0.45),
    );
    canvas.drawLine(
      Offset(origin.dx, origin.dy + 16),
      origin,
      Paint()
        ..color = metal
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round,
    );

    canvas.save();
    canvas.translate(origin.dx, origin.dy);
    canvas.rotate(swing);
    final head = Path()
      ..moveTo(-7, 2)
      ..lineTo(-3, -7)
      ..lineTo(3, -7)
      ..lineTo(7, 2)
      ..close();
    canvas.drawPath(head, Paint()..color = metal);
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(-2.2, -11, 4.4, 5), const Radius.circular(1.2)),
      Paint()..color = metal,
    );
    canvas.restore();

    if (!active) return;

    const rays = 11;
    for (var i = 0; i < rays; i++) {
      final spread = (i / (rays - 1) - 0.5) * 1.35;
      final angle = -math.pi / 2 + swing + spread;
      final reach = 0.95 * size.height;
      final dir = Offset(math.cos(angle), math.sin(angle));
      canvas.drawLine(
        origin,
        origin + dir * reach,
        Paint()
          ..color = TokenColors.accentGlow.withValues(alpha: 0.16)
          ..strokeWidth = 1.2,
      );
      for (var b = 0; b < 3; b++) {
        final bead = ((t * 1.4 + i * 0.09 + b * 0.28) % 1.0);
        final p = origin + dir * (reach * bead);
        canvas.drawCircle(
          p,
          2.6,
          Paint()..color = TokenColors.accentGlow.withValues(alpha: 0.5 * (1 - bead)),
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SprinklerPainter oldDelegate) =>
      oldDelegate.t != t || oldDelegate.active != active;
}

class LightBulbGlyph extends StatefulWidget {
  const LightBulbGlyph({
    super.key,
    required this.on,
    required this.profile,
    this.onIcon = Icons.lightbulb_rounded,
    this.offIcon = Icons.lightbulb_outline_rounded,
    this.glowColor = const Color(0xFFF5C542),
  });

  final bool on;
  final AnimationProfile profile;
  final IconData onIcon;
  final IconData offIcon;
  final Color glowColor;

  @override
  State<LightBulbGlyph> createState() => _LightBulbGlyphState();
}

class _LightBulbGlyphState extends State<LightBulbGlyph> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: _period(widget.profile));
    if (widget.on && _loopingFxEnabled()) _controller.repeat(reverse: true);
    if (widget.on && !_loopingFxEnabled()) _controller.value = 0.7;
  }

  @override
  void didUpdateWidget(LightBulbGlyph oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _controller.duration = _period(widget.profile);
    }
    if (widget.on && _loopingFxEnabled() && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.on && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  static Duration _period(AnimationProfile profile) {
    return switch (profile) {
      AnimationProfile.subtle => const Duration(milliseconds: 1600),
      AnimationProfile.standard => const Duration(milliseconds: 1100),
      AnimationProfile.rich => const Duration(milliseconds: 800),
    };
  }

  @override
  Widget build(BuildContext context) {
        final amber = widget.glowColor;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final glow = widget.on ? 0.55 + _controller.value * 0.45 : 0.0;
        return AnimatedContainer(
          duration: tokenMotion(widget.profile),
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: amber.withValues(alpha: widget.on ? 0.18 + _controller.value * 0.1 : 0.06),
            boxShadow: widget.on
                ? [
                    BoxShadow(
                      color: amber.withValues(alpha: 0.4 * glow),
                      blurRadius: 18 * glow,
                      spreadRadius: 2 * glow,
                    ),
                  ]
                : const [],
          ),
          alignment: Alignment.center,
          child: Icon(
            widget.on ? widget.onIcon : widget.offIcon,
            color: widget.on ? amber : TokenColors.offline,
            size: 28,
          ),
        );
      },
    );
  }
}
