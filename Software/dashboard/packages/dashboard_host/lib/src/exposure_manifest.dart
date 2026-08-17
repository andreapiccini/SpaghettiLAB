import 'package:dashboard_domain/dashboard_domain.dart';

import 'protocol_record.dart';

class ExposureBinding {
  const ExposureBinding({
    required this.pointId,
    required this.label,
    required this.sourceKey,
    required this.schemaId,
    required this.fieldId,
    required this.valueType,
    required this.visualHint,
    this.kind = 'sensor',
    this.unit,
    this.visualStates = const [],
    this.writable = false,
    this.commandIdOn = 1,
    this.commandIdOff = 2,
    this.initialValue,
    this.runningValue = true,
  });

  final String pointId;
  final String label;
  final String kind;
  final int sourceKey;
  final String schemaId;
  final int fieldId;
  final ValueType valueType;
  final VisualHint visualHint;
  final String? unit;
  final List<String> visualStates;
  final bool writable;
  final int commandIdOn;
  final int commandIdOff;
  final Object? initialValue;
  final Object runningValue;

  ExposurePoint toPoint({DateTime? at}) {
    final value = initialValue;
    return ExposurePoint(
      pointId: pointId,
      label: label,
      kind: kind,
      valueType: valueType,
      visualHint: visualHint,
      unit: unit,
      visualStates: visualStates,
      writable: writable,
      value: value,
      visualState: _visualState(value),
      updatedAt: at,
    );
  }

  String? visualStateFor(Object? value) => _visualState(value);

  String? _visualState(Object? value) {
    if (visualStates.isEmpty) return null;
    if (visualHint == VisualHint.animated) {
      return _isOn(value) ? 'running' : 'idle';
    }
    if (visualHint == VisualHint.status) {
      return _isOn(value) ? 'alarm' : 'ok';
    }
    return null;
  }

  bool _isOn(Object? value) => value == runningValue || value == true || value == 1 || value == 'on';

  int commandIdFor(Object value) => _isOn(value) ? commandIdOn : commandIdOff;

  factory ExposureBinding.parse(Map<String, Object?> json) {
    return ExposureBinding(
      pointId: json['pointId']! as String,
      label: json['label']! as String,
      kind: json['kind'] as String? ?? 'sensor',
      sourceKey: json['sourceKey']! as int,
      schemaId: json['schemaId']! as String,
      fieldId: json['fieldId'] as int? ?? 1,
      valueType: ValueType.values.byName(json['valueType'] as String? ?? 'number'),
      visualHint: _hint(json['visualHint'] as String? ?? 'value'),
      unit: json['unit'] as String?,
      visualStates: [
        for (final s in json['visualStates'] as List? ?? const []) '$s',
      ],
      writable: json['writable'] as bool? ?? false,
      commandIdOn: json['commandIdOn'] as int? ?? 1,
      commandIdOff: json['commandIdOff'] as int? ?? 2,
      initialValue: json['initialValue'],
    );
  }

  static VisualHint _hint(String raw) {
    if (raw == 'switch') return VisualHint.toggle;
    return VisualHint.values.byName(raw);
  }
}

class ExposureManifest {
  const ExposureManifest({required this.manifestId, required this.bindings});

  final String manifestId;
  final List<ExposureBinding> bindings;

  ExposureBinding? binding(String pointId) {
    for (final b in bindings) {
      if (b.pointId == pointId) return b;
    }
    return null;
  }

  List<ExposureBinding> matching(ProtocolRecord record) {
    return [
      for (final b in bindings)
        if (b.sourceKey == record.sourceKey && b.schemaId == record.schemaId) b,
    ];
  }

  factory ExposureManifest.parse(Map<String, Object?> json) {
    final raw = json['bindings'];
    return ExposureManifest(
      manifestId: json['manifestId'] as String? ?? 'exposure',
      bindings: [
        if (raw is List)
          for (final item in raw)
            if (item is Map) ExposureBinding.parse(Map<String, Object?>.from(item)),
      ],
    );
  }
}
