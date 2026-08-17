import 'dart:async';

abstract class HostApiTransport {
  String? get authToken;
  set authToken(String? value);
  Future<void> connect();
  Future<Object?> get(String path);
  Future<Object?> put(String path, Map<String, Object?> body);
  Future<Object?> post(String path, [Map<String, Object?>? body]);
  Stream<Map<String, Object?>> watch(String systemId);
  void dispose();
}
