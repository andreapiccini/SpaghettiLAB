import 'dart:async';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../role_copy.dart';
import '../theme/spaghetti_theme.dart';
import '../widgets/drop_segmented.dart';

enum _SettingsPane { display, users }

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
    this.canRequestSupport = false,
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
  final bool canRequestSupport;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  var _pane = _SettingsPane.display;
  List<SiteUser>? _users;
  List<SiteSession>? _sessions;
  String? _usersError;
  var _usersBusy = false;

  @override
  void initState() {
    super.initState();
    if (widget.canManageUsers) {
      unawaited(_loadUsers());
    }
  }

  @override
  void didUpdateWidget(SettingsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.canManageUsers && _pane == _SettingsPane.users) {
      _pane = _SettingsPane.display;
    }
    if (widget.canManageUsers &&
        (oldWidget.siteId != widget.siteId || oldWidget.host != widget.host || !oldWidget.canManageUsers)) {
      unawaited(_loadUsers());
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
      final request = await host.requestSupport(siteId);
      if (!mounted) return;
      await _alert(request.message);
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
        if (widget.canManageUsers) ...[
          const SizedBox(height: TokenSpace.lg),
          DropSegmented<_SettingsPane>(
            segments: const [
              DropSegment(value: _SettingsPane.display, label: 'Display'),
              DropSegment(value: _SettingsPane.users, label: 'Utenti'),
            ],
            value: _pane,
            onChanged: (pane) => setState(() => _pane = pane),
          ),
        ],
        if (!widget.canManageUsers || _pane == _SettingsPane.display) ..._displayPane(theme) else ..._usersPane(theme),
      ],
    );
  }

  List<Widget> _displayPane(ThemeData theme) {
    return [
      const SizedBox(height: TokenSpace.lg),
      if (!widget.canManageUsers) Text('Display', style: theme.textTheme.titleMedium),
      if (!widget.canManageUsers) const SizedBox(height: TokenSpace.sm),
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
      if (widget.canRequestSupport) ...[
        const SizedBox(height: TokenSpace.lg),
        ListTile(
          key: const ValueKey('request-support'),
          contentPadding: EdgeInsets.zero,
          hoverColor: tokenHoverFill(context),
          title: const Text('Richiedi supporto SpaghettiLAB'),
          subtitle: Text(
            'Apre il flusso Support Grant quando sarà disponibile.',
            style: theme.textTheme.bodySmall,
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: _usersBusy ? null : () => unawaited(_requestSupport()),
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

String _formatSeen(DateTime at) {
  final local = at.toLocal();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(local.day)}/${two(local.month)}/${local.year} ${two(local.hour)}:${two(local.minute)}';
}

String _hostMessage(Object error) {
  if (error is HostException && (error.message ?? '').isNotEmpty) return error.message!;
  return 'Operazione non riuscita';
}
