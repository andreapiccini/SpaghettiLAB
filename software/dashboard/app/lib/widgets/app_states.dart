import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.label = 'Caricamento…'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          const SizedBox(height: TokenSpace.md),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.body,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? body;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(TokenSpace.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
            if (body != null) ...[
              const SizedBox(height: TokenSpace.sm),
              Text(body!, style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: TokenSpace.md),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, this.message = 'Host non raggiungibile'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: TokenColors.offline.withValues(alpha: 0.2),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: TokenSpace.md, vertical: TokenSpace.sm),
        child: Row(
          children: [
            const Icon(Icons.cloud_off_outlined, size: 18, color: TokenColors.offline),
            const SizedBox(width: TokenSpace.sm),
            Expanded(child: Text(message, style: Theme.of(context).textTheme.bodySmall)),
          ],
        ),
      ),
    );
  }
}

class ErrorPanel extends StatelessWidget {
  const ErrorPanel({
    super.key,
    required this.title,
    this.body,
    this.onRetry,
  });

  final String title;
  final String? body;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(TokenSpace.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, style: theme.textTheme.titleMedium?.copyWith(color: TokenColors.error)),
            if (body != null) ...[
              const SizedBox(height: TokenSpace.sm),
              Text(body!, style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: TokenSpace.md),
              FilledButton(onPressed: onRetry, child: const Text('Riprova')),
            ],
          ],
        ),
      ),
    );
  }
}

class AlarmChip extends StatelessWidget {
  const AlarmChip({super.key, required this.label, this.active = true});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? TokenColors.error : TokenColors.ok;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: TokenSpace.sm, vertical: TokenSpace.xs),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.16),
        borderRadius: tokenCardRadius(),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

/// Maps HOST_API error codes to copy shown by [ErrorPanel].
String hostErrorTitle(String code) {
  return switch (code) {
    'offline' => 'Host non raggiungibile',
    'unauthorized' => 'Accesso non consentito',
    'internal' => 'Errore interno',
    _ => 'Qualcosa non ha funzionato',
  };
}
