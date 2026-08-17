import 'dart:math' as math;

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../renderers/view_renderer.dart';
import '../theme/spaghetti_theme.dart';
import '../widgets/glass.dart';
import '../widgets/point_card.dart';
import '../widgets/view_chrome.dart';
import 'point_detail_sheet.dart';

const _nodeW = 164.0;
const _nodeH = 96.0;

class SceneScreen extends StatefulWidget {
  const SceneScreen({super.key, required this.ctx});

  final ViewRenderContext ctx;

  @override
  State<SceneScreen> createState() => _SceneScreenState();
}

class _SceneScreenState extends State<SceneScreen> {
  late bool _editing = widget.ctx.editing;
  late Scene? _scene = widget.ctx.scene;
  String? _dragging;

  ViewRenderContext get ctx => widget.ctx;

  @override
  void didUpdateWidget(SceneScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.ctx.scene?.sceneId != widget.ctx.scene?.sceneId ||
        oldWidget.ctx.scene?.nodes.length != widget.ctx.scene?.nodes.length) {
      _scene = widget.ctx.scene;
    }
  }

  bool get _schematic => ctx.kind == ViewModeKind.schematic;

  @override
  Widget build(BuildContext context) {
    final kiosk = ctx.appearance.displayMode == DisplayMode.kiosk;
    final editing = kiosk ? false : _editing;
    final scene = _scene;
    return FlowBackdrop(
      appearance: ctx.appearance,
      schematic: true,
      garden: false,
      child: Column(
        children: [
          ViewChrome(
            title: scene?.name ?? 'Schema',
            kind: ctx.kind,
            editing: editing,
            showEdit: !kiosk && ctx.canEditLayout,
            onToggle: () => setState(() => _editing = !_editing),
            onChangeView: ctx.onChangeView,
            onCustomize: ctx.canEditAppearance ? ctx.onCustomizeAppearance : null,
          ),
          Expanded(
            child: scene == null
                ? const Center(child: Text('Nessuna scena'))
                : LayoutBuilder(
                    builder: (context, constraints) {
                      return SizedBox(
                        width: constraints.maxWidth,
                        height: constraints.maxHeight,
                        child: GestureDetector(
                          onTapUp: editing
                              ? null
                              : (details) {
                                  final node = _hit(scene, details.localPosition, constraints.biggest);
                                  if (node?.pointId == null) return;
                                  final point = ctx.point(node!.pointId!);
                                  if (point == null) return;
                                  openPointDetail(
                                    context,
                                    point: point,
                                    appearance: ctx.appearance,
                                    onCommand: ctx.canCommand
                                        ? (value) => ctx.onCommand(point.pointId, value)
                                        : null,
                                    loadHistory: ctx.onHistory == null ? null : () => ctx.onHistory!(point.pointId),
                                  );
                                },
                          child: CustomPaint(
                            painter: _schematic
                                ? _EdgePainter(
                                    scene: scene,
                                    color: Theme.of(context).colorScheme.primary,
                                  )
                                : null,
                            child: Stack(
                              children: [
                                for (final node in scene.nodes) _placed(node, constraints.biggest, editing),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (editing)
            Padding(
              padding: const EdgeInsets.fromLTRB(TokenSpace.md, 0, TokenSpace.md, TokenSpace.sm),
              child: Text(
                'Trascina i nodi. Tap per associare un punto.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
        ],
      ),
    );
  }

  Widget _placed(SceneNode node, Size size, bool editing) {
    final rect = _nodeRect(node, size);
    final point = node.pointId == null ? null : ctx.point(node.pointId!);
    return Positioned(
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      child: GestureDetector(
        onPanStart: editing ? (_) => _dragging = node.nodeId : null,
        onPanUpdate: editing
            ? (d) {
                final scene = _scene;
                if (scene == null || _dragging != node.nodeId) return;
                final current = scene.nodes.firstWhere((n) => n.nodeId == node.nodeId);
                final nx = (current.transform.x + d.delta.dx / size.width * 100).clamp(4, 96).toDouble();
                final ny = (current.transform.y + d.delta.dy / size.height * 100).clamp(6, 94).toDouble();
                setState(() {
                  _scene = scene.copyWith(
                    nodes: [
                      for (final n in scene.nodes)
                        if (n.nodeId == node.nodeId)
                          n.copyWith(transform: n.transform.copyWith(x: nx, y: ny))
                        else
                          n,
                    ],
                  );
                });
              }
            : null,
        onPanEnd: editing
            ? (_) {
                _dragging = null;
                final scene = _scene;
                if (scene != null) ctx.onSaveScene?.call(scene);
              }
            : null,
        onTap: editing ? () => _bind(node) : null,
        child: _FlowNode(
          node: node,
          point: point,
          appearance: ctx.appearance,
          style: _styleFor(point),
          onCommand: point == null || !ctx.canCommand
              ? null
              : (value) => ctx.onCommand(point.pointId, value),
        ),
      ),
    );
  }

  CardStyle? _styleFor(ExposurePoint? point) {
    if (point == null) return null;
    final styles = {for (final s in ctx.cardStyles) s.styleId: s};
    for (final page in ctx.layout?.pages ?? const <DashboardPage>[]) {
      for (final w in page.widgets) {
        if (w.pointId == point.pointId && w.styleId != null) return styles[w.styleId];
      }
    }
    final id = defaultStyleIdFor(point);
    return id == null ? null : styles[id];
  }

  SceneNode? _hit(Scene scene, Offset local, Size size) {
    for (final node in scene.nodes.reversed) {
      if (_nodeRect(node, size).inflate(10).contains(local)) return node;
    }
    return null;
  }

  Future<void> _bind(SceneNode node) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: tokenDropShape(),
      clipBehavior: Clip.antiAlias,
      builder: (sheet) => ListView(
        padding: const EdgeInsets.all(TokenSpace.lg),
        children: [
          Text('Associa ${node.label ?? node.nodeId}', style: Theme.of(sheet).textTheme.titleMedium),
          const SizedBox(height: TokenSpace.md),
          for (final point in ctx.points)
            ListTile(
              shape: tokenDropShape(),
              hoverColor: tokenHoverFill(sheet),
              title: Text(point.label),
              selected: point.pointId == node.pointId,
              onTap: () => Navigator.pop(sheet, point.pointId),
            ),
        ],
      ),
    );
    if (selected == null || _scene == null) return;
    final next = _scene!.copyWith(
      nodes: [
        for (final n in _scene!.nodes)
          if (n.nodeId == node.nodeId) n.copyWith(pointId: selected, label: ctx.point(selected)?.label) else n,
      ],
    );
    setState(() => _scene = next);
    ctx.onSaveScene?.call(next);
  }
}

class _FlowNode extends StatelessWidget {
  const _FlowNode({
    required this.node,
    required this.point,
    required this.appearance,
    this.style,
    this.onCommand,
  });

  final SceneNode node;
  final ExposurePoint? point;
  final DashboardAppearance appearance;
  final CardStyle? style;
  final ValueChanged<Object>? onCommand;

  @override
  Widget build(BuildContext context) {
    final live = point;
    if (live != null) {
      return PointCard(
        point: live.copyWith(label: node.label ?? live.label),
        appearance: appearance,
        style: style,
        onCommand: onCommand,
      );
    }
    final theme = Theme.of(context);
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(8, 7, 10, 7),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: TokenColors.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(TokenRadius.sm),
            ),
            alignment: Alignment.center,
            child: Icon(_icon, color: TokenColors.accent, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              node.label ?? node.nodeId,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.titleMedium?.copyWith(fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  IconData get _icon {
    return switch (node.assetRef) {
      'plant' => Icons.yard_outlined,
      'house' => Icons.home_outlined,
      'light' => Icons.lightbulb_outline,
      'alarm' => Icons.warning_amber_rounded,
      'drop' => Icons.water_drop_outlined,
      'tank' => Icons.propane_tank_outlined,
      'gauge' => Icons.speed,
      'pump' => Icons.cyclone,
      _ => Icons.place_outlined,
    };
  }
}

Rect _nodeRect(SceneNode node, Size size) {
  final center = Offset(node.transform.x / 100 * size.width, node.transform.y / 100 * size.height);
  return Rect.fromCenter(center: center, width: _nodeW, height: _nodeH);
}

enum _WireKind { horizontal, vertical, rounded }

class _EdgePainter extends CustomPainter {
  _EdgePainter({required this.scene, required this.color});

  final Scene scene;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..color = color.withValues(alpha: 0.16)
      ..strokeWidth = 9
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2.4);
    final line = Paint()
      ..color = color.withValues(alpha: 0.9)
      ..strokeWidth = 2.2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final shine = Paint()
      ..color = Colors.white.withValues(alpha: 0.35)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final cap = Paint()..color = color;
    final byId = {for (final n in scene.nodes) n.nodeId: n};
    for (final edge in scene.edges) {
      final a = byId[edge.from];
      final b = byId[edge.to];
      if (a == null || b == null) continue;
      final ra = _nodeRect(a, size);
      final rb = _nodeRect(b, size);
      final kind = _kind(edge.shape, ra, rb);
      final ends = _anchors(kind, ra, rb);
      final path = _wirePath(kind, ends.$1, ends.$2);
      canvas.drawPath(path, glow);
      canvas.drawPath(path, line);
      canvas.drawPath(path, shine);
      canvas.drawCircle(ends.$1, 3.2, cap);
      canvas.drawCircle(ends.$2, 3.2, cap);
    }
  }

  static _WireKind _kind(SceneEdgeShape shape, Rect a, Rect b) {
    if (shape == SceneEdgeShape.horizontal) return _WireKind.horizontal;
    if (shape == SceneEdgeShape.vertical) return _WireKind.vertical;
    if (shape == SceneEdgeShape.rounded) return _WireKind.rounded;
    final dx = (b.center.dx - a.center.dx).abs();
    final dy = (b.center.dy - a.center.dy).abs();
    if (dx >= dy * 1.25) return _WireKind.horizontal;
    if (dy >= dx * 1.25) return _WireKind.vertical;
    return _WireKind.rounded;
  }

  static (Offset, Offset) _anchors(_WireKind kind, Rect a, Rect b) {
    final dx = b.center.dx - a.center.dx;
    final dy = b.center.dy - a.center.dy;
    switch (kind) {
      case _WireKind.horizontal:
        return dx >= 0
            ? (Offset(a.right, a.center.dy), Offset(b.left, b.center.dy))
            : (Offset(a.left, a.center.dy), Offset(b.right, b.center.dy));
      case _WireKind.vertical:
        return dy >= 0
            ? (Offset(a.center.dx, a.bottom), Offset(b.center.dx, b.top))
            : (Offset(a.center.dx, a.top), Offset(b.center.dx, b.bottom));
      case _WireKind.rounded:
        if (dx.abs() >= dy.abs()) {
          final from = dx >= 0 ? Offset(a.right, a.center.dy) : Offset(a.left, a.center.dy);
          final to = dy >= 0 ? Offset(b.center.dx, b.top) : Offset(b.center.dx, b.bottom);
          return (from, to);
        }
        final from = dy >= 0 ? Offset(a.center.dx, a.bottom) : Offset(a.center.dx, a.top);
        final to = dx >= 0 ? Offset(b.left, b.center.dy) : Offset(b.right, b.center.dy);
        return (from, to);
    }
  }

  static Path _wirePath(_WireKind kind, Offset start, Offset end) {
    final dx = (end.dx - start.dx).abs();
    final dy = (end.dy - start.dy).abs();
    if (kind == _WireKind.horizontal && dy < 5) {
      return Path()
        ..moveTo(start.dx, start.dy)
        ..lineTo(end.dx, start.dy);
    }
    if (kind == _WireKind.vertical && dx < 5) {
      return Path()
        ..moveTo(start.dx, start.dy)
        ..lineTo(start.dx, end.dy);
    }
    final horizontalFirst = kind != _WireKind.vertical;
    final radius = kind == _WireKind.rounded ? 22.0 : 14.0;
    return _roundedElbow(start, end, horizontalFirst: horizontalFirst, radius: radius);
  }

  static Path _roundedElbow(
    Offset start,
    Offset end, {
    required bool horizontalFirst,
    required double radius,
  }) {
    final corner = horizontalFirst ? Offset(end.dx, start.dy) : Offset(start.dx, end.dy);
    final toCorner = corner - start;
    final fromCorner = end - corner;
    final inLen = toCorner.distance;
    final outLen = fromCorner.distance;
    final r = math.min(radius, math.min(inLen, outLen) / 2);
    final path = Path()..moveTo(start.dx, start.dy);
    if (r < 1.5 || inLen < 1 || outLen < 1) {
      path.lineTo(end.dx, end.dy);
      return path;
    }
    final p1 = start + toCorner * ((inLen - r) / inLen);
    final p2 = corner + fromCorner * (r / outLen);
    path
      ..lineTo(p1.dx, p1.dy)
      ..quadraticBezierTo(corner.dx, corner.dy, p2.dx, p2.dy)
      ..lineTo(end.dx, end.dy);
    return path;
  }

  @override
  bool shouldRepaint(covariant _EdgePainter oldDelegate) =>
      oldDelegate.scene != scene || oldDelegate.color != color;
}
