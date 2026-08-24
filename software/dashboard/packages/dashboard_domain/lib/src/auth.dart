/// Identity models and dashboard/host scopes. Enforcement lives on the host.
library;

class HostException implements Exception {
  const HostException(this.code, [this.message]);

  /// HOST_API: `offline` | `unauthorized` | `internal`.
  final String code;
  final String? message;

  @override
  String toString() => 'HostException($code${message == null ? '' : ': $message'})';
}

abstract final class HostScopes {
  static const dashboardView = 'dashboard.view';
  static const dashboardCommand = 'dashboard.command';
  static const dashboardAppearanceEdit = 'dashboard.appearance.edit';
  static const dashboardLayoutEdit = 'dashboard.layout.edit';
  static const dashboardMarketplace = 'dashboard.marketplace';
  static const hostUserManage = 'host.user.manage';
  static const hostSystemManage = 'host.system.manage';
  static const hostSupportGrantApprove = 'host.support.grant.approve';
  static const hostSupportSession = 'host.support.session';
  static const noderedView = 'nodered.view';
  static const noderedEdit = 'nodered.edit';
  static const noderedDeploy = 'nodered.deploy';
  static const partnerSiteManage = 'partner.site.manage';
  static const partnerBrandManage = 'partner.brand.manage';
}

enum SiteRole {
  viewer,
  operator,
  siteAdmin,
  siteTechnician,
  integrator,
  partnerAdmin,
  partnerEngineer,
  spaghettiSupport,
  platformAdmin,
}

String siteRoleWire(SiteRole role) => switch (role) {
      SiteRole.viewer => 'viewer',
      SiteRole.operator => 'operator',
      SiteRole.siteAdmin => 'site_admin',
      SiteRole.siteTechnician => 'site_technician',
      SiteRole.integrator => 'integrator',
      SiteRole.partnerAdmin => 'partner_admin',
      SiteRole.partnerEngineer => 'partner_engineer',
      SiteRole.spaghettiSupport => 'spaghetti_support',
      SiteRole.platformAdmin => 'platform_admin',
    };

SiteRole parseSiteRole(String raw) => switch (raw) {
      'viewer' => SiteRole.viewer,
      'operator' => SiteRole.operator,
      'site_admin' => SiteRole.siteAdmin,
      'site_technician' => SiteRole.siteTechnician,
      'integrator' => SiteRole.integrator,
      'partner_admin' => SiteRole.partnerAdmin,
      'partner_engineer' => SiteRole.partnerEngineer,
      'spaghetti_support' => SiteRole.spaghettiSupport,
      'platform_admin' => SiteRole.platformAdmin,
      _ => throw FormatException('ruolo sconosciuto: $raw'),
    };

Set<String> scopesForRole(SiteRole role) {
  const view = {HostScopes.dashboardView};
  const operate = {HostScopes.dashboardView, HostScopes.dashboardCommand};
  const appearance = {
    HostScopes.dashboardAppearanceEdit,
    HostScopes.dashboardLayoutEdit,
    HostScopes.dashboardMarketplace,
  };
  return switch (role) {
    SiteRole.viewer => view,
    SiteRole.operator => operate,
    SiteRole.siteTechnician => {...operate, HostScopes.noderedView},
    SiteRole.siteAdmin => {
        ...operate,
        ...appearance,
        HostScopes.hostUserManage,
        HostScopes.hostSystemManage,
        HostScopes.hostSupportGrantApprove,
        HostScopes.noderedView,
      },
    SiteRole.integrator => {
        ...operate,
        ...appearance,
        HostScopes.hostSystemManage,
        HostScopes.noderedView,
        HostScopes.noderedEdit,
        HostScopes.noderedDeploy,
      },
    SiteRole.partnerEngineer => {
        ...operate,
        ...appearance,
        HostScopes.hostSystemManage,
        HostScopes.noderedView,
        HostScopes.noderedEdit,
        HostScopes.noderedDeploy,
        HostScopes.partnerSiteManage,
      },
    SiteRole.partnerAdmin => {
        ...operate,
        ...appearance,
        HostScopes.hostUserManage,
        HostScopes.hostSystemManage,
        HostScopes.hostSupportGrantApprove,
        HostScopes.noderedView,
        HostScopes.noderedEdit,
        HostScopes.noderedDeploy,
        HostScopes.partnerSiteManage,
        HostScopes.partnerBrandManage,
      },
    SiteRole.spaghettiSupport => view,
    SiteRole.platformAdmin => {
        HostScopes.dashboardView,
        HostScopes.dashboardMarketplace,
        HostScopes.partnerBrandManage,
      },
  };
}

