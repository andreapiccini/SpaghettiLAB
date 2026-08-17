import 'dart:async';
import 'dart:math';

import 'package:dashboard_domain/dashboard_domain.dart';

import 'core_transport.dart';
import 'demo_manifest.dart';
import 'exposure_manifest.dart';
import 'mqtt/mqtt_transport.dart';
import 'protocol_record.dart';
import 'protocol_v1_adapter.dart';

/// HostPort backed by [ProtocolV1Adapter]. Presentation (layout, pack, scene)
/// stays on an inner [FakeHost] so Flutter still never sees Protocol V1.
class EdgeHost implements HostPort {
  EdgeHost({
    this.systemId = liveSystemId,
    this.displayName = 'Core live',
    CoreTransport? transport,
    ExposureManifest? manifest,
    FakeHost? presentation,
    Random? random,
    ConnectionStatus initialStatus = ConnectionStatus.connected,
  })  : _transport = transport ??
            MqttCoreTransport.loopback(manifest: manifest ?? demoExposureManifest(), random: random),
        _adapter = ProtocolV1Adapter(manifest ?? demoExposureManifest(), random: random),
        _presentation = presentation ?? FakeHost(),
        _status = initialStatus {
    _adapterSub = _adapter.events.listen(_events.add);
    _presentationSub = _presentation.watch(FakeHost.demoSystemId).listen((event) {
      if (event is PointUpdated) return;
      _events.add(event);
    });
  }

  static const String liveSystemId = 'core-live';

  final String systemId;
  final String displayName;
  final CoreTransport _transport;
  final ProtocolV1Adapter _adapter;
  final FakeHost _presentation;
  final _events = StreamController<HostEvent>.broadcast();
  StreamSubscription<ProtocolRecord>? _records;
  StreamSubscription<HostEvent>? _adapterSub;
  StreamSubscription<HostEvent>? _presentationSub;
  ConnectionStatus _status;
  var _disposed = false;

  void start() {
    _records ??= _transport.records.listen(_adapter.apply);
    unawaited(_connect());
  }

  Future<void> _connect() async {
    try {
      await _transport.start();
      if (_disposed) return;
      _setStatus(ConnectionStatus.connected);
    } catch (_) {
      if (_disposed) return;
      _setStatus(ConnectionStatus.disconnected);
    }
  }

  void _setStatus(ConnectionStatus status) {
    if (_status == status) return;
    _status = status;
    _events.add(
      SystemStatusUpdated(
        systemId: systemId,
        online: status == ConnectionStatus.connected,
      ),
    );
  }

  void dispose() {
    _disposed = true;
    unawaited(_records?.cancel());
    unawaited(_adapterSub?.cancel());
    unawaited(_presentationSub?.cancel());
    _transport.dispose();
    _adapter.dispose();
    _presentation.dispose();
    _events.close();
  }

  @override
  Future<AuthSession> login({required String email, required String password}) =>
      _presentation.login(email: email, password: password);

  @override
  Future<void> logout() => _presentation.logout();

  @override
  Future<AuthSession?> currentSession() => _presentation.currentSession();

  @override
  Future<AuthSession> selectSite(String siteId) => _presentation.selectSite(siteId);

  @override
  Future<List<LabSystem>> listSystems() async {
    _presentation.requireScope(HostScopes.dashboardView);
    return [
        LabSystem(
          systemId: systemId,
          name: displayName,
          connectionState: _status,
          hostAddress: _transport.address,
          lastSeen: DateTime.now().toUtc(),
        ),
      ];
  }

  @override
  Future<LabSystem> getSystem(String systemId) async =>
      (await listSystems()).firstWhere((s) => s.systemId == systemId);

  @override
  Future<LabSystem> createSystem({required String name, String address = ''}) {
    return _presentation.createSystem(name: name, address: address);
  }

  @override
  Future<List<ExposurePoint>> getPoints(String systemId) async {
    _presentation.requireScope(HostScopes.dashboardView);
    return _adapter.points;
  }

  @override
  Future<List<HistorySample>> getPointHistory(String systemId, String pointId) async {
    _presentation.requireScope(HostScopes.dashboardView);
    return _adapter.history(pointId);
  }

  @override
  Future<DashboardLayout> getLayout(String systemId) => _presentation.getLayout(FakeHost.demoSystemId);

  @override
  Future<void> putLayout(String systemId, DashboardLayout layout) =>
      _presentation.putLayout(FakeHost.demoSystemId, layout);

  @override
  Future<DashboardAppearance> getAppearance(String systemId) =>
      _presentation.getAppearance(FakeHost.demoSystemId);

  @override
  Future<void> putAppearance(String systemId, DashboardAppearance appearance) =>
      _presentation.putAppearance(FakeHost.demoSystemId, appearance);

  @override
  Future<void> applyPack(String systemId, String packId) =>
      _presentation.applyPack(FakeHost.demoSystemId, packId);

  @override
  Future<ViewPreset> getView(String systemId) => _presentation.getView(FakeHost.demoSystemId);

  @override
  Future<void> putView(String systemId, ViewPreset view) =>
      _presentation.putView(FakeHost.demoSystemId, view);

  @override
  Future<List<Scene>> listScenes(String systemId) => _presentation.listScenes(FakeHost.demoSystemId);

  @override
  Future<Scene> getScene(String systemId, String sceneId) =>
      _presentation.getScene(FakeHost.demoSystemId, sceneId);

  @override
  Future<void> putScene(String systemId, Scene scene) =>
      _presentation.putScene(FakeHost.demoSystemId, scene);

  @override
  Future<List<VisualPackSummary>> listVisualPacks() => _presentation.listVisualPacks();

  @override
  Future<void> installLocalPack(VisualPack pack) => _presentation.installLocalPack(pack);

  @override
  Future<void> installStorePack(String packId) => _presentation.installStorePack(packId);

  @override
  Future<List<CardStyle>> listCardStyles() => _presentation.listCardStyles();

  @override
  Future<void> installCardStyle(String styleId) => _presentation.installCardStyle(styleId);

  @override
  Future<void> putCardStyle(CardStyle style) => _presentation.putCardStyle(style);

  @override
  Future<SystemCapabilities> getCapabilities(String systemId) =>
      _presentation.getCapabilities(FakeHost.demoSystemId);

  @override
  Future<void> sendCommand(String systemId, String pointId, Object value) async {
    _presentation.requireScope(HostScopes.dashboardCommand);
    final command = _adapter.applyCommand(pointId, value);
    if (command == null) return;
    await _transport.sendModuleCommand(key: command.key, commandId: command.commandId);
  }

  @override
  Stream<HostEvent> watch(String systemId) {
    _presentation.requireScope(HostScopes.dashboardView);
    return _events.stream;
  }
}
