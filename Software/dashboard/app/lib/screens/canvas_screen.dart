import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../renderers/view_renderer.dart';
import '../screens/point_detail_sheet.dart';
import '../theme/spaghetti_theme.dart';
import '../widgets/edit_jiggle.dart';
import '../widgets/glass.dart';
import '../widgets/point_card.dart';
import '../widgets/slot_grid.dart';
import '../widgets/view_chrome.dart';

class CanvasScreen extends StatefulWidget {
  const CanvasScreen({super.key, required this.ctx});

  final ViewRenderContext ctx;

  @override
  State<CanvasScreen> createState() => _CanvasScreenState();
}

class _CanvasScreenState extends State<CanvasScreen> {
  late bool _editing = widget.ctx.editing;
  String? _dragId;
  String? _hoverId;

  ViewRenderContext get ctx => widget.ctx;

  List<DashboardWidget> get _widgets {
    final pages = ctx.layout?.pages ?? const <DashboardPage>[];
    if (pages.isEmpty) {
      return [
        for (var i = 0; i < ctx.points.length; i++)
          DashboardWidget(
            widgetId: 'w-$i',
            pointId: ctx.points[i].pointId,
            visualHint: ctx.points[i].visualHint.name,
            height: ctx.points[i].visualHint == VisualHint.gauge ? 2 : 1,
            column: i % 2,
            row: i ~/ 2,
          ),
      ];
    }
    return pages.first.widgets;
  }

  DashboardPage get _page {
    final pages = ctx.layout?.pages ?? const <DashboardPage>[];
    if (pages.isEmpty) {
      return const DashboardPage(pageId: 'home', title: 'Casa', widgets: []);
    }
    return pages.first;
  }

  List<({DashboardWidget widget, ExposurePoint point})> get _entries {
    final byId = {for (final p in ctx.points) p.pointId: p};
    return [
      for (final w in _widgets)
        if (byId[w.pointId] != null) (widget: w, point: byId[w.pointId]!),
    ];
  }

  List<({DashboardWidget widget, ExposurePoint point})> get _visibleEntries {
    final drag = _dragId;
    final hover = _hoverId;
    if (drag == null || hover == null) return _entries;
    return _movedById(_entries, drag, hover, (e) => e.widget.widgetId);
  }

  void _commit(List<DashboardWidget> widgets) {
    ctx.onSaveLayout?.call(
      DashboardLayout(
        pages: [
          DashboardPage(pageId: _page.pageId, title: _page.title, widgets: widgets),
        ],
      ),
    );
  }

