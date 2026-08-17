import 'dart:async';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:http/http.dart' as http;

import 'cloud_endpoint.dart';
import 'host_api.dart';
import 'host_api_transport.dart';
import 'http_host_api.dart';
import 'memory_host_api.dart';

/// [HostPort] over HOST_API JSON (HTTP or in-process). Flutter screens stay on HostPort.
class CloudHost implements HostPort {
  CloudHost({
    required this.systemId,
    required this.displayName,
    required this.endpoint,
    required HostApiTransport transport,
    String? remoteSystemId,
    ConnectionStatus initialStatus = ConnectionStatus.connecting,
  })  : _transport = transport,
        _remoteSystemId = remoteSystemId ?? endpoint.remoteSystemId,
        _status = initialStatus {
    if (endpoint.loopback) {
      _watchSub = _transport.watch(_rid).listen(_onWire, onError: (_) {});
    }
  }

  factory CloudHost.loopback({
    String systemId = loopbackSystemId,
    String displayName = 'Cloud demo',
    FakeHost? inner,
  }) {
    final fake = inner ?? FakeHost();
    return CloudHost(
      systemId: systemId,
      displayName: displayName,
      endpoint: CloudEndpoint.loopbackEndpoint,
      transport: MemoryHostApiTransport(fake),
      remoteSystemId: FakeHost.demoSystemId,
      initialStatus: ConnectionStatus.connecting,
    );
  }

  factory CloudHost.http(
    CloudEndpoint endpoint, {
    required String systemId,
    required String displayName,
    http.Client? client,
  }) {
    return CloudHost(
      systemId: systemId,
      displayName: displayName,
      endpoint: endpoint,
      transport: HttpHostApiTransport(endpoint, client: client),
      remoteSystemId: endpoint.remoteSystemId,
    );
  }

  static const loopbackSystemId = 'cloud-loopback';

  final String systemId;
  final String displayName;
  final CloudEndpoint endpoint;
  final HostApiTransport _transport;
  String? _remoteSystemId;
  ConnectionStatus _status;
  var _disposed = false;
  StreamSubscription<Map<String, Object?>>? _watchSub;
  final _events = StreamController<HostEvent>.broadcast();
  AuthSession? _session;

  String get _rid => _remoteSystemId ?? FakeHost.demoSystemId;

  HostException _wrap(HostApiException error) => HostException(error.code, error.message);

  void _storeSession(AuthSession session) {
    _session = session;
    _transport.authToken = session.token;
  }

  @override
  Future<AuthSession> login({required String email, required String password}) async {
    try {
      final session = AuthSession.parse(
        asJsonMap(await _transport.post(HostApiPaths.login, {'email': email, 'password': password})),
      );
      _storeSession(session);
      return session;
    } on HostApiException catch (error) {
      throw _wrap(error);
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _transport.post(HostApiPaths.logout);
    } on HostApiException catch (error) {
      throw _wrap(error);
    } finally {
      _session = null;
      _transport.authToken = null;
    }
  }

  @override
  Future<AuthSession?> currentSession() async {
    if (_session != null && !_session!.isExpired) return _session;
    try {
      final session = AuthSession.parse(asJsonMap(await _transport.get(HostApiPaths.me)));
      _storeSession(session);
      return session;
    } on HostApiException catch (error) {
      if (error.code == 'unauthorized') {
        _session = null;
        _transport.authToken = null;
        return null;
      }
      throw _wrap(error);
    }
  }

  @override
  Future<AuthSession> selectSite(String siteId) async {
    try {
      final session = AuthSession.parse(
        asJsonMap(await _transport.post(HostApiPaths.selectSite, {'siteId': siteId})),
      );
      _storeSession(session);
      return session;
    } on HostApiException catch (error) {
      throw _wrap(error);
    }
  }

  void start() {
    unawaited(_connect());
  }

  Future<void> _connect() async {
    try {
      await _transport.connect();
      if (_remoteSystemId == null) {
        final systems = asJsonObjectList(await _transport.get(HostApiPaths.systems));
        if (systems.isNotEmpty) {
          _remoteSystemId = systems.first['systemId'] as String?;
        }
      }
      _watchSub ??= _transport.watch(_rid).listen(_onWire, onError: (_) {});
      if (_disposed) return;
      _setStatus(ConnectionStatus.connected);
    } catch (_) {
      if (_disposed) return;
      _setStatus(ConnectionStatus.disconnected);
    }
  }

  void _onWire(Map<String, Object?> json) {
    try {
      final event = parseHostEvent(json);
      if (_events.isClosed) return;
      if (event is SystemStatusUpdated) {
        _events.add(SystemStatusUpdated(systemId: systemId, online: event.online));
        return;
      }
      _events.add(event);
    } on FormatException {
      return;
    }
  }

