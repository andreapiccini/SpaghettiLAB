import 'point.dart';
import 'visual_pack.dart';

/// Builtin renderer id for a downloadable card look. Packs later may add more.
enum CardEffect {
  gaugeArc,
  sparkline,
  humidityDrops,
  bigNumber,
  lightBulb,
  plainSwitch,
  powerGlyph,
  sprinkler,
  pump,
  statusPulse,
}

enum CardLabelPlace { top, bottom, hidden }

enum CardValueAlign { start, center }

/// Layout, formati e reazioni di una card. JSON, niente eval Dart.
class CardRecipe {
  const CardRecipe({
    this.labelPlace = CardLabelPlace.top,
    this.labelSize = 12,
    this.labelX = 0,
    this.valueAlign = CardValueAlign.start,
    this.valueX = 0,
    this.valueSize = 36,
    this.unitSize = 16,
    this.unitX = 0,
    this.decimals = 1,
    this.showUnit = true,
    this.bodyX = 0,
    this.radiusScale = 1,
    this.onText,
    this.offText,
    this.warnAbove,
    this.alarmAbove,
  });

  static const empty = CardRecipe();

  final CardLabelPlace labelPlace;
  final double labelSize;
  /// 0 = sinistra, 1 = destra.
  final double labelX;
  final CardValueAlign valueAlign;
  final double valueX;
  final double valueSize;
  final double unitSize;
  final double unitX;
  final int decimals;
  final bool showUnit;
  final double bodyX;
  final double radiusScale;
  final String? onText;
  final String? offText;
  final double? warnAbove;
  final double? alarmAbove;

  CardRecipe copyWith({
    CardLabelPlace? labelPlace,
    double? labelSize,
    double? labelX,
    CardValueAlign? valueAlign,
    double? valueX,
    double? valueSize,
    double? unitSize,
    double? unitX,
    int? decimals,
    bool? showUnit,
    double? bodyX,
    double? radiusScale,
    String? onText,
    String? offText,
    double? warnAbove,
    double? alarmAbove,
    bool clearWarn = false,
    bool clearAlarm = false,
  }) {
    return CardRecipe(
      labelPlace: labelPlace ?? this.labelPlace,
      labelSize: labelSize ?? this.labelSize,
      labelX: labelX ?? this.labelX,
      valueAlign: valueAlign ?? this.valueAlign,
      valueX: valueX ?? this.valueX,
      valueSize: valueSize ?? this.valueSize,
      unitSize: unitSize ?? this.unitSize,
      unitX: unitX ?? this.unitX,
      decimals: decimals ?? this.decimals,
      showUnit: showUnit ?? this.showUnit,
      bodyX: bodyX ?? this.bodyX,
      radiusScale: radiusScale ?? this.radiusScale,
      onText: onText ?? this.onText,
      offText: offText ?? this.offText,
      warnAbove: clearWarn ? null : (warnAbove ?? this.warnAbove),
      alarmAbove: clearAlarm ? null : (alarmAbove ?? this.alarmAbove),
    );
  }

  factory CardRecipe.parse(Map<String, Object?> json) {
    final valueAlign = CardValueAlign.values.byName(json['valueAlign'] as String? ?? CardValueAlign.start.name);
    return CardRecipe(
      labelPlace: CardLabelPlace.values.byName(json['labelPlace'] as String? ?? CardLabelPlace.top.name),
      labelSize: (json['labelSize'] as num?)?.toDouble() ?? 12,
      labelX: (json['labelX'] as num?)?.toDouble() ?? 0,
      valueAlign: valueAlign,
      valueX: (json['valueX'] as num?)?.toDouble() ?? (valueAlign == CardValueAlign.center ? 0.5 : 0),
      valueSize: (json['valueSize'] as num?)?.toDouble() ?? 36,
      unitSize: (json['unitSize'] as num?)?.toDouble() ?? 16,
      unitX: (json['unitX'] as num?)?.toDouble() ?? 0,
      decimals: json['decimals'] as int? ?? 1,
      showUnit: json['showUnit'] as bool? ?? true,
      bodyX: (json['bodyX'] as num?)?.toDouble() ?? 0,
      radiusScale: (json['radiusScale'] as num?)?.toDouble() ?? 1,
      onText: json['onText'] as String?,
      offText: json['offText'] as String?,
      warnAbove: (json['warnAbove'] as num?)?.toDouble(),
      alarmAbove: (json['alarmAbove'] as num?)?.toDouble(),
    );
  }

  Map<String, Object?> toJson() => {
        'labelPlace': labelPlace.name,
        'labelSize': labelSize,
        'labelX': labelX,
        'valueAlign': valueAlign.name,
        'valueX': valueX,
        'valueSize': valueSize,
        'unitSize': unitSize,
        'unitX': unitX,
        'decimals': decimals,
        'showUnit': showUnit,
        'bodyX': bodyX,
        'radiusScale': radiusScale,
        if (onText != null) 'onText': onText,
        if (offText != null) 'offText': offText,
        if (warnAbove != null) 'warnAbove': warnAbove,
        if (alarmAbove != null) 'alarmAbove': alarmAbove,
      };
}

VisualHint hintForEffect(CardEffect effect) {
  return switch (effect) {
    CardEffect.gaugeArc => VisualHint.gauge,
    CardEffect.sparkline => VisualHint.sparkline,
    CardEffect.humidityDrops || CardEffect.bigNumber => VisualHint.value,
    CardEffect.lightBulb || CardEffect.plainSwitch || CardEffect.powerGlyph => VisualHint.toggle,
    CardEffect.sprinkler => VisualHint.button,
    CardEffect.pump => VisualHint.animated,
    CardEffect.statusPulse => VisualHint.status,
  };
}

