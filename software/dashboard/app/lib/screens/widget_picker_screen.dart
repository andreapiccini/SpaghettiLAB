import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/app_states.dart';

class PickedWidget {
  const PickedWidget({required this.point, required this.style});

  final ExposurePoint point;
  final CardStyle style;
}

class WidgetPickerScreen extends StatefulWidget {
  const WidgetPickerScreen({
    super.key,
    required this.points,
    this.onCanvas = const {},
    this.cardStyles = const [],
    this.onInstallStyle,
  });

  final List<ExposurePoint> points;
  final Set<String> onCanvas;
  final List<CardStyle> cardStyles;
  final Future<void> Function(String styleId)? onInstallStyle;

  @override
  State<WidgetPickerScreen> createState() => _WidgetPickerScreenState();
}

class _WidgetPickerScreenState extends State<WidgetPickerScreen> {
  String _query = '';
  ExposurePoint? _selected;
  CardStyle? _style;
  late List<CardStyle> _styles = List.of(widget.cardStyles);
  bool _installing = false;

  List<ExposurePoint> get _filtered {
    final q = _query.trim().toLowerCase();
    return [
      for (final p in widget.points)
        if (q.isEmpty || p.label.toLowerCase().contains(q)) p,
    ];
  }

  List<CardStyle> _forPoint(ExposurePoint point, {required bool installed}) {
    return [for (final s in _styles) if (s.installed == installed && s.fits(point)) s];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = _filtered;
    final selected = _selected;
    final installed = selected == null ? const <CardStyle>[] : _forPoint(selected, installed: true);
    final catalog = selected == null ? const <CardStyle>[] : _forPoint(selected, installed: false);
    return Padding(
      padding: const EdgeInsets.fromLTRB(TokenSpace.lg, TokenSpace.sm, TokenSpace.lg, TokenSpace.lg),
      child: Column(
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
          Text('Aggiungi widget', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          TextField(
            decoration: const InputDecoration(hintText: 'Cerca per nome', prefixIcon: Icon(Icons.search)),
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: TokenSpace.md),
          Expanded(
            child: items.isEmpty
                ? const EmptyState(title: 'Nessun punto', body: 'Prova un altro nome.')
                : ListView(
                    key: const ValueKey('picker-points'),
                    cacheExtent: 2000,
                    children: [
                      for (final group in _groups(items).entries) ...[
                        Padding(
                          padding: const EdgeInsets.only(top: TokenSpace.sm, bottom: TokenSpace.xs),
                          child: Text(group.key, style: theme.textTheme.bodySmall),
                        ),
                        for (final point in group.value)
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            shape: tokenDropShape(),
                            hoverColor: tokenHoverFill(context),
                            selected: _selected?.pointId == point.pointId,
                            title: Text(point.label),
                            subtitle: Text(
                              [
                                _fmt(point),
                                if (widget.onCanvas.contains(point.pointId)) 'Già sul canvas',
                              ].join(' · '),
                            ),
                            enabled: !widget.onCanvas.contains(point.pointId),
                            onTap: widget.onCanvas.contains(point.pointId)
                                ? null
                                : () => setState(() {
                                      _selected = point;
                                      final match = _forPoint(point, installed: true);
                                      CardStyle? preferred;
                                      for (final s in match) {
                                        if (s.hint == point.visualHint) {
                                          preferred = s;
                                          break;
                                        }
                                      }
                                      _style = preferred ?? (match.isEmpty ? null : match.first);
                                    }),
                          ),
                      ],
                    ],
                  ),
          ),
          if (selected != null) ...[
            const SizedBox(height: TokenSpace.sm),
            Text('Stile card', style: theme.textTheme.bodySmall),
            const SizedBox(height: TokenSpace.xs),
            if (installed.isEmpty && catalog.isEmpty)
              Text('Nessuno stile per questo punto.', style: theme.textTheme.bodySmall),
            Wrap(
              spacing: TokenSpace.sm,
              runSpacing: TokenSpace.xs,
              children: [
                for (final style in installed)
                  ChoiceChip(
                    label: Text(style.name),
                    selected: _style?.styleId == style.styleId,
                    onSelected: (_) => setState(() => _style = style),
                  ),
              ],
            ),
            if (catalog.isNotEmpty) ...[
              const SizedBox(height: TokenSpace.sm),
              Text('Scarica dal marketplace', style: theme.textTheme.bodySmall),
              const SizedBox(height: TokenSpace.xs),
              for (final style in catalog)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: Text(style.name),
                  subtitle: Text(style.blurb, maxLines: 2, overflow: TextOverflow.ellipsis),
                  trailing: FilledButton.tonal(
                    onPressed: _installing ? null : () => _install(style),
                    child: const Text('Scarica'),
                  ),
                ),
            ],
            const SizedBox(height: TokenSpace.md),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: _style == null || !_style!.installed
                    ? null
                    : () => Navigator.pop(context, PickedWidget(point: selected, style: _style!)),
                child: const Text('Aggiungi'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _install(CardStyle style) async {
    setState(() => _installing = true);
    await widget.onInstallStyle?.call(style.styleId);
    if (!mounted) return;
    final next = style.copyWith(installed: true);
    setState(() {
      _installing = false;
      _styles = [for (final s in _styles) s.styleId == style.styleId ? next : s];
      _style = next;
    });
  }

  Map<String, List<ExposurePoint>> _groups(List<ExposurePoint> points) {
    final map = <String, List<ExposurePoint>>{};
    for (final p in points) {
      final key = p.kind == 'actuator' ? 'Attuatori' : 'Sensori';
      map.putIfAbsent(key, () => []).add(p);
    }
    return map;
  }

  static String _fmt(ExposurePoint point) {
    final value = point.value;
    if (value is double) return '${value.toStringAsFixed(1)}${point.unit ?? ''}';
    if (value == true) return 'On';
    if (value == false) return 'Off';
    return value?.toString() ?? '—';
  }
}

Future<PickedWidget?> openWidgetPicker(
  BuildContext context, {
  required List<ExposurePoint> points,
  Set<String> onCanvas = const {},
  List<CardStyle> cardStyles = const [],
  Future<void> Function(String styleId)? onInstallStyle,
}) {
  return showModalBottomSheet<PickedWidget>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: tokenDropShape(),
    clipBehavior: Clip.antiAlias,
    builder: (context) => SizedBox(
      height: MediaQuery.of(context).size.height * 0.75,
      child: WidgetPickerScreen(
        points: points,
        onCanvas: onCanvas,
        cardStyles: cardStyles,
        onInstallStyle: onInstallStyle,
      ),
    ),
  );
}
