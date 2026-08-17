import 'dart:typed_data';

class MqttPacket {
  const MqttPacket({required this.topic, required this.payload});
  final String topic;
  final Uint8List payload;
}

/// Byte broker. Loopback, TCP mosquitto, or browser WebSocket.
abstract class MqttBroker {
  Future<void> connect();
  Future<void> publish(String topic, Uint8List payload);
  Stream<MqttPacket> subscribe(String filter);
  void dispose();
}

bool mqttTopicMatches(String filter, String topic) {
  final f = filter.split('/');
  final t = topic.split('/');
  for (var i = 0; i < f.length; i++) {
    if (f[i] == '#') return true;
    if (i >= t.length) return false;
    if (f[i] == '+') continue;
    if (f[i] != t[i]) return false;
  }
  return f.length == t.length;
}
