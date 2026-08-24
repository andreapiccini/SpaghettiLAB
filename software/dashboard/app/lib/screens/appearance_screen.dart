import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import '../theme/spaghetti_theme.dart';
import '../widgets/drop_segmented.dart';
import '../widgets/point_card.dart';

const _accents = ['#3F77DA', '#22C55E', '#F59E0B', '#EF4444', '#A78BFA'];

const _backgrounds = <(String, BackgroundSpec)>[
  (
    'Studio',
    BackgroundSpec(kind: BackgroundKind.gradient, colors: ['#F3F4F6', '#F6F7F9']),
  ),
  ('Carta', BackgroundSpec(kind: BackgroundKind.solid, colors: ['#F5F6F7'])),
  (
    'Giardino',
    BackgroundSpec(kind: BackgroundKind.gradient, colors: ['#052e16', '#0F1114']),
  ),
  (
    'Sera',
    BackgroundSpec(kind: BackgroundKind.gradient, colors: ['#1e1b4b', '#0F1114']),
  ),
];

class AppearanceScreen extends StatelessWidget {
  const AppearanceScreen({
    super.key,
    required this.appearance,
    required this.previewPoints,
    required this.onChanged,
    required this.onReset,
  });

  final DashboardAppearance appearance;
  final List<ExposurePoint> previewPoints;
  final ValueChanged<DashboardAppearance> onChanged;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final editor = _Editor(
      appearance: appearance,
      onChanged: onChanged,
      onReset: onReset,
    );
    final preview = _Preview(appearance: appearance, points: previewPoints);
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 840;
        if (wide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(width: 420, child: SingleChildScrollView(child: editor)),
              Expanded(child: preview),
            ],
          );
        }
        return ListView(
          children: [
            SizedBox(height: 200, child: preview),
            editor,
          ],
        );
      },
    );
  }
}

class _Preview extends StatelessWidget {
  const _Preview({required this.appearance, required this.points});

  final DashboardAppearance appearance;
  final List<ExposurePoint> points;

  @override
  Widget build(BuildContext context) {
    final bg = appearance.background;
    final shown = points.take(2).toList();
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: bg.kind == BackgroundKind.gradient && bg.colors.length >= 2
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: bg.colors.map(_hex).toList(),
              )
            : null,
        color: bg.kind == BackgroundKind.solid ? _hex(bg.colors.first) : TokenColors.lightBgApp,
      ),
      child: Padding(
        padding: const EdgeInsets.all(TokenSpace.md),
        child: Row(
          children: [
            for (final point in shown)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: TokenSpace.sm),
                  child: IgnorePointer(
                    child: PointCard(point: point, appearance: appearance),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Editor extends StatelessWidget {
  const _Editor({required this.appearance, required this.onChanged, required this.onReset});

  final DashboardAppearance appearance;
  final ValueChanged<DashboardAppearance> onChanged;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
        final accent = appearance.color('accent', '#3F77DA');
    return Padding(
      padding: const EdgeInsets.all(TokenSpace.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Text('Aspetto', style: theme.textTheme.headlineMedium),
        const SizedBox(height: TokenSpace.lg),
        Text('Colori', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        Wrap(
          spacing: TokenSpace.sm,
          children: [
            for (final hex in _accents)
              GestureDetector(
                onTap: () => onChanged(appearance.copyWith(colors: {...appearance.colors, 'accent': hex})),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _hex(hex),
                    borderRadius: tokenCardRadius(),
                    border: Border.all(
                      color: hex.toLowerCase() == accent.toLowerCase()
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.55),
                      width: hex.toLowerCase() == accent.toLowerCase() ? 2 : 1,
                    ),
                    boxShadow: tokenShadowE1,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: TokenSpace.lg),
        Text('Sfondo', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        Wrap(
          spacing: TokenSpace.sm,
          children: [
            for (final entry in _backgrounds)
              ChoiceChip(
                label: Text(entry.$1),
                selected: _sameBg(appearance.background, entry.$2),
                onSelected: (_) => onChanged(appearance.copyWith(background: entry.$2)),
              ),
          ],
        ),
        const SizedBox(height: TokenSpace.lg),
        Text('Animazioni', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        DropSegmented<AnimationProfile>(
          segments: const [
            DropSegment(value: AnimationProfile.subtle, label: 'Subtle'),
            DropSegment(value: AnimationProfile.standard, label: 'Standard'),
            DropSegment(value: AnimationProfile.rich, label: 'Rich'),
          ],
          value: appearance.animationProfile,
          onChanged: (value) => onChanged(appearance.copyWith(animationProfile: value)),
        ),
        const SizedBox(height: TokenSpace.lg),
        Text('Menu', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        DropSegmented<ShellMenuStyle>(
          segments: const [
            DropSegment(value: ShellMenuStyle.bottomBar, label: 'Barra'),
            DropSegment(value: ShellMenuStyle.rail, label: 'Rail'),
          ],
          value: appearance.menuStyle,
          onChanged: (value) => onChanged(appearance.copyWith(menuStyle: value)),
        ),
        const SizedBox(height: TokenSpace.lg),
        Text('Brand', style: theme.textTheme.titleMedium),
        const SizedBox(height: TokenSpace.sm),
        TextFormField(
          initialValue: appearance.brand.name ?? '',
          decoration: const InputDecoration(hintText: 'Nome in app bar'),
          onChanged: (name) => onChanged(
            appearance.copyWith(brand: BrandSpec(name: name.trim().isEmpty ? null : name.trim())),
          ),
        ),
        const SizedBox(height: TokenSpace.lg),
        TextButton(onPressed: onReset, child: const Text('Ripristina default')),
        const SizedBox(height: TokenSpace.sm),
        Text(
          'Le automazioni si configurano fuori da questa app.',
          style: theme.textTheme.bodySmall,
        ),
        ],
      ),
    );
  }
}

bool _sameBg(BackgroundSpec a, BackgroundSpec b) {
  return a.kind == b.kind && a.colors.join() == b.colors.join();
}

Color _hex(String hex) {
  var value = hex.trim();
  if (value.startsWith('#')) value = value.substring(1);
  return Color(int.parse(value, radix: 16) + 0xFF000000);
}