  void _setStatus(ConnectionStatus status) {
    if (_status == status) return;
    _status = status;
    _events.add(SystemStatusUpdated(systemId: systemId, online: status == ConnectionStatus.connected));
  }

  void dispose() {
    _disposed = true;
    unawaited(_watchSub?.cancel());
    _transport.dispose();
    unawaited(_events.close());
  }

  @override
  Future<List<LabSystem>> listSystems() async => [
        LabSystem(
          systemId: systemId,
          name: displayName,
          connectionState: _status,
          hostAddress: endpoint.address,
          lastSeen: DateTime.now().toUtc(),
        ),
      ];

  @override
  Future<LabSystem> getSystem(String systemId) async =>
      (await listSystems()).firstWhere((s) => s.systemId == systemId);

  @override
  Future<LabSystem> createSystem({required String name, String address = ''}) async {
    final raw = await _transport.post(HostApiPaths.systems, {'name': name, 'address': address});
    return LabSystem.parse(asJsonMap(raw));
  }

  @override
  Future<List<ExposurePoint>> getPoints(String systemId) async {
    final raw = await _transport.get(HostApiPaths.points(_rid));
    return [for (final p in asJsonObjectList(raw)) ExposurePoint.parse(p)];
  }

  @override
  Future<List<HistorySample>> getPointHistory(String systemId, String pointId) async {
    final raw = asJsonMap(await _transport.get(HostApiPaths.history(_rid, pointId)));
    final samples = raw['samples'];
    if (samples is! List) return const [];
    return [
      for (final s in samples)
        if (s is Map) HistorySample.parse(Map<String, Object?>.from(s)),
    ];
  }

  @override
  Future<DashboardLayout> getLayout(String systemId) async =>
      DashboardLayout.parse(asJsonMap(await _transport.get(HostApiPaths.layout(_rid))));

  @override
  Future<void> putLayout(String systemId, DashboardLayout layout) async {
    await _transport.put(HostApiPaths.layout(_rid), layout.toJson());
  }

  @override
  Future<DashboardAppearance> getAppearance(String systemId) async =>
      DashboardAppearance.parse(asJsonMap(await _transport.get(HostApiPaths.appearance(_rid))));

  @override
  Future<void> putAppearance(String systemId, DashboardAppearance appearance) async {
    await _transport.put(HostApiPaths.appearance(_rid), appearance.toJson());
  }

  @override
  Future<void> applyPack(String systemId, String packId) async {
    await _transport.post(HostApiPaths.applyPack(_rid), {'packId': packId});
  }

  @override
  Future<ViewPreset> getView(String systemId) async =>
      ViewPreset.parse(asJsonMap(await _transport.get(HostApiPaths.view(_rid))));

  @override
  Future<void> putView(String systemId, ViewPreset view) async {
    await _transport.put(HostApiPaths.view(_rid), view.toJson());
  }

  @override
  Future<List<Scene>> listScenes(String systemId) async {
    return [for (final s in asJsonObjectList(await _transport.get(HostApiPaths.scenes(_rid)))) Scene.parse(s)];
  }

  @override
  Future<Scene> getScene(String systemId, String sceneId) async =>
      Scene.parse(asJsonMap(await _transport.get(HostApiPaths.scene(_rid, sceneId))));

  @override
  Future<void> putScene(String systemId, Scene scene) async {
    await _transport.put(HostApiPaths.scene(_rid, scene.sceneId), scene.toJson());
  }

  @override
  Future<List<VisualPackSummary>> listVisualPacks() async {
    return [
      for (final p in asJsonObjectList(await _transport.get(HostApiPaths.visualPacks))) VisualPackSummary.parse(p),
    ];
  }

  @override
  Future<void> installLocalPack(VisualPack pack) async {
    await _transport.post(HostApiPaths.installLocalPack, pack.toJson());
  }

  @override
  Future<void> installStorePack(String packId) async {
    await _transport.post(HostApiPaths.installStorePack(packId));
  }

  @override
  Future<List<CardStyle>> listCardStyles() async {
    return [for (final s in asJsonObjectList(await _transport.get(HostApiPaths.cardStyles))) CardStyle.parse(s)];
  }

  @override
  Future<void> installCardStyle(String styleId) async {
    await _transport.post(HostApiPaths.installCardStyle(styleId));
  }

  @override
  Future<void> putCardStyle(CardStyle style) async {
    await _transport.post(HostApiPaths.cardStyles, style.toJson());
  }

  @override
  Future<SystemCapabilities> getCapabilities(String systemId) async =>
      SystemCapabilities.parse(asJsonMap(await _transport.get(HostApiPaths.capabilities(_rid))));

  @override
  Future<void> sendCommand(String systemId, String pointId, Object value) async {
    await _transport.post(HostApiPaths.command(_rid, pointId), {'value': value});
  }

  @override
  Stream<HostEvent> watch(String systemId) => _events.stream;
}
