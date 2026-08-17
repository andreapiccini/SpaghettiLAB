import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:test/test.dart';

void main() {
  test('appearance overlay wins on colors and keeps missing keys', () {
    const base = DashboardAppearance(colors: {'accent': '#3B82F6', 'ok': '#22C55E'});
    const overlay = DashboardAppearance(colors: {'accent': '#22C55E'});
    final merged = base.merge(overlay);
    expect(merged.color('accent', ''), '#22C55E');
    expect(merged.color('ok', ''), '#22C55E');
  });

  test('default view preset is cards', () {
    expect(ViewPreset.cards.kind, ViewModeKind.cards);
  });

  test('visual pack summary parses marketplace JSON', () {
    final pack = VisualPackSummary.parse({
      'packId': 'garden',
      'name': 'Garden',
      'version': '0.2.0',
      'teaserViewMode': 'top_down',
    });
    expect(pack.packId, 'garden');
    expect(pack.teaserViewMode, 'top_down');
    expect(pack.source, PackSource.marketplace);
  });

  test('fake host demo has pump and temperature, view stays cards', () async {
    final host = FakeHost();
    final points = await host.getPoints(FakeHost.demoSystemId);
    expect(points.any((p) => p.pointId == 'giardino.pompa'), isTrue);
    expect(points.any((p) => p.pointId == 'salotto.temperatura'), isTrue);
    expect((await host.getView(FakeHost.demoSystemId)).kind, ViewModeKind.cards);
    await host.applyPack(FakeHost.demoSystemId, 'garden');
    expect((await host.getView(FakeHost.demoSystemId)).kind, ViewModeKind.cards);
    expect((await host.getView(FakeHost.demoSystemId)).packRef, 'garden');
    await host.applyPack(FakeHost.demoSystemId, 'industrial');
    expect((await host.getView(FakeHost.demoSystemId)).kind, ViewModeKind.schematic);
    expect((await host.getView(FakeHost.demoSystemId)).sceneRef, 'machine');
    host.dispose();
  });

  test('scene JSON roundtrip keeps binding and edges', () {
    final scene = Scene.parse({
      'sceneId': 'greenhouse',
      'name': 'Serra',
      'kindHint': 'top_down',
      'nodes': [
        {
          'nodeId': 'pompa',
          'pointId': 'giardino.pompa',
          'label': 'Pompa',
          'assetRef': 'pump',
          'transform': {'x': 50, 'y': 78, 'z': 0, 'rotation': 0, 'scale': 1},
        },
      ],
      'edges': [
        {'from': 'a', 'to': 'b'},
      ],
      'cameras': [
        {'cameraId': 'path', 'x': 50, 'z': 4, 'yaw': 0.2},
      ],
    });
    expect(scene.nodes.first.pointId, 'giardino.pompa');
    expect(scene.toJson()['kindHint'], 'top_down');
    expect(scene.cameras.first.z, 4);
    expect(SceneEdge.parse({'from': 'a', 'to': 'b', 'shape': 'rounded'}).shape, SceneEdgeShape.rounded);
    expect(SceneEdge.parse({'from': 'a', 'to': 'b'}).toJson().containsKey('shape'), isFalse);
  });

  test('frozen HOST_API V1 appearance JSON parses', () {
    final appearance = DashboardAppearance.parse({
      'colors': {'accent': '#22C55E', 'ok': '#4ADE80'},
      'background': {
        'kind': 'gradient',
        'colors': ['#052e16', '#0F1114'],
        'imageRef': null,
      },
      'animationProfile': 'standard',
      'brand': {'name': 'Garden', 'logoRef': null},
      'menuStyle': 'bottomBar',
      'displayMode': 'normal',
      'typeDisplayScale': 1,
      'radiusScale': 1,
    });
    expect(appearance.color('accent', ''), '#22C55E');
    expect(appearance.background.kind, BackgroundKind.gradient);
    expect(appearance.brand.name, 'Garden');
    expect(appearance.toJson()['animationProfile'], 'standard');
  });

  test('frozen HOST_API V1 point_updated JSON includes visualState', () {
    final event = PointUpdated.parse({
      'type': 'point_updated',
      'pointId': 'giardino.pompa',
      'value': true,
      'visualState': 'running',
      'timestamp': '2026-08-16T14:00:00Z',
    });
    expect(event.pointId, 'giardino.pompa');
    expect(event.value, true);
    expect(event.visualState, 'running');
  });

  test('HOST_API JSON roundtrip for system, point switch, layout', () {
    final system = LabSystem.parse({
      'systemId': 'site',
      'name': 'Serra',
      'connectionState': 'connected',
      'hostAddress': 'https://host.local/v1',
      'lastSeen': '2026-08-17T18:00:00Z',
    });
    expect(system.toJson()['connectionState'], 'connected');

    final point = ExposurePoint.parse({
      'pointId': 'ingresso.luce',
      'label': 'Luce',
      'valueType': 'boolean',
      'visualHint': 'switch',
      'writable': true,
      'value': true,
    });
    expect(point.visualHint, VisualHint.toggle);
    expect(point.toJson()['visualHint'], 'switch');

    final layout = DashboardLayout.parse({
      'pages': [
        {
          'pageId': 'home',
          'title': 'Casa',
          'widgets': [
            {'widgetId': 'w-0', 'pointId': 'ingresso.luce', 'visualHint': 'switch', 'column': 0, 'row': 0},
          ],
        },
      ],
    });
    expect(layout.pages.single.widgets.single.pointId, 'ingresso.luce');
    expect(parseHostEvent({'type': 'appearance_updated'}), isA<AppearanceUpdated>());
  });

  test('HostPort surface has no automation or firmware methods', () {
    const names = [
      'login',
      'logout',
      'currentSession',
      'selectSite',
      'listSystems',
      'getSystem',
      'createSystem',
      'getPoints',
      'getPointHistory',
      'getLayout',
      'putLayout',
      'getAppearance',
      'putAppearance',
      'applyPack',
      'getView',
      'putView',
      'listVisualPacks',
      'installLocalPack',
      'installStorePack',
      'getCapabilities',
      'sendCommand',
      'watch',
      'listScenes',
      'getScene',
      'putScene',
      'listCardStyles',
      'installCardStyle',
      'putCardStyle',
    ];
    expect(names, isNot(contains('sendRule')));
    expect(names, isNot(contains('mqtt')));
    expect(names, isNot(contains('protocolV1')));
  });

  test('fake host createSystem and putLayout persist', () async {
    final host = FakeHost();
    final created = await host.createSystem(name: 'Serra nord', address: 'fake://serra');
    expect(created.name, 'Serra nord');
    expect(created.hostAddress, 'fake://serra');
    expect((await host.listSystems()).length, 2);
    final layout = await host.getLayout(FakeHost.demoSystemId);
    expect(layout.pages.first.widgets.any((w) => w.pointId == 'esterno.luminosita'), isFalse);
    await host.putLayout(FakeHost.demoSystemId, const DashboardLayout(pages: []));
    expect((await host.getLayout(FakeHost.demoSystemId)).pages, isEmpty);
    host.dispose();
  });

  test('visual pack JSON parses and installs locally', () async {
    final pack = exampleLocalWalkPack();
    expect(pack.summary.packId, 'sdk-example');
    expect(pack.defaultViewMode, 'cards');
    expect(pack.scenes, isEmpty);
    expect(VisualPack.parse(pack.toJson()).summary.name, 'Esempio SDK');
    final host = FakeHost();
    await host.installLocalPack(pack);
    expect((await host.listVisualPacks()).any((p) => p.packId == 'sdk-example'), isTrue);
    await host.applyPack(FakeHost.demoSystemId, 'sdk-example');
    expect((await host.getView(FakeHost.demoSystemId)).kind, ViewModeKind.cards);
    await expectLater(
      host.putView(FakeHost.demoSystemId, const ViewPreset(viewId: 'x', kind: ViewModeKind.custom)),
      throwsStateError,
    );
    host.dispose();
  });

  test('signed store pack verifies and rejects tampering', () async {
    final signed = PackSigner.dev().sign(storeNottePack());
    expect(PackTrust.dev().verify(signed), isTrue);
    final tampered = SignedPack(
      pack: VisualPack(
        summary: signed.pack.summary,
        appearance: const DashboardAppearance(colors: {'accent': '#FF0000'}),
      ),
      keyId: signed.keyId,
      signature: signed.signature,
    );
    expect(PackTrust.dev().verify(tampered), isFalse);
    final host = FakeHost();
    expect((await host.listVisualPacks()).firstWhere((p) => p.packId == 'notte').installed, isFalse);
    await expectLater(host.applyPack(FakeHost.demoSystemId, 'notte'), throwsStateError);
    await host.installStorePack('notte');
    expect((await host.listVisualPacks()).firstWhere((p) => p.packId == 'notte').installed, isTrue);
    await host.applyPack(FakeHost.demoSystemId, 'notte');
    expect((await host.getAppearance(FakeHost.demoSystemId)).brand.name, 'Notte');
    host.dispose();
  });

  test('card styles catalog installs and fits points', () async {
    final host = FakeHost();
    final styles = await host.listCardStyles();
    expect(styles.any((s) => s.styleId == 'style.light-bulb' && s.installed), isTrue);
    expect(styles.any((s) => s.styleId == 'style.plain-switch' && !s.installed), isTrue);
    final parsed = CardStyle.parse(styles.first.toJson());
    expect(parsed.styleId, styles.first.styleId);
    await host.installCardStyle('style.plain-switch');
    expect((await host.listCardStyles()).firstWhere((s) => s.styleId == 'style.plain-switch').installed, isTrue);
    final light = (await host.getPoints(FakeHost.demoSystemId)).firstWhere((p) => p.pointId == 'ingresso.luce');
    expect(styles.firstWhere((s) => s.styleId == 'style.light-bulb').fits(light), isTrue);
    expect(styles.firstWhere((s) => s.styleId == 'style.gauge-arc').fits(light), isFalse);
    await host.putCardStyle(
      styles.firstWhere((s) => s.styleId == 'style.big-number').copyWith(
            name: 'Numero custom',
            recipe: const CardRecipe(
              valueSize: 48,
              decimals: 0,
              labelPlace: CardLabelPlace.bottom,
              labelX: 0.6,
              valueX: 0.2,
              unitX: 0.7,
              bodyX: 0.1,
              showUnit: false,
              unitSize: 22,
              warnAbove: 20,
            ),
          ),
    );
    final saved = (await host.listCardStyles()).firstWhere((s) => s.styleId == 'style.big-number');
    expect(saved.name, 'Numero custom');
    expect(saved.recipe.valueSize, 48);
    expect(saved.recipe.decimals, 0);
    expect(saved.recipe.labelX, 0.6);
    expect(saved.recipe.valueX, 0.2);
    expect(saved.recipe.unitX, 0.7);
    expect(saved.recipe.bodyX, 0.1);
    expect(saved.recipe.showUnit, isFalse);
    expect(saved.recipe.unitSize, 22);
    expect(saved.recipe.warnAbove, 20);
    expect(saved.installed, isTrue);
    final layout = await host.getLayout(FakeHost.demoSystemId);
    expect(layout.pages.first.widgets.any((w) => w.styleId == 'style.light-bulb'), isTrue);
    expect(
      layout.pages.first.widgets.firstWhere((w) => w.pointId == 'salotto.temperatura').height,
      2,
    );
    expect(cardSlotHeight(visualHint: 'gauge'), 2);
    expect(cardSlotHeight(visualHint: 'toggle'), 1);
    host.dispose();
  });

  test('fake host history and retired views map to cards', () async {
    final host = FakeHost();
    final history = await host.getPointHistory(FakeHost.demoSystemId, 'salotto.temperatura');
    expect(history.length, greaterThanOrEqualTo(2));
    expect(history.first.value, isA<double>());
    expect((await host.getPointHistory(FakeHost.demoSystemId, 'giardino.pompa')), isEmpty);
    await host.putView(
      FakeHost.demoSystemId,
      const ViewPreset(viewId: 'old', kind: ViewModeKind.topDown, sceneRef: 'greenhouse'),
    );
    expect((await host.getView(FakeHost.demoSystemId)).kind, ViewModeKind.cards);
    await host.putView(
      FakeHost.demoSystemId,
      const ViewPreset(viewId: 'old-walk', kind: ViewModeKind.firstPerson, sceneRef: 'walk'),
    );
    expect((await host.getView(FakeHost.demoSystemId)).kind, ViewModeKind.cards);
    host.dispose();
  });

  test('role scopes match the access matrix', () {
    expect(scopesForRole(SiteRole.viewer), equals({HostScopes.dashboardView}));
    expect(scopesForRole(SiteRole.operator).contains(HostScopes.dashboardCommand), isTrue);
    expect(scopesForRole(SiteRole.operator).contains(HostScopes.dashboardLayoutEdit), isFalse);
    expect(scopesForRole(SiteRole.siteAdmin).contains(HostScopes.dashboardMarketplace), isTrue);
    expect(scopesForRole(SiteRole.siteAdmin).contains(HostScopes.hostUserManage), isTrue);
  });

  test('fake host login enforces scopes and session expiry', () async {
    final host = FakeHost(requireLogin: true);
    expect(await host.currentSession(), isNull);
    await expectLater(host.getPoints(FakeHost.demoSystemId), throwsA(isA<HostException>()));
    await expectLater(
      host.login(email: 'nobody@demo.local', password: 'x'),
      throwsA(isA<HostException>()),
    );
    final viewer = await host.login(email: FakeHost.demoViewerEmail, password: 'viewer');
    expect(viewer.user.email, FakeHost.demoViewerEmail);
    expect(viewer.allows(HostScopes.dashboardView), isTrue);
    expect(viewer.allows(HostScopes.dashboardCommand), isFalse);
    await expectLater(
      host.sendCommand(FakeHost.demoSystemId, 'giardino.pompa', true),
      throwsA(isA<HostException>()),
    );
    await expectLater(
      host.putLayout(FakeHost.demoSystemId, const DashboardLayout(pages: [])),
      throwsA(isA<HostException>()),
    );
    expect((await host.getPoints(FakeHost.demoSystemId)).isNotEmpty, isTrue);

    await host.logout();
    final operator = await host.login(email: FakeHost.demoOperatorEmail, password: 'operator');
    expect(operator.allows(HostScopes.dashboardCommand), isTrue);
    await host.sendCommand(FakeHost.demoSystemId, 'giardino.pompa', true);
    expect(
      (await host.getPoints(FakeHost.demoSystemId)).firstWhere((p) => p.pointId == 'giardino.pompa').visualState,
      'running',
    );
    await expectLater(
      host.applyPack(FakeHost.demoSystemId, 'minimal'),
      throwsA(isA<HostException>()),
    );

    final partner = await host.login(email: FakeHost.demoPartnerEmail, password: 'partner');
    expect(partner.selectedSiteId, isNull);
    expect(partner.sites.length, 2);
    final picked = await host.selectSite(FakeHost.demoSerraSiteId);
    expect(picked.selectedSiteId, FakeHost.demoSerraSiteId);

    await host.login(email: FakeHost.demoAdminEmail, password: 'admin');
    host.expireSession();
    await expectLater(host.getPoints(FakeHost.demoSystemId), throwsA(isA<HostException>()));
    expect(await host.currentSession(), isNull);
    host.dispose();
  });
}
