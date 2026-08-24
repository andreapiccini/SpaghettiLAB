class MqttEndpoint {
  const MqttEndpoint({
    required this.scheme,
    required this.host,
    required this.port,
    required this.coreBase,
    required this.useTls,
    required this.useWebSocket,
  });

  final String scheme;
  final String host;
  final int port;
  final String coreBase;
  final bool useTls;
  final bool useWebSocket;

  static const _schemes = {'mqtt', 'mqtts', 'ws', 'wss'};

  static bool looksLike(String address) {
    final uri = Uri.tryParse(address.trim());
    if (uri == null || !uri.hasScheme) return false;
    return _schemes.contains(uri.scheme);
  }

  /// Last path segment of `<base>/v1/cores/<core_id>`.
  String get coreId {
    final parts = coreBase.split('/');
    return parts.isEmpty ? coreBase : parts.last;
  }

  /// Canonical URI stored on [LabSystem.hostAddress].
  String get address {
    final path = coreBase.startsWith('/') ? coreBase : '/$coreBase';
    return '$scheme://$host:$port$path';
  }

  /// MQTT client id — Protocol V1 `requests/<client_id>` is ≤ 31 chars.
  String get clientId {
    const prefix = 'dash-';
    final raw = '$prefix$coreId';
    if (raw.length <= 31) return raw;
    return raw.substring(0, 31);
  }

  /// Host or `ws://` URL passed to mqtt_client.
  String get clientServer {
    if (!useWebSocket) return host;
    final ws = useTls ? 'wss' : 'ws';
    return '$ws://$host/mqtt';
  }

  /// Flutter web cannot open TCP 1883; rewrite to Mosquitto websockets.
  MqttEndpoint get asBrowser {
    if (useWebSocket) return this;
    return MqttEndpoint(
      scheme: useTls ? 'wss' : 'ws',
      host: host,
      port: 9001,
      coreBase: coreBase,
      useTls: useTls,
      useWebSocket: true,
    );
  }

  static MqttEndpoint parse(String address) {
    final trimmed = address.trim();
    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme || !_schemes.contains(uri.scheme)) {
      throw FormatException('indirizzo MQTT non valido', trimmed);
    }
    if (uri.host.isEmpty) {
      throw FormatException('host MQTT mancante', trimmed);
    }
    final path = uri.path.replaceFirst(RegExp(r'^/+'), '').replaceFirst(RegExp(r'/+$'), '');
    if (path.isEmpty || !path.contains('v1/cores/')) {
      throw FormatException('serve un path …/v1/cores/<id>', trimmed);
    }
    final coreId = path.split('/').last;
    if (coreId.isEmpty || coreId == 'cores') {
      throw FormatException('core id mancante', trimmed);
    }
    final websocket = uri.scheme == 'ws' || uri.scheme == 'wss';
    final tls = uri.scheme == 'mqtts' || uri.scheme == 'wss';
    return MqttEndpoint(
      scheme: uri.scheme,
      host: uri.host,
      port: uri.hasPort ? uri.port : _defaultPort(uri.scheme),
      coreBase: path,
      useTls: tls,
      useWebSocket: websocket,
    );
  }

  static int _defaultPort(String scheme) {
    return switch (scheme) {
      'mqtts' => 8883,
      'ws' => 9001,
      'wss' => 443,
      _ => 1883,
    };
  }
}
