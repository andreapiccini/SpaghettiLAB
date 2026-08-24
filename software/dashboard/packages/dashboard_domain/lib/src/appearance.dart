enum AnimationProfile { subtle, standard, rich }

enum ShellMenuStyle { bottomBar, rail }

enum DisplayMode { normal, kiosk, compact }

enum BackgroundKind { solid, gradient, image }

class BrandSpec {
  const BrandSpec({this.name, this.logoRef});

  final String? name;
  final String? logoRef;

  factory BrandSpec.parse(Map<String, Object?> json) {
    return BrandSpec(name: json['name'] as String?, logoRef: json['logoRef'] as String?);
  }

  Map<String, Object?> toJson() => {'name': name, 'logoRef': logoRef};
}

class BackgroundSpec {
  const BackgroundSpec({
    required this.kind,
    this.colors = const ['#F5F6F7'],
    this.imageRef,
  });

  final BackgroundKind kind;
  final List<String> colors;
  final String? imageRef;

  factory BackgroundSpec.parse(Map<String, Object?> json) {
    final raw = json['colors'];
    return BackgroundSpec(
      kind: BackgroundKind.values.byName(json['kind']! as String),
      colors: raw is List ? [for (final c in raw) '$c'] : const ['#F5F6F7'],
      imageRef: json['imageRef'] as String?,
    );
  }

  Map<String, Object?> toJson() => {'kind': kind.name, 'colors': colors, 'imageRef': imageRef};
}

/// Semantic color overrides on top of DESIGN_TOKENS.md. Empty map = tokens.
class DashboardAppearance {
  const DashboardAppearance({
    this.colors = const {},
    this.background = const BackgroundSpec(
      kind: BackgroundKind.gradient,
      colors: ['#F3F4F6', '#F6F7F9'],
    ),
    this.animationProfile = AnimationProfile.standard,
    this.brand = const BrandSpec(),
    this.menuStyle = ShellMenuStyle.bottomBar,
    this.displayMode = DisplayMode.normal,
    this.typeDisplayScale = 1,
    this.radiusScale = 1,
  });

  final Map<String, String> colors;
  final BackgroundSpec background;
  final AnimationProfile animationProfile;
  final BrandSpec brand;
  final ShellMenuStyle menuStyle;
  final DisplayMode displayMode;
  final double typeDisplayScale;
  final double radiusScale;

  static const DashboardAppearance lightDefaults = DashboardAppearance(
    colors: {'accent': '#3F77DA'},
  );

  static const DashboardAppearance darkDefaults = DashboardAppearance(
    background: BackgroundSpec(kind: BackgroundKind.solid, colors: ['#0F1114']),
  );

  factory DashboardAppearance.parse(Map<String, Object?> json) {
    final colorsRaw = json['colors'];
    final colors = <String, String>{};
    if (colorsRaw is Map) {
      colorsRaw.forEach((key, value) {
        if (value is String) colors['$key'] = value;
      });
    }
    final backgroundRaw = json['background'];
    final brandRaw = json['brand'];
    return DashboardAppearance(
      colors: colors,
      background: backgroundRaw is Map
          ? BackgroundSpec.parse(Map<String, Object?>.from(backgroundRaw))
          : const BackgroundSpec(kind: BackgroundKind.solid),
      animationProfile: AnimationProfile.values.byName(
        json['animationProfile'] as String? ?? AnimationProfile.standard.name,
      ),
      brand: brandRaw is Map ? BrandSpec.parse(Map<String, Object?>.from(brandRaw)) : const BrandSpec(),
      menuStyle: ShellMenuStyle.values.byName(json['menuStyle'] as String? ?? ShellMenuStyle.bottomBar.name),
      displayMode: DisplayMode.values.byName(json['displayMode'] as String? ?? DisplayMode.normal.name),
      typeDisplayScale: (json['typeDisplayScale'] as num?)?.toDouble() ?? 1,
      radiusScale: (json['radiusScale'] as num?)?.toDouble() ?? 1,
    );
  }

  Map<String, Object?> toJson() => {
        'colors': colors,
        'background': background.toJson(),
        'animationProfile': animationProfile.name,
        'brand': brand.toJson(),
        'menuStyle': menuStyle.name,
        'displayMode': displayMode.name,
        'typeDisplayScale': typeDisplayScale,
        'radiusScale': radiusScale,
      };

  /// Overlay wins on non-empty fields; color keys are unioned with overlay last.
  DashboardAppearance merge(DashboardAppearance overlay) {
    return DashboardAppearance(
      colors: {...colors, ...overlay.colors},
      background: overlay.background.colors.isNotEmpty ? overlay.background : background,
      animationProfile: overlay.animationProfile,
      brand: BrandSpec(
        name: overlay.brand.name ?? brand.name,
        logoRef: overlay.brand.logoRef ?? brand.logoRef,
      ),
      menuStyle: overlay.menuStyle,
      displayMode: overlay.displayMode,
      typeDisplayScale: overlay.typeDisplayScale,
      radiusScale: overlay.radiusScale,
    );
  }

  String color(String token, String fallback) => colors[token] ?? fallback;

  DashboardAppearance copyWith({
    Map<String, String>? colors,
    BackgroundSpec? background,
    AnimationProfile? animationProfile,
    BrandSpec? brand,
    ShellMenuStyle? menuStyle,
    DisplayMode? displayMode,
    double? typeDisplayScale,
    double? radiusScale,
  }) {
    return DashboardAppearance(
      colors: colors ?? this.colors,
      background: background ?? this.background,
      animationProfile: animationProfile ?? this.animationProfile,
      brand: brand ?? this.brand,
      menuStyle: menuStyle ?? this.menuStyle,
      displayMode: displayMode ?? this.displayMode,
      typeDisplayScale: typeDisplayScale ?? this.typeDisplayScale,
      radiusScale: radiusScale ?? this.radiusScale,
    );
  }
}
