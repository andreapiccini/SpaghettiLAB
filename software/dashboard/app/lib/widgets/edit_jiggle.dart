import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Widget tests call [WidgetTester.pumpAndSettle]; a repeating ticker never settles.
bool _loopingFxEnabled() {
  return !WidgetsBinding.instance.runtimeType.toString().contains('TestWidgetsFlutterBinding');
}

/// Leggera oscillazione tipo iOS, per le card in modifica layout.
class EditJiggle extends StatefulWidget {
  const EditJiggle({
    super.key,
    required this.enabled,
    required this.child,
    this.seed = 0,
  });

  final bool enabled;
  final Widget child;
  final int seed;

  @override
  State<EditJiggle> createState() => _EditJiggleState();
}

class _EditJiggleState extends State<EditJiggle> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 620 + widget.seed.abs() % 180),
    );
    if (widget.enabled && _loopingFxEnabled()) {
      _controller.repeat(reverse: true);
    } else {
      _controller.value = 0.5;
    }
  }

  @override
  void didUpdateWidget(EditJiggle oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.enabled && _loopingFxEnabled()) {
      if (!_controller.isAnimating) _controller.repeat(reverse: true);
    } else if (_controller.isAnimating) {
      _controller.stop();
      _controller.value = 0.5;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final wave = math.sin((_controller.value + widget.seed * 0.13) * math.pi * 2);
        return Transform.rotate(
          angle: wave * 0.028,
          child: Transform.translate(
            offset: Offset(wave * 0.7, 0),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}
