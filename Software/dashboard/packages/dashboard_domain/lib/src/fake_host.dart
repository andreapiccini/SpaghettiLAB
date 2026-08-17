import 'dart:async';
import 'dart:math';

import 'appearance.dart';
import 'auth.dart';
import 'capabilities.dart';
import 'card_style.dart';
import 'events.dart';
import 'history.dart';
import 'host_port.dart';
import 'layout.dart';
import 'pack_signature.dart';
import 'point.dart';
import 'scene.dart';
import 'store_catalog.dart';
import 'system.dart';
import 'view.dart';
import 'visual_pack.dart';

/// In-memory host. Automation is *simulated under* the UI (toggle pompa),
/// not defined as rules in the dashboard.
class FakeHost implements HostPort {
  FakeHost({Random? random, this.requireLogin = false}) : _random = random ?? Random(1) {
    _points = [
      const ExposurePoint(
        pointId: 'salotto.temperatura',
        label: 'Temperatura salotto',
        valueType: ValueType.number,
        visualHint: VisualHint.gauge,
        unit: '°C',
        value: 21.4,
      ),
      const ExposurePoint(
        pointId: 'giardino.pompa',
        label: 'Pompa giardino',
        kind: 'actuator',
        valueType: ValueType.boolean,
        visualHint: VisualHint.animated,
        visualStates: ['idle', 'running'],
        writable: true,
        value: false,
        visualState: 'idle',
      ),
      const ExposurePoint(
        pointId: 'giardino.umidita',
        label: 'Umidità vaso',
        valueType: ValueType.number,
        visualHint: VisualHint.value,
        unit: '%',
        value: 47,
      ),
      const ExposurePoint(
        pointId: 'ingresso.luce',
        label: 'Luce ingresso',
        kind: 'actuator',
        valueType: ValueType.boolean,
        visualHint: VisualHint.toggle,
        writable: true,
        value: true,
      ),
      const ExposurePoint(
        pointId: 'cucina.consumo',
        label: 'Consumo cucina',
        valueType: ValueType.number,
        visualHint: VisualHint.sparkline,
        unit: 'W',
        value: 182,
      ),
      const ExposurePoint(
        pointId: 'cantina.allarme',
        label: 'Allarme cantina',
        valueType: ValueType.boolean,
        visualHint: VisualHint.status,
        value: false,
        visualState: 'ok',
      ),
      const ExposurePoint(
        pointId: 'serra.irrigazione',
        label: 'Irrigazione',
        kind: 'actuator',
        valueType: ValueType.boolean,
        visualHint: VisualHint.button,
        writable: true,
        value: false,
      ),
      const ExposurePoint(
        pointId: 'esterno.luminosita',
        label: 'Luminosità',
        valueType: ValueType.number,
        visualHint: VisualHint.gauge,
        unit: 'lux',
        value: 340,
      ),
    ];
    _scenes = {
      'machine': _machineScene,
    };
    _history = {
      for (final p in _points)
        if (p.value is num) p.pointId: _seedHistory((p.value as num).toDouble()),
    };
    _store = {for (final signed in builtinSignedStore()) signed.pack.summary.packId: signed};
    for (final signed in _store.values) {
      _packs.add(signed.pack.summary);
    }
    if (!requireLogin) {
      _session = _issue(_accounts[demoAdminEmail]!);
    }
  }

  static const String demoSystemId = 'casa-demo';
  static const String demoSiteId = 'site-casa';
  static const String demoSerraSiteId = 'site-serra';
  static const String demoAdminEmail = 'admin@demo.local';
  static const String demoViewerEmail = 'viewer@demo.local';
  static const String demoOperatorEmail = 'operator@demo.local';
  static const String demoPartnerEmail = 'partner@demo.local';

  /// When true, [currentSession] starts empty and mutating calls need [login].
  final bool requireLogin;

  final Random _random;
  final _events = StreamController<HostEvent>.broadcast();
  Timer? _tick;
  late List<ExposurePoint> _points;
  late Map<String, List<HistorySample>> _history;
  DashboardAppearance _appearance = DashboardAppearance.lightDefaults;
  ViewPreset _view = ViewPreset.cards;
  DashboardLayout? _layout;
  late Map<String, Scene> _scenes;
  final _systems = <LabSystem>[
    const LabSystem(
      systemId: demoSystemId,
      name: 'Casa demo',
      connectionState: ConnectionStatus.connected,
      hostAddress: 'fake://local',
    ),
  ];