  void _move(String fromId, String toId) {
    final current = _widgets;
    final next = _movedById(current, fromId, toId, (w) => w.widgetId);
    if (next.length != current.length) return;
    var changed = false;
    for (var i = 0; i < next.length; i++) {
      if (next[i].widgetId != current[i].widgetId) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    _commit(next);
  }

  void _remove(String widgetId) {
    _commit([for (final w in _widgets) if (w.widgetId != widgetId) w]);
  }

  void _onDragStarted(String id) {
    _dragId = id;
    _hoverId = id;
  }

  void _onHover(String fromId, String toId) {
    if (_dragId != fromId) return;
    if (toId == fromId) return;
    if (_hoverId == toId) return;
    setState(() => _hoverId = toId);
  }

  void _onDragEnded() {
    final from = _dragId;
    final to = _hoverId;
    if (from != null && to != null) _move(from, to);
    setState(() {
      _dragId = null;
      _hoverId = null;
    });
  }

  Future<void> _open(ExposurePoint point) {
    return openPointDetail(
      context,
      point: point,
      appearance: ctx.appearance,
      onCommand: ctx.canCommand ? (value) => ctx.onCommand(point.pointId, value) : null,
      loadHistory: ctx.onHistory == null ? null : () => ctx.onHistory!(point.pointId),
    );
  }

  @override
  Widget build(BuildContext context) {
    final points = _visibleEntries;
    final styles = {for (final s in ctx.cardStyles) s.styleId: s};
    final kiosk = ctx.appearance.displayMode == DisplayMode.kiosk;
    final compact = ctx.appearance.displayMode == DisplayMode.compact;
    final editing = kiosk ? false : _editing;
    return FlowBackdrop(
      appearance: ctx.appearance,
      child: Column(
        children: [
          ViewChrome(
            title: ctx.layout != null && ctx.layout!.pages.isNotEmpty
                ? ctx.layout!.pages.first.title
                : 'Canvas',
            kind: ctx.kind,
            editing: editing,
            showEdit: !kiosk && ctx.canEditLayout,
            onToggle: () {
              setState(() => _editing = !_editing);
              ctx.onToggleEditing?.call();
            },
            onChangeView: ctx.onChangeView,
            onAdd: ctx.onAddWidget,
          ),
          Expanded(
            child: points.isEmpty
                ? _EmptyCanvas(onCustomize: ctx.onCustomizeAppearance)
                : Padding(
                    padding: const EdgeInsets.fromLTRB(TokenSpace.sm, 0, TokenSpace.sm, TokenSpace.sm),
                    child: SlotGrid(
                      maxCrossAxisExtent: compact ? 260 : 300,
                      childAspectRatio: compact ? 2.05 : 1.92,
                      spacing: TokenSpace.sm,
                      children: [
                        for (final entry in points)
                          SlotChild(
                            id: entry.widget.widgetId,
                            slots: cardSlotHeight(
                              visualHint: entry.widget.visualHint,
                              style: entry.widget.styleId == null ? null : styles[entry.widget.styleId],
                              height: entry.widget.height,
                            ),
                            child: _CanvasTile(
                              key: ValueKey('tile-${entry.widget.widgetId}'),
                              widgetId: entry.widget.widgetId,
                              label: entry.point.label,
                              editing: editing,
                              onOpen: () => _open(entry.point),
                              onDragStarted: () => _onDragStarted(entry.widget.widgetId),
                              onHover: (fromId) => _onHover(fromId, entry.widget.widgetId),
                              onDragEnded: _onDragEnded,
                              onRemove: () => _remove(entry.widget.widgetId),
                              onEditStyle: ctx.onEditCardStyle == null
                                  ? null
                                  : () => ctx.onEditCardStyle!(entry.widget, entry.point),
                              child: PointCard(
                                point: entry.point,
                                appearance: ctx.appearance,
                                style: entry.widget.styleId == null ? null : styles[entry.widget.styleId],
                                onCommand: ctx.canCommand
                                    ? (value) => ctx.onCommand(entry.point.pointId, value)
                                    : null,
                              ),
                            ),
                          ),
                        if (editing)
                          SlotChild(
                            id: 'add-slot',
                            slots: 1,
                            child: DragTarget<String>(
                              onWillAcceptWithDetails: (_) => true,
                              onMove: (details) {
                                if (_entries.isEmpty) return;
                                _onHover(details.data, _entries.last.widget.widgetId);
                              },
                              builder: (context, candidate, rejected) {
                                return GestureDetector(
                                  onTap: ctx.onAddWidget,
                                  child: const _AddSlot(),
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _CanvasTile extends StatelessWidget {
  const _CanvasTile({
    super.key,
    required this.widgetId,
    required this.label,
    required this.editing,
    required this.onOpen,
    required this.onDragStarted,
    required this.onHover,
    required this.onDragEnded,
    required this.onRemove,
    this.onEditStyle,
    required this.child,
  });

  final String widgetId;
  final String label;
  final bool editing;
  final VoidCallback onOpen;
  final VoidCallback onDragStarted;
  final ValueChanged<String> onHover;
  final VoidCallback onDragEnded;
  final VoidCallback onRemove;
  final VoidCallback? onEditStyle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final card = GestureDetector(
      onTap: editing ? null : onOpen,
      child: child,
    );
    if (!editing) return card;
    return EditJiggle(
      enabled: true,
      seed: widgetId.hashCode,
      child: DragTarget<String>(
      key: ValueKey('slot-$widgetId'),
      hitTestBehavior: HitTestBehavior.translucent,
      onWillAcceptWithDetails: (details) => details.data != widgetId,
      onMove: (details) => onHover(details.data),
      onAcceptWithDetails: (_) {},
      builder: (context, candidate, rejected) {
        final over = candidate.isNotEmpty;
        return Draggable<String>(
          key: ValueKey('drag-$widgetId'),
          data: widgetId,
          maxSimultaneousDrags: 1,
          hitTestBehavior: HitTestBehavior.opaque,
          onDragStarted: onDragStarted,
          onDragEnd: (_) => onDragEnded(),
          feedback: _DragGhost(label: label),
          childWhenDragging: _DropPlaceholder(child: card),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Positioned.fill(
                child: IgnorePointer(
                  child: AnimatedScale(
                    scale: over ? 0.97 : 1,
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOutCubic,
                    child: card,
                  ),
                ),
              ),
              Positioned(
                top: 2,
                right: 2,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      key: ValueKey('style-$widgetId'),
                      tooltip: 'Stile',
                      visualDensity: VisualDensity.compact,
                      iconSize: 18,
                      onPressed: onEditStyle,
                      icon: const Icon(Icons.palette_outlined),
                    ),
                    IconButton(
                      key: ValueKey('remove-$widgetId'),
                      tooltip: 'Rimuovi',
                      visualDensity: VisualDensity.compact,
                      iconSize: 18,
                      onPressed: onRemove,
                      icon: const Icon(Icons.close_rounded),
                    ),
                    Icon(
                      Icons.drag_indicator_rounded,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
      ),
    );
  }
}

class _DropPlaceholder extends StatelessWidget {
  const _DropPlaceholder({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: 0.38,
      child: child,
    );
  }
}

class _DragGhost extends StatelessWidget {
  const _DragGhost({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.transparent,
      child: Transform.rotate(
        angle: -0.035,
        child: SizedBox(
          width: 248,
          child: GlassCard(
            hovered: true,
            child: Padding(
              padding: const EdgeInsets.all(TokenSpace.md),
              child: Text(label, style: theme.textTheme.titleMedium),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyCanvas extends StatelessWidget {
  const _EmptyCanvas({this.onCustomize});

  final VoidCallback? onCustomize;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: GlassCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Nessun widget', style: theme.textTheme.titleMedium),
            const SizedBox(height: TokenSpace.sm),
            Text('Aggiungi il primo widget dalla modifica layout.', style: theme.textTheme.bodySmall),
            TextButton(onPressed: onCustomize, child: const Text('Personalizza aspetto')),
          ],
        ),
      ),
    );
  }
}

class _AddSlot extends StatelessWidget {
  const _AddSlot();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GlassCard(
      child: Center(
        child: Text('Aggiungi widget', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
      ),
    );
  }
}

List<T> _movedById<T>(List<T> items, String fromId, String toId, String Function(T) idOf) {
  final from = items.indexWhere((e) => idOf(e) == fromId);
  final to = items.indexWhere((e) => idOf(e) == toId);
  if (from < 0 || to < 0 || from == to) return items;
  final next = [...items];
  final item = next.removeAt(from);
  next.insert(to, item);
  return next;
}
