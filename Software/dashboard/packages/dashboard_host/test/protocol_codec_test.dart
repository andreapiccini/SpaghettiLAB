import 'dart:typed_data';

import 'package:dashboard_host/dashboard_host.dart';
import 'package:test/test.dart';

Uint8List _hex(String hex) {
  final out = Uint8List(hex.length ~/ 2);
  for (var i = 0; i < out.length; i++) {
    out[i] = int.parse(hex.substring(i * 2, i * 2 + 2), radix: 16);
  }
  return out;
}

String _toHex(Uint8List bytes) =>
    [for (final b in bytes) b.toRadixString(16).padLeft(2, '0')].join();

void main() {
  test('GET_STATUS request matches firmware golden vector', () {
    final bytes = encodeRequest(
      RequestEnvelope(
        correlationId: 1,
        operation: operationGetStatus,
        payload: Uint8List(0),
      ),
    );
    expect(_toHex(bytes), 'bf0001010102020340ff');
    final decoded = decodeRequest(_hex('bf0001010102020340ff'));
    expect(decoded.correlationId, 1);
    expect(decoded.operation, operationGetStatus);
    expect(decoded.payload, isEmpty);
  });

  test('RECORD payload matches firmware golden vector', () {
    final bytes = encodeRecordEventPayload(
      const RecordEventPayload(
        sourceKey: 10,
        sequence: 3,
        schemaId: 'spaghetti.ina219.sample',
        schemaVersion: 1,
      ),
    );
    expect(_toHex(bytes), 'bf000a010302777370616768657474692e696e613231392e73616d706c650301ff');
    final decoded = decodeRecordEventPayload(
      _hex('bf000a010302777370616768657474692e696e613231392e73616d706c650301ff'),
    );
    expect(decoded.sourceKey, 10);
    expect(decoded.sequence, 3);
    expect(decoded.schemaId, 'spaghetti.ina219.sample');
    expect(decoded.fields, isEmpty);
  });

  test('RECORD event with host field map round-trips a pump value', () {
    final payload = encodeRecordEventPayload(
      const RecordEventPayload(
        sourceKey: 2,
        sequence: 4,
        schemaId: 'act.pump',
        fields: {1: true},
      ),
    );
    final event = encodeEvent(EventEnvelope(sequence: 4, type: eventRecord, payload: payload));
    final record = recordFromEvent(decodeEvent(event));
    expect(record.sourceKey, 2);
    expect(record.fields[1], true);
  });

  test('MODULE_COMMAND payload round-trips', () {
    final bytes = encodeModuleCommandPayload(key: 2, commandId: 1);
    final command = decodeModuleCommandPayload(bytes);
    expect(command.key, 2);
    expect(command.commandId, 1);
  });
}