  final _packs = <VisualPackSummary>[
    const VisualPackSummary(
      packId: 'minimal',
      name: 'Minimal',
      version: '1.0.0',
      teaserViewMode: 'cards',
      blurb: 'Cards pulite, contrasto alto.',
    ),
    const VisualPackSummary(
      packId: 'industrial',
      name: 'Industrial',
      version: '0.2.0',
      teaserViewMode: 'schematic',
      blurb: 'Schema macchina con tubi e nodi live.',
    ),
    const VisualPackSummary(
      packId: 'garden',
      name: 'Garden',
      version: '0.2.0',
      teaserViewMode: 'cards',
      blurb: 'Tema serra verde sulle cards.',
    ),
    const VisualPackSummary(
      packId: 'walk',
      name: 'Walk',
      version: '0.1.0',
      source: PackSource.developer,
      teaserViewMode: 'cards',
      blurb: 'Tema serra sulle cards — vetro e verde.',
    ),
  ];
  final _localPacks = <String, VisualPack>{};
  late final Map<String, SignedPack> _store;
  final _trust = PackTrust.dev();
  List<CardStyle> _cardStyles = builtinCardCatalog();
  AuthSession? _session;
  static const _accounts = <String, _DemoAccount>{
    demoViewerEmail: _DemoAccount(
      email: demoViewerEmail,
      password: 'viewer',
      displayName: 'Viewer demo',
      role: SiteRole.viewer,
      siteIds: [demoSiteId],
    ),
    demoOperatorEmail: _DemoAccount(
      email: demoOperatorEmail,
      password: 'operator',
      displayName: 'Operatore demo',
      role: SiteRole.operator,
      siteIds: [demoSiteId],
    ),
    demoAdminEmail: _DemoAccount(
      email: demoAdminEmail,
      password: 'admin',
      displayName: 'Admin demo',
      role: SiteRole.siteAdmin,
      siteIds: [demoSiteId],
    ),
    demoPartnerEmail: _DemoAccount(
      email: demoPartnerEmail,
      password: 'partner',
      displayName: 'Partner demo',
      role: SiteRole.partnerAdmin,
      siteIds: [demoSiteId, demoSerraSiteId],
    ),
  };
  static const _sites = <String, SiteMembership>{
    demoSiteId: SiteMembership(
      siteId: demoSiteId,
      name: 'Casa demo',
      orgId: 'org-demo',
    ),
    demoSerraSiteId: SiteMembership(
      siteId: demoSerraSiteId,
      name: 'Serra nord',
      orgId: 'org-demo',
    ),
  };

  void requireScope(String scope) {
    final session = _liveSession();
    if (session == null || !session.allows(scope)) {
      throw const HostException('unauthorized');
    }
  }

  void expireSession() {
    final session = _session;
    if (session == null) return;
    _session = session.copyWith(
      expiresAt: DateTime.now().toUtc().subtract(const Duration(seconds: 1)),
    );
  }

  AuthSession? _liveSession() {
    final session = _session;
    if (session == null) return null;
    if (session.isExpired) {
      _session = null;
      return null;
    }
    return session;
  }

  AuthSession _issue(_DemoAccount account, {String? selectedSiteId}) {
    final memberships = [
      for (final id in account.siteIds)
        SiteMembership(
          siteId: id,
          name: _sites[id]!.name,
          orgId: _sites[id]!.orgId,
          roles: [account.role],
          scopes: scopesForRole(account.role),
        ),
    ];
    final selected = selectedSiteId ?? (memberships.length == 1 ? memberships.first.siteId : null);
    return AuthSession(
      token: 'dev.${account.email}.$selected',
      user: AuthUser(
        userId: 'user-${account.email.split('@').first}',
        email: account.email,
        displayName: account.displayName,
      ),
      sites: memberships,
      selectedSiteId: selected,
      expiresAt: DateTime.now().toUtc().add(const Duration(hours: 8)),
    );
  }

  @override
  Future<AuthSession> login({required String email, required String password}) async {
    final account = _accounts[email.trim().toLowerCase()];
    if (account == null || account.password != password) {
      throw const HostException('unauthorized', 'credenziali non valide');
    }
    _session = _issue(account);
    return _session!;
  }

  @override
  Future<void> logout() async {
    _session = null;
  }

  @override
  Future<AuthSession?> currentSession() async => _liveSession();

