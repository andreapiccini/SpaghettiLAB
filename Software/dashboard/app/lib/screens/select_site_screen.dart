import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../role_copy.dart';
import '../theme/spaghetti_theme.dart';

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
