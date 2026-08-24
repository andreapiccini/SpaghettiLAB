import 'dart:typed_data';

import 'broker.dart';
import 'mqtt_endpoint.dart';

MqttBroker createNetworkMqttBroker(MqttEndpoint endpoint) =>
    _UnsupportedNetworkMqttBroker(endpoint);

class _UnsupportedNetworkMqttBroker implements MqttBroker {
  _UnsupportedNetworkMqttBroker(this.endpoint);
  final MqttEndpoint endpoint;

  @override
  Future<void> connect() async {
    throw StateError('MQTT di rete non disponibile (${endpoint.address})');
  }

  @override
  Future<void> publish(String topic, Uint8List payload) async {}

  @override
  Stream<MqttPacket> subscribe(String filter) => const Stream.empty();

  @override
  void dispose() {}
}
