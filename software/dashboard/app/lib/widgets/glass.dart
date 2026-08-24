import 'dart:ui';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.backdrop,
    this.accent,
    this.glow,
    this.hovered = false,
    this.padding,
    this.radiusScale = 1,
  });

  final Widget child;
  final Widget? backdrop;
  final Color? accent;
  final Color? glow;
  final bool hovered;
  final EdgeInsetsGeometry? padding;
  final double radiusScale;

  @override
  Widget build(BuildContext context) {
    final light = Theme.of(context).brightness == Brightness.light;
    final radius = tokenCardRadius(radiusScale);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        borderRadius: radius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: light
              ? [
                  hovered ? const Color(0xFFFFFFFF) : const Color(0xF5FFFFFF),
                  hovered ? const Color(0xFFE7EEF8) : const Color(0xE8F3F6FB),
                ]
              : [
                  hovered ? const Color(0xE6363C48) : const Color(0xCC2A2F38),
                  hovered ? const Color(0xCC242830) : const Color(0xB31A1D23),
                ],
        ),
        border: Border.all(
          color: glow != null
              ? glow!.withValues(alpha: light ? 0.7 : 0.85)
              : (light ? const Color(0x66FFFFFF) : const Color(0x33FFFFFF)),
          width: glow == null ? 1 : 1.6,
        ),
        boxShadow: [
          if (glow != null)
            BoxShadow(
              color: glow!.withValues(alpha: light ? 0.42 : 0.55),
              blurRadius: 22,
              spreadRadius: 1.5,
            ),
          ...(hovered ? tokenShadowE2 : tokenShadowE1),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          children: [
            if (backdrop != null) Positioned.fill(child: backdrop!),
            if (glow != null)
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        center: Alignment.center,
                        radius: 1.05,
                        colors: [
                          glow!.withValues(alpha: light ? 0.32 : 0.4),
                          glow!.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withValues(alpha: light ? 0.95 : 0.28),
                      Colors.white.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            if (accent != null)
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: ColoredBox(color: accent!, child: const SizedBox(width: 3)),
              ),
            Padding(
              padding: (padding ?? const EdgeInsets.fromLTRB(10, 8, 10, 8))
                  .add(EdgeInsets.only(left: accent == null ? 0 : 3)),
              child: child,
            ),
          ],
        ),
      ),
    );
  }
}

class FlowBackdrop extends StatelessWidget {
  const FlowBackdrop({
    super.key,
    required this.appearance,
    required this.child,
    this.schematic = false,
    this.garden = false,
  });

  final DashboardAppearance appearance;
  final Widget child;
  final bool schematic;
  final bool garden;

  @override
  Widget build(BuildContext context) {
    final light = Theme.of(context).brightness == Brightness.light;
    final bg = appearance.background;
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: bg.kind == BackgroundKind.gradient && bg.colors.length >= 2
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: bg.colors.map(parseHexColor).toList(),
                  )
                : null,
            color: bg.kind == BackgroundKind.solid
                ? parseHexColor(bg.colors.isEmpty ? '#F5F6F7' : bg.colors.first)
                : (light ? const Color(0xFFF5F6F7) : const Color(0xFF0F1114)),
          ),
        ),
        if (garden) CustomPaint(painter: _GardenBedsPainter(light: light)),
        if (schematic) CustomPaint(painter: _SchematicGridPainter(light: light)),
        child,
      ],
    );
  }
}

class FrostBar extends StatelessWidget {
  const FrostBar({super.key, required this.child, this.height});

  final Widget child;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final light = Theme.of(context).brightness == Brightness.light;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: light ? const Color(0xB8FFFFFF) : const Color(0xB31A1D23),
            border: Border(
              bottom: BorderSide(color: light ? const Color(0x33FFFFFF) : const Color(0x22FFFFFF)),
            ),
          ),
          child: height == null ? child : SizedBox(height: height, child: child),
        ),
      ),
    );
  }
}

class _GardenBedsPainter extends CustomPainter {
  _GardenBedsPainter({required this.light});

  final bool light;

  @override
  void paint(Canvas canvas, Size size) {
    final bed = Paint()..color = light ? const Color(0x33D7E0D9) : const Color(0x5914532D);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.08, size.height * 0.12, size.width * 0.84, size.height * 0.76),
        const Radius.circular(28),
      ),
      bed,
    );
    final path = Paint()
      ..color = light ? const Color(0x44C9D4CC) : const Color(0x80166534)
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(size.width * 0.5, size.height * 0.2), Offset(size.width * 0.5, size.height * 0.8), path);
  }

  @override
  bool shouldRepaint(covariant _GardenBedsPainter oldDelegate) => oldDelegate.light != light;
}

class _SchematicGridPainter extends CustomPainter {
  _SchematicGridPainter({required this.light});

  final bool light;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = (light ? const Color(0xFF3F77DA) : const Color(0xFF3B82F6)).withValues(alpha: 0.035)
      ..strokeWidth = 1;
    const step = 48.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SchematicGridPainter oldDelegate) => oldDelegate.light != light;
}
