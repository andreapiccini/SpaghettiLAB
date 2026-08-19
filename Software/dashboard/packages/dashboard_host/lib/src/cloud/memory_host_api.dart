import 'dart:async';

import 'package:dashboard_domain/dashboard_domain.dart';

import 'host_api.dart';
import 'host_api_transport.dart';

/// HOST_API JSON in-process. [CloudHost] never sees [FakeHost] types except here.
class MemoryHostApiTransport implements HostApiTransport {
  MemoryHostApiTransport(this.inner, {this.ownInner = true});

  final HostPort inner;
  final bool ownInner;
  @override
  String? authToken;

  @override
  Future<void> connect() async {
    final host = inner;
    if (host is FakeHost) host.start();
    await inner.listSystems();
  }

  @override
  Future<Object?> get(String path) => _dispatch('GET', path);

  @override
  Future<Object?> put(String path, Map<String, Object?> body) => _dispatch('PUT', path, body);

  @override
  Future<Object?> post(String path, [Map<String, Object?>? body]) =>
      _dispatch('POST', path, body ?? const {});

  @override
  Stream<Map<String, Object?>> watch(String systemId) {
    try {
      return inner.watch(systemId).map(hostEventToJson);
    } on HostException {
      return const Stream.empty();
    }
  }

  @override
  void dispose() {
    final host = inner;
    if (ownInner && host is FakeHost) host.dispose();
  }

  Future<Object?> _dispatch(String method, String path, [Map<String, Object?>? body]) async {
    try {
      return await _route(method, path, body);
    } on HostException catch (error) {
      throw HostApiException(error.code, error.message);
    }
  }

  Future<Object?> _route(String method, String path, [Map<String, Object?>? body]) async {
    final parts = path.split('/').where((s) => s.isNotEmpty).toList();
    if (parts.isEmpty || parts.first != 'v1') {
      throw HostApiException('internal', path);
    }
    if (parts.length == 2 && parts[1] == 'me' && method == 'GET') {
      final session = await inner.currentSession();
      if (session == null) throw const HostException('unauthorized');
      return session.toJson();
    }
    if (parts.length >= 2 && parts[1] == 'auth') {
      return _auth(method, parts, body);
    }
    if (parts.length >= 2 && parts[1] == 'sites') {
      return _sites(method, parts, body);
    }
    if (parts.length >= 2 && parts[1] == 'marketplace') {
      return _marketplace(method, parts, body);
    }
    if (parts.length < 2 || parts[1] != 'systems') {
      throw HostApiException('internal', path);
    }
    if (parts.length == 2) {
      if (method == 'GET') {
        return [for (final s in await inner.listSystems()) s.toJson()];
      }
      if (method == 'POST') {
        final name = body?['name'] as String? ?? '';
        final address = body?['address'] as String? ?? '';
        return (await inner.createSystem(name: name, address: address)).toJson();
      }
    }
    final id = parts[2];
    if (parts.length == 3) {
      if (method == 'GET') return (await inner.getSystem(id)).toJson();
    }
    if (parts.length == 4 && parts[3] == 'points' && method == 'GET') {
      return [for (final p in await inner.getPoints(id)) p.toJson()];
    }
    if (parts.length == 5 && parts[3] == 'history' && method == 'GET') {
      final samples = await inner.getPointHistory(id, parts[4]);
      return {
        'pointId': parts[4],
        'samples': [for (final s in samples) s.toJson()],
      };
    }
    if (parts.length == 4 && parts[3] == 'layout') {
      if (method == 'GET') return (await inner.getLayout(id)).toJson();
      if (method == 'PUT') {
        await inner.putLayout(id, DashboardLayout.parse(body ?? const {}));
        return const <String, Object?>{};
      }
    }
    if (parts.length == 4 && parts[3] == 'appearance' && method == 'GET') {
      return (await inner.getAppearance(id)).toJson();
    }
    if (parts.length == 4 && parts[3] == 'appearance' && method == 'PUT') {
      await inner.putAppearance(id, DashboardAppearance.parse(body ?? const {}));
      return const <String, Object?>{};
    }
    if (parts.length == 5 && parts[3] == 'appearance' && parts[4] == 'apply-pack' && method == 'POST') {
      await inner.applyPack(id, body?['packId'] as String? ?? '');
      return const <String, Object?>{};
    }
    if (parts.length == 4 && parts[3] == 'view') {
      if (method == 'GET') return (await inner.getView(id)).toJson();
      if (method == 'PUT') {
        await inner.putView(id, ViewPreset.parse(body ?? const {}));
        return const <String, Object?>{};
      }
    }
    if (parts.length == 4 && parts[3] == 'scenes' && method == 'GET') {
      return [for (final s in await inner.listScenes(id)) s.toJson()];
    }
    if (parts.length == 5 && parts[3] == 'scenes') {
      if (method == 'GET') return (await inner.getScene(id, parts[4])).toJson();
      if (method == 'PUT') {
        await inner.putScene(id, Scene.parse(body ?? const {}));
        return const <String, Object?>{};
      }
    }
    if (parts.length == 4 && parts[3] == 'capabilities' && method == 'GET') {
      return (await inner.getCapabilities(id)).toJson();
    }
    if (parts.length == 5 && parts[3] == 'commands' && method == 'POST') {
      await inner.sendCommand(id, parts[4], body?['value'] ?? false);
      return const <String, Object?>{};
    }
    throw HostApiException('internal', path);
  }

