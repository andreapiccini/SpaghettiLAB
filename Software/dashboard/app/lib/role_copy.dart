import 'package:dashboard_domain/dashboard_domain.dart';

String siteRoleLabel(SiteRole role) => switch (role) {
      SiteRole.viewer => 'Visitatore',
      SiteRole.operator => 'Operatore',
      SiteRole.siteAdmin => 'Amministratore sito',
      SiteRole.siteTechnician => 'Tecnico sito',
      SiteRole.integrator => 'Integratore',
      SiteRole.partnerAdmin => 'Partner',
      SiteRole.partnerEngineer => 'Tecnico partner',
      SiteRole.spaghettiSupport => 'Supporto SpaghettiLAB',
      SiteRole.platformAdmin => 'Piattaforma',
    };
