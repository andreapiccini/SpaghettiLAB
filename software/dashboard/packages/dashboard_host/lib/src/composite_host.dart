import 'package:dashboard_domain/dashboard_domain.dart';

import 'cloud/cloud_endpoint.dart';
import 'cloud/cloud_host.dart';
import 'edge_host.dart';
import 'mqtt/broker.dart';
import 'mqtt/mqtt_endpoint.dart';
import 'mqtt/mqtt_transport.dart';

/// Casa demo ([FakeHost]) + Core live ([EdgeHost]) + Core MQTT / Cloud HOST_API.
/// Flutter still talks [HostPort].
class CompositeHost implements HostPort {
  CompositeHost({
    required this.demo,
    required this.live,
    MqttBroker Function(MqttEndpoint endpoint)? networkBroker,
  }) : _networkBroker = networkBroker;

  final FakeHost demo;
  final EdgeHost live;
  final MqttBroker Function(MqttEndpoint endpoint)? _networkBroker;
  final _mqtt = <String, EdgeHost>{};
  final _cloud = <String, CloudHost>{};
  var _cloudSeq = 0;

  Future<T> _gated<T>(String scope, Future<T> Function() run) {
    demo.requireScope(scope);
    return run();
  }

  HostPort _for(String systemId) {
    if (systemId == live.systemId) return live;
    final extra = _mqtt[systemId];
    if (extra != null) return extra;
    final cloud = _cloud[systemId];
    if (cloud != null) return cloud;
    return demo;
  }

  @override
  Future<AuthSession> login({required String email, required String password}) =>
      demo.login(email: email, password: password);

  @override
  Future<void> logout() => demo.logout();

  @override
  Future<AuthSession?> currentSession() => demo.currentSession();

  @override
  Future<AuthSession> selectSite(String siteId) => demo.selectSite(siteId);

  @override
  Future<List<SiteUser>> listSiteUsers(String siteId) =>
      _gated(HostScopes.hostUserManage, () => demo.listSiteUsers(siteId));

  @override
  Future<SiteInvite> inviteSiteUser({required String siteId, required String email, required SiteRole role}) =>
      _gated(HostScopes.hostUserManage, () => demo.inviteSiteUser(siteId: siteId, email: email, role: role));

  @override
  Future<void> revokeSiteUser({required String siteId, required String userId}) =>
      _gated(HostScopes.hostUserManage, () => demo.revokeSiteUser(siteId: siteId, userId: userId));

  @override
  Future<List<SiteSession>> listSiteSessions(String siteId) =>
      _gated(HostScopes.hostUserManage, () => demo.listSiteSessions(siteId));

  @override
  Future<List<SupportGrant>> listSupportGrants(String siteId) => demo.listSupportGrants(siteId);

  @override
  Future<SupportGrant> requestSupportGrant(String siteId) =>
      _gated(HostScopes.hostSupportGrantApprove, () => demo.requestSupportGrant(siteId));

  @override
  Future<SupportGrant> approveSupportGrant({required String siteId, required String grantId}) =>
      _gated(HostScopes.hostSupportGrantApprove, () => demo.approveSupportGrant(siteId: siteId, grantId: grantId));

  @override
  Future<void> revokeSupportGrant({required String siteId, required String grantId}) =>
      demo.revokeSupportGrant(siteId: siteId, grantId: grantId);

  @override
  Future<List<PartnerSiteSummary>> listPartnerSites() => demo.listPartnerSites();

  @override
  Future<SupportGrant> requestPartnerSiteAccess(String siteId) => demo.requestPartnerSiteAccess(siteId);

  @override
  Future<PartnerSiteSummary> applyPartnerBrand({required String siteId, required String packId}) =>
      demo.applyPartnerBrand(siteId: siteId, packId: packId);

  @override
  Future<PartnerSiteSummary> queueSitePackageUpdate(String siteId) => demo.queueSitePackageUpdate(siteId);

  @override
  Future<List<LabSystem>> listSystems() async {
    demo.requireScope(HostScopes.dashboardView);
    return [
        ...await demo.listSystems(),
        ...await live.listSystems(),
        for (final host in _mqtt.values) ...await host.listSystems(),
        for (final host in _cloud.values) ...await host.listSystems(),
      ];
  }

  @override
  Future<LabSystem> getSystem(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getSystem(systemId));

  @override
  Future<LabSystem> createSystem({required String name, String address = ''}) async {
    demo.requireScope(HostScopes.hostSystemManage);
    final trimmedName = name.trim();
    if (trimmedName.isEmpty) {
      throw ArgumentError.value(name, 'name', 'nome obbligatorio');
    }
    final trimmed = address.trim();
    if (MqttEndpoint.looksLike(trimmed)) {
      final endpoint = MqttEndpoint.parse(trimmed);
      final id = _mqttSystemId(endpoint.coreId);
      final host = EdgeHost(
        systemId: id,
        displayName: trimmedName,
        transport: MqttCoreTransport.network(endpoint, broker: _networkBroker?.call(endpoint)),
        initialStatus: ConnectionStatus.connecting,
      )..start();
      _mqtt[id] = host;
      return (await host.listSystems()).single;
    }
    if (CloudEndpoint.looksLike(trimmed)) {
      final endpoint = CloudEndpoint.parse(trimmed);
      final id = _cloudSystemId();
      final host = endpoint.loopback
          ? CloudHost.loopback(systemId: id, displayName: trimmedName)
          : CloudHost.http(endpoint, systemId: id, displayName: trimmedName);
      host.start();
      _cloud[id] = host;
      return (await host.listSystems()).single;
    }
    return demo.createSystem(name: name, address: address);
  }

