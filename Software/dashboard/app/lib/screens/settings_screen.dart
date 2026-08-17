import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../role_copy.dart';
import '../theme/spaghetti_theme.dart';
import '../widgets/drop_segmented.dart';

class SettingsScreen extends StatelessWidget {
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
  });

  final DashboardAppearance appearance;
  final LabSystem system;
  final SystemCapabilities capabilities;
  final ValueChanged<DisplayMode> onDisplayMode;
  final VoidCallback? onOpenAppearance;
  final VoidCallback? onOpenMarketplace;
  final AuthSession? session;
  final VoidCallback? onLogout;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(TokenSpace.lg),
      children: [
        Text('Impostazioni', style: theme.textTheme.headlineMedium),
        if (session != null) ...[
          const SizedBox(height: TokenSpace.lg),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(session!.user.displayName),
            subtitle: Text(
              [
                session!.user.email,
                if (session!.selectedSite != null)
                  '${session!.selectedSite!.name} · ${session!.selectedSite!.roles.map(siteRoleLabel).join(', ')}',
              ].join('\n'),
              style: theme.textTheme.bodySmall,
            ),
            isThreeLine: true,
            trailing: onLogout == null
                ? null
                : TextButton(
                    key: const ValueKey('logout'),
                    onPressed: onLogout,
                    child: const Text('Esci'),
                  ),
          ),
        ],
        const SizedBox(height: TokenSpace.lg),
        Text('Display', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        DropSegmented<DisplayMode>(
          segments: const [
            DropSegment(value: DisplayMode.normal, label: 'Normale'),
            DropSegment(value: DisplayMode.kiosk, label: 'Kiosk'),
            DropSegment(value: DisplayMode.compact, label: 'Compatto'),
          ],
          value: appearance.displayMode,
          onChanged: onDisplayMode,
        ),
        const SizedBox(height: TokenSpace.sm),
        Text(
          appearance.displayMode == DisplayMode.kiosk
              ? 'Kiosk: schermo pieno. L’occhio in basso a destra mostra o nasconde il menu.'
              : appearance.displayMode == DisplayMode.compact
                  ? 'Compatto: card più dense.'
                  : 'Normale: toolbar canvas completa.',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: TokenSpace.lg),
        Text('Host', style: theme.textTheme.titleMedium),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(system.name),
          subtitle: Text(system.hostAddress ?? system.systemId, style: theme.textTheme.bodySmall),
        ),
        const SizedBox(height: TokenSpace.md),
        Text('Scorciatoie', style: theme.textTheme.titleMedium),
        if (onOpenAppearance != null)
          ListTile(
            contentPadding: EdgeInsets.zero,
            hoverColor: tokenHoverFill(context),
            title: const Text('Aspetto'),
            trailing: const Icon(Icons.chevron_right),
            onTap: onOpenAppearance,
          ),
        if (onOpenMarketplace != null && capabilities.marketplace)
          ListTile(
            contentPadding: EdgeInsets.zero,
            hoverColor: tokenHoverFill(context),
            title: const Text('Marketplace'),
            trailing: const Icon(Icons.chevron_right),
            onTap: onOpenMarketplace,
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
      ],
    );
  }
}