  @override
  Future<AuthSession> selectSite(String siteId) async {
    final session = _liveSession();
    if (session == null) throw const HostException('unauthorized');
    if (!session.sites.any((s) => s.siteId == siteId)) {
      throw const HostException('unauthorized', 'sito non disponibile');
    }
    _session = session.copyWith(token: 'dev.${session.user.email}.$siteId', selectedSiteId: siteId);
    return _session!;
  }

  void start() {
    _tick ??= Timer.periodic(const Duration(seconds: 3), (_) {
      final temp = _points.firstWhere((p) => p.pointId == 'salotto.temperatura');
      final next = 20 + _random.nextDouble() * 4;
      _replace(temp.copyWith(value: double.parse(next.toStringAsFixed(1))));
      _events.add(
        PointUpdated(
          pointId: temp.pointId,
          value: next,
          timestamp: DateTime.now().toUtc(),
        ),
      );
    });
  }

  void dispose() {
    _tick?.cancel();
    _events.close();
  }

  @override
  Future<List<LabSystem>> listSystems() async {
    requireScope(HostScopes.dashboardView);
    return [
        for (final system in _systems)
          LabSystem(
            systemId: system.systemId,
            name: system.name,
            connectionState: system.connectionState,
            hostAddress: system.hostAddress,
            lastSeen: DateTime.now().toUtc(),
          ),
      ];
  }

  @override
  Future<LabSystem> getSystem(String systemId) async =>
      (await listSystems()).firstWhere((s) => s.systemId == systemId);

  @override
  Future<LabSystem> createSystem({required String name, String address = ''}) async {
    requireScope(HostScopes.hostSystemManage);
    final trimmed = name.trim();
    if (trimmed.isEmpty) {
      throw ArgumentError.value(name, 'name', 'nome obbligatorio');
    }
    var id = trimmed.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
    if (id.isEmpty) id = 'sistema';
    final slug = id;
    var n = 2;
    while (_systems.any((s) => s.systemId == id)) {
      id = '$slug-$n';
      n++;
    }
    final system = LabSystem(
      systemId: id,
      name: trimmed,
      connectionState: ConnectionStatus.connected,
      hostAddress: address.trim().isEmpty ? null : address.trim(),
      lastSeen: DateTime.now().toUtc(),
    );
    _systems.add(system);
    return system;
  }

  @override
  Future<List<ExposurePoint>> getPoints(String systemId) async {
    requireScope(HostScopes.dashboardView);
    return List.unmodifiable(_points);
  }

  @override
  Future<List<HistorySample>> getPointHistory(String systemId, String pointId) async {
    requireScope(HostScopes.dashboardView);
    return List.unmodifiable(_history[pointId] ?? const []);
  }

  DashboardLayout _defaultLayout() {
    final laidOut = [for (final p in _points) if (p.pointId != 'esterno.luminosita') p];
    return DashboardLayout(
        pages: [
          DashboardPage(
            pageId: 'home',
            title: 'Casa',
            widgets: [
              for (var i = 0; i < laidOut.length; i++)
                DashboardWidget(
                  widgetId: 'w-$i',
                  pointId: laidOut[i].pointId,
                  visualHint: laidOut[i].visualHint.name,
                  styleId: defaultStyleIdFor(laidOut[i]),
                  height: laidOut[i].visualHint == VisualHint.gauge ? 2 : 1,
                  column: i % 2,
                  row: i ~/ 2,
                ),
            ],
          ),
        ],
      );
  }

  @override
  Future<DashboardLayout> getLayout(String systemId) async {
    requireScope(HostScopes.dashboardView);
    return _layout ??= _defaultLayout();
  }

  @override
  Future<void> putLayout(String systemId, DashboardLayout layout) async {
    requireScope(HostScopes.dashboardLayoutEdit);
    _layout = layout;
  }

  @override
  Future<DashboardAppearance> getAppearance(String systemId) async {
    requireScope(HostScopes.dashboardView);
    return _appearance;
  }

  @override
  Future<void> putAppearance(String systemId, DashboardAppearance appearance) async {
    requireScope(HostScopes.dashboardAppearanceEdit);
    _appearance = appearance;
    _events.add(const AppearanceUpdated());
  }

