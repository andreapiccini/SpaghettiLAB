import 'dart:math';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:dashboard_host/dashboard_host.dart';
import 'package:test/test.dart';

void main() {
  test('edge host exposes adapter points and persists a command', () async {
    final host = EdgeHost(random: Random(1));
    addTearDown(host.dispose);
    host.start();
    final systems = await host.listSystems();
    expect(systems.single.systemId, EdgeHost.liveSystemId);
    final points = await host.getPoints(EdgeHost.liveSystemId);
    expect(points.any((p) => p.pointId == 'salotto.temperatura'), isTrue);
    await host.sendCommand(EdgeHost.liveSystemId, 'giardino.pompa', true);
    expect(
      (await host.getPoints(EdgeHost.liveSystemId)).firstWhere((p) => p.pointId == 'giardino.pompa').visualState,
      'running',
    );
    expect((await host.getPointHistory(EdgeHost.liveSystemId, 'salotto.temperatura')).length, greaterThan(1));
    await host.putView(
      EdgeHost.liveSystemId,
      const ViewPreset(viewId: 'schema', kind: ViewModeKind.schematic, sceneRef: 'machine'),
    );
    expect((await host.getView(EdgeHost.liveSystemId)).kind, ViewModeKind.schematic);
  });

  test('composite host lists demo and live cores', () async {
    final host = CompositeHost(demo: FakeHost(), live: EdgeHost());
    addTearDown(host.dispose);
    host.start();
    final ids = [for (final s in await host.listSystems()) s.systemId];
    expect(ids, containsAll([FakeHost.demoSystemId, EdgeHost.liveSystemId]));
    await host.sendCommand(FakeHost.demoSystemId, 'giardino.pompa', true);
    expect(
      (await host.getPoints(FakeHost.demoSystemId)).firstWhere((p) => p.pointId == 'giardino.pompa').visualState,
      'running',
    );
    await host.sendCommand(EdgeHost.liveSystemId, 'ingresso.luce', false);
    expect(
      (await host.getPoints(EdgeHost.liveSystemId)).firstWhere((p) => p.pointId == 'ingresso.luce').value,
      false,
    );
  });
}