  String _mqttSystemId(String coreId) {
    var id = 'core-$coreId';
    if (id == live.systemId || id == FakeHost.demoSystemId || _mqtt.containsKey(id)) {
      var n = 2;
      while (_mqtt.containsKey('$id-$n') || '$id-$n' == live.systemId) {
        n++;
      }
      id = '$id-$n';
    }
    return id;
  }

  String _cloudSystemId() {
    var id = 'cloud-${++_cloudSeq}';
    while (_cloud.containsKey(id) || id == live.systemId || id == FakeHost.demoSystemId) {
      id = 'cloud-${++_cloudSeq}';
    }
    return id;
  }

  @override
  Future<List<ExposurePoint>> getPoints(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getPoints(systemId));

  @override
  Future<List<HistorySample>> getPointHistory(String systemId, String pointId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getPointHistory(systemId, pointId));

  @override
  Future<DashboardLayout> getLayout(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getLayout(systemId));

  @override
  Future<void> putLayout(String systemId, DashboardLayout layout) =>
      _gated(HostScopes.dashboardLayoutEdit, () => _for(systemId).putLayout(systemId, layout));

  @override
  Future<DashboardAppearance> getAppearance(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getAppearance(systemId));

  @override
  Future<void> putAppearance(String systemId, DashboardAppearance appearance) =>
      _gated(HostScopes.dashboardAppearanceEdit, () => _for(systemId).putAppearance(systemId, appearance));

  @override
  Future<void> applyPack(String systemId, String packId) =>
      _gated(HostScopes.dashboardMarketplace, () => _for(systemId).applyPack(systemId, packId));

  @override
  Future<ViewPreset> getView(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getView(systemId));

  @override
  Future<void> putView(String systemId, ViewPreset view) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).putView(systemId, view));

  @override
  Future<List<Scene>> listScenes(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).listScenes(systemId));

  @override
  Future<Scene> getScene(String systemId, String sceneId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getScene(systemId, sceneId));

  @override
  Future<void> putScene(String systemId, Scene scene) =>
      _gated(HostScopes.dashboardLayoutEdit, () => _for(systemId).putScene(systemId, scene));

  @override
  Future<List<VisualPackSummary>> listVisualPacks() =>
      _gated(HostScopes.dashboardView, demo.listVisualPacks);

  @override
  Future<void> installLocalPack(VisualPack pack) async {
    demo.requireScope(HostScopes.dashboardMarketplace);
    await demo.installLocalPack(pack);
    await live.installLocalPack(pack);
    for (final host in _mqtt.values) {
      await host.installLocalPack(pack);
    }
    for (final host in _cloud.values) {
      await host.installLocalPack(pack);
    }
  }

  @override
  Future<void> installStorePack(String packId) async {
    demo.requireScope(HostScopes.dashboardMarketplace);
    await demo.installStorePack(packId);
    await live.installStorePack(packId);
    for (final host in _mqtt.values) {
      await host.installStorePack(packId);
    }
    for (final host in _cloud.values) {
      await host.installStorePack(packId);
    }
  }

  @override
  Future<List<CardStyle>> listCardStyles() =>
      _gated(HostScopes.dashboardView, demo.listCardStyles);

  @override
  Future<void> installCardStyle(String styleId) async {
    demo.requireScope(HostScopes.dashboardMarketplace);
    await demo.installCardStyle(styleId);
    await live.installCardStyle(styleId);
    for (final host in _mqtt.values) {
      await host.installCardStyle(styleId);
    }
    for (final host in _cloud.values) {
      await host.installCardStyle(styleId);
    }
  }

  @override
  Future<void> putCardStyle(CardStyle style) async {
    demo.requireScope(HostScopes.dashboardMarketplace);
    await demo.putCardStyle(style);
    await live.putCardStyle(style);
    for (final host in _mqtt.values) {
      await host.putCardStyle(style);
    }
    for (final host in _cloud.values) {
      await host.putCardStyle(style);
    }
  }

  @override
  Future<SystemCapabilities> getCapabilities(String systemId) =>
      _gated(HostScopes.dashboardView, () => _for(systemId).getCapabilities(systemId));

  @override
  Future<void> sendCommand(String systemId, String pointId, Object value) =>
      _gated(HostScopes.dashboardCommand, () => _for(systemId).sendCommand(systemId, pointId, value));

  @override
  Stream<HostEvent> watch(String systemId) {
    demo.requireScope(HostScopes.dashboardView);
    return _for(systemId).watch(systemId);
  }

  void start() {
    demo.start();
    live.start();
  }

  void dispose() {
    for (final host in _mqtt.values) {
      host.dispose();
    }
    _mqtt.clear();
    for (final host in _cloud.values) {
      host.dispose();
    }
    _cloud.clear();
    demo.dispose();
    live.dispose();
  }
}