  @override
  Future<void> applyPack(String systemId, String packId) async {
    requireScope(HostScopes.dashboardMarketplace);
    if (_store.containsKey(packId) && !_localPacks.containsKey(packId)) {
      throw StateError('pack $packId non installato');
    }
    switch (packId) {
      case 'garden':
        _appearance = const DashboardAppearance(
          colors: {'accent': '#22C55E', 'ok': '#4ADE80'},
          background: BackgroundSpec(
            kind: BackgroundKind.gradient,
            colors: ['#052e16', '#0F1114'],
          ),
          brand: BrandSpec(name: 'Garden'),
        );
        _view = const ViewPreset(
          viewId: 'garden-cards',
          kind: ViewModeKind.cards,
          layoutRef: 'home',
          packRef: 'garden',
        );
      case 'industrial':
        _appearance = const DashboardAppearance(
          colors: {'accent': '#F59E0B'},
          brand: BrandSpec(name: 'Industrial'),
          animationProfile: AnimationProfile.subtle,
        );
        _view = const ViewPreset(
          viewId: 'industrial-schema',
          kind: ViewModeKind.schematic,
          sceneRef: 'machine',
          packRef: 'industrial',
        );
      case 'walk':
        _appearance = const DashboardAppearance(
          colors: {'accent': '#4ADE80'},
          background: BackgroundSpec(
            kind: BackgroundKind.gradient,
            colors: ['#022c22', '#0F1114'],
          ),
          brand: BrandSpec(name: 'Walk'),
          animationProfile: AnimationProfile.rich,
        );
        _view = const ViewPreset(
          viewId: 'garden-walk',
          kind: ViewModeKind.cards,
          layoutRef: 'home',
          packRef: 'walk',
        );
      default:
        final local = _localPacks[packId];
        if (local == null) {
          _appearance = DashboardAppearance.lightDefaults;
          _view = ViewPreset.cards;
        } else {
          if (local.appearance != null) _appearance = local.appearance!;
          var kind = ViewModeKind.cards;
          try {
            kind = parseViewKind(local.defaultViewMode);
          } catch (_) {}
          if (kind != ViewModeKind.cards && kind != ViewModeKind.schematic) {
            kind = ViewModeKind.cards;
          }
          _view = ViewPreset(
            viewId: '${local.summary.packId}-view',
            kind: kind,
            sceneRef: local.scenes.isEmpty ? null : local.scenes.first.sceneId,
            packRef: local.summary.packId,
          );
        }
    }
    _events.add(const AppearanceUpdated());
  }

  @override
  Future<ViewPreset> getView(String systemId) async {
    requireScope(HostScopes.dashboardView);
    return _productView(_view);
  }

  @override
  Future<void> putView(String systemId, ViewPreset view) async {
    requireScope(HostScopes.dashboardView);
    if (view.kind == ViewModeKind.custom) {
      throw StateError('vista ${viewKindWire(view.kind)} non disponibile');
    }
    _view = _productView(view);
  }

  ViewPreset _productView(ViewPreset view) {
    if (view.kind == ViewModeKind.topDown || view.kind == ViewModeKind.firstPerson) {
      return ViewPreset(
        viewId: view.viewId,
        kind: ViewModeKind.cards,
        layoutRef: view.layoutRef ?? 'home',
        packRef: view.packRef,
      );
    }
    return view;
  }

  @override
  Future<List<Scene>> listScenes(String systemId) async {
    requireScope(HostScopes.dashboardView);
    return _scenes.values.toList();
  }

  @override
  Future<Scene> getScene(String systemId, String sceneId) async {
    requireScope(HostScopes.dashboardView);
    final scene = _scenes[sceneId];
    if (scene == null) throw StateError('scene $sceneId assente');
    return scene;
  }

  @override
  Future<void> putScene(String systemId, Scene scene) async {
    requireScope(HostScopes.dashboardLayoutEdit);
    _scenes[scene.sceneId] = scene;
  }

  @override
  Future<List<VisualPackSummary>> listVisualPacks() async {
    requireScope(HostScopes.dashboardView);
    return List.unmodifiable(_packs);
  }

  @override
  Future<void> installLocalPack(VisualPack pack) async {
    requireScope(HostScopes.dashboardMarketplace);
    _packs.removeWhere((p) => p.packId == pack.summary.packId);
    _packs.insert(0, pack.summary.copyWith(installed: true));
    _localPacks[pack.summary.packId] = pack;
    for (final scene in pack.scenes) {
      _scenes[scene.sceneId] = scene;
    }
  }

  @override
  Future<void> installStorePack(String packId) async {
    requireScope(HostScopes.dashboardMarketplace);
    final signed = _store[packId];
    if (signed == null) throw StateError('pack $packId assente nello store');
    if (!_trust.verify(signed)) throw PackSignatureException('firma non valida');
    await installLocalPack(signed.pack);
  }

