import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class DropSegment<T> {
  const DropSegment({required this.value, required this.label});

  final T value;
  final String label;
}

/// Selettore a goccia: la selezione riempie il segmento, senza alone interno.
class DropSegmented<T> extends StatelessWidget {
  const DropSegmented({
    super.key,
    required this.segments,
    required this.value,
    required this.onChanged,
  });

  final List<DropSegment<T>> segments;
  final T value;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final light = theme.brightness == Brightness.light;
    final radius = tokenCardRadius();
    return Material(
      color: light ? const Color(0xF2FFFFFF) : const Color(0xCC1A1D23),
      elevation: 1,
      shadowColor: const Color(0x1414171F),
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: BorderSide(color: light ? const Color(0x66FFFFFF) : const Color(0x22FFFFFF)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          for (final segment in segments)
            Expanded(
              child: _DropCell(
                label: segment.label,
                selected: segment.value == value,
                onTap: () {
                  if (segment.value != value) onChanged(segment.value);
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _DropCell extends StatelessWidget {
  const _DropCell({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: selected ? theme.colorScheme.primary : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        overlayColor: tokenInkOverlayOf(context),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : theme.colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
