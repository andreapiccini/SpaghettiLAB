import 'package:dashboard_host/dashboard_host.dart';
import 'package:test/test.dart';

void main() {
  test('manifest JSON roundtrip maps protocol record onto exposure point', () {
    final parsed = ExposureManifest.parse({
      'manifestId': 't',
      'bindings': [
        {
          'pointId': 'salotto.temperatura',
          'label': 'Temperatura salotto',
          'sourceKey': 1,
          'schemaId': 'env.temperature',
          'fieldId': 1,
          'valueType': 'number',
          'visualHint': 'gauge',
          'unit': '°C',
          'initialValue': 21.4,
        },
      ],
    });
    expect(parsed.bindings.single.sourceKey, 1);
    final adapter = ProtocolV1Adapter(parsed);
    adapter.apply(
      const ProtocolRecord(
        sourceKey: 1,
        sequence: 2,
        schemaId: 'env.temperature',
        fields: {1: 22.8},
      ),
    );
    expect(adapter.points.single.value, 22.8);
    expect(adapter.history('salotto.temperatura'), isNotEmpty);
    adapter.dispose();
  });

  test('demo adapter maps pump command to MODULE_COMMAND and visualState', () {
    final adapter = ProtocolV1Adapter(demoExposureManifest());
    addTearDown(adapter.dispose);
    final command = adapter.applyCommand('giardino.pompa', true);
    expect(command, isNotNull);
    expect(command!.key, 2);
    expect(command.commandId, 1);
    final pump = adapter.points.firstWhere((p) => p.pointId == 'giardino.pompa');
    expect(pump.value, true);
    expect(pump.visualState, 'running');
    adapter.apply(
      const ProtocolRecord(
        sourceKey: 1,
        sequence: 9,
        schemaId: 'env.temperature',
        fields: {1: 19.2},
      ),
    );
    expect(adapter.points.firstWhere((p) => p.pointId == 'salotto.temperatura').value, 19.2);
  });

  test('unknown schema is ignored', () {
    final adapter = ProtocolV1Adapter(demoExposureManifest());
    addTearDown(adapter.dispose);
    final before = adapter.points.first.value;
    adapter.apply(
      const ProtocolRecord(sourceKey: 99, sequence: 1, schemaId: 'nope', fields: {1: 1}),
    );
    expect(adapter.points.first.value, before);
  });
}
