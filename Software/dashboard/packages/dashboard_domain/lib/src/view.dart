enum ViewModeKind { cards, schematic, topDown, firstPerson, custom }

String viewKindWire(ViewModeKind kind) {
  return switch (kind) {
    ViewModeKind.topDown => 'top_down',
    ViewModeKind.firstPerson => 'first_person',
    _ => kind.name,
  };
}

ViewModeKind parseViewKind(String raw) {
  return switch (raw) {
    'top_down' => ViewModeKind.topDown,
    'first_person' => ViewModeKind.firstPerson,
    _ => ViewModeKind.values.byName(raw),
  };
}

class ViewPreset {
  const ViewPreset({
    required this.viewId,
    required this.kind,
    this.sceneRef,
    this.layoutRef,
    this.packRef,
  });

  final String viewId;
  final ViewModeKind kind;
  final String? sceneRef;
  final String? layoutRef;
  final String? packRef;

  static const ViewPreset cards = ViewPreset(
    viewId: 'default-cards',
    kind: ViewModeKind.cards,
    layoutRef: 'home',
  );

  ViewPreset copyWith({
    String? viewId,
    ViewModeKind? kind,
    String? sceneRef,
    String? layoutRef,
    String? packRef,
  }) {
    return ViewPreset(
      viewId: viewId ?? this.viewId,
      kind: kind ?? this.kind,
      sceneRef: sceneRef ?? this.sceneRef,
      layoutRef: layoutRef ?? this.layoutRef,
      packRef: packRef ?? this.packRef,
    );
  }

  factory ViewPreset.parse(Map<String, Object?> json) {
    return ViewPreset(
      viewId: json['viewId'] as String? ?? 'default',
      kind: parseViewKind(json['kind'] as String? ?? 'cards'),
      sceneRef: json['sceneRef'] as String?,
      layoutRef: json['layoutRef'] as String?,
      packRef: json['packRef'] as String?,
    );
  }

  Map<String, Object?> toJson() => {
        'viewId': viewId,
        'kind': viewKindWire(kind),
        'sceneRef': sceneRef,
        'layoutRef': layoutRef,
        'packRef': packRef,
      };
}
