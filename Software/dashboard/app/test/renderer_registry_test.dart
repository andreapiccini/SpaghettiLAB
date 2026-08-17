import 'package:dashboard_app/renderers/cards_renderer.dart';
import 'package:dashboard_app/renderers/view_renderer.dart';
import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

class _StubRenderer implements ViewRenderer {
  @override
  ViewModeKind get kind => ViewModeKind.schematic;

  @override
  Widget build(BuildContext context, ViewRenderContext ctx) => const Text('schematic-stub');
}

void main() {
  test('registry resolves cards and schematic only', () {
    final registry = createBuiltinRegistry();
    expect(registry.resolve(ViewModeKind.cards), isA<CardsRenderer>());
    expect(registry.resolve(ViewModeKind.schematic), isA<SchematicRenderer>());
    expect(registry.resolve(ViewModeKind.topDown), isNull);
    expect(registry.resolve(ViewModeKind.firstPerson), isNull);
    expect(registry.resolve(ViewModeKind.custom), isNull);
  });

  test('a second renderer can register without replacing cards', () {
    final registry = createBuiltinRegistry()..register(_StubRenderer());
    expect(registry.resolve(ViewModeKind.cards), isA<CardsRenderer>());
    expect(registry.resolve(ViewModeKind.schematic), isA<_StubRenderer>());
  });
}
