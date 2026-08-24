enum ConnectionStatus { disconnected, connecting, connected, error }

class LabSystem {
  const LabSystem({
    required this.systemId,
    required this.name,
    required this.connectionState,
    this.lastSeen,
    this.hostAddress,
  });

  final String systemId;
  final String name;
  final ConnectionStatus connectionState;
  final DateTime? lastSeen;
  final String? hostAddress;

  factory LabSystem.parse(Map<String, Object?> json) {
    return LabSystem(
      systemId: json['systemId']! as String,
      name: json['name']! as String,
      connectionState: ConnectionStatus.values.byName(
        json['connectionState'] as String? ?? ConnectionStatus.disconnected.name,
      ),
      hostAddress: json['hostAddress'] as String?,
      lastSeen: json['lastSeen'] is String ? DateTime.parse(json['lastSeen']! as String) : null,
    );
  }

  Map<String, Object?> toJson() => {
        'systemId': systemId,
        'name': name,
        'connectionState': connectionState.name,
        'hostAddress': hostAddress,
        'lastSeen': lastSeen?.toUtc().toIso8601String(),
      };
}
