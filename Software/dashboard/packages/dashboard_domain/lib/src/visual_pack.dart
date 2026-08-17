import 'appearance.dart';
import 'scene.dart';

enum PackSource { marketplace, local, org, developer }

class VisualPackSummary {
  const VisualPackSummary({
    required this.packId,
    required this.name,
    required this.version,
    this.author = 'SpaghettiLAB',
    this.source = PackSource.marketplace,
    this.teaserViewMode,
    this.blurb = '',
    this.installed = true,
    this.signed = false,
    this.keyId,
  });

  final String packId;
  final String name;
  final String version;
  final String author;
  final PackSource source;
  final String? teaserViewMode;
  final String blurb;
  final bool installed;
  final bool signed;
  final String? keyId;

  VisualPackSummary copyWith({bool? installed}) {
    return VisualPackSummary(
      packId: packId,
      name: name,
      version: version,
      author: author,
      source: source,
      teaserViewMode: teaserViewMode,
      blurb: blurb,
      installed: installed ?? this.installed,
      signed: signed,
      keyId: keyId,
    );
  }

  factory VisualPackSummary.parse(Map<String, Object?> json) {
    return VisualPackSummary(
      packId: json['packId']! as String,
      name: json['name']! as String,
      version: json['version']! as String,
      author: json['author'] as String? ?? 'SpaghettiLAB',
      source: PackSource.values.byName(json['source'] as String? ?? 'marketplace'),
      teaserViewMode: json['teaserViewMode'] as String?,
      blurb: json['blurb'] as String? ?? '',
      installed: json['installed'] as bool? ?? true,
      signed: json['signed'] as bool? ?? false,
      keyId: json['keyId'] as String?,
    );
  }

  Map<String, Object?> toJson() => {
        'packId': packId,
        'name': name,
        'version': version,
        'author': author,
        'source': source.name,
        'teaserViewMode': teaserViewMode,
        'blurb': blurb,
        'installed': installed,
        'signed': signed,
        'keyId': keyId,
      };
}

class VisualPack {
  const VisualPack({
    required this.summary,
    this.appearance,
    this.scenes = const [],
    this.defaultViewMode = 'cards',
    this.supportedViewModes = const ['cards'],
  });

  final VisualPackSummary summary;
  final DashboardAppearance? appearance;
  final List<Scene> scenes;
  final String defaultViewMode;
  final List<String> supportedViewModes;

  factory VisualPack.parse(Map<String, Object?> json) {
    final summaryRaw = json['summary'];
    final scenesRaw = json['scenes'];
    final appearanceRaw = json['appearance'];
    final modesRaw = json['supportedViewModes'];
    return VisualPack(
      summary: summaryRaw is Map
          ? VisualPackSummary.parse(Map<String, Object?>.from(summaryRaw))
          : VisualPackSummary.parse(json),
      appearance: appearanceRaw is Map
          ? DashboardAppearance.parse(Map<String, Object?>.from(appearanceRaw))
          : null,
      scenes: scenesRaw is List
          ? [
              for (final s in scenesRaw)
                if (s is Map) Scene.parse(Map<String, Object?>.from(s)),
            ]
          : const [],
      defaultViewMode: json['defaultViewMode'] as String? ?? 'cards',
      supportedViewModes: modesRaw is List ? [for (final m in modesRaw) '$m'] : const ['cards'],
    );
  }

  Map<String, Object?> toJson() => {
        ...summary.toJson(),
        'appearance': appearance?.toJson(),
        'scenes': [for (final s in scenes) s.toJson()],
        'defaultViewMode': defaultViewMode,
        'supportedViewModes': supportedViewModes,
      };
}
