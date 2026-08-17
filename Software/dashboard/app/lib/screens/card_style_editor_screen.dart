import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/drop_segmented.dart';
import '../widgets/glass.dart';
import '../widgets/point_card.dart';

const _effectLabels = <CardEffect, String>{
  CardEffect.gaugeArc: 'Arco',
  CardEffect.sparkline: 'Andamento',
  CardEffect.humidityDrops: 'Gocce',
  CardEffect.bigNumber: 'Numero',
  CardEffect.lightBulb: 'Lampadina',
  CardEffect.plainSwitch: 'Switch',
  CardEffect.powerGlyph: 'Power',
  CardEffect.sprinkler: 'Irrigatore',
  CardEffect.pump: 'Pompa',
  CardEffect.statusPulse: 'Allarme',
};

Future<CardStyle?> openCardStyleEditor(
  BuildContext context, {
  required CardStyle style,
  required DashboardAppearance appearance,
  ExposurePoint? previewPoint,
}) {
  return Navigator.of(context).push<CardStyle>(
    MaterialPageRoute(
      builder: (context) => CardStyleEditorScreen(
        initial: style,
        appearance: appearance,
        previewPoint: previewPoint,
      ),
    ),
  );
}

class CardStyleEditorScreen extends StatefulWidget {
  const CardStyleEditorScreen({
    super.key,
    required this.initial,
    required this.appearance,
    this.previewPoint,
  });

  final CardStyle initial;
  final DashboardAppearance appearance;
  final ExposurePoint? previewPoint;

  @override
  State<CardStyleEditorScreen> createState() => _CardStyleEditorScreenState();
}

class _CardStyleEditorScreenState extends State<CardStyleEditorScreen> {
  late CardStyle _style = widget.initial;
  late final TextEditingController _name = TextEditingController(text: widget.initial.name);
  late final TextEditingController _on = TextEditingController(text: widget.initial.recipe.onText ?? '');
  late final TextEditingController _off = TextEditingController(text: widget.initial.recipe.offText ?? '');
  late final TextEditingController _warn = TextEditingController(
    text: widget.initial.recipe.warnAbove?.toString() ?? '',
  );
  late final TextEditingController _alarm = TextEditingController(
    text: widget.initial.recipe.alarmAbove?.toString() ?? '',
  );

  CardRecipe get _recipe => _style.recipe;

  @override
  void dispose() {
    _name.dispose();
    _on.dispose();
    _off.dispose();
    _warn.dispose();
    _alarm.dispose();
    super.dispose();
  }

  void _setRecipe(CardRecipe recipe) {
    setState(() => _style = _style.copyWith(recipe: recipe));
  }

  void _setEffect(CardEffect effect) {
    setState(() {
      _style = _style.copyWith(effect: effect, hint: hintForEffect(effect));
    });
  }

