import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class ViewChrome extends StatelessWidget {
  const ViewChrome({
    super.key,
    required this.title,
    required this.kind,
    required this.editing,
    required this.showEdit,
    this.onToggle,
    this.onChangeView,
    this.onAdd,
    this.onCustomize,
  });

  final String title;
  final ViewModeKind kind;
  final bool editing;
  final bool showEdit;
  final VoidCallback? onToggle;
  final ValueChanged<ViewModeKind>? onChangeView;
  final VoidCallback? onAdd;
  final VoidCallback? onCustomize;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final light = theme.brightness == Brightness.light;
    return Padding(
      padding: const EdgeInsets.fromLTRB(TokenSpace.md, TokenSpace.sm, TokenSpace.md, TokenSpace.sm),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title, style: theme.textTheme.headlineMedium, overflow: TextOverflow.ellipsis),
              ),
              if (showEdit)
                _GlassToggle(
                  editing: editing,
                  onToggle: onToggle,
                ),
              if (showEdit) const SizedBox(width: TokenSpace.sm),
              if (editing && onAdd != null)
                TextButton(
                  key: const ValueKey('view-add'),
                  onPressed: onAdd,
                  child: const Text('Aggiungi'),
                ),
              if (onCustomize != null)
                TextButton(onPressed: onCustomize, child: const Text('Aspetto')),
            ],
          ),
          if (onChangeView != null) ...[
            const SizedBox(height: TokenSpace.sm),
            Align(
              alignment: Alignment.centerLeft,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: light ? const Color(0xB8FFFFFF) : const Color(0x661A1D23),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: light ? const Color(0x66FFFFFF) : const Color(0x22FFFFFF)),
                  boxShadow: tokenShadowE1,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (final option in _views)
                        _ViewPill(
                          label: option.label,
                          selected: kind == option.kind,
                          onTap: () => onChangeView!(option.kind),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _GlassToggle extends StatelessWidget {
  const _GlassToggle({required this.editing, this.onToggle});

  final bool editing;
  final VoidCallback? onToggle;

  @override
  Widget build(BuildContext context) {
    final light = Theme.of(context).brightness == Brightness.light;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: light ? const Color(0xB8FFFFFF) : const Color(0x661A1D23),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: light ? const Color(0x66FFFFFF) : const Color(0x22FFFFFF)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ViewPill(label: 'Vista', selected: !editing, onTap: () { if (editing) onToggle?.call(); }),
          _ViewPill(label: 'Modifica', selected: editing, onTap: () { if (!editing) onToggle?.call(); }),
        ],
      ),
    );
  }
}

class _ViewPill extends StatelessWidget {
  const _ViewPill({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(2),
      child: Material(
        color: selected ? theme.colorScheme.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          overlayColor: tokenInkOverlayOf(context),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : theme.colorScheme.onSurface,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

const _views = [
  (kind: ViewModeKind.cards, label: 'Cards'),
  (kind: ViewModeKind.schematic, label: 'Schema'),
];
