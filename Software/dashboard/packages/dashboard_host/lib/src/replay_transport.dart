import 'dart:async';
import 'dart:math';

import 'core_transport.dart';
import 'demo_manifest.dart';
import 'exposure_manifest.dart';
import 'protocol_record.dart';

/// Deterministic Core stand-in: casa demo as Protocol-shaped records (D120).
class ReplayCoreTransport implements CoreTransport {
  ReplayCoreTransport({
    ExposureManifest? manifest,
    Random? random,
    this.tick = const Duration(seconds: 3),
  })  : _manifest = manifest ?? demoExposureManifest(),
        _random = random ?? Random(1);

  final ExposureManifest _manifest;
  final Random _random;
  final Duration tick;
  final _records = StreamController<ProtocolRecord>.broadcast();
  Timer? _timer;
  var _sequence = 0;

  @override
  String get address => 'replay://protocol-v1';

  @override
  Stream<ProtocolRecord> get records => _records.stream;

  @override
  Future<void> start() async {
    for (final b in _manifest.bindings) {
      _records.add(_next(b.sourceKey, b.schemaId, {b.fieldId: b.initialValue}));
    }
    _timer ??= Timer.periodic(tick, (_) {
      if (_records.isClosed) return;
      final b = _manifest.binding('salotto.temperatura');
      if (b == null) return;
      final next = double.parse((20 + _random.nextDouble() * 4).toStringAsFixed(1));
      _records.add(_next(b.sourceKey, b.schemaId, {b.fieldId: next}));
    });
  }

  @override
  Future<void> sendModuleCommand({required int key, required int commandId}) async {}

  @override
  void dispose() {
    _timer?.cancel();
    _records.close();
  }

  ProtocolRecord _next(int sourceKey, String schemaId, Map<int, Object?> fields) {
    _sequence += 1;
    return ProtocolRecord(
      sourceKey: sourceKey,
      sequence: _sequence,
      schemaId: schemaId,
      fields: fields,
      at: DateTime.now().toUtc(),
    );
  }
}
