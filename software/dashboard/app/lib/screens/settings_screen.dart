import 'dart:async';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../role_copy.dart';
import '../theme/spaghetti_theme.dart';
import '../widgets/drop_segmented.dart';

enum _SettingsPane { display, users, support }

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.appearance,
    required this.system,
    required this.capabilities,
    required this.onDisplayMode,
    required this.onOpenAppearance,
    required this.onOpenMarketplace,
    this.session,
    this.onLogout,
    this.host,
    this.siteId,
    this.canManageUsers = false,
    this.canApproveSupport = false,
    this.canSeeSupportSession = false,
  });

  final DashboardAppearance appearance;
  final LabSystem system;
  final SystemCapabilities capabilities;
  final ValueChanged<DisplayMode> onDisplayMode;
  final VoidCallback? onOpenAppearance;
  final VoidCallback? onOpenMarketplace;
  final AuthSession? session;
  final VoidCallback? onLogout;
  final HostPort? host;
  final String? siteId;
  final bool canManageUsers;
  final bool canApproveSupport;
  final bool canSeeSupportSession;

  bool get canSeeSupport => canApproveSupport || canSeeSupportSession;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  var _pane = _SettingsPane.display;
  List<SiteUser>? _users;
  List<SiteSession>? _sessions;
  List<SupportGrant>? _grants;
  String? _usersError;
  String? _grantsError;
  var _usersBusy = false;
  var _grantsBusy = false;

  bool get _showSwitcher => widget.canManageUsers || widget.canSeeSupport;

  @override
  void initState() {
    super.initState();
    if (widget.canManageUsers) {
      unawaited(_loadUsers());
    }
    if (widget.canSeeSupport) {
      unawaited(_loadGrants());
    }
  }

  @override
  void didUpdateWidget(SettingsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_pane == _SettingsPane.users && !widget.canManageUsers) {
      _pane = _SettingsPane.display;
    }
    if (_pane == _SettingsPane.support && !widget.canSeeSupport) {
      _pane = _SettingsPane.display;
    }
    if (widget.canManageUsers &&
        (oldWidget.siteId != widget.siteId || oldWidget.host != widget.host || !oldWidget.canManageUsers)) {
      unawaited(_loadUsers());
    }
    if (widget.canSeeSupport &&
        (oldWidget.siteId != widget.siteId ||
            oldWidget.host != widget.host ||
            !oldWidget.canSeeSupport)) {
      unawaited(_loadGrants());
    }
  }

  Future<void> _loadUsers() async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null || siteId.isEmpty) {
      setState(() {
        _users = const [];
        _sessions = const [];
        _usersError = 'Sito non disponibile';
        _usersBusy = false;
      });
      return;
    }
    setState(() {
      _usersBusy = true;
      _usersError = null;
    });
    try {
      final users = await host.listSiteUsers(siteId);
      final sessions = await host.listSiteSessions(siteId);
      if (!mounted) return;
      setState(() {
        _users = users;
        _sessions = sessions;
        _usersBusy = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _usersBusy = false;
        _usersError = _hostMessage(error);
      });
    }
  }

  Future<void> _loadGrants() async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null || siteId.isEmpty) {
      setState(() {
        _grants = const [];
        _grantsError = 'Sito non disponibile';
        _grantsBusy = false;
      });
      return;
    }
    setState(() {
      _grantsBusy = true;
      _grantsError = null;
    });
    try {
      final grants = await host.listSupportGrants(siteId);
      if (!mounted) return;
      setState(() {
        _grants = grants;
        _grantsBusy = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _grantsBusy = false;
        _grantsError = _hostMessage(error);
      });
    }
  }

  Future<void> _invite() async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null) return;
    final invite = await showDialog<SiteInvite>(
      context: context,
      builder: (ctx) => _InviteUserDialog(
        onSubmit: (email, role) => host.inviteSiteUser(siteId: siteId, email: email, role: role),
      ),
    );
    if (invite == null || !mounted) return;
    await _loadUsers();
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Invito inviato'),
        content: Text('Link: ${invite.link}'),
        actions: [
          FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Ok')),
        ],
      ),
    );
  }

  Future<void> _revoke(SiteUser user) async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Revocare ${user.displayName}?'),
        content: const Text('Perde l’accesso a questo sito. Le sessioni attive vengono chiuse.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annulla')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Revoca')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await host.revokeSiteUser(siteId: siteId, userId: user.userId);
      await _loadUsers();
    } catch (error) {
      if (!mounted) return;
      await _alert(_hostMessage(error));
    }
  }

  Future<void> _requestSupport() async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null) return;
    try {
      await host.requestSupportGrant(siteId);
      await _loadGrants();
    } catch (error) {
      if (!mounted) return;
      await _alert(_hostMessage(error));
    }
  }

  Future<void> _approveGrant(SupportGrant grant) async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null) return;
    try {
      await host.approveSupportGrant(siteId: siteId, grantId: grant.grantId);
      await _loadGrants();
    } catch (error) {
      if (!mounted) return;
      await _alert(_hostMessage(error));
    }
  }

  Future<void> _revokeGrant(SupportGrant grant) async {
    final host = widget.host;
    final siteId = widget.siteId;
    if (host == null || siteId == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Revocare il grant?'),
        content: const Text('La sessione di supporto viene chiusa.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annulla')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Revoca')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await host.revokeSupportGrant(siteId: siteId, grantId: grant.grantId);
      await _loadGrants();
    } catch (error) {
      if (!mounted) return;
      await _alert(_hostMessage(error));
    }
  }

  Future<void> _alert(String message) {
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supporto'),
        content: Text(message),
        actions: [
          FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Ok')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = widget.session;
    final segments = <DropSegment<_SettingsPane>>[
      const DropSegment(value: _SettingsPane.display, label: 'Display'),
      if (widget.canManageUsers) const DropSegment(value: _SettingsPane.users, label: 'Utenti'),
      if (widget.canSeeSupport) const DropSegment(value: _SettingsPane.support, label: 'Supporto'),
    ];
    return ListView(
      key: const ValueKey('settings-list'),
      padding: const EdgeInsets.fromLTRB(TokenSpace.lg, TokenSpace.lg, TokenSpace.lg, TokenSpace.xl * 3),
      children: [
        Text('Impostazioni', style: theme.textTheme.headlineMedium),
        if (session != null) ...[
          const SizedBox(height: TokenSpace.lg),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(session.user.displayName),
            subtitle: Text(
              [
                session.user.email,
                if (session.selectedSite != null)
                  '${session.selectedSite!.name} · ${session.selectedSite!.roles.map(siteRoleLabel).join(', ')}',
              ].join('\n'),
              style: theme.textTheme.bodySmall,
            ),
            isThreeLine: true,
            trailing: widget.onLogout == null
                ? null
                : TextButton(
                    key: const ValueKey('logout'),
                    onPressed: widget.onLogout,
                    child: const Text('Esci'),
                  ),
          ),
        ],
        if (_showSwitcher) ...[
          const SizedBox(height: TokenSpace.lg),
          DropSegmented<_SettingsPane>(
            segments: segments,
            value: _pane,
            onChanged: (pane) => setState(() => _pane = pane),
          ),
        ],
        if (!_showSwitcher || _pane == _SettingsPane.display)
          ..._displayPane(theme)
        else if (_pane == _SettingsPane.users)
          ..._usersPane(theme)
        else
          ..._supportPane(theme),
      ],
    );
  }

  List<Widget> _displayPane(ThemeData theme) {
    return [
      const SizedBox(height: TokenSpace.lg),
      if (!_showSwitcher) Text('Display', style: theme.textTheme.titleMedium),
      if (!_showSwitcher) const SizedBox(height: TokenSpace.sm),
      DropSegmented<DisplayMode>(
        segments: const [
          DropSegment(value: DisplayMode.normal, label: 'Normale'),
          DropSegment(value: DisplayMode.kiosk, label: 'Kiosk'),
          DropSegment(value: DisplayMode.compact, label: 'Compatto'),
        ],
        value: widget.appearance.displayMode,
        onChanged: widget.onDisplayMode,
      ),
      const SizedBox(height: TokenSpace.sm),
      Text(
        widget.appearance.displayMode == DisplayMode.kiosk
            ? 'Kiosk: schermo pieno. L’occhio in basso a destra mostra o nasconde il menu.'
            : widget.appearance.displayMode == DisplayMode.compact
                ? 'Compatto: card più dense.'
                : 'Normale: toolbar canvas completa.',
        style: theme.textTheme.bodySmall,
      ),
      const SizedBox(height: TokenSpace.lg),
      Text('Host', style: theme.textTheme.titleMedium),
      ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(widget.system.name),
        subtitle: Text(widget.system.hostAddress ?? widget.system.systemId, style: theme.textTheme.bodySmall),
      ),
      const SizedBox(height: TokenSpace.md),
      Text('Scorciatoie', style: theme.textTheme.titleMedium),
      if (widget.onOpenAppearance != null)
        ListTile(
          contentPadding: EdgeInsets.zero,
          hoverColor: tokenHoverFill(context),
          title: const Text('Aspetto'),
          trailing: const Icon(Icons.chevron_right),
          onTap: widget.onOpenAppearance,
        ),
      if (widget.onOpenMarketplace != null && widget.capabilities.marketplace)
        ListTile(
          contentPadding: EdgeInsets.zero,
          hoverColor: tokenHoverFill(context),
          title: const Text('Marketplace'),
          trailing: const Icon(Icons.chevron_right),
          onTap: widget.onOpenMarketplace,
        ),
      const SizedBox(height: TokenSpace.md),
      Text('Info', style: theme.textTheme.titleMedium),
      const ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text('Dashboard SpaghettiLAB'),
        subtitle: Text('Versione 0.1.0 · fase 1 cards'),
      ),
      ListTile(
        contentPadding: EdgeInsets.zero,
        title: const Text('Automazioni e integrazioni'),
        subtitle: Text(
          'Telegram e regole vivono fuori da questa app.',
          style: theme.textTheme.bodySmall,
        ),
      ),
    ];
  }

  List<Widget> _usersPane(ThemeData theme) {
    final selfId = widget.session?.user.userId;
    return [
      const SizedBox(height: TokenSpace.lg),
      Row(
        children: [
          Expanded(child: Text('Persone del sito', style: theme.textTheme.titleMedium)),
          FilledButton(
            key: const ValueKey('invite-user'),
            onPressed: _usersBusy ? null : _invite,
            child: const Text('Invita'),
          ),
        ],
      ),
      const SizedBox(height: TokenSpace.sm),
      Text(
        'Puoi invitare visitatori e operatori. L’integratore si crea solo con una policy host.',
        style: theme.textTheme.bodySmall,
      ),
      if (_usersError != null)
        Padding(
          padding: const EdgeInsets.only(top: TokenSpace.sm),
          child: Text(_usersError!, style: theme.textTheme.bodySmall?.copyWith(color: TokenColors.error)),
        ),
      if (_usersBusy && _users == null)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: TokenSpace.lg),
          child: Center(child: CircularProgressIndicator()),
        ),
      for (final user in _users ?? const <SiteUser>[])
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(user.displayName),
          subtitle: Text(
            '${user.email}\n${siteRoleLabel(user.role)} · ${_statusLabel(user.status)}',
            style: theme.textTheme.bodySmall,
          ),
          isThreeLine: true,
          trailing: user.userId == selfId || user.status == SiteUserStatus.revoked
              ? null
              : TextButton(
                  key: ValueKey('revoke-user-${user.userId}'),
                  onPressed: _usersBusy ? null : () => unawaited(_revoke(user)),
                  child: const Text('Revoca'),
                ),
        ),
      const SizedBox(height: TokenSpace.lg),
      Text('Sessioni attive', style: theme.textTheme.titleMedium),
      const SizedBox(height: TokenSpace.sm),
      Text('Solo lettura. La revoca chiude le sessioni di quella persona.', style: theme.textTheme.bodySmall),
      if ((_sessions ?? const <SiteSession>[]).isEmpty)
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Nessuna sessione', style: theme.textTheme.bodySmall),
        ),
      for (final session in _sessions ?? const <SiteSession>[])
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(session.email),
          subtitle: Text(
            [
              session.device,
              _formatSeen(session.lastSeen),
              if (session.current) 'Questa sessione',
            ].join(' · '),
            style: theme.textTheme.bodySmall,
          ),
        ),
    ];
  }

  List<Widget> _supportPane(ThemeData theme) {
    return [
      const SizedBox(height: TokenSpace.lg),
      Row(
        children: [
          Expanded(child: Text('Support Grant', style: theme.textTheme.titleMedium)),
          if (widget.canApproveSupport)
            FilledButton(
              key: const ValueKey('request-support'),
              onPressed: _grantsBusy ? null : () => unawaited(_requestSupport()),
              child: const Text('Richiedi'),
            ),
        ],
      ),
      const SizedBox(height: TokenSpace.sm),
      Text(
        'Accesso remoto SpaghettiLAB solo dopo approvazione. Scade o si revoca.',
        style: theme.textTheme.bodySmall,
      ),
      if (_grantsError != null)
        Padding(
          padding: const EdgeInsets.only(top: TokenSpace.sm),
          child: Text(_grantsError!, style: theme.textTheme.bodySmall?.copyWith(color: TokenColors.error)),
        ),
      if (_grantsBusy && _grants == null)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: TokenSpace.lg),
          child: Center(child: CircularProgressIndicator()),
        ),
      if (!_grantsBusy && (_grants ?? const <SupportGrant>[]).isEmpty)
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Nessun grant', style: theme.textTheme.bodySmall),
        ),
      for (final grant in _grants ?? const <SupportGrant>[]) ...[
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(grant.requesterEmail),
          subtitle: Text(
            [
              _grantStatusLabel(grant.status),
              if (grant.approvedByEmail != null) 'da ${grant.approvedByEmail}',
              if (grant.expiresAt != null) 'scade ${_formatSeen(grant.expiresAt!)}',
            ].join(' · '),
            style: theme.textTheme.bodySmall,
          ),
        ),
        if (grant.status == SupportGrantStatus.pending || grant.status == SupportGrantStatus.approved)
          Align(
            alignment: Alignment.centerLeft,
            child: Wrap(
              spacing: TokenSpace.sm,
              children: [
                if (widget.canApproveSupport && grant.status == SupportGrantStatus.pending)
                  TextButton(
                    key: ValueKey('approve-grant-${grant.grantId}'),
                    onPressed: _grantsBusy ? null : () => unawaited(_approveGrant(grant)),
                    child: const Text('Approva'),
                  ),
                TextButton(
                  key: ValueKey('revoke-grant-${grant.grantId}'),
                  onPressed: _grantsBusy ? null : () => unawaited(_revokeGrant(grant)),
                  child: const Text('Revoca'),
                ),
              ],
            ),
          ),
      ],
    ];
  }
}