  void _setThreshold({required bool warn, required String text}) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) {
      _setRecipe(warn ? _recipe.copyWith(clearWarn: true) : _recipe.copyWith(clearAlarm: true));
      return;
    }
    final value = double.tryParse(trimmed.replaceAll(',', '.'));
    if (value == null) return;
    _setRecipe(warn ? _recipe.copyWith(warnAbove: value) : _recipe.copyWith(alarmAbove: value));
  }

  ExposurePoint get _preview {
    final live = widget.previewPoint;
    if (live != null && _style.fits(live)) return live;
    return switch (_style.hint) {
      VisualHint.gauge || VisualHint.value || VisualHint.sparkline => ExposurePoint(
          pointId: 'preview.n',
          label: _name.text.trim().isEmpty ? 'Anteprima' : _name.text.trim(),
          valueType: ValueType.number,
          visualHint: _style.hint,
          unit: '°C',
          value: 21.4,
        ),
      _ => ExposurePoint(
          pointId: 'preview.b',
          label: _name.text.trim().isEmpty ? 'Anteprima' : _name.text.trim(),
          valueType: ValueType.boolean,
          visualHint: _style.hint,
          writable: true,
          value: true,
          visualState: 'running',
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stile card'),
        actions: [
          TextButton(
            key: const ValueKey('card-style-save'),
            onPressed: () {
              Navigator.pop(
                context,
                _style.copyWith(
                  name: _name.text.trim().isEmpty ? _style.name : _name.text.trim(),
                  recipe: CardRecipe(
                    labelPlace: _recipe.labelPlace,
                    labelSize: _recipe.labelSize,
                    labelX: _recipe.labelX,
                    valueAlign: _recipe.valueAlign,
                    valueX: _recipe.valueX,
                    valueSize: _recipe.valueSize,
                    unitSize: _recipe.unitSize,
                    unitX: _recipe.unitX,
                    decimals: _recipe.decimals,
                    showUnit: _recipe.showUnit,
                    bodyX: _recipe.bodyX,
                    radiusScale: _recipe.radiusScale,
                    onText: _on.text.trim().isEmpty ? null : _on.text.trim(),
                    offText: _off.text.trim().isEmpty ? null : _off.text.trim(),
                    warnAbove: double.tryParse(_warn.text.replaceAll(',', '.')),
                    alarmAbove: double.tryParse(_alarm.text.replaceAll(',', '.')),
                  ),
                ),
              );
            },
            child: const Text('Salva'),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _PinnedPreview(
            appearance: widget.appearance,
            child: PointCard(
              key: const ValueKey('card-style-preview'),
              point: _preview,
              appearance: widget.appearance,
              style: _style,
            ),
          ),
          Expanded(
            child: ListView(
              key: const ValueKey('card-style-controls'),
              padding: const EdgeInsets.all(TokenSpace.lg),
              children: [
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Nome stile'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: TokenSpace.lg),
          Text('Grafica', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          Wrap(
            spacing: TokenSpace.sm,
            runSpacing: TokenSpace.sm,
            children: [
              for (final effect in CardEffect.values)
                ChoiceChip(
                  label: Text(_effectLabels[effect] ?? effect.name),
                  selected: _style.effect == effect,
                  onSelected: (_) => _setEffect(effect),
                ),
            ],
          ),
          _SliderRow(
            label: 'Posizione X grafica',
            value: _recipe.bodyX * 100,
            min: 0,
            max: 100,
            divisions: 20,
            onChanged: (v) => _setRecipe(_recipe.copyWith(bodyX: v / 100)),
          ),
          const SizedBox(height: TokenSpace.lg),
          Text('Titolo', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          DropSegmented<CardLabelPlace>(
            segments: const [
              DropSegment(value: CardLabelPlace.top, label: 'Alto'),
              DropSegment(value: CardLabelPlace.bottom, label: 'Basso'),
              DropSegment(value: CardLabelPlace.hidden, label: 'Nascosto'),
            ],
            value: _recipe.labelPlace,
            onChanged: (place) => _setRecipe(_recipe.copyWith(labelPlace: place)),
          ),
          _SliderRow(
            label: 'Dimensione titolo',
            value: _recipe.labelSize,
            min: 10,
            max: 20,
            onChanged: (v) => _setRecipe(_recipe.copyWith(labelSize: v)),
          ),
          _SliderRow(
            label: 'Posizione X titolo',
            value: _recipe.labelX * 100,
            min: 0,
            max: 100,
            divisions: 20,
            onChanged: (v) => _setRecipe(_recipe.copyWith(labelX: v / 100)),
          ),
          const SizedBox(height: TokenSpace.lg),
          Text('Valore', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          DropSegmented<CardValueAlign>(
            segments: const [
              DropSegment(value: CardValueAlign.start, label: 'Sinistra'),
              DropSegment(value: CardValueAlign.center, label: 'Centro'),
            ],
            value: _recipe.valueAlign,
            onChanged: (align) => _setRecipe(
              _recipe.copyWith(
                valueAlign: align,
                valueX: align == CardValueAlign.center ? 0.5 : 0,
              ),
            ),
          ),
          _SliderRow(
            label: 'Posizione X numero',
            value: _recipe.valueX * 100,
            min: 0,
            max: 100,
            divisions: 20,
            onChanged: (v) => _setRecipe(_recipe.copyWith(valueX: v / 100)),
          ),
          _SliderRow(
            label: 'Dimensione numero',
            value: _recipe.valueSize,
            min: 22,
            max: 56,
            onChanged: (v) => _setRecipe(_recipe.copyWith(valueSize: v)),
          ),
          _SliderRow(
            label: 'Dimensione unità',
            value: _recipe.unitSize,
            min: 10,
            max: 28,
            onChanged: (v) => _setRecipe(_recipe.copyWith(unitSize: v)),
          ),
          _SliderRow(
            label: 'Posizione X unità',
            value: _recipe.unitX * 100,
            min: 0,
            max: 100,
            divisions: 20,
            onChanged: (v) => _setRecipe(_recipe.copyWith(unitX: v / 100)),
          ),
          _SliderRow(
            label: 'Decimali',
            value: _recipe.decimals.toDouble(),
            min: 0,
            max: 3,
            divisions: 3,
            onChanged: (v) => _setRecipe(_recipe.copyWith(decimals: v.round())),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Mostra unità'),
            value: _recipe.showUnit,
            onChanged: (v) => _setRecipe(_recipe.copyWith(showUnit: v)),
          ),
          const SizedBox(height: TokenSpace.md),
          Text('Stondamento', style: theme.textTheme.titleMedium),
          _SliderRow(
            label: 'Raggio card',
            value: _recipe.radiusScale,
            min: 0.4,
            max: 1.6,
            onChanged: (v) => _setRecipe(_recipe.copyWith(radiusScale: v)),
          ),
          const SizedBox(height: TokenSpace.lg),
          Text('Testi di stato', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          TextField(
            controller: _on,
            decoration: const InputDecoration(labelText: 'Acceso / in funzione / allarme'),
          ),
          const SizedBox(height: TokenSpace.sm),
          TextField(
            controller: _off,
            decoration: const InputDecoration(labelText: 'Spento / fermo / ok'),
          ),
          const SizedBox(height: TokenSpace.lg),
          Text('Soglie numeriche', style: theme.textTheme.titleMedium),
          const SizedBox(height: TokenSpace.sm),
          TextField(
            controller: _warn,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Avviso sopra (giallo)'),
            onChanged: (text) => _setThreshold(warn: true, text: text),
          ),
          const SizedBox(height: TokenSpace.sm),
          TextField(
            controller: _alarm,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Allarme sopra (rosso)'),
            onChanged: (text) => _setThreshold(warn: false, text: text),
          ),
          const SizedBox(height: TokenSpace.xl),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PinnedPreview extends StatelessWidget {
  const _PinnedPreview({required this.appearance, required this.child});

  final DashboardAppearance appearance;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      elevation: 0,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: theme.colorScheme.outlineVariant),
          ),
        ),
        child: SizedBox(
          height: 196,
          child: FlowBackdrop(
            appearance: appearance,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(TokenSpace.lg, TokenSpace.md, TokenSpace.lg, TokenSpace.md),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 300),
                  child: child,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SliderRow extends StatelessWidget {
  const _SliderRow({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.divisions,
  });

  final String label;
  final double value;
  final double min;
  final double max;
  final int? divisions;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
            Text(value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1)),
          ],
        ),
        Slider(value: value.clamp(min, max), min: min, max: max, divisions: divisions, onChanged: onChanged),
      ],
    );
  }
}