  Future<Object?> _marketplace(String method, List<String> parts, Map<String, Object?>? body) async {
    if (parts.length == 3 && parts[2] == 'visual-packs' && method == 'GET') {
      return [for (final p in await inner.listVisualPacks()) p.toJson()];
    }
    if (parts.length == 4 && parts[2] == 'visual-packs' && parts[3] == 'install-local' && method == 'POST') {
      await inner.installLocalPack(VisualPack.parse(body ?? const {}));
      return const <String, Object?>{};
    }
    if (parts.length == 5 && parts[2] == 'visual-packs' && parts[4] == 'install' && method == 'POST') {
      await inner.installStorePack(parts[3]);
      return const <String, Object?>{};
    }
    if (parts.length == 3 && parts[2] == 'card-styles' && method == 'GET') {
      return [for (final s in await inner.listCardStyles()) s.toJson()];
    }
    if (parts.length == 3 && parts[2] == 'card-styles' && method == 'POST') {
      await inner.putCardStyle(CardStyle.parse(body ?? const {}));
      return const <String, Object?>{};
    }
    if (parts.length == 5 && parts[2] == 'card-styles' && parts[4] == 'install' && method == 'POST') {
      await inner.installCardStyle(parts[3]);
      return const <String, Object?>{};
    }
    throw HostApiException('internal', parts.join('/'));
  }

  Future<Object?> _sites(String method, List<String> parts, Map<String, Object?>? body) async {
    if (parts.length < 3) throw HostApiException('internal', parts.join('/'));
    final siteId = parts[2];
    if (parts.length == 4 && parts[3] == 'users' && method == 'GET') {
      return [for (final u in await inner.listSiteUsers(siteId)) u.toJson()];
    }
    if (parts.length == 4 && parts[3] == 'invites' && method == 'POST') {
      return (await inner.inviteSiteUser(
        siteId: siteId,
        email: body?['email'] as String? ?? '',
        role: parseSiteRole(body?['role'] as String? ?? 'viewer'),
      ))
          .toJson();
    }
    if (parts.length == 4 && parts[3] == 'sessions' && method == 'GET') {
      return [for (final s in await inner.listSiteSessions(siteId)) s.toJson()];
    }
    if (parts.length == 4 && parts[3] == 'support-requests' && method == 'POST') {
      return (await inner.requestSupport(siteId)).toJson();
    }
    if (parts.length == 6 && parts[3] == 'users' && parts[5] == 'revoke' && method == 'POST') {
      await inner.revokeSiteUser(siteId: siteId, userId: parts[4]);
      return const <String, Object?>{};
    }
    throw HostApiException('internal', parts.join('/'));
  }

  Future<Object?> _auth(String method, List<String> parts, Map<String, Object?>? body) async {
    if (parts.length == 3 && parts[2] == 'login' && method == 'POST') {
      return (await inner.login(
        email: body?['email'] as String? ?? '',
        password: body?['password'] as String? ?? '',
      ))
          .toJson();
    }
    if (parts.length == 3 && parts[2] == 'logout' && method == 'POST') {
      await inner.logout();
      return const <String, Object?>{};
    }
    if (parts.length == 3 && parts[2] == 'select-site' && method == 'POST') {
      return (await inner.selectSite(body?['siteId'] as String? ?? '')).toJson();
    }
    throw HostApiException('internal', parts.join('/'));
  }
}
