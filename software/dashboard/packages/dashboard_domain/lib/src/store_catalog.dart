import 'appearance.dart';
import 'pack_signature.dart';
import 'visual_pack.dart';

/// Builtin signed store catalog. JSON + builtin renderer only — no Dart eval.
VisualPack storeNottePack() {
  return VisualPack(
    summary: const VisualPackSummary(
      packId: 'notte',
      name: 'Notte',
      version: '1.0.0',
      author: 'SpaghettiLAB',
      source: PackSource.marketplace,
      teaserViewMode: 'cards',
      blurb: 'Tema scuro firmato dallo store. Solo JSON + cards builtin.',
      installed: false,
      signed: true,
      keyId: spaghettiLabStoreKeyId,
    ),
    appearance: const DashboardAppearance(
      colors: {'accent': '#7DD3FC'},
      background: BackgroundSpec(
        kind: BackgroundKind.gradient,
        colors: ['#0f172a', '#020617'],
      ),
      animationProfile: AnimationProfile.subtle,
      brand: BrandSpec(name: 'Notte'),
    ),
    defaultViewMode: 'cards',
    supportedViewModes: const ['cards'],
  );
}

List<SignedPack> builtinSignedStore() => [PackSigner.dev().sign(storeNottePack())];
