class CloudEndpoint {
  const CloudEndpoint({
    required this.origin,
    this.remoteSystemId,
    this.loopback = false,
  });

  static const loopbackUri = 'cloud://loopback';

  static final CloudEndpoint loopbackEndpoint = CloudEndpoint(
    origin: Uri(scheme: 'cloud', host: 'loopback'),
    remoteSystemId: 'casa-demo',
    loopback: true,
  );

  /// Origin without `/v1` (e.g. `https://host.example`).
  final Uri origin;
  final String? remoteSystemId;
  final bool loopback;

  static bool looksLike(String address) {
    final uri = Uri.tryParse(address.trim());
    if (uri == null || !uri.hasScheme) return false;
    return const {'http', 'https', 'cloud'}.contains(uri.scheme);
  }

  String get address {
    if (loopback) return loopbackUri;
    final path = StringBuffer(origin.origin);
    if (origin.path.isNotEmpty && origin.path != '/') {
      path.write(origin.path);
    }
    path.write('/v1');
    if (remoteSystemId != null) {
      path.write('/systems/$remoteSystemId');
    }
    return path.toString();
  }

  Uri resolve(String apiPath) {
    final suffix = apiPath.startsWith('/') ? apiPath : '/$apiPath';
    final base = origin.path.endsWith('/')
        ? origin.path.substring(0, origin.path.length - 1)
        : origin.path;
    return origin.replace(path: '$base$suffix');
  }

  static CloudEndpoint parse(String address) {
    final trimmed = address.trim();
    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme) {
      throw FormatException('indirizzo cloud non valido', trimmed);
    }
    if (uri.scheme == 'cloud') {
      return loopbackEndpoint;
    }
    if (uri.scheme != 'http' && uri.scheme != 'https') {
      throw FormatException('serve http(s) o cloud://loopback', trimmed);
    }
    if (uri.host.isEmpty) {
      throw FormatException('host cloud mancante', trimmed);
    }
    var path = uri.path;
    String? systemId;
    final match = RegExp(r'/v1/systems/([^/]+)/?$').firstMatch(path);
    if (match != null) {
      systemId = match.group(1);
      path = path.substring(0, match.start);
    }
    if (path == '/v1' || path.endsWith('/v1')) {
      path = path.substring(0, path.length - 3);
    }
    if (path == '/') path = '';
    return CloudEndpoint(
      origin: uri.replace(path: path),
      remoteSystemId: systemId,
    );
  }
}
