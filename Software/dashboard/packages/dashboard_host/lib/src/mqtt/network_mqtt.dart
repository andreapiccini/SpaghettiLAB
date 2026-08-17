import 'broker.dart';
import 'mqtt_endpoint.dart';
import 'network_mqtt_stub.dart'
    if (dart.library.html) 'network_mqtt_web.dart'
    if (dart.library.io) 'network_mqtt_io.dart' as impl;

MqttBroker networkMqttBroker(MqttEndpoint endpoint) => impl.createNetworkMqttBroker(endpoint);
