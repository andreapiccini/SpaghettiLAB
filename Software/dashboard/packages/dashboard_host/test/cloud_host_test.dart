import 'dart:convert';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:dashboard_host/dashboard_host.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';

void main() {
  test('parses cloud HTTP and loopback URIs', () {
    final loopback = CloudEndpoint.parse('cloud://loopback');
    expect(loopback.loopback, isTrue);
    expect(loopback.address, CloudEndpoint.loopbackUri);

    final host = CloudEndpoint.parse('https://api.example.com/v1');
    expect(host.origin.host, 'api.example.com');
    expect(host.remoteSystemId, isNull);
    expect(host.address, 'https://api.example.com/v1');
    expect(host.resolve('/v1/systems').toString(), 'https://api.example.com/v1/systems');

    final site = CloudEndpoint.parse('http://127.0.0.1:8787/v1/systems/nord');
    expect(site.remoteSystemId, 'nord');
    expect(site.resolve(HostApiPaths.points('nord')).toString(), 'http://127.0.0.1:8787/v1/systems/nord/points');
  });

  test('cloud loopback speaks HOST_API JSON for points and commands', () async {
    final host = CloudHost.loopback();
    addTearDown(host.dispose);
    final online = host
        .watch(CloudHost.loopbackSystemId)
        .firstWhere((e) => e is SystemStatusUpdated && e.online);
    host.start();
    await online.timeout(const Duration(seconds: 2));
    final listed = (await host.listSystems()).single;
    expect(listed.hostAddress, CloudEndpoint.loopbackUri);
    final points = await host.getPoints(CloudHost.loopbackSystemId);
    expect(points.any((p) => p.pointId == 'salotto.temperatura'), isTrue);
    await host.sendCommand(CloudHost.loopbackSystemId, 'giardino.pompa', true);
    expect(
      (await host.getPoints(CloudHost.loopbackSystemId))
          .firstWhere((p) => p.pointId == 'giardino.pompa')
          .visualState,
      'running',
    );
    await host.installStorePack('notte');
    expect((await host.listVisualPacks()).firstWhere((p) => p.packId == 'notte').installed, isTrue);
    expect(
      (await host.getPointHistory(CloudHost.loopbackSystemId, 'salotto.temperatura')).length,
      greaterThan(1),
    );
  });

  test('composite host adds cloud://loopback as a HOST_API system', () async {
    final host = CompositeHost(demo: FakeHost(), live: EdgeHost());
    addTearDown(host.dispose);
    final created = await host.createSystem(name: 'Ufficio', address: 'cloud://loopback');
    expect(created.name, 'Ufficio');
    expect(created.hostAddress, CloudEndpoint.loopbackUri);
    expect(created.systemId, 'cloud-1');
    await host.sendCommand(created.systemId, 'ingresso.luce', false);
    expect(
      (await host.getPoints(created.systemId)).firstWhere((p) => p.pointId == 'ingresso.luce').value,
      false,
    );
  });

  test('HTTP CloudHost maps GET /v1/systems and points', () async {
    final client = MockClient((request) async {
      if (request.method == 'GET' && request.url.path == '/v1/systems') {
        return http.Response(
          jsonEncode([
            {'systemId': 'nord', 'name': 'Serra nord', 'connectionState': 'connected'},
          ]),
          200,
        );
      }
      if (request.method == 'GET' && request.url.path == '/v1/systems/nord/points') {
        return http.Response(
          jsonEncode([
            {
              'pointId': 'salotto.temperatura',
              'label': 'Temperatura',
              'valueType': 'number',
              'visualHint': 'gauge',
              'value': 21.4,
            },
          ]),
          200,
        );
      }
      return http.Response('missing ${request.url.path}', 404);
    });
    final endpoint = CloudEndpoint.parse('https://host.example/v1');
    final host = CloudHost.http(endpoint, systemId: 'cloud-http', displayName: 'Remoto', client: client);
    addTearDown(host.dispose);
    final online = host.watch('cloud-http').firstWhere((e) => e is SystemStatusUpdated && e.online);
    host.start();
    await online.timeout(const Duration(seconds: 2));
    final points = await host.getPoints('cloud-http');
    expect(points.single.pointId, 'salotto.temperatura');
    expect(points.single.value, 21.4);
  });

  test('cloud loopback login and viewer cannot command', () async {
    final inner = FakeHost(requireLogin: true);
    final host = CloudHost.loopback(inner: inner);
    addTearDown(host.dispose);
    await expectLater(
      host.login(email: FakeHost.demoViewerEmail, password: 'nope'),
      throwsA(isA<HostException>()),
    );
    final session = await host.login(email: FakeHost.demoViewerEmail, password: 'viewer');
    expect(session.allows(HostScopes.dashboardCommand), isFalse);
    expect((await host.currentSession())?.user.email, FakeHost.demoViewerEmail);
    await expectLater(
      host.sendCommand(CloudHost.loopbackSystemId, 'giardino.pompa', true),
      throwsA(isA<HostApiException>()),
    );
    await host.logout();
    expect(await host.currentSession(), isNull);
  });
}
