class HostApiException implements Exception {
  HostApiException(this.code, [this.message]);

  /// HOST_API: `offline` | `unauthorized` | `internal`.
  final String code;
  final String? message;

  @override
  String toString() => 'HostApiException($code${message == null ? '' : ': $message'})';
}

class HostApiPaths {
  static const login = '/v1/auth/login';
  static const logout = '/v1/auth/logout';
  static const selectSite = '/v1/auth/select-site';
  static const me = '/v1/me';
  static String siteUsers(String siteId) => '/v1/sites/$siteId/users';
  static String siteInvites(String siteId) => '/v1/sites/$siteId/invites';
  static String siteUserRevoke(String siteId, String userId) => '/v1/sites/$siteId/users/$userId/revoke';
  static String siteSessions(String siteId) => '/v1/sites/$siteId/sessions';
  static String siteSupportGrants(String siteId) => '/v1/sites/$siteId/support-grants';
  static String siteSupportGrantApprove(String siteId, String grantId) =>
      '/v1/sites/$siteId/support-grants/$grantId/approve';
  static String siteSupportGrantRevoke(String siteId, String grantId) =>
      '/v1/sites/$siteId/support-grants/$grantId/revoke';
  static const systems = '/v1/systems';
  static String system(String id) => '/v1/systems/$id';
  static String points(String id) => '/v1/systems/$id/points';
  static String history(String id, String pointId) => '/v1/systems/$id/history/$pointId';
  static String layout(String id) => '/v1/systems/$id/layout';
  static String appearance(String id) => '/v1/systems/$id/appearance';
  static String applyPack(String id) => '/v1/systems/$id/appearance/apply-pack';
  static String view(String id) => '/v1/systems/$id/view';
  static String scenes(String id) => '/v1/systems/$id/scenes';
  static String scene(String id, String sceneId) => '/v1/systems/$id/scenes/$sceneId';
  static String capabilities(String id) => '/v1/systems/$id/capabilities';
  static String command(String id, String pointId) => '/v1/systems/$id/commands/$pointId';
  static const visualPacks = '/v1/marketplace/visual-packs';
  static const installLocalPack = '/v1/marketplace/visual-packs/install-local';
  static String installStorePack(String packId) => '/v1/marketplace/visual-packs/$packId/install';
  static const cardStyles = '/v1/marketplace/card-styles';
  static String installCardStyle(String styleId) => '/v1/marketplace/card-styles/$styleId/install';
}

Map<String, Object?> asJsonMap(Object? value) {
  if (value is Map<String, Object?>) return value;
  if (value is Map) return Map<String, Object?>.from(value);
  throw const FormatException('oggetto JSON atteso');
}

List<Map<String, Object?>> asJsonObjectList(Object? value) {
  if (value is! List) throw const FormatException('lista JSON attesa');
  return [
    for (final item in value)
      if (item is Map) Map<String, Object?>.from(item),
  ];
}
