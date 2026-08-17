sealed class HostEvent {
  const HostEvent();
}

class PointUpdated extends HostEvent {
  const PointUpdated({
    required this.pointId,
    required this.value,
    this.visualState,
    required this.timestamp,
  });

  final String pointId;
  final Object? value;
  final String? visualState;
  final DateTime timestamp;

  factory PointUpdated.parse(Map<String, Object?> json) {
    return PointUpdated(
      pointId: json['pointId']! as String,
      value: json['value'],
      visualState: json['visualState'] as String?,
      timestamp: DateTime.parse(json['timestamp']! as String),
    );
  }
}

class SystemStatusUpdated extends HostEvent {
  const SystemStatusUpdated({required this.systemId, required this.online});

  final String systemId;
  final bool online;
}

class AppearanceUpdated extends HostEvent {
  const AppearanceUpdated();
}

HostEvent parseHostEvent(Map<String, Object?> json) {
  return switch (json['type'] as String?) {
    'point_updated' => PointUpdated.parse(json),
    'system_status' => SystemStatusUpdated(
        systemId: json['systemId']! as String,
        online: json['online'] as bool? ?? false,
      ),
    'appearance_updated' => const AppearanceUpdated(),
    _ => throw FormatException('evento host sconosciuto', json['type']),
  };
}

Map<String, Object?> hostEventToJson(HostEvent event) {
  return switch (event) {
    PointUpdated() => {
        'type': 'point_updated',
        'pointId': event.pointId,
        'value': event.value,
        'visualState': event.visualState,
        'timestamp': event.timestamp.toUtc().toIso8601String(),
      },
    SystemStatusUpdated() => {
        'type': 'system_status',
        'systemId': event.systemId,
        'online': event.online,
      },
    AppearanceUpdated() => {'type': 'appearance_updated'},
  };
}