class AuthUser {
  const AuthUser({
    required this.userId,
    required this.email,
    required this.displayName,
  });

  final String userId;
  final String email;
  final String displayName;

  factory AuthUser.parse(Map<String, Object?> json) {
    return AuthUser(
      userId: json['userId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
    );
  }

  Map<String, Object?> toJson() => {
        'userId': userId,
        'email': email,
        'displayName': displayName,
      };
}

class SiteMembership {
  const SiteMembership({
    required this.siteId,
    required this.name,
    this.orgId,
    this.roles = const [],
    this.scopes = const {},
  });

  final String siteId;
  final String name;
  final String? orgId;
  final List<SiteRole> roles;
  final Set<String> scopes;

  factory SiteMembership.parse(Map<String, Object?> json) {
    final rolesRaw = json['roles'];
    final scopesRaw = json['scopes'];
    return SiteMembership(
      siteId: json['siteId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      orgId: json['orgId'] as String?,
      roles: [
        if (rolesRaw is List)
          for (final r in rolesRaw)
            if (r is String) parseSiteRole(r),
      ],
      scopes: {
        if (scopesRaw is List)
          for (final s in scopesRaw)
            if (s is String) s,
      },
    );
  }

  Map<String, Object?> toJson() => {
        'siteId': siteId,
        'name': name,
        if (orgId != null) 'orgId': orgId,
        'roles': [for (final r in roles) siteRoleWire(r)],
        'scopes': scopes.toList()..sort(),
      };
}

class AuthSession {
  const AuthSession({
    required this.token,
    required this.user,
    required this.sites,
    required this.expiresAt,
    this.selectedSiteId,
  });

  final String token;
  final AuthUser user;
  final List<SiteMembership> sites;
  final String? selectedSiteId;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().toUtc().isAfter(expiresAt);

  SiteMembership? get selectedSite {
    if (sites.isEmpty) return null;
    if (selectedSiteId == null) return sites.length == 1 ? sites.first : null;
    for (final site in sites) {
      if (site.siteId == selectedSiteId) return site;
    }
    return null;
  }

  bool allows(String scope) => selectedSite?.scopes.contains(scope) ?? false;

  AuthSession copyWith({
    String? token,
    AuthUser? user,
    List<SiteMembership>? sites,
    String? selectedSiteId,
    DateTime? expiresAt,
    bool clearSelectedSite = false,
  }) {
    return AuthSession(
      token: token ?? this.token,
      user: user ?? this.user,
      sites: sites ?? this.sites,
      selectedSiteId: clearSelectedSite ? null : (selectedSiteId ?? this.selectedSiteId),
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }

  factory AuthSession.parse(Map<String, Object?> json) {
    final userRaw = json['user'];
    final sitesRaw = json['sites'];
    return AuthSession(
      token: json['token'] as String? ?? '',
      user: AuthUser.parse(userRaw is Map ? Map<String, Object?>.from(userRaw) : const {}),
      sites: [
        if (sitesRaw is List)
          for (final s in sitesRaw)
            if (s is Map) SiteMembership.parse(Map<String, Object?>.from(s)),
      ],
      selectedSiteId: json['selectedSiteId'] as String?,
      expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '')?.toUtc() ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
    );
  }

  Map<String, Object?> toJson() => {
        'token': token,
        'user': user.toJson(),
        'sites': [for (final s in sites) s.toJson()],
        if (selectedSiteId != null) 'selectedSiteId': selectedSiteId,
        'expiresAt': expiresAt.toIso8601String(),
      };
}
