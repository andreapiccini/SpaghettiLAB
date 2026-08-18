import 'dart:math' as math;

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../renderers/view_renderer.dart';
import '../theme/spaghetti_theme.dart';
import '../widgets/edit_jiggle.dart';
import '../widgets/glass.dart';
import '../widgets/point_card.dart';
import '../widgets/view_chrome.dart';
import 'point_detail_sheet.dart';

const _cardW = 196.0;
const _cardH = 118.0;
const _hubW = 132.0;
const _hubH = 52.0;

enum _WireAction { addCard, addNode, remove }

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
        oldWidget.ctx.scene?.nodes.length != widget.ctx.scene?.nodes.length ||
        oldWidget.ctx.scene?.edges.length != widget.ctx.scene?.edges.length) {
      if (_dragging == null) _scene = widget.ctx.scene;
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
            onAdd: editing ? _addCard : null,
            onCustomize: ctx.canEditAppearance ? ctx.onCustomizeAppearance : null,
          ),
          Expanded(
            child: scene == null
                ? const Center(child: Text('Nessuna scena'))
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final size = constraints.biggest;
                      return SizedBox(
                        width: size.width,
                        height: size.height,
                        child: Stack(
                          children: [
                            if (_schematic)
                              Positioned.fill(
                                child: CustomPaint(
                                  painter: _EdgePainter(
                                    scene: scene,
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                                ),
                              ),
                            Positioned.fill(
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTapUp: (details) {
                                  if (editing) {
                                    _onEditCanvasTap(details.localPosition, size);
                                  } else {
                                    _onViewTap(details.localPosition, size);
                                  }
                                },
                              ),
                            ),
                            for (final node in scene.nodes) _placed(node, size, editing),
                            if (editing)
                              for (final edge in scene.edges) _edgeHandle(edge, size),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          if (editing)
            Padding(
              padding: const EdgeInsets.fromLTRB(TokenSpace.md, 0, TokenSpace.md, TokenSpace.sm),
              child: Text(
                'Trascina le card. Tocca un filo per aggiungere o togliere. La X toglie la card.',
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
      child: EditJiggle(
        enabled: editing,
        seed: node.nodeId.hashCode,
        child: Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onPanStart: editing ? (_) => _dragging = node.nodeId : null,
                onPanUpdate: editing
                    ? (d) {
                        final scene = _scene;
                        if (scene == null || _dragging != node.nodeId) return;
                        final current = scene.nodes.firstWhere((n) => n.nodeId == node.nodeId);
                        final nx = (current.transform.x + d.delta.dx / size.width * 100).clamp(6, 94).toDouble();
                        final ny = (current.transform.y + d.delta.dy / size.height * 100).clamp(8, 92).toDouble();
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
                child: IgnorePointer(
                  ignoring: editing,
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
              ),
            ),
            if (editing)
              Positioned(
                top: 0,
                right: 0,
                child: IconButton(
                  key: ValueKey('remove-node-${node.nodeId}'),
                  tooltip: 'Rimuovi',
                  visualDensity: VisualDensity.compact,
                  iconSize: 18,
                  onPressed: () => _removeNode(node),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _edgeHandle(SceneEdge edge, Size size) {
    final scene = _scene;
    if (scene == null) return const SizedBox.shrink();
    final path = _edgePath(scene, edge, size);
    if (path == null) return const SizedBox.shrink();
    final at = _pathMid(path);
    return Positioned(
      left: at.dx - 14,
      top: at.dy - 14,
      width: 28,
      height: 28,
      child: Material(
        key: ValueKey('edge-handle-${edge.from}-${edge.to}'),
        color: Theme.of(context).colorScheme.surface,
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () => _openEdgeMenu(edge, at, size),
          child: Icon(Icons.add_rounded, size: 18, color: Theme.of(context).colorScheme.primary),
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

  SceneNode? _hitNode(Offset local, Size size) {
    final scene = _scene;
    if (scene == null) return null;
    for (final node in scene.nodes.reversed) {
      if (_nodeRect(node, size).inflate(10).contains(local)) return node;
    }
    return null;
  }

  SceneEdge? _hitEdge(Offset local, Size size) {
    final scene = _scene;
    if (scene == null) return null;
    SceneEdge? best;
    var bestDist = 18.0;
    for (final edge in scene.edges) {
      final path = _edgePath(scene, edge, size);
      if (path == null) continue;
      final dist = _distanceToPath(path, local);
      if (dist < bestDist) {
        bestDist = dist;
        best = edge;
      }
    }
    return best;
  }

  void _onViewTap(Offset local, Size size) {
    final scene = _scene;
    if (scene == null) return;
    final node = _hitNode(local, size);
    if (node?.pointId == null) return;
    final point = ctx.point(node!.pointId!);
    if (point == null) return;
    openPointDetail(
      context,
      point: point,
      appearance: ctx.appearance,
      onCommand: ctx.canCommand ? (value) => ctx.onCommand(point.pointId, value) : null,
      loadHistory: ctx.onHistory == null ? null : () => ctx.onHistory!(point.pointId),
    );
  }

  Future<void> _onEditCanvasTap(Offset local, Size size) async {
    if (_hitNode(local, size) != null) return;
    final edge = _hitEdge(local, size);
    if (edge == null) return;
    await _openEdgeMenu(edge, local, size);
  }

  Future<void> _openEdgeMenu(SceneEdge edge, Offset insertAt, Size size) async {
    final action = await showModalBottomSheet<_WireAction>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: tokenDropShape(),
      clipBehavior: Clip.antiAlias,
      builder: (sheet) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(TokenSpace.lg),
        children: [
          Text('Collegamento', style: Theme.of(sheet).textTheme.titleMedium),
          const SizedBox(height: TokenSpace.md),
          ListTile(
            key: const ValueKey('schema-add-card'),
            shape: tokenDropShape(),
            hoverColor: tokenHoverFill(sheet),
            leading: const Icon(Icons.add_box_outlined),
            title: const Text('Aggiungi card'),
            onTap: () => Navigator.pop(sheet, _WireAction.addCard),
          ),
          ListTile(
            key: const ValueKey('schema-add-node'),
            shape: tokenDropShape(),
            hoverColor: tokenHoverFill(sheet),
            leading: const Icon(Icons.hub_outlined),
            title: const Text('Aggiungi nodo'),
            onTap: () => Navigator.pop(sheet, _WireAction.addNode),
          ),
          ListTile(
            key: const ValueKey('schema-remove-edge'),
            shape: tokenDropShape(),
            hoverColor: tokenHoverFill(sheet),
            leading: const Icon(Icons.link_off_rounded),
            title: const Text('Rimuovi collegamento'),
            onTap: () => Navigator.pop(sheet, _WireAction.remove),
          ),
        ],
      ),
    );
    if (!mounted || action == null || _scene == null) return;
    switch (action) {
      case _WireAction.remove:
        _removeEdge(edge);
      case _WireAction.addNode:
        _insertOnEdge(edge, insertAt, size, point: null);
      case _WireAction.addCard:
        final point = await _pickPoint(title: 'Aggiungi card', usedOnly: true);
        if (point == null || _scene == null) return;
        _insertOnEdge(edge, insertAt, size, point: point);
    }
  }

  Future<void> _addCard() async {
    final point = await _pickPoint(title: 'Aggiungi card', usedOnly: true);
    if (point == null || _scene == null) return;
    final at = _freePercent();
    _commit(
      _scene!.copyWith(
        nodes: [
          ..._scene!.nodes,
          SceneNode(
            nodeId: _newNodeId(_scene!),
            pointId: point.pointId,
            label: point.label,
            assetRef: _assetFor(point),
            transform: SceneTransform(x: at.dx, y: at.dy),
          ),
        ],
      ),
    );
  }

  Future<void> _bind(SceneNode node) async {
    final selected = await _pickPoint(title: 'Associa ${node.label ?? node.nodeId}', usedOnly: false);
    if (selected == null || _scene == null) return;
    _commit(
      _scene!.copyWith(
        nodes: [
          for (final n in _scene!.nodes)
            if (n.nodeId == node.nodeId)
              n.copyWith(pointId: selected.pointId, label: selected.label, assetRef: _assetFor(selected))
            else
              n,
        ],
      ),
    );
  }

  Future<ExposurePoint?> _pickPoint({required String title, required bool usedOnly}) async {
    final used = {
      for (final n in _scene?.nodes ?? const <SceneNode>[])
        if (n.pointId != null) n.pointId!,
    };
    return showModalBottomSheet<ExposurePoint>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: tokenDropShape(),
      clipBehavior: Clip.antiAlias,
      builder: (sheet) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(TokenSpace.lg),
        children: [
          Text(title, style: Theme.of(sheet).textTheme.titleMedium),
          const SizedBox(height: TokenSpace.md),
          for (final point in ctx.points)
            ListTile(
              key: ValueKey('schema-point-${point.pointId}'),
              shape: tokenDropShape(),
              hoverColor: tokenHoverFill(sheet),
              title: Text(point.label),
              enabled: !usedOnly || !used.contains(point.pointId),
              onTap: usedOnly && used.contains(point.pointId) ? null : () => Navigator.pop(sheet, point),
            ),
        ],
      ),
    );
  }

  void _insertOnEdge(SceneEdge edge, Offset insertAt, Size size, {required ExposurePoint? point}) {
    final scene = _scene;
    if (scene == null) return;
    final path = _edgePath(scene, edge, size);
    final raw = path == null ? insertAt : _projectOnPath(path, insertAt);
    final x = (raw.dx / size.width * 100).clamp(8, 92).toDouble();
    final y = (raw.dy / size.height * 100).clamp(10, 90).toDouble();
    final id = _newNodeId(scene);
    final node = SceneNode(
      nodeId: id,
      pointId: point?.pointId,
      label: point?.label ?? 'Nodo',
      assetRef: point == null ? 'marker' : _assetFor(point),
      transform: SceneTransform(x: x, y: y),
    );
    _commit(
      scene.copyWith(
        nodes: [...scene.nodes, node],
        edges: [
          for (final e in scene.edges)
            if (!_sameEdge(e, edge)) e,
          SceneEdge(from: edge.from, to: id, shape: edge.shape),
          SceneEdge(from: id, to: edge.to, shape: edge.shape),
        ],
      ),
    );
  }

  void _removeEdge(SceneEdge edge) {
    final scene = _scene;
    if (scene == null) return;
    _commit(
      scene.copyWith(
        edges: [
          for (final e in scene.edges)
            if (!_sameEdge(e, edge)) e,
        ],
      ),
    );
  }

  void _removeNode(SceneNode node) {
    final scene = _scene;
    if (scene == null) return;
    final neighbors = <String>{};
    for (final e in scene.edges) {
      if (e.from == node.nodeId) neighbors.add(e.to);
      if (e.to == node.nodeId) neighbors.add(e.from);
    }
    final kept = [
      for (final e in scene.edges)
        if (e.from != node.nodeId && e.to != node.nodeId) e,
    ];
    if (neighbors.length == 2) {
      final pair = neighbors.toList();
      final exists = kept.any(
        (e) => (e.from == pair[0] && e.to == pair[1]) || (e.from == pair[1] && e.to == pair[0]),
      );
      if (!exists) kept.add(SceneEdge(from: pair[0], to: pair[1]));
    }
    _commit(
      scene.copyWith(
        nodes: [
          for (final n in scene.nodes)
            if (n.nodeId != node.nodeId) n,
        ],
        edges: kept,
      ),
    );
  }

  void _commit(Scene next) {
    setState(() => _scene = next);
    ctx.onSaveScene?.call(next);
  }

  Offset _freePercent() {
    final taken = {
      for (final n in _scene?.nodes ?? const <SceneNode>[])
        '${n.transform.x.round()}:${n.transform.y.round()}',
    };
    const spots = <(double, double)>[
      (50, 78),
      (28, 78),
      (72, 78),
      (50, 36),
      (22, 28),
    ];
    for (final spot in spots) {
      if (!taken.contains('${spot.$1.round()}:${spot.$2.round()}')) {
        return Offset(spot.$1, spot.$2);
      }
    }
    return const Offset(50, 78);
  }

  static String _newNodeId(Scene scene) {
    var i = scene.nodes.length;
    while (scene.nodes.any((n) => n.nodeId == 'n-$i')) {
      i++;
    }
    return 'n-$i';
  }

  static String _assetFor(ExposurePoint point) {
    return switch (point.visualHint) {
      VisualHint.gauge => 'gauge',
      VisualHint.animated => 'pump',
      VisualHint.toggle => 'light',
      VisualHint.status => 'alarm',
      VisualHint.button => 'drop',
      VisualHint.value when point.unit == '%' => 'drop',
      VisualHint.value => 'tank',
      VisualHint.sparkline => 'gauge',
    };
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
        compact: true,
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
  final card = node.pointId != null;
  return Rect.fromCenter(center: center, width: card ? _cardW : _hubW, height: card ? _cardH : _hubH);
}

bool _sameEdge(SceneEdge a, SceneEdge b) =>
    (a.from == b.from && a.to == b.to) || (a.from == b.to && a.to == b.from);

Path? _edgePath(Scene scene, SceneEdge edge, Size size) {
  final byId = {for (final n in scene.nodes) n.nodeId: n};
  final a = byId[edge.from];
  final b = byId[edge.to];
  if (a == null || b == null) return null;
  final ra = _nodeRect(a, size);
  final rb = _nodeRect(b, size);
  return _wirePath(_wireKind(edge.shape, ra, rb), ra.center, rb.center);
}

enum _WireKind { horizontal, vertical, rounded }

_WireKind _wireKind(SceneEdgeShape shape, Rect a, Rect b) {
  if (shape == SceneEdgeShape.horizontal) return _WireKind.horizontal;
  if (shape == SceneEdgeShape.vertical) return _WireKind.vertical;
  if (shape == SceneEdgeShape.rounded) return _WireKind.rounded;
  final dx = (b.center.dx - a.center.dx).abs();
  final dy = (b.center.dy - a.center.dy).abs();
  if (dx >= dy * 1.25) return _WireKind.horizontal;
  if (dy >= dx * 1.25) return _WireKind.vertical;
  return _WireKind.rounded;
}

Path _wirePath(_WireKind kind, Offset start, Offset end) {
  final dx = (end.dx - start.dx).abs();
  final dy = (end.dy - start.dy).abs();
  if (dx < 8 || dy < 8) {
    return Path()
      ..moveTo(start.dx, start.dy)
      ..lineTo(end.dx, end.dy);
  }
  final radius = kind == _WireKind.rounded ? 22.0 : 16.0;
  final upper = start.dy <= end.dy ? start : end;
  final lower = start.dy <= end.dy ? end : start;
  return _roundedElbow(upper, lower, horizontalFirst: true, radius: radius);
}

Path _roundedElbow(
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

Offset _pathMid(Path path) {
  for (final metric in path.computeMetrics()) {
    if (metric.length <= 0) continue;
    return metric.getTangentForOffset(metric.length / 2)?.position ?? Offset.zero;
  }
  return Offset.zero;
}

Offset _projectOnPath(Path path, Offset point) {
  var best = point;
  var minD = double.infinity;
  for (final metric in path.computeMetrics()) {
    for (var d = 0.0; d <= metric.length; d += 4) {
      final tangent = metric.getTangentForOffset(d);
      if (tangent == null) continue;
      final dist = (tangent.position - point).distance;
      if (dist < minD) {
        minD = dist;
        best = tangent.position;
      }
    }
  }
  return best;
}

double _distanceToPath(Path path, Offset point) {
  var minD = double.infinity;
  for (final metric in path.computeMetrics()) {
    for (var d = 0.0; d <= metric.length; d += 6) {
      final tangent = metric.getTangentForOffset(d);
      if (tangent == null) continue;
      minD = math.min(minD, (tangent.position - point).distance);
    }
  }
  return minD;
}

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
    for (final edge in scene.edges) {
      final path = _edgePath(scene, edge, size);
      if (path == null) continue;
      canvas.drawPath(path, glow);
      canvas.drawPath(path, line);
      canvas.drawPath(path, shine);
    }
  }

  @override
  bool shouldRepaint(covariant _EdgePainter oldDelegate) =>
      oldDelegate.scene != scene || oldDelegate.color != color;
}