class _InviteUserDialog extends StatefulWidget {
  const _InviteUserDialog({required this.onSubmit});

  final Future<SiteInvite> Function(String email, SiteRole role) onSubmit;

  @override
  State<_InviteUserDialog> createState() => _InviteUserDialogState();
}

class _InviteUserDialogState extends State<_InviteUserDialog> {
  final _email = TextEditingController();
  var _role = SiteRole.viewer;
  var _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Inserisci un’email.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final invite = await widget.onSubmit(email, _role);
      if (!mounted) return;
      Navigator.pop(context, invite);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = _hostMessage(error);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Invita al sito'),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              key: const ValueKey('invite-email'),
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofocus: true,
              enabled: !_busy,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: TokenSpace.md),
            DropSegmented<SiteRole>(
              segments: const [
                DropSegment(value: SiteRole.viewer, label: 'Visitatore'),
                DropSegment(value: SiteRole.operator, label: 'Operatore'),
              ],
              value: _role,
              onChanged: (role) {
                if (!_busy) setState(() => _role = role);
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: TokenSpace.sm),
              Text(_error!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: TokenColors.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _busy ? null : () => Navigator.pop(context), child: const Text('Annulla')),
        FilledButton(
          key: const ValueKey('invite-submit'),
          onPressed: _busy ? null : _submit,
          child: const Text('Invita'),
        ),
      ],
    );
  }
}

String _statusLabel(SiteUserStatus status) => switch (status) {
      SiteUserStatus.active => 'Attivo',
      SiteUserStatus.invited => 'Invitato',
      SiteUserStatus.revoked => 'Revocato',
    };

String _grantStatusLabel(SupportGrantStatus status) => switch (status) {
      SupportGrantStatus.pending => 'In attesa',
      SupportGrantStatus.approved => 'Sessione attiva',
      SupportGrantStatus.revoked => 'Revocato',
      SupportGrantStatus.expired => 'Scaduto',
    };

String _formatSeen(DateTime at) {
  final local = at.toLocal();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(local.day)}/${two(local.month)}/${local.year} ${two(local.hour)}:${two(local.minute)}';
}

String _hostMessage(Object error) {
  if (error is HostException && (error.message ?? '').isNotEmpty) return error.message!;
  return 'Operazione non riuscita';
}
