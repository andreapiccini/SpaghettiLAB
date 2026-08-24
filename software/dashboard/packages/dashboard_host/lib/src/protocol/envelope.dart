import 'dart:typed_data';

import 'cbor.dart';

const protocolVersion = 1;
const payloadAbsoluteMax = 2048;

const operationGetStatus = 2;
const operationModuleCommand = 7;

const eventRecord = 1;
const eventStatus = 2;
const eventDiscovery = 3;
const eventConnectivity = 4;

const statusOk = 0;

class RequestEnvelope {
  const RequestEnvelope({required this.correlationId, required this.operation, required this.payload});
  final int correlationId;
  final int operation;
  final Uint8List payload;
}

class ResponseEnvelope {
  const ResponseEnvelope({required this.correlationId, required this.status, required this.payload});
  final int correlationId;
  final int status;
  final Uint8List payload;
}

class EventEnvelope {
  const EventEnvelope({required this.sequence, required this.type, required this.payload});
  final int sequence;
  final int type;
  final Uint8List payload;
}

Uint8List _encodeEnvelope(int field1, int field2, Uint8List payload) {
  if (payload.length > payloadAbsoluteMax) {
    throw ProtocolCodecError('payload of ${payload.length} bytes exceeds the $payloadAbsoluteMax-byte limit');
  }
  return encodeMap([
    (0, encodeUint(protocolVersion)),
    (1, encodeUint(field1)),
    (2, encodeUint(field2)),
    (3, encodeBytes(payload)),
  ]);
}

Uint8List encodeRequest(RequestEnvelope request) {
  if (request.correlationId == 0) throw ProtocolCodecError('correlationId must be nonzero');
  if (request.operation < 1 || request.operation > 31) {
    throw ProtocolCodecError('invalid operation ${request.operation}');
  }
  return _encodeEnvelope(request.correlationId, request.operation, request.payload);
}

Uint8List encodeResponse(ResponseEnvelope response) {
  if (response.correlationId == 0) throw ProtocolCodecError('correlationId must be nonzero');
  return _encodeEnvelope(response.correlationId, response.status, response.payload);
}

Uint8List encodeEvent(EventEnvelope event) {
  if (event.sequence == 0) throw ProtocolCodecError('sequence must be nonzero');
  if (event.type < 1 || event.type > 4) throw ProtocolCodecError('invalid event type ${event.type}');
  return _encodeEnvelope(event.sequence, event.type, event.payload);
}

({int field1, int field2, Uint8List payload}) _decodeEnvelope(Uint8List bytes) {
  final reader = CborReader(bytes);
  final value = reader.readValue();
  if (reader.remaining != 0) throw ProtocolCodecError('trailing bytes after envelope');
  if (value is! CborMap) throw ProtocolCodecError('envelope must be a CBOR map');
  final map = value.value;
  for (final key in map.keys) {
    if (key < 0 || key > 3) throw ProtocolCodecError('unexpected envelope key $key');
  }
  for (final required in [0, 1, 2, 3]) {
    if (!map.containsKey(required)) throw ProtocolCodecError('missing envelope key $required');
  }
  final version = map[0];
  if (version is! CborUint || version.value != protocolVersion) {
    throw ProtocolCodecError('unsupported envelope version');
  }
  final field1 = map[1];
  if (field1 is! CborUint) throw ProtocolCodecError('envelope field 1 must be a uint');
  if (field1.value == 0) throw ProtocolCodecError('envelope field 1 (correlation/sequence) must be nonzero');
  final field2 = map[2];
  if (field2 is! CborUint) throw ProtocolCodecError('envelope field 2 must be a uint');
  final payload = map[3];
  if (payload is! CborBytes) throw ProtocolCodecError('envelope field 3 (payload) must be a byte string');
  if (payload.value.length > payloadAbsoluteMax) {
    throw ProtocolCodecError('payload of ${payload.value.length} bytes exceeds the $payloadAbsoluteMax-byte limit');
  }
  return (field1: field1.value, field2: field2.value, payload: payload.value);
}

RequestEnvelope decodeRequest(Uint8List bytes) {
  final raw = _decodeEnvelope(bytes);
  return RequestEnvelope(correlationId: raw.field1, operation: raw.field2, payload: raw.payload);
}

ResponseEnvelope decodeResponse(Uint8List bytes) {
  final raw = _decodeEnvelope(bytes);
  return ResponseEnvelope(correlationId: raw.field1, status: raw.field2, payload: raw.payload);
}

EventEnvelope decodeEvent(Uint8List bytes) {
  final raw = _decodeEnvelope(bytes);
  if (raw.field2 < 1 || raw.field2 > 4) throw ProtocolCodecError('unsupported event type ${raw.field2}');
  return EventEnvelope(sequence: raw.field1, type: raw.field2, payload: raw.payload);
}