class CardStyle {
  const CardStyle({
    required this.styleId,
    required this.name,
    required this.blurb,
    required this.hint,
    required this.effect,
    this.installed = false,
    this.source = PackSource.marketplace,
    this.recipe = CardRecipe.empty,
  });

  final String styleId;
  final String name;
  final String blurb;
  final VisualHint hint;
  final CardEffect effect;
  final bool installed;
  final PackSource source;
  final CardRecipe recipe;

  bool fits(ExposurePoint point) {
    final numeric = point.valueType == ValueType.number;
    return switch (hint) {
      VisualHint.gauge || VisualHint.value || VisualHint.sparkline => numeric,
      VisualHint.toggle || VisualHint.button || VisualHint.animated || VisualHint.status =>
        point.valueType == ValueType.boolean,
    };
  }

  CardStyle copyWith({
    String? styleId,
    String? name,
    String? blurb,
    VisualHint? hint,
    CardEffect? effect,
    bool? installed,
    PackSource? source,
    CardRecipe? recipe,
  }) {
    return CardStyle(
      styleId: styleId ?? this.styleId,
      name: name ?? this.name,
      blurb: blurb ?? this.blurb,
      hint: hint ?? this.hint,
      effect: effect ?? this.effect,
      installed: installed ?? this.installed,
      source: source ?? this.source,
      recipe: recipe ?? this.recipe,
    );
  }

  factory CardStyle.parse(Map<String, Object?> json) {
    final rawRecipe = json['recipe'];
    return CardStyle(
      styleId: json['styleId']! as String,
      name: json['name']! as String,
      blurb: json['blurb'] as String? ?? '',
      hint: VisualHint.values.byName(json['hint'] as String? ?? 'value'),
      effect: CardEffect.values.byName(json['effect'] as String? ?? 'bigNumber'),
      installed: json['installed'] as bool? ?? false,
      source: PackSource.values.byName(json['source'] as String? ?? 'marketplace'),
      recipe: rawRecipe is Map
          ? CardRecipe.parse(Map<String, Object?>.from(rawRecipe))
          : CardRecipe.empty,
    );
  }

  Map<String, Object?> toJson() => {
        'styleId': styleId,
        'name': name,
        'blurb': blurb,
        'hint': hint.name,
        'effect': effect.name,
        'installed': installed,
        'source': source.name,
        'recipe': recipe.toJson(),
      };
}

/// Vertical grid slots. Gauges need two so the arc is not squashed.
int cardSlotHeight({required String visualHint, CardStyle? style, int height = 1}) {
  if (height > 1) return height;
  if (style?.effect == CardEffect.gaugeArc || style?.hint == VisualHint.gauge) return 2;
  if (visualHint == 'gauge') return 2;
  return 1;
}

/// Demo catalog. Installed entries ship with the canvas; the rest are marketplace downloads.
List<CardStyle> builtinCardCatalog() => const [
      CardStyle(
        styleId: 'style.gauge-arc',
        name: 'Gauge ad arco',
        blurb: 'Arco e valore al centro. Per temperature, lux, livelli.',
        hint: VisualHint.gauge,
        effect: CardEffect.gaugeArc,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.sparkline',
        name: 'Andamento',
        blurb: 'Sparkline con il valore numerico.',
        hint: VisualHint.sparkline,
        effect: CardEffect.sparkline,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.humidity-drops',
        name: 'Gocce',
        blurb: 'Percentuale grande e gocce in movimento.',
        hint: VisualHint.value,
        effect: CardEffect.humidityDrops,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.light-bulb',
        name: 'Lampadina',
        blurb: 'Lampadina e azioni accesa / spenta.',
        hint: VisualHint.toggle,
        effect: CardEffect.lightBulb,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.sprinkler',
        name: 'Irrigatore',
        blurb: 'Ugello fermo o getto animato con lo switch.',
        hint: VisualHint.button,
        effect: CardEffect.sprinkler,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.pump-spin',
        name: 'Pompa',
        blurb: 'Rotore che gira quando è in funzione.',
        hint: VisualHint.animated,
        effect: CardEffect.pump,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.status-pulse',
        name: 'Allarme',
        blurb: 'Punto di stato con impulso in allarme.',
        hint: VisualHint.status,
        effect: CardEffect.statusPulse,
        installed: true,
      ),
      CardStyle(
        styleId: 'style.plain-switch',
        name: 'Interruttore semplice',
        blurb: 'Solo switch accesa / spenta, senza lampadina.',
        hint: VisualHint.toggle,
        effect: CardEffect.plainSwitch,
      ),
      CardStyle(
        styleId: 'style.power-glyph',
        name: 'Pulsante power',
        blurb: 'Icona power con alone quando è acceso.',
        hint: VisualHint.toggle,
        effect: CardEffect.powerGlyph,
      ),
      CardStyle(
        styleId: 'style.big-number',
        name: 'Numero grande',
        blurb: 'Valore e unità, senza gocce né arco.',
        hint: VisualHint.value,
        effect: CardEffect.bigNumber,
      ),
    ];

String? defaultStyleIdFor(ExposurePoint point) {
  for (final style in builtinCardCatalog()) {
    if (style.installed && style.hint == point.visualHint) return style.styleId;
  }
  for (final style in builtinCardCatalog()) {
    if (style.installed && style.fits(point)) return style.styleId;
  }
  return null;
}

CardStyle newCustomCardStyle() {
  return CardStyle(
    styleId: 'custom.${DateTime.now().millisecondsSinceEpoch}',
    name: 'Nuovo stile',
    blurb: 'Creato in dashboard',
    hint: VisualHint.value,
    effect: CardEffect.bigNumber,
    installed: true,
    source: PackSource.local,
  );
}
