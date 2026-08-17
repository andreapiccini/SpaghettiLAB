import 'dart:async';
import 'dart:typed_data';

import 'broker.dart';

/// Fan-out from one mqtt_client updates stream to per-filter Dart streams.
class NetworkMqttHub {
  final _subs = <_Sub>[];

  void dispatch(String topic, Uint8List payload) {
    final packet = MqttPacket(topic: topic, payload: Uint8List.fromList(payload));
    for (final sub in List<_Sub>.from(_subs)) {
      if (mqttTopicMatches(sub.filter, packet.topic) && !sub.controller.isClosed) {
        sub.controller.add(packet);
      }
    }
  }

  Stream<MqttPacket> listen(String filter) {
    final controller = StreamController<MqttPacket>.broadcast();
    final sub = _Sub(filter, controller);
    _subs.add(sub);
    controller.onCancel = () => _subs.remove(sub);
    return controller.stream;
  }

  void close() {
    for (final sub in List<_Sub>.from(_subs)) {
      unawaited(sub.controller.close());
    }
    _subs.clear();
  }
}

class _Sub {
  _Sub(this.filter, this.controller);
  final String filter;
  final StreamController<MqttPacket> controller;
}
