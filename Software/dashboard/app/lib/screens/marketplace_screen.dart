import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/app_states.dart';

class MarketplaceScreen extends StatelessWidget {
  const MarketplaceScreen({
    super.key,
    required this.packs,
    required this.onApply,
    this.cardStyles = const [],
    this.onInstallStyle,
    this.onInstallExample,
    this.onInstallStore,
    this.onEditStyle,
    this.onCreateStyle,
  });

  final List<VisualPackSummary> packs;
  final List<CardStyle> cardStyles;
  final ValueChanged<String> onApply;
  final Future<void> Function(String styleId)? onInstallStyle;
  final Future<void> Function()? onInstallExample;
  final Future<void> Function(String packId)? onInstallStore;
  final Future<void> Function(CardStyle style)? onEditStyle;
  final VoidCallback? onCreateStyle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (packs.isEmpty && cardStyles.isEmpty) {
      return const EmptyState(title: 'Nessun pack', body: 'Il catalogo arriverà dall’host.');
    }
    return ListView(
      key: const ValueKey('marketplace-list'),
      cacheExtent: 8000,
      padding: const EdgeInsets.all(TokenSpace.lg),
      children: [
        Text('Marketplace', style: theme.textTheme.headlineMedium),
        const SizedBox(height: TokenSpace.sm),
        Text(
          'Stili card e pack tema. Lo store verifica la firma Ed25519; niente eval Dart e niente pagamento.',
          style: theme.textTheme.bodySmall,
        ),
        if (onInstallExample != null) ...[
          const SizedBox(height: TokenSpace.lg),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton(
              onPressed: () async {
                await onInstallExample?.call();
              },
              child: const Text('Installa esempio SDK'),
            ),
          ),
        ],
        if (cardStyles.isNotEmpty) ...[
          const SizedBox(height: TokenSpace.lg),
          Text('Stili card', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          if (onCreateStyle != null)
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton.icon(
                key: const ValueKey('card-style-new'),
                onPressed: onCreateStyle,
                icon: const Icon(Icons.add),
                label: const Text('Nuovo stile'),
              ),
            ),
          if (onCreateStyle != null) const SizedBox(height: TokenSpace.sm),
          for (final style in cardStyles)
            _StyleTile(
              style: style,
              onInstall: onInstallStyle,
              onEdit: onEditStyle == null ? null : () => onEditStyle!(style),
            ),
        ],
        if (packs.isNotEmpty) ...[
          const SizedBox(height: TokenSpace.lg),
          Text('Pack tema', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          Text(
            'Industrial apre lo schema; Garden resta sulle cards.',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: TokenSpace.md),
          for (final pack in packs)
            Card(
              clipBehavior: Clip.antiAlias,
              margin: const EdgeInsets.only(bottom: TokenSpace.md),
              shape: tokenDropShape(),
              child: Padding(
                padding: const EdgeInsets.all(TokenSpace.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pack.name, style: theme.textTheme.titleMedium),
                    const SizedBox(height: TokenSpace.xs),
                    Text(pack.blurb, style: theme.textTheme.bodySmall),
                    const SizedBox(height: TokenSpace.sm),
                    Wrap(
                      spacing: TokenSpace.sm,
                      runSpacing: TokenSpace.xs,
                      children: [
                        for (final tag in _tags(pack))
                          Chip(label: Text(tag), visualDensity: VisualDensity.compact),
                      ],
                    ),
                    const SizedBox(height: TokenSpace.sm),
                    Align(
                      alignment: Alignment.centerRight,
                      child: pack.installed
                          ? FilledButton(
                              onPressed: () => _confirm(context, pack),
                              child: const Text('Applica'),
                            )
                          : FilledButton(
                              key: ValueKey('store-install-${pack.packId}'),
                              onPressed: onInstallStore == null ? null : () => onInstallStore!(pack.packId),
                              child: const Text('Installa'),
                            ),
                    ),
                  ],
                ),
              ),
            ),
        ],
        Text(
          'Chi programma: JSON Visual Pack + install locale. Store: solo pack firmati, renderer builtin.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }

  Future<void> _confirm(BuildContext context, VisualPackSummary pack) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Applicare ${pack.name}?'),
        content: Text(
            pack.teaserViewMode == 'schematic'
              ? 'Applica tema e apre lo schema.'
              : 'Aggiorna colori e brand. La vista resta cards.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annulla')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Applica')),
        ],
      ),
    );
    if (ok == true) onApply(pack.packId);
  }

  static List<String> _tags(VisualPackSummary pack) {
    return [
      'Cards',
      if (pack.signed) 'Firmato',
      if (!pack.installed) 'Store',
      if (pack.source == PackSource.local) 'Locale',
      if (pack.source == PackSource.developer) 'Dev',
      if (pack.packId == 'industrial') 'Industrial',
      if (pack.packId == 'garden') 'Garden',
      if (pack.packId == 'walk') 'Walk',
    ];
  }
}

class _StyleTile extends StatelessWidget {
  const _StyleTile({required this.style, this.onInstall, this.onEdit});

  final CardStyle style;
  final Future<void> Function(String styleId)? onInstall;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: TokenSpace.md),
      shape: tokenDropShape(),
      child: Padding(
        padding: const EdgeInsets.all(TokenSpace.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(style.name, style: theme.textTheme.titleMedium),
                  const SizedBox(height: TokenSpace.xs),
                  Text(style.blurb, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: TokenSpace.sm),
            if (style.installed)
              FilledButton.tonal(
                onPressed: onEdit,
                child: const Text('Modifica'),
              )
            else
              FilledButton(
                onPressed: onInstall == null ? null : () => onInstall!(style.styleId),
                child: const Text('Scarica'),
              ),
          ],
        ),
      ),
    );
  }
}
