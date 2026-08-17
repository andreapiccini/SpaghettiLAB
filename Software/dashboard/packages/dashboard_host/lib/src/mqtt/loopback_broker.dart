import 'dart:async';
import 'dart:typed_data';

import 'broker.dart';

class LoopbackMqttBroker implements MqttBroker {
  final _subs = <_Sub>[];
  var _open = true;

  @override
  Future<void> connect() async {}

  @override
  Future<void> publish(String topic, Uint8List payload) async {
    if (!_open) return;
    final packet = MqttPacket(topic: topic, payload: Uint8List.fromList(payload));
    for (final sub in List<_Sub>.from(_subs)) {
      if (mqttTopicMatches(sub.filter, topic) && !sub.controller.isClosed) {
        sub.controller.add(packet);
      }
    }
  }

  @override
  Stream<MqttPacket> subscribe(String filter) {
    final controller = StreamController<MqttPacket>.broadcast();
    final sub = _Sub(filter, controller);
    _subs.add(sub);
    controller.onCancel = () {
      _subs.remove(sub);
    };
    return controller.stream;
  }

  @override
  void dispose() {
    _open = false;
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
