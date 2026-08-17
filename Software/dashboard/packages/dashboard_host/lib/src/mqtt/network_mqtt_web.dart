import 'dart:async';
import 'dart:typed_data';

import 'package:mqtt_client/mqtt_browser_client.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:typed_data/typed_buffers.dart';

import 'broker.dart';
import 'mqtt_endpoint.dart';
import 'network_mqtt_hub.dart';

MqttBroker createNetworkMqttBroker(MqttEndpoint endpoint) =>
    NetworkMqttBroker(endpoint.asBrowser);

class NetworkMqttBroker implements MqttBroker {
  NetworkMqttBroker(this.endpoint);

  final MqttEndpoint endpoint;
  final _hub = NetworkMqttHub();
  MqttBrowserClient? _client;
  StreamSubscription<List<MqttReceivedMessage<MqttMessage>>>? _updates;

  @override
  Future<void> connect() async {
    final client = MqttBrowserClient.withPort(
      endpoint.clientServer,
      endpoint.clientId,
      endpoint.port,
      maxConnectionAttempts: 1,
    );
    client.logging(on: false);
    client.keepAlivePeriod = 20;
    client.connectTimeoutPeriod = 2500;
    client.autoReconnect = false;
    client.setProtocolV311();
    client.websocketProtocols = MqttClientConstants.protocolsSingleDefault;
    _client = client;
    try {
      await client.connect();
    } catch (error) {
      client.disconnect();
      throw StateError('MQTT offline: $error');
    }
    if (client.connectionStatus?.state != MqttConnectionState.connected) {
      client.disconnect();
      throw StateError('MQTT offline');
    }
    _updates = client.updates?.listen(_onUpdates);
  }

  void _onUpdates(List<MqttReceivedMessage<MqttMessage>> messages) {
    for (final message in messages) {
      final payload = message.payload;
      if (payload is! MqttPublishMessage) continue;
      _hub.dispatch(message.topic, Uint8List.fromList(payload.payload.message));
    }
  }

  @override
  Future<void> publish(String topic, Uint8List payload) async {
    final client = _client;
    if (client == null || client.connectionStatus?.state != MqttConnectionState.connected) {
      return;
    }
    final buffer = Uint8Buffer()..addAll(payload);
    final qos = topic.contains('/requests/') ? MqttQos.atLeastOnce : MqttQos.atMostOnce;
    client.publishMessage(topic, qos, buffer);
  }

  @override
  Stream<MqttPacket> subscribe(String filter) {
    final stream = _hub.listen(filter);
    final client = _client;
    if (client != null && client.connectionStatus?.state == MqttConnectionState.connected) {
      client.subscribe(filter, MqttQos.atMostOnce);
    }
    return stream;
  }

  @override
  void dispose() {
    unawaited(_updates?.cancel());
    _hub.close();
    _client?.disconnect();
    _client = null;
  }
}
