import 'dart:async';
import 'dart:math';
import 'dart:typed_data';

import '../demo_manifest.dart';
import '../exposure_manifest.dart';
import '../protocol/envelope.dart';
import '../protocol/record_codec.dart';
import 'broker.dart';
import 'topics.dart';

/// In-process Core that speaks Protocol V1 MQTT topics (D120 loopback).
class SimulatedCore {
  SimulatedCore({
    required MqttBroker broker,
    ProtocolV1Topics? topics,
    ExposureManifest? manifest,
    Random? random,
    this.tick = const Duration(seconds: 3),
  })  : _broker = broker,
        _topics = topics ?? ProtocolV1Topics.demo,
        _manifest = manifest ?? demoExposureManifest(),
        _random = random ?? Random(1);

  final MqttBroker _broker;
  final ProtocolV1Topics _topics;
  final ExposureManifest _manifest;
  final Random _random;
  final Duration tick;
  final _values = <String, Object?>{};
  StreamSubscription<MqttPacket>? _requests;
  Timer? _timer;
  var _sequence = 0;

  Future<void> start() async {
    for (final b in _manifest.bindings) {
      _values[b.pointId] = b.initialValue;
    }
    _requests = _broker.subscribe('${_topics.coreBase}/requests/+').listen(_onRequest);
    for (final b in _manifest.bindings) {
      await _publish(b, _values[b.pointId]);
    }
    _timer ??= Timer.periodic(tick, (_) {
      unawaited(_tickTemperature());
    });
  }

  void dispose() {
    _timer?.cancel();
    unawaited(_requests?.cancel());
  }

  Future<void> _onRequest(MqttPacket packet) async {
    final request = decodeRequest(packet.payload);
    if (request.operation != operationModuleCommand) return;
    final command = decodeModuleCommandPayload(request.payload);
    ExposureBinding? binding;
    for (final b in _manifest.bindings) {
      if (b.sourceKey == command.key && b.writable) {
        binding = b;
        break;
      }
    }
    if (binding == null) return;
    final on = command.commandId == binding.commandIdOn;
    _values[binding.pointId] = on;
    await _publish(binding, on);
    await _broker.publish(
      _topics.responses,
      encodeResponse(
        ResponseEnvelope(
          correlationId: request.correlationId,
          status: statusOk,
          payload: Uint8List.fromList([0xa0]),
        ),
      ),
    );
  }

  Future<void> _tickTemperature() async {
    final b = _manifest.binding('salotto.temperatura');
    if (b == null) return;
    final next = double.parse((20 + _random.nextDouble() * 4).toStringAsFixed(1));
    _values[b.pointId] = next;
    await _publish(b, next);
  }

  Future<void> _publish(ExposureBinding binding, Object? value) async {
    _sequence += 1;
    final payload = encodeRecordEventPayload(
      RecordEventPayload(
        sourceKey: binding.sourceKey,
        sequence: _sequence,
        schemaId: binding.schemaId,
        fields: {binding.fieldId: value},
      ),
    );
    await _broker.publish(
      _topics.records(binding.sourceKey),
      encodeEvent(EventEnvelope(sequence: _sequence, type: eventRecord, payload: payload)),
    );
  }
}
