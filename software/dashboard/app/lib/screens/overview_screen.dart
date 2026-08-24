import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/app_states.dart';
import '../widgets/glass.dart';

class OverviewScreen extends StatelessWidget {
  const OverviewScreen({
    super.key,
    required this.system,
    required this.points,
    required this.onOpenCanvas,
    this.onOpenAppearance,
    this.onOpenMarketplace,
    required this.onOpenSettings,
    this.onOpenPoint,
    this.onRefresh,
  });

  final LabSystem system;
  final List<ExposurePoint> points;
  final VoidCallback onOpenCanvas;
  final VoidCallback? onOpenAppearance;
  final VoidCallback? onOpenMarketplace;
  final VoidCallback onOpenSettings;
  final ValueChanged<ExposurePoint>? onOpenPoint;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final online = system.connectionState == ConnectionStatus.connected;
    final alarms = points.where((p) => p.visualState == 'alarm' || (p.visualHint == VisualHint.status && p.value == true)).toList();
    return RefreshIndicator(
      onRefresh: onRefresh ?? () async {},
      child: ListView(
      padding: const EdgeInsets.all(TokenSpace.lg),
      children: [
        if (!online) ...[
          const OfflineBanner(),
          const SizedBox(height: TokenSpace.md),
        ],
        Row(
          children: [
            Expanded(child: Text(system.name, style: theme.textTheme.headlineMedium)),
            _StatusPill(online: online, alarm: alarms.isNotEmpty),
          ],
        ),
        const SizedBox(height: TokenSpace.sm),
        Text('${points.length} punti esposti', style: theme.textTheme.bodySmall),
        const SizedBox(height: TokenSpace.lg),
        GlassCard(
          child: Text(
            alarms.isEmpty ? 'Nessun allarme' : '${alarms.length} allarmi attivi',
            style: theme.textTheme.bodyMedium?.copyWith(color: alarms.isEmpty ? TokenColors.ok : TokenColors.error),
          ),
        ),
        const SizedBox(height: TokenSpace.lg),
        Text('Apri', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        Wrap(
          spacing: TokenSpace.sm,
          runSpacing: TokenSpace.sm,
          children: [
            _Shortcut(icon: Icons.grid_view_rounded, label: 'Canvas', onTap: onOpenCanvas),
            if (onOpenAppearance != null)
              _Shortcut(icon: Icons.palette_outlined, label: 'Aspetto', onTap: onOpenAppearance!),
            if (onOpenMarketplace != null)
              _Shortcut(icon: Icons.storefront_outlined, label: 'Marketplace', onTap: onOpenMarketplace!),
            _Shortcut(icon: Icons.tune, label: 'Impostazioni', onTap: onOpenSettings),
          ],
        ),
        const SizedBox(height: TokenSpace.lg),
        Wrap(
          spacing: TokenSpace.sm,
          runSpacing: TokenSpace.sm,
          children: [
            for (final point in points.take(6))
              ActionChip(
                label: Text('${point.label}: ${_short(point)}'),
                onPressed: onOpenPoint == null ? null : () => onOpenPoint!(point),
              ),
          ],
        ),
      ],
      ),
    );
  }

  static String _short(ExposurePoint point) {
    if (point.visualState != null) return point.visualState!;
    final value = point.value;
    if (value is double) return value.toStringAsFixed(1);
    return value?.toString() ?? '—';
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.online, required this.alarm});

  final bool online;
  final bool alarm;

  @override
  Widget build(BuildContext context) {
    final color = !online ? TokenColors.offline : alarm ? TokenColors.warn : TokenColors.ok;
    final label = !online ? 'Offline' : alarm ? 'Attenzione' : 'Ok';
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

class _Shortcut extends StatelessWidget {
  const _Shortcut({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 160,
      child: Material(
        color: Colors.transparent,
        shape: tokenDropShape(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          customBorder: tokenDropShape(),
          overlayColor: tokenInkOverlayOf(context),
          child: GlassCard(
            child: Row(
              children: [
                Icon(icon, color: TokenColors.accent, size: 20),
                const SizedBox(width: TokenSpace.sm),
                Expanded(
                  child: Text(label, style: theme.textTheme.titleMedium, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
