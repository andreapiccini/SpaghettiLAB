import 'dart:math' as math;

import 'package:flutter/material.dart';

class SlotChild {
  const SlotChild({required this.slots, required this.child, this.id});

  final int slots;
  final Widget child;
  final Object? id;
}

/// Packs children into a grid. [slots] > 1 spans that many rows in one column.
class SlotGrid extends StatelessWidget {
  const SlotGrid({
    super.key,
    required this.children,
    required this.maxCrossAxisExtent,
    required this.childAspectRatio,
    required this.spacing,
    this.animate = true,
  });

  final List<SlotChild> children;
  final double maxCrossAxisExtent;
  final double childAspectRatio;
  final double spacing;
  final bool animate;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        var columns = (width / (maxCrossAxisExtent + spacing)).ceil();
        if (columns < 1) columns = 1;
        final slotW = (width - spacing * (columns - 1)) / columns;
        final slotH = slotW / childAspectRatio;
        final placed = _place(children, columns);
        var rows = 0;
        for (final p in placed) {
          rows = math.max(rows, p.row + p.slots);
        }
        final height = rows == 0 ? 0.0 : rows * slotH + (rows - 1) * spacing;
        return SingleChildScrollView(
          child: SizedBox(
            height: height,
            child: Stack(
              children: [
                for (final p in placed)
                  AnimatedPositioned(
                    key: ValueKey(p.child.id ?? identityHashCode(p.child)),
                    duration: animate ? const Duration(milliseconds: 320) : Duration.zero,
                    curve: Curves.easeOutCubic,
                    left: p.col * (slotW + spacing),
                    top: p.row * (slotH + spacing),
                    width: slotW,
                    height: p.slots * slotH + (p.slots - 1) * spacing,
                    child: p.child.child,
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  static List<_Placed> _place(List<SlotChild> children, int columns) {
    final occupied = <int>{};
    int key(int c, int r) => r * 64 + c;
    bool fits(int c, int r, int h) {
      if (c >= columns) return false;
      for (var y = r; y < r + h; y++) {
        if (occupied.contains(key(c, y))) return false;
      }
      return true;
    }

    void mark(int c, int r, int h) {
      for (var y = r; y < r + h; y++) {
        occupied.add(key(c, y));
      }
    }

    final out = <_Placed>[];
    for (final child in children) {
      final h = child.slots.clamp(1, 8);
      var done = false;
      for (var row = 0; !done; row++) {
        for (var col = 0; col < columns; col++) {
          if (!fits(col, row, h)) continue;
          mark(col, row, h);
          out.add(_Placed(col: col, row: row, slots: h, child: child));
          done = true;
          break;
        }
      }
    }
    return out;
  }
}

class _Placed {
  const _Placed({required this.col, required this.row, required this.slots, required this.child});

  final int col;
  final int row;
  final int slots;
  final SlotChild child;
}
