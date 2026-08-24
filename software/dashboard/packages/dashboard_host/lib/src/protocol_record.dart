/// Decoded Protocol V1 RECORD (D110). No CBOR here — the transport strips the envelope.
class ProtocolRecord {
  const ProtocolRecord({
    required this.sourceKey,
    required this.sequence,
    required this.schemaId,
    this.schemaVersion = 1,
    this.fields = const {},
    this.at,
  });

  final int sourceKey;
  final int sequence;
  final String schemaId;
  final int schemaVersion;

  /// Field id → value. MQTT V1 event metadata has no fields; the host fills this
  /// after decoding a record body (or from a replay fixture).
  final Map<int, Object?> fields;
  final DateTime? at;

  factory ProtocolRecord.parse(Map<String, Object?> json) {
    final rawFields = json['fields'];
    return ProtocolRecord(
      sourceKey: json['sourceKey']! as int,
      sequence: json['sequence']! as int,
      schemaId: json['schemaId']! as String,
      schemaVersion: json['schemaVersion'] as int? ?? 1,
      fields: rawFields is Map
          ? {
              for (final e in rawFields.entries) int.parse('${e.key}'): e.value,
            }
          : const {},
      at: json['at'] is String ? DateTime.parse(json['at']! as String) : null,
    );
  }

  Map<String, Object?> toJson() => {
        'sourceKey': sourceKey,
        'sequence': sequence,
        'schemaId': schemaId,
        'schemaVersion': schemaVersion,
        'fields': {for (final e in fields.entries) '${e.key}': e.value},
        'at': at?.toUtc().toIso8601String(),
      };
}

class ModuleCommand {
  const ModuleCommand({required this.key, required this.commandId});

  final int key;
  final int commandId;
}
