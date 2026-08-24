import 'dart:typed_data';

import '../protocol_record.dart';
import 'cbor.dart';
import 'envelope.dart';

class RecordEventPayload {
  const RecordEventPayload({
    required this.sourceKey,
    required this.sequence,
    required this.schemaId,
    this.schemaVersion = 1,
    this.fields = const {},
  });

  final int sourceKey;
  final int sequence;
  final String schemaId;
  final int schemaVersion;

  /// Host-side additive map (CBOR key 4). Firmware V1 RECORD has only keys 0–3.
  final Map<int, Object?> fields;
}

Uint8List encodeRecordEventPayload(RecordEventPayload payload) {
  final pairs = <(int, Uint8List)>[
    (0, encodeUint(payload.sourceKey)),
    (1, encodeUint(payload.sequence)),
    (2, encodeText(payload.schemaId)),
    (3, encodeUint(payload.schemaVersion)),
  ];
  if (payload.fields.isNotEmpty) {
    pairs.add((
      4,
      encodeMap([
        for (final e in payload.fields.entries) (e.key, encodeDart(e.value)),
      ]),
    ));
  }
  return encodeMap(pairs);
}

RecordEventPayload decodeRecordEventPayload(Uint8List bytes) {
  final value = decodeOne(bytes);
  if (value is! CborMap) throw ProtocolCodecError('record payload must be a CBOR map');
  final map = value.value;
  final fields = <int, Object?>{};
  final extra = map[4];
  if (extra is CborMap) {
    for (final e in extra.value.entries) {
      fields[e.key] = cborToDart(e.value);
    }
  }
  return RecordEventPayload(
    sourceKey: requireUint(map, 0, 'RecordEventPayload'),
    sequence: requireUint(map, 1, 'RecordEventPayload'),
    schemaId: requireText(map, 2, 'RecordEventPayload'),
    schemaVersion: requireUint(map, 3, 'RecordEventPayload'),
    fields: fields,
  );
}

Uint8List encodeModuleCommandPayload({required int key, required int commandId}) {
  return encodeMap([
    (0, encodeUint(key)),
    (1, encodeUint(commandId)),
  ]);
}

ModuleCommand decodeModuleCommandPayload(Uint8List bytes) {
  final value = decodeOne(bytes);
  if (value is! CborMap) throw ProtocolCodecError('module command payload must be a CBOR map');
  return ModuleCommand(
    key: requireUint(value.value, 0, 'ModuleCommand'),
    commandId: requireUint(value.value, 1, 'ModuleCommand'),
  );
}

ProtocolRecord recordFromEvent(EventEnvelope event, {DateTime? at}) {
  if (event.type != eventRecord) {
    throw ProtocolCodecError('not a RECORD event');
  }
  final payload = decodeRecordEventPayload(event.payload);
  return ProtocolRecord(
    sourceKey: payload.sourceKey,
    sequence: payload.sequence,
    schemaId: payload.schemaId,
    schemaVersion: payload.schemaVersion,
    fields: payload.fields,
    at: at,
  );
}
