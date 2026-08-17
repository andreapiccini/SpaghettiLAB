import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class KioskRadialItem {
  const KioskRadialItem({
    required this.id,
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String id;
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
}

/// Menu kiosk: hamburger in basso a destra, destinazioni a ventaglio.
class KioskRadialMenu extends StatefulWidget {
  const KioskRadialMenu({
    super.key,
    required this.open,
    required this.onToggle,
    required this.items,
  });

  final bool open;
  final VoidCallback onToggle;
  final List<KioskRadialItem> items;

  @override
  State<KioskRadialMenu> createState() => _KioskRadialMenuState();
}

class _KioskRadialMenuState extends State<KioskRadialMenu> with SingleTickerProviderStateMixin {
  static const _fab = 48.0;
  static const _box = 420.0;
  static const _radius = 268.0;
  static const _startAngle = 180 * math.pi / 180;
  static const _endAngle = 100 * math.pi / 180;

  late final AnimationController _fan = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 520),
    reverseDuration: const Duration(milliseconds: 220),
  );

  @override
  void initState() {
    super.initState();
    if (widget.open) _fan.value = 1;
  }

  @override
  void didUpdateWidget(covariant KioskRadialMenu oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.open == oldWidget.open) return;
    if (widget.open) {
      _fan.forward();
    } else {
      _fan.reverse();
    }
  }

  @override
  void dispose() {
    _fan.dispose();
    super.dispose();
  }

  ({Offset offset, double angle}) _spoke(int index, int count) {
    final t = count <= 1 ? 0.5 : index / (count - 1);
    final angle = _startAngle + (_endAngle - _startAngle) * t;
    return (
      offset: Offset(math.cos(angle) * _radius, -math.sin(angle) * _radius),
      angle: angle,
    );
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);
    final origin = const Offset(_box - _fab / 2, _box - _fab / 2);
    final count = widget.items.length;

    return AnimatedBuilder(
      animation: _fan,
      builder: (context, _) {
        final t = _fan.value;
        return Stack(
          children: [
            if (t > 0.001)
              Positioned.fill(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: widget.onToggle,
                  child: ColoredBox(
                    color: Colors.black.withValues(alpha: 0.18 * t),
                  ),
                ),
              ),
            Positioned(
              right: TokenSpace.md + padding.right,
              bottom: TokenSpace.md + padding.bottom,
              child: SizedBox(
                width: _box,
                height: _box,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    if (t > 0.001)
                      for (var i = 0; i < count; i++)
                        _FanSpoke(
                          progress: _spokeProgress(i),
                          origin: origin,
                          spoke: _spoke(i, count),
                          child: _HoverChip(item: widget.items[i], angle: _spoke(i, count).angle),
                        ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: _HamburgerButton(
                        open: widget.open,
                        progress: t,
                        onPressed: widget.onToggle,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  double _spokeProgress(int index) {
    if (_fan.status == AnimationStatus.reverse) {
      return Curves.easeInCubic.transform(_fan.value);
    }
    final start = (index * 0.07).clamp(0.0, 0.4);
    final end = (0.48 + index * 0.07).clamp(0.55, 1.0);
    final span = end - start;
    if (span <= 0) return _fan.value;
    final local = ((_fan.value - start) / span).clamp(0.0, 1.0);
    return Curves.easeOutBack.transform(local);
  }
}

class _FanSpoke extends StatelessWidget {
  const _FanSpoke({
    required this.progress,
    required this.origin,
    required this.spoke,
    required this.child,
  });

  final double progress;
  final Offset origin;
  final ({Offset offset, double angle}) spoke;
  final Widget child;

  static const _size = 200.0;

  @override
  Widget build(BuildContext context) {
    final t = progress.clamp(0.0, 1.2);
    final center = origin + spoke.offset * t.clamp(0.0, 1.15);
    return Positioned(
      left: center.dx - _size / 2,
      top: center.dy - _size / 2,
      width: _size,
      height: _size,
      child: IgnorePointer(
        ignoring: progress < 0.55,
        child: Opacity(
          opacity: t.clamp(0.0, 1.0),
          child: Transform.scale(
            scale: t.clamp(0.0, 1.0),
            child: child,
          ),
        ),
      ),
    );
  }
}

class _HamburgerButton extends StatelessWidget {
  const _HamburgerButton({
    required this.open,
    required this.progress,
    required this.onPressed,
  });

  final bool open;
  final double progress;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final light = Theme.of(context).brightness == Brightness.light;
    return Semantics(
      button: true,
      label: open ? 'Nascondi menu' : 'Mostra menu',
      child: Material(
        key: const ValueKey('kiosk-menu'),
        color: light ? const Color(0xE6FFFFFF) : const Color(0xE62A2F38),
        shape: const CircleBorder(),
        elevation: 3 + 2 * progress,
        shadowColor: Colors.black26,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: SizedBox(
            width: 48,
            height: 48,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              child: Icon(
                open ? Icons.close_rounded : Icons.menu_rounded,
                key: ValueKey(open),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HoverChip extends StatefulWidget {
  const _HoverChip({required this.item, required this.angle});

  final KioskRadialItem item;
  final double angle;

  @override
  State<_HoverChip> createState() => _HoverChipState();
}

class _HoverChipState extends State<_HoverChip> {
  bool _hot = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final light = theme.brightness == Brightness.light;
    final selected = widget.item.selected;
    final hot = _hot || selected;
    final accent = TokenColors.accent;
    final circle = selected
        ? accent
        : (light ? const Color(0xF2FFFFFF) : const Color(0xE62A2F38));
    final iconColor = selected
        ? Colors.white
        : (_hot ? accent : theme.iconTheme.color);
    final labelStyle = theme.textTheme.labelSmall?.copyWith(
          fontSize: _hot ? 12.5 : 11,
          fontWeight: _hot || selected ? FontWeight.w700 : FontWeight.w500,
          color: _hot || selected
              ? accent
              : (light ? TokenColors.lightTextPrimary : TokenColors.textPrimary),
          height: 1.05,
        ) ??
        const TextStyle(fontSize: 11);
    final labelShift = Offset(math.cos(widget.angle), -math.sin(widget.angle)) * 58;

    return MouseRegion(
      opaque: false,
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hot = true),
      onExit: (_) => setState(() => _hot = false),
      child: GestureDetector(
        key: ValueKey('kiosk-radial-${widget.item.id}'),
        behavior: HitTestBehavior.deferToChild,
        onTapDown: (_) => setState(() => _hot = true),
        onTapUp: (_) => setState(() => _hot = false),
        onTapCancel: () => setState(() => _hot = false),
        onTap: widget.item.onTap,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            AnimatedScale(
              scale: _hot ? 1.1 : 1,
              duration: const Duration(milliseconds: 160),
              curve: Curves.easeOutCubic,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                curve: Curves.easeOutCubic,
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: circle,
                  shape: BoxShape.circle,
                  boxShadow: hot ? tokenShadowE2 : tokenShadowE1,
                ),
                child: AnimatedRotation(
                  turns: _hot ? 0.03 : 0,
                  duration: const Duration(milliseconds: 180),
                  curve: Curves.easeOutCubic,
                  child: Icon(widget.item.icon, size: _hot ? 22 : 20, color: iconColor),
                ),
              ),
            ),
            Transform.translate(
              offset: labelShift,
              child: AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 160),
                curve: Curves.easeOutCubic,
                style: labelStyle,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Text(
                    widget.item.label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.visible,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

