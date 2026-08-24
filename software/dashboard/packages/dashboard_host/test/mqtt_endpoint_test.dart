import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:dashboard_host/dashboard_host.dart';
import 'package:test/test.dart';

void main() {
  test('parses mqtt and websocket core URIs', () {
    final tcp = MqttEndpoint.parse('mqtt://127.0.0.1:1883/v1/cores/deadbeef');
    expect(tcp.host, '127.0.0.1');
    expect(tcp.port, 1883);
    expect(tcp.coreBase, 'v1/cores/deadbeef');
    expect(tcp.coreId, 'deadbeef');
    expect(tcp.useWebSocket, isFalse);
    expect(tcp.clientId, 'dash-deadbeef');
    expect(tcp.address, 'mqtt://127.0.0.1:1883/v1/cores/deadbeef');

    final prefixed = MqttEndpoint.parse('mqtt://broker/spaghetti/dev/v1/cores/abc');
    expect(prefixed.port, 1883);
    expect(prefixed.coreBase, 'spaghetti/dev/v1/cores/abc');

    final ws = MqttEndpoint.parse('ws://127.0.0.1:9001/v1/cores/demo');
    expect(ws.useWebSocket, isTrue);
    expect(ws.port, 9001);
    expect(ws.asBrowser.address, ws.address);

    final rewritten = MqttEndpoint.parse('mqtt://127.0.0.1/v1/cores/demo').asBrowser;
    expect(rewritten.scheme, 'ws');
    expect(rewritten.port, 9001);
    expect(rewritten.useWebSocket, isTrue);
  });

  test('looksLike only mqtt family schemes', () {
    expect(MqttEndpoint.looksLike('mqtt://127.0.0.1/v1/cores/a'), isTrue);
    expect(MqttEndpoint.looksLike('ws://127.0.0.1:9001/v1/cores/a'), isTrue);
    expect(MqttEndpoint.looksLike('https://host.local'), isFalse);
    expect(MqttEndpoint.looksLike(''), isFalse);
  });

  test('rejects mqtt URI without core path', () {
    expect(() => MqttEndpoint.parse('mqtt://127.0.0.1:1883/'), throwsFormatException);
    expect(() => MqttEndpoint.parse('mqtt://127.0.0.1/v1/cores/'), throwsFormatException);
  });

  test('composite host adds an MQTT system without a live broker', () async {
    final broker = LoopbackMqttBroker();
    addTearDown(broker.dispose);
    final host = CompositeHost(
      demo: FakeHost(),
      live: EdgeHost(),
      networkBroker: (_) => broker,
    );
    addTearDown(host.dispose);

    final created = await host.createSystem(
      name: 'Serra nord',
      address: 'mqtt://127.0.0.1:1883/v1/cores/aabbcc',
    );
    expect(created.systemId, 'core-aabbcc');
    expect(created.name, 'Serra nord');
    expect(created.hostAddress, 'mqtt://127.0.0.1:1883/v1/cores/aabbcc');
    expect(
      [for (final s in await host.listSystems()) s.systemId],
      containsAll([FakeHost.demoSystemId, EdgeHost.liveSystemId, 'core-aabbcc']),
    );

    var listed = await host.getSystem(created.systemId);
    if (listed.connectionState != ConnectionStatus.connected) {
      await host
          .watch(created.systemId)
          .firstWhere((e) => e is SystemStatusUpdated && e.online)
          .timeout(const Duration(seconds: 2));
      listed = await host.getSystem(created.systemId);
    }
    expect(listed.connectionState, ConnectionStatus.connected);
  });
}
