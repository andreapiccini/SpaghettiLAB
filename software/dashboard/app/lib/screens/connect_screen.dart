import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/app_states.dart';

class ConnectScreen extends StatelessWidget {
  const ConnectScreen({
    super.key,
    required this.systems,
    required this.onOpen,
    required this.onCreate,
    this.canCreate = true,
    this.loading = false,
    this.errorCode,
    this.onRetry,
  });

  final List<LabSystem> systems;
  final ValueChanged<LabSystem> onOpen;
  final Future<void> Function({required String name, String address}) onCreate;
  final bool canCreate;
  final bool loading;
  final String? errorCode;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (loading && systems.isEmpty) return const LoadingView();
    if (errorCode != null && systems.isEmpty) {
      return ErrorPanel(title: hostErrorTitle(errorCode!), onRetry: onRetry);
    }
    return ListView(
      padding: const EdgeInsets.all(TokenSpace.lg),
      children: [
        Text('Connessione', style: theme.textTheme.headlineMedium),
        const SizedBox(height: TokenSpace.sm),
        Text(
          'Casa demo, Core live (MQTT loopback) o un host cloud HOST_API: https://…/v1 oppure cloud://loopback.',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: TokenSpace.lg),
        Align(
          alignment: Alignment.centerLeft,
          child: FilledButton.icon(
            onPressed: canCreate ? () => _openAdd(context) : null,
            icon: const Icon(Icons.add),
            label: const Text('Aggiungi sistema'),
          ),
        ),
        const SizedBox(height: TokenSpace.lg),
        if (systems.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: TokenSpace.xl),
            child: EmptyState(
              title: 'Nessun sistema',
              body: 'Aggiungi un host per vedere la panoramica.',
            ),
          )
        else
          for (final system in systems)
            Card(
              clipBehavior: Clip.antiAlias,
              margin: const EdgeInsets.only(bottom: TokenSpace.sm),
              shape: tokenDropShape(),
              child: ListTile(
                shape: tokenDropShape(),
                hoverColor: tokenHoverFill(context),
                title: Text(system.name),
                subtitle: Text(
                  system.hostAddress ?? system.systemId,
                  style: theme.textTheme.bodySmall,
                ),
                trailing: _StatusDot(status: system.connectionState),
                onTap: () => onOpen(system),
              ),
            ),
      ],
    );
  }

  Future<void> _openAdd(BuildContext context) async {
    final name = TextEditingController();
    final address = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: tokenDropShape(),
      clipBehavior: Clip.antiAlias,
      builder: (ctx) {
        String? error;
        return StatefulBuilder(
          builder: (ctx, setLocal) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                TokenSpace.lg,
                TokenSpace.md,
                TokenSpace.lg,
                MediaQuery.of(ctx).viewInsets.bottom + TokenSpace.lg,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Aggiungi sistema', style: Theme.of(ctx).textTheme.titleMedium),
                  const SizedBox(height: TokenSpace.md),
                  TextField(
                    controller: name,
                    decoration: const InputDecoration(labelText: 'Nome'),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: TokenSpace.sm),
                  TextField(
                    controller: address,
                    decoration: const InputDecoration(
                      labelText: 'Indirizzo host',
                      hintText: 'mqtt://…/v1/cores/… oppure https://…/v1',
                    ),
                    textInputAction: TextInputAction.done,
                  ),
                  if (error != null) ...[
                    const SizedBox(height: TokenSpace.sm),
                    Text(error!, style: const TextStyle(color: TokenColors.error, fontSize: 12)),
                  ],
                  const SizedBox(height: TokenSpace.lg),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      onPressed: () {
                        if (name.text.trim().isEmpty) {
                          setLocal(() {
                            error = 'Il nome è obbligatorio';
                          });
                          return;
                        }
                        Navigator.pop(ctx, true);
                      },
                      child: const Text('Aggiungi'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    final n = name.text;
    final a = address.text;
    name.dispose();
    address.dispose();
    if (ok == true) {
      await onCreate(name: n, address: a);
    }
  }
}

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.status});

  final ConnectionStatus status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      ConnectionStatus.connected => (TokenColors.ok, 'Connesso'),
      ConnectionStatus.connecting => (TokenColors.warn, 'Connessione…'),
      ConnectionStatus.disconnected => (TokenColors.offline, 'Offline'),
      ConnectionStatus.error => (TokenColors.error, 'Errore'),
    };
    return Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600));
  }
}
