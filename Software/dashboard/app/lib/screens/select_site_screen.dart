import 'dart:async';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../role_copy.dart';
import '../theme/spaghetti_theme.dart';

class PartnerConsoleScreen extends StatefulWidget {
  const PartnerConsoleScreen({
    super.key,
    required this.host,
    required this.session,
    required this.onOpenSite,
    required this.onLogout,
  });

  final HostPort host;
  final AuthSession session;
  final ValueChanged<String> onOpenSite;
  final VoidCallback onLogout;

  @override
  State<PartnerConsoleScreen> createState() => _PartnerConsoleScreenState();
}

class _PartnerConsoleScreenState extends State<PartnerConsoleScreen> {
  List<PartnerSiteSummary>? _sites;
  String? _error;
  String? _busySiteId;
  var _loading = true;

  bool get _canBrand => widget.session.sites.any(
        (s) => s.scopes.contains(HostScopes.partnerBrandManage),
      );

  @override
  void initState() {
    super.initState();
    unawaited(_reload());
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final sites = await widget.host.listPartnerSites();
      if (!mounted) return;
      setState(() {
        _sites = sites;
        _loading = false;
      });
    } on HostException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message ?? error.code;
        _loading = false;
      });
    }
  }

  Future<void> _run(String siteId, Future<void> Function() action) async {
    setState(() => _busySiteId = siteId);
    try {
      await action();
      await _reload();
    } on HostException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message ?? error.code);
    } finally {
      if (mounted) setState(() => _busySiteId = null);
    }
  }

  String _statusLabel(PartnerSiteStatus status) => switch (status) {
        PartnerSiteStatus.online => 'Online',
        PartnerSiteStatus.offline => 'Offline',
        PartnerSiteStatus.updateQueued => 'Update in coda',
      };

  String _accessLabel(PartnerSiteAccess access) => switch (access) {
        PartnerSiteAccess.permanent => 'Accesso permanente',
        PartnerSiteAccess.grantRequired => 'Serve grant',
        PartnerSiteAccess.grantPending => 'Grant in attesa',
        PartnerSiteAccess.grantActive => 'Grant attivo',
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sites = _sites;
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          child: ListView(
            padding: const EdgeInsets.all(TokenSpace.lg),
            children: [
              Text(
                key: const ValueKey('partner-console'),
                'Console partner',
                style: theme.textTheme.headlineMedium,
              ),
              const SizedBox(height: TokenSpace.sm),
              Text(
                'Ciao ${widget.session.user.displayName}. Siti del tuo portafoglio.',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: TokenSpace.lg),
              if (_loading) const Center(child: CircularProgressIndicator()),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: TokenSpace.sm),
                  child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                ),
              if (!_loading && sites != null)
                for (final site in sites)
                  Card(
                    key: ValueKey('partner-site-${site.siteId}'),
                    clipBehavior: Clip.antiAlias,
                    margin: const EdgeInsets.only(bottom: TokenSpace.sm),
                    shape: tokenDropShape(),
                    child: Padding(
                      padding: const EdgeInsets.all(TokenSpace.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(site.name, style: theme.textTheme.titleMedium),
                          const SizedBox(height: TokenSpace.xs),
                          Text(
                            '${site.customerOrgName} · ${_statusLabel(site.status)} · ${_accessLabel(site.access)}'
                            '${site.brandPackId == null ? '' : ' · brand ${site.brandPackId}'}',
                            style: theme.textTheme.bodySmall,
                          ),
                          const SizedBox(height: TokenSpace.sm),
                          Wrap(
                            spacing: TokenSpace.sm,
                            runSpacing: TokenSpace.sm,
                            children: [
                              if (site.canOpen)
                                FilledButton(
                                  key: ValueKey('open-site-${site.siteId}'),
                                  onPressed: _busySiteId == site.siteId
                                      ? null
                                      : () => widget.onOpenSite(site.siteId),
                                  child: const Text('Apri'),
                                ),
                              if (site.access == PartnerSiteAccess.grantRequired)
                                OutlinedButton(
                                  key: ValueKey('request-access-${site.siteId}'),
                                  onPressed: _busySiteId == site.siteId
                                      ? null
                                      : () => unawaited(
                                            _run(
                                              site.siteId,
                                              () async {
                                                await widget.host.requestPartnerSiteAccess(site.siteId);
                                              },
                                            ),
                                          ),
                                  child: const Text('Richiedi grant'),
                                ),
                              if (site.canOpen)
                                OutlinedButton(
                                  key: ValueKey('queue-package-${site.siteId}'),
                                  onPressed: _busySiteId == site.siteId
                                      ? null
                                      : () => unawaited(
                                            _run(
                                              site.siteId,
                                              () async {
                                                await widget.host.queueSitePackageUpdate(site.siteId);
                                              },
                                            ),
                                          ),
                                  child: const Text('Coda update'),
                                ),
                              if (site.canOpen && _canBrand)
                                OutlinedButton(
                                  key: ValueKey('apply-brand-${site.siteId}'),
                                  onPressed: _busySiteId == site.siteId
                                      ? null
                                      : () => unawaited(
                                            _run(
                                              site.siteId,
                                              () async {
                                                await widget.host.applyPartnerBrand(
                                                  siteId: site.siteId,
                                                  packId: 'garden',
                                                );
                                              },
                                            ),
                                          ),
                                  child: const Text('Brand Garden'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
              TextButton(
                key: const ValueKey('partner-console-logout'),
                onPressed: widget.onLogout,
                child: const Text('Esci'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SelectSiteScreen extends StatelessWidget {
  const SelectSiteScreen({
    super.key,
    required this.session,
    required this.onPick,
  });

  final AuthSession session;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: ListView(
            padding: const EdgeInsets.all(TokenSpace.lg),
            children: [
              Text('Scegli un sito', style: theme.textTheme.headlineMedium),
              const SizedBox(height: TokenSpace.sm),
              Text(
                'Ciao ${session.user.displayName}. Quale impianto vuoi aprire?',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: TokenSpace.lg),
              for (final site in session.sites)
                Card(
                  key: ValueKey('site-${site.siteId}'),
                  clipBehavior: Clip.antiAlias,
                  margin: const EdgeInsets.only(bottom: TokenSpace.sm),
                  shape: tokenDropShape(),
                  child: ListTile(
                    shape: tokenDropShape(),
                    hoverColor: tokenHoverFill(context),
                    title: Text(site.name),
                    subtitle: Text(
                      site.roles.map(siteRoleLabel).join(', '),
                      style: theme.textTheme.bodySmall,
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => onPick(site.siteId),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class AwaitingGrantScreen extends StatelessWidget {
  const AwaitingGrantScreen({
    super.key,
    required this.session,
    required this.onLogout,
  });

  final AuthSession session;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: ListView(
            padding: const EdgeInsets.all(TokenSpace.lg),
            children: [
              Text(
                key: const ValueKey('awaiting-grant'),
                'In attesa di Support Grant',
                style: theme.textTheme.headlineMedium,
              ),
              const SizedBox(height: TokenSpace.sm),
              Text(
                'Ciao ${session.user.displayName}. Un site admin deve approvare l’accesso remoto.',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: TokenSpace.lg),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  key: const ValueKey('awaiting-grant-logout'),
                  onPressed: onLogout,
                  child: const Text('Esci'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
