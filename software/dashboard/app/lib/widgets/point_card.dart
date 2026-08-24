import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import 'card_fx.dart';
import 'gauge_body.dart';
import 'glass.dart';
import 'pump_glyph.dart';

class PointCard extends StatefulWidget {
  const PointCard({
    super.key,
    required this.point,
    required this.appearance,
    this.style,
    this.onCommand,
    this.compact = false,
  });

  final ExposurePoint point;
  final DashboardAppearance appearance;
  final CardStyle? style;
  final ValueChanged<Object>? onCommand;
  final bool compact;

  @override
  State<PointCard> createState() => _PointCardState();
}

class _PointCardState extends State<PointCard> {
  bool _hover = false;

  ExposurePoint get point => widget.point;
  DashboardAppearance get appearance => widget.appearance;
  ValueChanged<bool>? get _onBool =>
      widget.onCommand == null ? null : (value) => widget.onCommand!(value);

  CardEffect get _effect {
    if (widget.style != null) return widget.style!.effect;
    return switch (point.visualHint) {
      VisualHint.gauge => CardEffect.gaugeArc,
      VisualHint.sparkline => CardEffect.sparkline,
      VisualHint.value when point.unit == '%' => CardEffect.humidityDrops,
      VisualHint.value => CardEffect.bigNumber,
      VisualHint.toggle => CardEffect.lightBulb,
      VisualHint.button => CardEffect.sprinkler,
      VisualHint.animated => CardEffect.pump,
      VisualHint.status => CardEffect.statusPulse,
    };
  }

