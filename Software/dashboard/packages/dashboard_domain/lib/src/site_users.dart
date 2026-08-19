import 'auth.dart';

enum SiteUserStatus { active, invited, revoked }

String siteUserStatusWire(SiteUserStatus status) => switch (status) {
      SiteUserStatus.active => 'active',
      SiteUserStatus.invited => 'invited',
      SiteUserStatus.revoked => 'revoked',
    };

SiteUserStatus parseSiteUserStatus(String raw) => switch (raw) {
      'active' => SiteUserStatus.active,
      'invited' => SiteUserStatus.invited,
      'revoked' => SiteUserStatus.revoked,
      _ => throw FormatException('stato utente sconosciuto: $raw'),
    };

/// Ruoli che un site_admin può assegnare con un invito (E051).
const invitableSiteRoles = {SiteRole.viewer, SiteRole.operator};

class SiteUser {
  const SiteUser({
    required this.userId,
    required this.email,
    required this.displayName,
    required this.role,
    this.status = SiteUserStatus.active,
  });

  final String userId;
  final String email;
  final String displayName;
  final SiteRole role;
  final SiteUserStatus status;

  SiteUser copyWith({SiteRole? role, SiteUserStatus? status}) {
    return SiteUser(
      userId: userId,
      email: email,
      displayName: displayName,
      role: role ?? this.role,
      status: status ?? this.status,
    );
  }

  factory SiteUser.parse(Map<String, Object?> json) {
    return SiteUser(
      userId: json['userId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      role: parseSiteRole(json['role'] as String? ?? 'viewer'),
      status: parseSiteUserStatus(json['status'] as String? ?? 'active'),
    );
  }

  Map<String, Object?> toJson() => {
        'userId': userId,
        'email': email,
        'displayName': displayName,
        'role': siteRoleWire(role),
        'status': siteUserStatusWire(status),
      };
}

class SiteInvite {
  const SiteInvite({
    required this.inviteId,
    required this.email,
    required this.role,
    required this.link,
    required this.createdAt,
  });

  final String inviteId;
  final String email;
  final SiteRole role;
  final String link;
  final DateTime createdAt;

  factory SiteInvite.parse(Map<String, Object?> json) {
    return SiteInvite(
      inviteId: json['inviteId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: parseSiteRole(json['role'] as String? ?? 'viewer'),
      link: json['link'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '')?.toUtc() ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
    );
  }

  Map<String, Object?> toJson() => {
        'inviteId': inviteId,
        'email': email,
        'role': siteRoleWire(role),
        'link': link,
        'createdAt': createdAt.toIso8601String(),
      };
}

class SiteSession {
  const SiteSession({
    required this.sessionId,
    required this.userId,
    required this.email,
    required this.device,
    required this.lastSeen,
    this.current = false,
  });

  final String sessionId;
  final String userId;
  final String email;
  final String device;
  final DateTime lastSeen;
  final bool current;

  factory SiteSession.parse(Map<String, Object?> json) {
    return SiteSession(
      sessionId: json['sessionId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      device: json['device'] as String? ?? '',
      lastSeen: DateTime.tryParse(json['lastSeen'] as String? ?? '')?.toUtc() ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      current: json['current'] as bool? ?? false,
    );
  }

  Map<String, Object?> toJson() => {
        'sessionId': sessionId,
        'userId': userId,
        'email': email,
        'device': device,
        'lastSeen': lastSeen.toIso8601String(),
        'current': current,
      };
}

class SupportRequest {
  const SupportRequest({
    required this.requestId,
    required this.status,
    required this.message,
  });

  final String requestId;
  final String status;
  final String message;

  factory SupportRequest.parse(Map<String, Object?> json) {
    return SupportRequest(
      requestId: json['requestId'] as String? ?? '',
      status: json['status'] as String? ?? 'placeholder',
      message: json['message'] as String? ?? '',
    );
  }

  Map<String, Object?> toJson() => {
        'requestId': requestId,
        'status': status,
        'message': message,
      };
}

class HostAuditEvent {
  const HostAuditEvent({
    required this.at,
    required this.action,
    required this.actorEmail,
    required this.detail,
  });

  final DateTime at;
  final String action;
  final String actorEmail;
  final String detail;
}
