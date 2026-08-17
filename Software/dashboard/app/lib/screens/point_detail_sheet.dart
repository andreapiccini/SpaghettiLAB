import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/gauge_body.dart';
import '../widgets/pump_glyph.dart';

class PointDetailSheet extends StatelessWidget {
  const PointDetailSheet({
    super.key,
    required this.point,
    required this.appearance,
    this.onCommand,
    this.history = const [],
  });

  final ExposurePoint point;
  final DashboardAppearance appearance;
  final ValueChanged<Object>? onCommand;
  final List<HistorySample> history;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final running = point.visualState == 'running';
    final stamp = point.updatedAt;
    final samples = [for (final s in history) s.value];
    return Padding(
      padding: const EdgeInsets.fromLTRB(TokenSpace.lg, TokenSpace.sm, TokenSpace.lg, TokenSpace.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 32,
              height: 4,
              margin: const EdgeInsets.only(bottom: TokenSpace.md),
              decoration: BoxDecoration(color: theme.dividerColor, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          Text(point.label, style: theme.textTheme.titleMedium),
          Text(
            stamp == null ? '—' : 'Aggiornato ${_fmt(stamp)}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: TokenSpace.lg),
          if (point.visualHint == VisualHint.animated)
            Center(child: PumpGlyph(running: running, profile: appearance.animationProfile))
          else if (point.visualHint == VisualHint.gauge)
            Center(child: GaugeBody(value: _num(point.value), unit: point.unit, max: point.unit == 'lux' ? 1000 : 40))
          else
            Text.rich(
              TextSpan(
                text: _fmtValue(point.value),
                style: theme.textTheme.displayLarge,
                children: [
                  if (point.unit != null) TextSpan(text: ' ${point.unit}', style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          const SizedBox(height: TokenSpace.md),
          Text('Storico', style: theme.textTheme.bodySmall),
          SizedBox(
            height: 64,
            child: samples.length < 2
                ? Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Nessun dato recente', style: theme.textTheme.bodySmall),
                  )
                : SparklineBody(value: _num(point.value), unit: point.unit, samples: samples),
          ),
          if (point.writable) ...[
            const SizedBox(height: TokenSpace.lg),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(running || point.value == true ? 'Acceso' : 'Spento'),
              value: running || point.value == true,
              onChanged: onCommand == null ? null : (v) => onCommand!(v),
            ),
          ],
        ],
      ),
    );
  }

  static String _fmt(DateTime t) {
    final l = t.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(l.hour)}:${two(l.minute)}:${two(l.second)}';
  }

  static double _num(Object? value) {
    if (value is num) return value.toDouble();
    return 0;
  }

  static String _fmtValue(Object? value) {
    if (value is double) return value.toStringAsFixed(1);
    if (value == null) return '—';
    return value.toString();
  }
}

Future<void> openPointDetail(
  BuildContext context, {
  required ExposurePoint point,
  required DashboardAppearance appearance,
  ValueChanged<Object>? onCommand,
  Future<List<HistorySample>> Function()? loadHistory,
}) async {
  final history = loadHistory == null ? const <HistorySample>[] : await loadHistory();
  if (!context.mounted) return;
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Theme.of(context).brightness == Brightness.light
        ? const Color(0xF2FFFFFF)
        : Theme.of(context).colorScheme.surface,
    shape: tokenDropShape(),
    clipBehavior: Clip.antiAlias,
    isScrollControlled: true,
    builder: (context) => PointDetailSheet(
      point: point,
      appearance: appearance,
      onCommand: onCommand,
      history: history,
    ),
  );
}
