import 'dart:async';
import 'dart:math';

import 'package:dashboard_domain/dashboard_domain.dart';

import 'exposure_manifest.dart';
import 'protocol_record.dart';

/// Maps decoded Protocol V1 records onto [ExposurePoint]. Flutter never sees this.
class ProtocolV1Adapter {
  ProtocolV1Adapter(this.manifest, {Random? random, DateTime Function()? clock})
      : _random = random ?? Random(1),
        _now = clock ?? DateTime.now {
    _points = [for (final b in manifest.bindings) b.toPoint(at: _now().toUtc())];
    _history = {
      for (final p in _points)
        if (p.value is num) p.pointId: _seedHistory((p.value as num).toDouble()),
    };
  }

  final ExposureManifest manifest;
  final Random _random;
  final DateTime Function() _now;
  final _events = StreamController<HostEvent>.broadcast();
  late List<ExposurePoint> _points;
  late Map<String, List<HistorySample>> _history;
  var _sequence = 0;

  List<ExposurePoint> get points => List.unmodifiable(_points);
  Stream<HostEvent> get events => _events.stream;

  List<HistorySample> history(String pointId) => List.unmodifiable(_history[pointId] ?? const []);

  ExposureBinding? binding(String pointId) => manifest.binding(pointId);

  void apply(ProtocolRecord record) {
    final matches = manifest.matching(record);
    if (matches.isEmpty) return;
    final stamp = record.at ?? _now().toUtc();
    for (final b in matches) {
      if (!record.fields.containsKey(b.fieldId)) continue;
      _replace(b.pointId, record.fields[b.fieldId], b.visualStateFor(record.fields[b.fieldId]), stamp);
    }
  }

  ModuleCommand? applyCommand(String pointId, Object value) {
    final b = manifest.binding(pointId);
    if (b == null || !b.writable) return null;
    final stamp = _now().toUtc();
    _replace(pointId, value, b.visualStateFor(value), stamp);
    return ModuleCommand(key: b.sourceKey, commandId: b.commandIdFor(value));
  }

  ProtocolRecord seedRecord(ExposureBinding binding) {
    _sequence += 1;
    return ProtocolRecord(
      sourceKey: binding.sourceKey,
      sequence: _sequence,
      schemaId: binding.schemaId,
      fields: {binding.fieldId: binding.initialValue},
      at: _now().toUtc(),
    );
  }

  ProtocolRecord tickTemperature({double? value}) {
    final b = manifest.binding('salotto.temperatura');
    if (b == null) {
      throw StateError('manifest senza salotto.temperatura');
    }
    _sequence += 1;
    final next = value ?? 20 + _random.nextDouble() * 4;
    final rounded = double.parse(next.toStringAsFixed(1));
    return ProtocolRecord(
      sourceKey: b.sourceKey,
      sequence: _sequence,
      schemaId: b.schemaId,
      fields: {b.fieldId: rounded},
      at: _now().toUtc(),
    );
  }

  void dispose() {
    _events.close();
  }

  void _replace(String pointId, Object? value, String? visualState, DateTime stamp) {
    final current = _points.firstWhere((p) => p.pointId == pointId);
    final next = current.copyWith(value: value, visualState: visualState, updatedAt: stamp);
    _points = [for (final p in _points) p.pointId == pointId ? next : p];
    if (value is num) {
      final list = _history.putIfAbsent(pointId, () => <HistorySample>[]);
      list.add(HistorySample(at: stamp, value: value.toDouble()));
      if (list.length > 48) list.removeRange(0, list.length - 48);
    }
    _events.add(PointUpdated(pointId: pointId, value: next.value, visualState: next.visualState, timestamp: stamp));
  }

  List<HistorySample> _seedHistory(double center) {
    final now = _now().toUtc();
    return [
      for (var i = 24; i >= 1; i--)
        HistorySample(
          at: now.subtract(Duration(minutes: i * 3)),
          value: double.parse((center + sin(i / 3) * (center.abs() * 0.06 + 0.4)).toStringAsFixed(1)),
        ),
    ];
  }
}
