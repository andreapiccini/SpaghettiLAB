import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

/// Tokens aligned with host editor (React Flow) — light studio, dark kiosk.
abstract final class TokenColors {
  static const bgApp = Color(0xFF0F1114);
  static const bgSurface = Color(0xFF1A1D23);
  static const bgElevated = Color(0xFF242830);
  static const textPrimary = Color(0xFFF4F5F7);
  static const textSecondary = Color(0xFF9AA3B2);
  static const accent = Color(0xFF3F77DA);
  static const accentGlow = Color(0xFF00C4CC);
  static const ok = Color(0xFF1F9D55);
  static const warn = Color(0xFFB36B00);
  static const error = Color(0xFFD6373D);
  static const offline = Color(0xFF8A8F99);
  static const border = Color(0xFF2E3440);

  static const lightBgApp = Color(0xFFF5F6F7);
  static const lightBgSurface = Color(0xFFFFFFFF);
  static const lightBgElevated = Color(0xFFF8F9FC);
  static const lightTextPrimary = Color(0xFF14171F);
  static const lightTextSecondary = Color(0xFF4B4F58);
  static const lightTextFaint = Color(0xFF8A8F99);
  static const lightBorder = Color(0xFFE1E4EB);
}

abstract final class TokenSpace {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

abstract final class TokenRadius {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 28.0;
  static const mark = lg;
}

/// Card e controlli: tutti gli angoli stondati (`radius.lg`).
BorderRadius tokenCardRadius([double scale = 1]) {
  return BorderRadius.circular(TokenRadius.lg * scale);
}

RoundedRectangleBorder tokenDropShape([double scale = 1]) {
  return RoundedRectangleBorder(borderRadius: tokenCardRadius(scale));
}

/// Hover/press: velo accent, non grigio (il grigio M3 coincide con `bg.app`).
WidgetStateProperty<Color?> tokenInkOverlay(bool light) {
  return WidgetStateProperty.resolveWith((states) {
    if (states.contains(WidgetState.pressed)) {
      return TokenColors.accent.withValues(alpha: light ? 0.16 : 0.28);
    }
    if (states.contains(WidgetState.hovered) || states.contains(WidgetState.focused)) {
      return TokenColors.accent.withValues(alpha: light ? 0.12 : 0.22);
    }
    return null;
  });
}

WidgetStateProperty<Color?> tokenInkOverlayOf(BuildContext context) {
  return tokenInkOverlay(Theme.of(context).brightness == Brightness.light);
}

Color tokenHoverFill(BuildContext context) {
  return TokenColors.accent.withValues(
    alpha: Theme.of(context).brightness == Brightness.light ? 0.12 : 0.22,
  );
}

List<BoxShadow> get tokenShadowE1 => const [
      BoxShadow(color: Color(0x0F14171F), blurRadius: 8, offset: Offset(0, 2)),
      BoxShadow(color: Color(0x0F14171F), blurRadius: 2, offset: Offset(0, 1)),
    ];

List<BoxShadow> get tokenShadowE2 => const [
      BoxShadow(color: Color(0x1A14171F), blurRadius: 18, offset: Offset(0, 6)),
      BoxShadow(color: Color(0x1414171F), blurRadius: 6, offset: Offset(0, 2)),
    ];

Color parseHexColor(String hex, [Color fallback = TokenColors.accent]) {
  var value = hex.trim();
  if (value.startsWith('#')) value = value.substring(1);
  if (value.length != 6) return fallback;
  return Color(int.parse(value, radix: 16) + 0xFF000000);
}

bool appearanceIsDark(DashboardAppearance appearance) {
  final override = appearance.colors['bg.app'];
  final hex = override ??
      (appearance.background.colors.isNotEmpty ? appearance.background.colors.first : '#F5F6F7');
  return parseHexColor(hex, TokenColors.lightBgApp).computeLuminance() < 0.42;
}

Duration tokenMotion(AnimationProfile profile) {
  return switch (profile) {
    AnimationProfile.subtle => const Duration(milliseconds: 400),
    AnimationProfile.standard => const Duration(milliseconds: 250),
    AnimationProfile.rich => const Duration(milliseconds: 180),
  };
}

Duration pumpPeriod(AnimationProfile profile) {
  return switch (profile) {
    AnimationProfile.subtle => const Duration(milliseconds: 1200),
    AnimationProfile.standard => const Duration(milliseconds: 900),
    AnimationProfile.rich => const Duration(milliseconds: 700),
  };
}

ThemeData spaghettiTheme(DashboardAppearance appearance, {bool? light}) {
  final isLight = light ?? !appearanceIsDark(appearance);
  Color c(String token, Color fallback) => parseHexColor(appearance.color(token, ''), fallback);

  final bg = c('bg.app', isLight ? TokenColors.lightBgApp : TokenColors.bgApp);
  final surface = c('bg.surface', isLight ? TokenColors.lightBgSurface : TokenColors.bgSurface);
  final elevated = c('bg.elevated', isLight ? TokenColors.lightBgElevated : TokenColors.bgElevated);
  final text = c('text.primary', isLight ? TokenColors.lightTextPrimary : TokenColors.textPrimary);
  final muted = c('text.secondary', isLight ? TokenColors.lightTextSecondary : TokenColors.textSecondary);
  final accent = c('accent', TokenColors.accent);
  final scheme = ColorScheme(
    brightness: isLight ? Brightness.light : Brightness.dark,
    primary: accent,
    onPrimary: Colors.white,
    secondary: c('ok', TokenColors.ok),
    onSecondary: Colors.white,
    error: c('error', TokenColors.error),
    onError: Colors.white,
    surface: surface,
    onSurface: text,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: scheme.brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: bg,
    canvasColor: bg,
    cardColor: surface,
    dividerColor: c('border', isLight ? TokenColors.lightBorder : TokenColors.border),
    cardTheme: CardThemeData(
      clipBehavior: Clip.antiAlias,
      elevation: 0,
      color: surface,
      shadowColor: const Color(0x1414171F),
      margin: const EdgeInsets.only(bottom: TokenSpace.sm),
      shape: tokenDropShape(),
    ),
    splashFactory: InkSparkle.splashFactory,
    hoverColor: accent.withValues(alpha: isLight ? 0.12 : 0.22),
    highlightColor: accent.withValues(alpha: isLight ? 0.08 : 0.16),
    splashColor: accent.withValues(alpha: isLight ? 0.16 : 0.28),
    focusColor: accent.withValues(alpha: isLight ? 0.12 : 0.22),
    listTileTheme: ListTileThemeData(
      shape: tokenDropShape(),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: text,
      elevation: 0,
      scrolledUnderElevation: 0,
      toolbarHeight: 116,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: text,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: isLight ? const Color(0xCCFFFFFF) : elevated.withValues(alpha: 0.92),
      elevation: 0,
      indicatorColor: accent.withValues(alpha: 0.14),
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: muted, letterSpacing: 0.2),
      ),
    ),
    chipTheme: ChipThemeData(
      color: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return accent.withValues(alpha: 0.16);
        if (states.contains(WidgetState.hovered) ||
            states.contains(WidgetState.pressed) ||
            states.contains(WidgetState.focused)) {
          return accent.withValues(alpha: isLight ? 0.12 : 0.22);
        }
        return isLight ? TokenColors.lightBgSurface : elevated;
      }),
      backgroundColor: isLight ? TokenColors.lightBgSurface : elevated,
      selectedColor: accent.withValues(alpha: 0.16),
      side: BorderSide(color: isLight ? TokenColors.lightBorder : TokenColors.border),
      elevation: 1,
      pressElevation: 1,
      shadowColor: const Color(0x1A14171F),
      surfaceTintColor: Colors.transparent,
      labelStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: text),
      shape: tokenDropShape(0.85),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: tokenDropShape(0.85),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        elevation: 0,
        shape: tokenDropShape(0.85),
        side: BorderSide(color: isLight ? TokenColors.lightBorder : TokenColors.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isLight ? TokenColors.lightBgSurface : elevated,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: tokenCardRadius(0.85),
        borderSide: BorderSide(color: isLight ? const Color(0xFFC5CAD3) : TokenColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: tokenCardRadius(0.85),
        borderSide: BorderSide(color: isLight ? const Color(0xFFC5CAD3) : TokenColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: tokenCardRadius(0.85),
        borderSide: BorderSide(color: accent, width: 1.5),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        visualDensity: VisualDensity.compact,
        side: const WidgetStatePropertyAll(BorderSide.none),
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return accent;
          return isLight ? const Color(0xFFF8F9FC) : elevated;
        }),
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return Colors.white;
          return text;
        }),
        shape: WidgetStatePropertyAll(tokenDropShape(0.85)),
      ),
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: 44 * appearance.typeDisplayScale,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.2,
        height: 1.05,
        color: text,
      ),
      headlineMedium: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: text,
      ),
      titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: text),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.35, color: text),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: muted),
    ),
  );
}
