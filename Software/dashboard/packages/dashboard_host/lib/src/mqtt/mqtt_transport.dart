import 'dart:async';
import 'dart:math';

import '../core_transport.dart';
import '../demo_manifest.dart';
import '../exposure_manifest.dart';
import '../protocol/cbor.dart';
import '../protocol/envelope.dart';
import '../protocol/record_codec.dart';
import '../protocol_record.dart';
import 'broker.dart';
import 'loopback_broker.dart';
import 'mqtt_endpoint.dart';
import 'network_mqtt.dart';
import 'simulated_core.dart';
import 'topics.dart';

/// Protocol V1 MQTT transport. Flutter never sees this class.
class MqttCoreTransport implements CoreTransport {
  MqttCoreTransport({
    required MqttBroker broker,
    ProtocolV1Topics? topics,
    SimulatedCore? simulated,
    this.address = 'mqtt://loopback/v1/cores/demo',
  })  : _broker = broker,
        _topics = topics ?? ProtocolV1Topics.demo,
        _simulated = simulated;

  factory MqttCoreTransport.loopback({
    ExposureManifest? manifest,
    Random? random,
    Duration tick = const Duration(seconds: 3),
  }) {
    final broker = LoopbackMqttBroker();
    final topics = ProtocolV1Topics.demo;
    final exposure = manifest ?? demoExposureManifest();
    return MqttCoreTransport(
      broker: broker,
      topics: topics,
      simulated: SimulatedCore(
        broker: broker,
        topics: topics,
        manifest: exposure,
        random: random,
        tick: tick,
      ),
    );
  }

  factory MqttCoreTransport.network(
    MqttEndpoint endpoint, {
    MqttBroker? broker,
  }) {
    return MqttCoreTransport(
      broker: broker ?? networkMqttBroker(endpoint),
      topics: ProtocolV1Topics(coreBase: endpoint.coreBase, clientId: endpoint.clientId),
      address: endpoint.address,
    );
  }

  @override
  final String address;

  final MqttBroker _broker;
  final ProtocolV1Topics _topics;
  final SimulatedCore? _simulated;
  final _records = StreamController<ProtocolRecord>.broadcast();
  StreamSubscription<MqttPacket>? _sub;
  var _correlation = 0;

  @override
  Stream<ProtocolRecord> get records => _records.stream;

  @override
  Future<void> start() async {
    await _broker.connect();
    _sub ??= _broker.subscribe(_topics.recordsFilter).listen(_onPacket);
    await _simulated?.start();
  }

  @override
  Future<void> sendModuleCommand({required int key, required int commandId}) async {
    _correlation += 1;
    final payload = encodeModuleCommandPayload(key: key, commandId: commandId);
    await _broker.publish(
      _topics.requests,
      encodeRequest(
        RequestEnvelope(
          correlationId: _correlation,
          operation: operationModuleCommand,
          payload: payload,
        ),
      ),
    );
  }

  @override
  void dispose() {
    unawaited(_sub?.cancel());
    _simulated?.dispose();
    _broker.dispose();
    unawaited(_records.close());
  }

  void _onPacket(MqttPacket packet) {
    try {
      final event = decodeEvent(packet.payload);
      if (event.type != eventRecord) return;
      if (_records.isClosed) return;
      _records.add(recordFromEvent(event, at: DateTime.now().toUtc()));
    } on ProtocolCodecError {
      return;
    }
  }
}
