import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/widgets.dart';

class ViewRenderContext {
  const ViewRenderContext({
    required this.kind,
    required this.appearance,
    required this.points,
    required this.onCommand,
    this.layout,
    this.scene,
    this.editing = false,
    this.onToggleEditing,
    this.onCustomizeAppearance,
    this.onAddWidget,
    this.onChangeView,
    this.onSaveScene,
    this.onSaveLayout,
    this.onHistory,
    this.cardStyles = const [],
    this.canCommand = true,
    this.canEditLayout = true,
    this.canEditAppearance = true,
    this.onEditCardStyle,
  });

  final ViewModeKind kind;
  final DashboardAppearance appearance;
  final DashboardLayout? layout;
  final Scene? scene;
  final List<ExposurePoint> points;
  final List<CardStyle> cardStyles;
  final void Function(String pointId, Object value) onCommand;
  final bool editing;
  final VoidCallback? onToggleEditing;
  final VoidCallback? onCustomizeAppearance;
  final VoidCallback? onAddWidget;
  final ValueChanged<ViewModeKind>? onChangeView;
  final ValueChanged<Scene>? onSaveScene;
  final ValueChanged<DashboardLayout>? onSaveLayout;
  final Future<List<HistorySample>> Function(String pointId)? onHistory;
  final bool canCommand;
  final bool canEditLayout;
  final bool canEditAppearance;
  final void Function(DashboardWidget widget, ExposurePoint point)? onEditCardStyle;

  ExposurePoint? point(String pointId) {
    for (final p in points) {
      if (p.pointId == pointId) return p;
    }
    return null;
  }
}

abstract class ViewRenderer {
  ViewModeKind get kind;
  Widget build(BuildContext context, ViewRenderContext ctx);
}

class ViewRendererRegistry {
  final _renderers = <ViewModeKind, ViewRenderer>{};

  void register(ViewRenderer renderer) => _renderers[renderer.kind] = renderer;

  ViewRenderer? resolve(ViewModeKind kind) => _renderers[kind];
}