  CardRecipe get _recipe => widget.style?.recipe ?? CardRecipe.empty;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final running = point.visualState == 'running' || point.value == true;
    final recipe = _recipe;
    final glow = _alertGlow();
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: AnimatedScale(
        scale: _hover ? 1.015 : 1,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        child: GlassCard(
          hovered: _hover,
          glow: glow,
          accent: glow,
          radiusScale: appearance.radiusScale * recipe.radiusScale,
          backdrop: _backdrop(),
          padding: widget.compact
              ? const EdgeInsets.fromLTRB(12, 14, 10, 10)
              : null,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (recipe.labelPlace == CardLabelPlace.top) ...[
                _alongX(recipe.labelX, _title(theme)),
                SizedBox(height: widget.compact ? 6 : TokenSpace.xs),
              ],
              Expanded(child: _body(theme, running)),
              if (recipe.labelPlace == CardLabelPlace.bottom) ...[
                SizedBox(height: widget.compact ? 6 : TokenSpace.xs),
                _alongX(recipe.labelX, _title(theme)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _title(ThemeData theme) {
    final size = widget.compact ? _recipe.labelSize.clamp(14.0, 16.0) : _recipe.labelSize;
    return Text(
      point.label,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: theme.textTheme.titleMedium?.copyWith(
        fontSize: size,
        fontWeight: FontWeight.w700,
        height: 1.0,
      ),
    );
  }

  Widget _alongX(double t, Widget child) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.isFinite ? constraints.maxWidth : 0.0;
        return Transform.translate(
          offset: Offset(t.clamp(0.0, 1.0) * width * 0.65, 0),
          child: child,
        );
      },
    );
  }

  Widget? _backdrop() {
    final profile = appearance.animationProfile;
    final fx = switch (_effect) {
      CardEffect.humidityDrops => HumidityDrops(
        percent: _asDouble(point.value),
        profile: profile,
        compact: widget.compact,
      ),
      CardEffect.sprinkler => SprinklerFx(active: point.value == true, profile: profile),
      CardEffect.lightBulb when point.value == true => const _LightWash(),
      CardEffect.powerGlyph when point.value == true => const _LightWash(),
      _ => null,
    };
    if (fx == null) return null;
    if (_recipe.bodyX == 0) return fx;
    return _alongX(_recipe.bodyX, fx);
  }

  Widget _body(ThemeData theme, bool running) {
    switch (_effect) {
      case CardEffect.gaugeArc:
        return _alongX(
          _recipe.bodyX,
          GaugeBody(
            value: _asDouble(point.value),
            unit: point.unit,
            max: point.unit == 'lux' ? 1000 : 40,
            valueSize: widget.compact ? null : _recipe.valueSize,
            unitSize: widget.compact ? null : _recipe.unitSize,
            showUnit: _recipe.showUnit,
            decimals: _recipe.decimals,
            valueColor: _valueColor(theme),
            compact: widget.compact,
          ),
        );
      case CardEffect.sparkline:
        return _alongX(
          _recipe.bodyX,
          SparklineBody(
            value: _asDouble(point.value),
            unit: point.unit,
            valueSize: _recipe.valueSize,
            unitSize: _recipe.unitSize,
            showUnit: _recipe.showUnit,
            decimals: _recipe.decimals,
            valueColor: _valueColor(theme),
          ),
        );
      case CardEffect.humidityDrops:
      case CardEffect.bigNumber:
        return _numericValue(theme);
      case CardEffect.pump:
        return _alongX(
          _recipe.bodyX,
          _statusRow(
            theme,
            leading: PumpGlyph(
              key: const ValueKey('pump-glyph'),
              running: running,
              profile: appearance.animationProfile,
              size: widget.compact ? 28 : 52,
            ),
            text: running ? (_recipe.onText ?? 'In funzione') : (_recipe.offText ?? 'Ferma'),
            trailing: point.writable ? _switch(running) : null,
          ),
        );
      case CardEffect.lightBulb:
      case CardEffect.powerGlyph:
      case CardEffect.plainSwitch:
        final on = point.value == true;
        return _alongX(
          _recipe.bodyX,
          _statusRow(
            theme,
            leading: _effect == CardEffect.plainSwitch
                ? null
                : LightBulbGlyph(
                    on: on,
                    profile: appearance.animationProfile,
                    size: widget.compact ? 28 : 48,
                    onIcon: _effect == CardEffect.powerGlyph ? Icons.power_settings_new_rounded : Icons.lightbulb_rounded,
                    offIcon: _effect == CardEffect.powerGlyph ? Icons.power_settings_new_rounded : Icons.lightbulb_outline_rounded,
                    glowColor: _effect == CardEffect.powerGlyph ? TokenColors.accent : const Color(0xFFF5C542),
                  ),
            text: on ? (_recipe.onText ?? 'Accesa') : (_recipe.offText ?? 'Spenta'),
            trailing: _switch(on),
          ),
        );
      case CardEffect.sprinkler:
        final on = point.value == true;
        return _alongX(
          _recipe.bodyX,
          _statusRow(
            theme,
            text: on ? (_recipe.onText ?? 'In funzione') : (_recipe.offText ?? 'Ferma'),
            trailing: _switch(on),
          ),
        );
      case CardEffect.statusPulse:
        final alarm = point.value == true || point.visualState == 'alarm';
        return _alongX(
          _recipe.bodyX,
          _statusRow(
            theme,
            leading: _PulseDot(active: alarm, color: alarm ? TokenColors.error : TokenColors.ok),
            text: alarm ? (_recipe.onText ?? 'Allarme') : (_recipe.offText ?? 'OK'),
          ),
        );
    }
  }

  Widget _statusRow(
    ThemeData theme, {
    Widget? leading,
    required String text,
    Widget? trailing,
  }) {
    return Row(
      children: [
        if (leading != null) ...[
          leading,
          SizedBox(width: widget.compact ? 6 : TokenSpace.sm),
        ],
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            softWrap: false,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontSize: widget.compact ? 12 : 14,
              height: 1.1,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        if (trailing != null) trailing,
      ],
    );
  }

  Widget _switch(bool value) {
    final scale = widget.compact ? 0.68 : 1.0;
    return SizedBox(
      width: 52 * scale,
      height: 32 * scale,
      child: Transform.scale(
        scale: scale,
        alignment: Alignment.center,
        child: Switch.adaptive(
          value: value,
          onChanged: _onBool,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      ),
    );
  }

  Widget _numericValue(ThemeData theme) {
    final recipe = _recipe;
    final unit = point.unit;
    final number = Text(
      _formatValue(point.value, recipe.decimals),
      style: theme.textTheme.displayLarge?.copyWith(
        fontSize: widget.compact ? recipe.valueSize.clamp(20.0, 26.0) : recipe.valueSize,
        height: 1,
        color: _valueColor(theme),
      ),
    );
    final showUnit = recipe.showUnit && unit != null && unit.isNotEmpty;
    if (!showUnit || recipe.unitX <= 0) {
      return _alongX(
        recipe.valueX,
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              number,
              if (showUnit)
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(
                    unit,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontSize: widget.compact ? recipe.unitSize.clamp(10.0, 13.0) : recipe.unitSize,
                      height: 1,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
        ),
      );
    }
    return Stack(
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: _alongX(recipe.valueX, FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: number)),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: _alongX(
            recipe.unitX,
            Text(
              unit,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: widget.compact ? recipe.unitSize.clamp(10.0, 13.0) : recipe.unitSize,
                height: 1,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color? _alertGlow() {
    if (point.value is! num) return null;
    final value = _asDouble(point.value);
    final recipe = _recipe;
    if (recipe.alarmAbove != null && value >= recipe.alarmAbove!) return TokenColors.error;
    if (recipe.warnAbove != null && value >= recipe.warnAbove!) return TokenColors.warn;
    return null;
  }

  Color? _valueColor(ThemeData theme) {
    return _alertGlow() ?? theme.textTheme.displayLarge?.color;
  }

  static double _asDouble(Object? value) {
    if (value is num) return value.toDouble();
    return 0;
  }

  static String _formatValue(Object? value, int decimals) {
    if (value is num) return value.toStringAsFixed(decimals.clamp(0, 3));
    if (value == null) return '—';
    return value.toString();
  }
}

class _LightWash extends StatelessWidget {
  const _LightWash();

  @override
  Widget build(BuildContext context) {
    return const IgnorePointer(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-0.15, 0.1),
            radius: 0.95,
            colors: [Color(0x66F5C542), Color(0x00F5C542)],
          ),
        ),
      ),
    );
  }
}

class _PulseDot extends StatelessWidget {
  const _PulseDot({required this.active, required this.color});

  final bool active;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: active
            ? [BoxShadow(color: color.withValues(alpha: 0.55), blurRadius: 12, spreadRadius: 2)]
            : const [],
      ),
    );
  }
}
