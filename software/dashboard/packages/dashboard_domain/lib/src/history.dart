class HistorySample {
  const HistorySample({required this.at, required this.value});

  final DateTime at;
  final double value;

  factory HistorySample.parse(Map<String, Object?> json) {
    return HistorySample(
      at: DateTime.parse(json['at'] as String),
      value: (json['value'] as num).toDouble(),
    );
  }

  Map<String, Object?> toJson() => {
        'at': at.toUtc().toIso8601String(),
        'value': value,
      };
}
