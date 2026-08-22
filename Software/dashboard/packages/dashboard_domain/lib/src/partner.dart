/// Partner multi-site portfolio (E081). Isolation by `partnerOrgId`.
library;

enum PartnerSiteStatus { online, offline, updateQueued }

String partnerSiteStatusWire(PartnerSiteStatus status) => switch (status) {
      PartnerSiteStatus.online => 'online',
      PartnerSiteStatus.offline => 'offline',
      PartnerSiteStatus.updateQueued => 'update_queued',
    };

PartnerSiteStatus parsePartnerSiteStatus(String raw) => switch (raw) {
      'online' => PartnerSiteStatus.online,
      'offline' => PartnerSiteStatus.offline,
      'update_queued' => PartnerSiteStatus.updateQueued,
      _ => throw FormatException('stato site partner sconosciuto: $raw'),
    };

enum PartnerSiteAccess { permanent, grantRequired, grantPending, grantActive }

String partnerSiteAccessWire(PartnerSiteAccess access) => switch (access) {
      PartnerSiteAccess.permanent => 'permanent',
      PartnerSiteAccess.grantRequired => 'grant_required',
      PartnerSiteAccess.grantPending => 'grant_pending',
      PartnerSiteAccess.grantActive => 'grant_active',
    };

PartnerSiteAccess parsePartnerSiteAccess(String raw) => switch (raw) {
      'permanent' => PartnerSiteAccess.permanent,
      'grant_required' => PartnerSiteAccess.grantRequired,
      'grant_pending' => PartnerSiteAccess.grantPending,
      'grant_active' => PartnerSiteAccess.grantActive,
      _ => throw FormatException('accesso site partner sconosciuto: $raw'),
    };

class PartnerSiteSummary {
  const PartnerSiteSummary({
    required this.siteId,
    required this.name,
    required this.customerOrgName,
    required this.partnerOrgId,
    required this.status,
    required this.access,
    this.brandPackId,
  });

  final String siteId;
  final String name;
  final String customerOrgName;
  final String partnerOrgId;
  final PartnerSiteStatus status;
  final PartnerSiteAccess access;
  final String? brandPackId;

  bool get canOpen =>
      access == PartnerSiteAccess.permanent || access == PartnerSiteAccess.grantActive;

  factory PartnerSiteSummary.parse(Map<String, Object?> json) {
    return PartnerSiteSummary(
      siteId: json['siteId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      customerOrgName: json['customerOrgName'] as String? ?? '',
      partnerOrgId: json['partnerOrgId'] as String? ?? '',
      status: parsePartnerSiteStatus(json['status'] as String? ?? 'offline'),
      access: parsePartnerSiteAccess(json['access'] as String? ?? 'grant_required'),
      brandPackId: json['brandPackId'] as String?,
    );
  }

  Map<String, Object?> toJson() => {
        'siteId': siteId,
        'name': name,
        'customerOrgName': customerOrgName,
        'partnerOrgId': partnerOrgId,
        'status': partnerSiteStatusWire(status),
        'access': partnerSiteAccessWire(access),
        if (brandPackId != null) 'brandPackId': brandPackId,
      };
}