  @override
  Future<List<CardStyle>> listCardStyles() async {
    requireScope(HostScopes.dashboardView);
    return List.unmodifiable(_cardStyles);
  }

  @override
  Future<void> installCardStyle(String styleId) async {
    requireScope(HostScopes.dashboardMarketplace);
    final i = _cardStyles.indexWhere((s) => s.styleId == styleId);
    if (i < 0) throw StateError('stile $styleId assente');
    _cardStyles = [
      for (var n = 0; n < _cardStyles.length; n++)
        n == i ? _cardStyles[n].copyWith(installed: true) : _cardStyles[n],
    ];
  }

  @override
  Future<void> putCardStyle(CardStyle style) async {
    requireScope(HostScopes.dashboardMarketplace);
    final next = style.copyWith(installed: true);
    final i = _cardStyles.indexWhere((s) => s.styleId == next.styleId);
    if (i < 0) {
      _cardStyles = [..._cardStyles, next];
      return;
    }
    _cardStyles = [
      for (var n = 0; n < _cardStyles.length; n++) n == i ? next : _cardStyles[n],
    ];
  }

  @override
  Future<SystemCapabilities> getCapabilities(String systemId) async {
    requireScope(HostScopes.dashboardView);
    return const SystemCapabilities(customViews: true, rbac: true);
  }

  @override
  Future<void> sendCommand(String systemId, String pointId, Object value) async {
    requireScope(HostScopes.dashboardCommand);
    final point = _points.firstWhere((p) => p.pointId == pointId);
    final running = value == true || value == 'on' || value == 1;
    final next = point.pointId == 'giardino.pompa'
        ? point.copyWith(value: running, visualState: running ? 'running' : 'idle')
        : point.copyWith(value: value);
    _replace(next);
    _events.add(
      PointUpdated(
        pointId: pointId,
        value: next.value,
        visualState: next.visualState,
        timestamp: DateTime.now().toUtc(),
      ),
    );
  }

  @override
  Stream<HostEvent> watch(String systemId) {
    requireScope(HostScopes.dashboardView);
    return _events.stream;
  }

  void _replace(ExposurePoint next) {
    final stamped = next.copyWith(updatedAt: DateTime.now().toUtc());
    _points = [for (final p in _points) p.pointId == stamped.pointId ? stamped : p];
    _pushHistory(stamped.pointId, stamped.value);
  }

  void _pushHistory(String pointId, Object? value) {
    if (value is! num) return;
    final list = _history.putIfAbsent(pointId, () => <HistorySample>[]);
    list.add(HistorySample(at: DateTime.now().toUtc(), value: value.toDouble()));
    if (list.length > 48) list.removeRange(0, list.length - 48);
  }

  static List<HistorySample> _seedHistory(double center) {
    final now = DateTime.now().toUtc();
    return [
      for (var i = 24; i >= 1; i--)
        HistorySample(
          at: now.subtract(Duration(minutes: i * 3)),
          value: double.parse((center + sin(i / 3) * (center.abs() * 0.06 + 0.4)).toStringAsFixed(1)),
        ),
    ];
  }
}

const _machineScene = Scene(
  sceneId: 'machine',
  name: 'Schema',
  kindHint: 'schematic',
  nodes: [
    SceneNode(
      nodeId: 'in',
      pointId: 'cucina.consumo',
      label: 'Carico',
      assetRef: 'tank',
      transform: SceneTransform(x: 18, y: 50),
    ),
    SceneNode(
      nodeId: 'pump',
      pointId: 'giardino.pompa',
      label: 'Pompa',
      assetRef: 'pump',
      transform: SceneTransform(x: 50, y: 50),
    ),
    SceneNode(
      nodeId: 'out',
      pointId: 'giardino.umidita',
      label: 'Mandata',
      assetRef: 'tank',
      transform: SceneTransform(x: 82, y: 50),
    ),
    SceneNode(
      nodeId: 'temp',
      pointId: 'salotto.temperatura',
      label: 'T',
      assetRef: 'gauge',
      transform: SceneTransform(x: 50, y: 22),
    ),
  ],
  edges: [
    SceneEdge(from: 'in', to: 'pump'),
    SceneEdge(from: 'pump', to: 'out'),
    SceneEdge(from: 'temp', to: 'pump'),
  ],
);

class _DemoAccount {
  const _DemoAccount({
    required this.email,
    required this.password,
    required this.displayName,
    required this.role,
    required this.siteIds,
  });

  final String email;
  final String password;
  final String displayName;
  final SiteRole role;
  final List<String> siteIds;
}

