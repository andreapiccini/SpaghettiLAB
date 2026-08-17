import 'dart:async';

import 'package:dashboard_host/dashboard_host.dart';
import 'package:test/test.dart';

void main() {
  test('loopback MQTT publishes MODULE_COMMAND and record events', () async {
    final broker = LoopbackMqttBroker();
    addTearDown(broker.dispose);
    final topics = ProtocolV1Topics.demo;
    final commands = <RequestEnvelope>[];
    final commandSub = broker.subscribe(topics.requests).listen((packet) {
      commands.add(decodeRequest(packet.payload));
    });
    addTearDown(commandSub.cancel);

    final sim = SimulatedCore(broker: broker, topics: topics, tick: const Duration(days: 1));
    final transport = MqttCoreTransport(broker: broker, topics: topics, simulated: sim);
    addTearDown(transport.dispose);

    final records = <ProtocolRecord>[];
    final recordSub = transport.records.listen(records.add);
    addTearDown(recordSub.cancel);

    await transport.start();
    await Future<void>.delayed(Duration.zero);
    expect(records.where((r) => r.schemaId == 'env.temperature'), isNotEmpty);
    expect(records.first.fields, isNotEmpty);

    await transport.sendModuleCommand(key: 2, commandId: 1);
    await Future<void>.delayed(Duration.zero);
    expect(commands, isNotEmpty);
    expect(commands.single.operation, operationModuleCommand);
    final command = decodeModuleCommandPayload(commands.single.payload);
    expect(command.key, 2);
    expect(command.commandId, 1);
    expect(records.where((r) => r.sourceKey == 2 && r.fields[1] == true), isNotEmpty);
  });

  test('edge host default address is MQTT loopback', () async {
    final host = EdgeHost();
    addTearDown(host.dispose);
    final system = (await host.listSystems()).single;
    expect(system.hostAddress, 'mqtt://loopback/v1/cores/demo');
    host.start();
    await host.sendCommand(EdgeHost.liveSystemId, 'giardino.pompa', true);
    expect(
      (await host.getPoints(EdgeHost.liveSystemId)).firstWhere((p) => p.pointId == 'giardino.pompa').visualState,
      'running',
    );
  });
}
