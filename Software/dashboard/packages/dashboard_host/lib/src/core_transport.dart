import 'protocol_record.dart';

/// Byte pipe to a Core. MQTT/CBOR live here later — not in Flutter.
abstract class CoreTransport {
  String get address;
  Stream<ProtocolRecord> get records;
  Future<void> sendModuleCommand({required int key, required int commandId});
  Future<void> start();
  void dispose();
}
