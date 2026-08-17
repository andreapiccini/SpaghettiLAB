import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/widgets.dart';

import '../screens/canvas_screen.dart';
import '../screens/scene_screen.dart';
import 'view_renderer.dart';

class CardsRenderer implements ViewRenderer {
  const CardsRenderer();

  @override
  ViewModeKind get kind => ViewModeKind.cards;

  @override
  Widget build(BuildContext context, ViewRenderContext ctx) => CanvasScreen(ctx: ctx);
}

class SchematicRenderer implements ViewRenderer {
  const SchematicRenderer();

  @override
  ViewModeKind get kind => ViewModeKind.schematic;

  @override
  Widget build(BuildContext context, ViewRenderContext ctx) => SceneScreen(ctx: ctx);
}

class UnavailableView extends StatelessWidget {
  const UnavailableView({super.key, required this.kind});

  final ViewModeKind kind;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text('Vista ${kind.name} non disponibile in questa versione'),
    );
  }
}

ViewRendererRegistry createBuiltinRegistry() {
  return ViewRendererRegistry()
    ..register(const CardsRenderer())
    ..register(const SchematicRenderer());
}
