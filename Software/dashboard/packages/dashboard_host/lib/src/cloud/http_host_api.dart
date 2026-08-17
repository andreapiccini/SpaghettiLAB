import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'cloud_endpoint.dart';
import 'host_api.dart';
import 'host_api_transport.dart';

class HttpHostApiTransport implements HostApiTransport {
  HttpHostApiTransport(
    this.endpoint, {
    http.Client? client,
    this.poll = const Duration(seconds: 3),
  }) : _client = client ?? http.Client(),
       _ownsClient = client == null;

  final CloudEndpoint endpoint;
  final Duration poll;
  final http.Client _client;
  final bool _ownsClient;
  @override
  String? authToken;

  @override
  Future<void> connect() async {
    await get(HostApiPaths.systems);
  }

  @override
  Future<Object?> get(String path) => _send('GET', path);

  @override
  Future<Object?> put(String path, Map<String, Object?> body) => _send('PUT', path, body);

  @override
  Future<Object?> post(String path, [Map<String, Object?>? body]) => _send('POST', path, body);

  @override
  Stream<Map<String, Object?>> watch(String systemId) {
    final controller = StreamController<Map<String, Object?>>.broadcast();
    final last = <String, String>{};
    var online = true;
    timer() async {
      if (controller.isClosed) return;
      try {
        final system = asJsonMap(await get(HostApiPaths.system(systemId)));
        final nextOnline = system['connectionState'] == 'connected';
        if (nextOnline != online) {
          online = nextOnline;
          controller.add({'type': 'system_status', 'systemId': systemId, 'online': online});
        }
        final points = asJsonObjectList(await get(HostApiPaths.points(systemId)));
        for (final point in points) {
          final id = point['pointId'] as String? ?? '';
          final key = jsonEncode(point['value']);
          if (last[id] == key) continue;
          last[id] = key;
          controller.add({
            'type': 'point_updated',
            'pointId': id,
            'value': point['value'],
            'visualState': point['visualState'],
            'timestamp': point['updatedAt'] ?? DateTime.now().toUtc().toIso8601String(),
          });
        }
      } on HostApiException {
        if (online) {
          online = false;
          if (!controller.isClosed) {
            controller.add({'type': 'system_status', 'systemId': systemId, 'online': false});
          }
        }
      }
    }

    final periodic = Timer.periodic(poll, (_) => unawaited(timer()));
    controller.onCancel = periodic.cancel;
    return controller.stream;
  }

  @override
  void dispose() {
    if (_ownsClient) _client.close();
  }

  Future<Object?> _send(String method, String path, [Map<String, Object?>? body]) async {
    final uri = endpoint.resolve(path);
    http.Response response;
    try {
      final headers = {
        'Accept': 'application/json',
        if (body != null) 'Content-Type': 'application/json',
        if (authToken != null && authToken!.isNotEmpty) 'Authorization': 'Bearer $authToken',
      };
      final encoded = body == null ? null : jsonEncode(body);
      response = await switch (method) {
        'GET' => _client.get(uri, headers: headers),
        'PUT' => _client.put(uri, headers: headers, body: encoded),
        'POST' => _client.post(uri, headers: headers, body: encoded),
        _ => throw HostApiException('internal', method),
      }
          .timeout(const Duration(seconds: 4));
    } on TimeoutException {
      throw HostApiException('offline');
    } on HostApiException {
      rethrow;
    } catch (error) {
      throw HostApiException('offline', '$error');
    }

    if (response.statusCode == 401) throw HostApiException('unauthorized');
    if (response.statusCode >= 400) throw HostApiException('internal', '${response.statusCode}');
    if (response.body.isEmpty) return null;
    return jsonDecode(response.body);
  }
}
