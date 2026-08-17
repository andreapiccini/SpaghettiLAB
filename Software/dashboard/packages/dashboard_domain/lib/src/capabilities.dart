class SystemCapabilities {
  const SystemCapabilities({
    this.customThemes = true,
    this.marketplace = true,
    this.whiteLabel = false,
    this.animations = true,
    this.kioskLock = false,
    this.customViews = false,
    this.appearanceLocked = false,
    this.rbac = false,
  });

  final bool customThemes;
  final bool marketplace;
  final bool whiteLabel;
  final bool animations;
  final bool kioskLock;
  final bool customViews;
  final bool appearanceLocked;
  final bool rbac;

  factory SystemCapabilities.parse(Map<String, Object?> json) {
    return SystemCapabilities(
      customThemes: json['customThemes'] as bool? ?? true,
      marketplace: json['marketplace'] as bool? ?? true,
      whiteLabel: json['whiteLabel'] as bool? ?? false,
      animations: json['animations'] as bool? ?? true,
      kioskLock: json['kioskLock'] as bool? ?? false,
      customViews: json['customViews'] as bool? ?? false,
      appearanceLocked: json['appearanceLocked'] as bool? ?? false,
      rbac: json['rbac'] as bool? ?? false,
    );
  }

  Map<String, Object?> toJson() => {
        'customThemes': customThemes,
        'marketplace': marketplace,
        'whiteLabel': whiteLabel,
        'animations': animations,
        'kioskLock': kioskLock,
        'customViews': customViews,
        'appearanceLocked': appearanceLocked,
        'rbac': rbac,
      };
}
