enum ValueType { number, boolean, string }

/// Maps HOST_API `visualHint`. `toggle` is the JSON value `switch`.
enum VisualHint { gauge, value, toggle, button, status, animated, sparkline }

String visualHintWire(VisualHint hint) => hint == VisualHint.toggle ? 'switch' : hint.name;

VisualHint parseVisualHint(String raw) =>
    raw == 'switch' ? VisualHint.toggle : VisualHint.values.byName(raw);

class ExposurePoint {
  const ExposurePoint({
    required this.pointId,
    required this.label,
    required this.valueType,
    required this.visualHint,
    this.kind = 'sensor',
    this.unit,
    this.visualStates = const [],
    this.writable = false,
    this.commandPointId,
    this.value,
    this.visualState,
    this.updatedAt,
  });

  final String pointId;
  final String label;
  final String kind;
  final ValueType valueType;
  final String? unit;
  final VisualHint visualHint;
  final List<String> visualStates;
  final bool writable;
  final String? commandPointId;
  final Object? value;
  final String? visualState;
  final DateTime? updatedAt;

  factory ExposurePoint.parse(Map<String, Object?> json) {
    final states = json['visualStates'];
    return ExposurePoint(
      pointId: json['pointId']! as String,
      label: json['label']! as String,
      kind: json['kind'] as String? ?? 'sensor',
      valueType: ValueType.values.byName(json['valueType'] as String? ?? 'string'),
      unit: json['unit'] as String?,
      visualHint: parseVisualHint(json['visualHint'] as String? ?? 'value'),
      visualStates: states is List ? [for (final s in states) '$s'] : const [],
      writable: json['writable'] as bool? ?? false,
      commandPointId: json['commandPointId'] as String?,
      value: json['value'],
      visualState: json['visualState'] as String?,
      updatedAt: json['updatedAt'] is String ? DateTime.parse(json['updatedAt']! as String) : null,
    );
  }

  Map<String, Object?> toJson() => {
        'pointId': pointId,
        'label': label,
        'kind': kind,
        'valueType': valueType.name,
        'unit': unit,
        'visualHint': visualHintWire(visualHint),
        'visualStates': visualStates,
        'writable': writable,
        'commandPointId': commandPointId,
        'value': value,
        'visualState': visualState,
        'updatedAt': updatedAt?.toUtc().toIso8601String(),
      };

  ExposurePoint copyWith({
    String? label,
    Object? value = _sentinel,
    String? visualState,
    DateTime? updatedAt,
  }) {
    return ExposurePoint(
      pointId: pointId,
      label: label ?? this.label,
      valueType: valueType,
      visualHint: visualHint,
      kind: kind,
      unit: unit,
      visualStates: visualStates,
      writable: writable,
      commandPointId: commandPointId,
      value: identical(value, _sentinel) ? this.value : value,
      visualState: visualState ?? this.visualState,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

const Object _sentinel = Object();
