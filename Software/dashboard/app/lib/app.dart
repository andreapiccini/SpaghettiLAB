import 'dart:async';

import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:flutter/material.dart';

import 'host/host_scope.dart';
import 'renderers/cards_renderer.dart';
import 'renderers/view_renderer.dart';
import 'screens/appearance_screen.dart';
import 'screens/card_style_editor_screen.dart';
import 'screens/connect_screen.dart';
import 'screens/login_screen.dart';
import 'screens/marketplace_screen.dart';
import 'screens/overview_screen.dart';
import 'screens/point_detail_sheet.dart';
import 'screens/select_site_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/widget_picker_screen.dart';
import 'theme/appearance_scope.dart';
import 'theme/spaghetti_theme.dart';
import 'widgets/app_states.dart';
import 'widgets/glass.dart';
import 'widgets/kiosk_radial_menu.dart';

class DashboardApp extends StatefulWidget {
  const DashboardApp({super.key, required this.host});

  final HostPort host;

  @override
  State<DashboardApp> createState() => _DashboardAppState();
}

class _DashboardAppState extends State<DashboardApp> {
  static const _allDestinations = [
    (icon: Icons.link_outlined, label: 'Host', dest: _Dest.host, scope: null),
    (icon: Icons.dashboard_outlined, label: 'Panoramica', dest: _Dest.overview, scope: null),
    (icon: Icons.grid_view_rounded, label: 'Canvas', dest: _Dest.canvas, scope: null),
    (icon: Icons.palette_outlined, label: 'Aspetto', dest: _Dest.appearance, scope: HostScopes.dashboardAppearanceEdit),
    (icon: Icons.storefront_outlined, label: 'Pack', dest: _Dest.packs, scope: HostScopes.dashboardMarketplace),
    (icon: Icons.tune, label: 'Impostazioni', dest: _Dest.settings, scope: null),
  ];

  late final AppearanceController _appearance;
  late final ViewRendererRegistry _registry;
  List<LabSystem> _systems = const [];
  List<ExposurePoint> _points = const [];
  List<VisualPackSummary> _packs = const [];
  List<CardStyle> _cardStyles = const [];
  DashboardLayout? _layout;
  ViewPreset _view = ViewPreset.cards;
  Scene? _scene;
  LabSystem? _system;
  SystemCapabilities _capabilities = const SystemCapabilities();
  AuthSession? _session;
  _Dest _dest = _Dest.canvas;
  bool _kioskNavVisible = false;
  bool _loading = true;
  String? _bootError;
  StreamSubscription<HostEvent>? _sub;

  String get _id => _system?.systemId ?? FakeHost.demoSystemId;

  List<({IconData icon, String label, _Dest dest, String? scope})> get _destinations {
    final session = _session;
    return [
      for (final d in _allDestinations)
        if (d.scope == null || (session?.allows(d.scope!) ?? false)) d,
    ];
  }

  int get _navIndex {
    final i = _destinations.indexWhere((d) => d.dest == _dest);
    return i < 0 ? 0 : i;
  }

  bool get _needsSite {
    final session = _session;
    if (session == null) return false;
    return session.selectedSite == null && session.sites.length > 1;
  }

  bool _allows(String scope) => _session?.allows(scope) ?? false;

  @override
  void initState() {
    super.initState();
    _appearance = AppearanceController(widget.host, FakeHost.demoSystemId);
    _appearance.addListener(_onAppearance);
    _registry = createBuiltinRegistry();
    _boot();
  }

  Future<void> _boot() async {
    try {
      final session = await widget.host.currentSession();
      if (!mounted) return;
      if (session == null || (session.selectedSite == null && session.sites.length > 1)) {
        setState(() {
          _session = session;
          _loading = false;
        });
        return;
      }
      _session = session;
      await _loadWorkspace();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _bootError = 'internal';
        _loading = false;
      });
    }
  }

  Future<void> _loadWorkspace() async {
    final systems = await widget.host.listSystems();
    if (!mounted) return;
    setState(() => _systems = systems);
    await _bindSystem(systems.first);
    if (!mounted) return;
    setState(() => _loading = false);
  }

  Future<void> _enterSession(AuthSession session) async {
    setState(() {
      _session = session;
      _bootError = null;
    });
    if (session.selectedSite == null && session.sites.length > 1) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    try {
      await _loadWorkspace();
    } on HostException catch (error) {
      if (!mounted) return;
      setState(() {
        _bootError = error.code;
        _loading = false;
      });
    }
  }

  Future<void> _logout() async {
    final sub = _sub;
    _sub = null;
    if (!mounted) return;
    setState(() {
      _session = null;
      _system = null;
      _dest = _Dest.canvas;
      _kioskNavVisible = false;
      _loading = false;
      _bootError = null;
    });
    await sub?.cancel();
    try {
      await widget.host.logout();
    } on HostException {
      // already signed out locally
    }
  }

  Future<void> _guarded(Future<void> Function() run) async {
    try {
      await run();
    } on HostException catch (error) {
      if (error.code == 'unauthorized') {
        await _logout();
      }
    }
  }

  Future<void> _bindSystem(LabSystem system, {_Dest? dest}) async {
    _appearance.bind(system.systemId);
    await _appearance.load();
    final points = await widget.host.getPoints(system.systemId);
    final packs = await widget.host.listVisualPacks();
    final cardStyles = await widget.host.listCardStyles();
    final layout = await widget.host.getLayout(system.systemId);
    final view = await widget.host.getView(system.systemId);
    final capabilities = await widget.host.getCapabilities(system.systemId);
    final scene = view.sceneRef == null ? null : await widget.host.getScene(system.systemId, view.sceneRef!);
    await _sub?.cancel();
    _sub = widget.host.watch(system.systemId).listen(_onEvent);
    if (!mounted) return;
    setState(() {
      _system = system;
      _points = points;
      _packs = packs;
      _cardStyles = cardStyles;
      _layout = layout;
      _view = view;
      _scene = scene;
      _capabilities = capabilities;
      if (dest != null) _dest = dest;
    });
  }

  void _onAppearance() {
    if (mounted) setState(() {});
  }

  Future<void> _onEvent(HostEvent event) async {
    try {
      switch (event) {
      case PointUpdated():
        final points = await widget.host.getPoints(_id);
        if (mounted) setState(() => _points = points);
      case AppearanceUpdated():
        await _appearance.load();
        await _reloadView();
      case SystemStatusUpdated():
        if (!mounted) return;
        LabSystem patch(LabSystem system) => LabSystem(
              systemId: system.systemId,
              name: system.name,
              connectionState: event.online ? ConnectionStatus.connected : ConnectionStatus.disconnected,
              hostAddress: system.hostAddress,
              lastSeen: DateTime.now().toUtc(),
            );
        setState(() {
          _systems = [
            for (final system in _systems)
              if (system.systemId == event.systemId) patch(system) else system,
          ];
          if (_system?.systemId == event.systemId) {
            _system = patch(_system!);
          }
        });
    }
    } on HostException catch (error) {
      if (error.code == 'unauthorized') await _logout();
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    _appearance.removeListener(_onAppearance);
    _appearance.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appearance = _appearance.appearance;
    final system = _system;
    return HostScope(
      host: widget.host,
      systemId: _id,
      child: AppearanceScope(
        appearance: appearance,
        child: MaterialApp(
          title: 'SpaghettiLAB',
          debugShowCheckedModeBanner: false,
          theme: spaghettiTheme(appearance),
          home: Builder(
            builder: (context) {
              if (_bootError != null) {
                return Scaffold(
                  body: ErrorPanel(
                    title: hostErrorTitle(_bootError!),
                    onRetry: () {
                      setState(() {
                        _loading = true;
                        _bootError = null;
                      });
                      unawaited(_boot());
                    },
                  ),
                );
              }
              if (_loading) {
                return const Scaffold(body: LoadingView());
              }
              if (_session == null) {
                return LoginScreen(
                  key: const ValueKey('login-screen'),
                  onSubmit: (email, password) async {
                    final session = await widget.host.login(email: email, password: password);
                    if (!mounted) return;
                    await _enterSession(session);
                  },
                );
              }
              if (_needsSite) {
                return SelectSiteScreen(
                  session: _session!,
                  onPick: (siteId) => unawaited(() async {
                    try {
                      final session = await widget.host.selectSite(siteId);
                      if (!mounted) return;
                      await _enterSession(session);
                    } on HostException catch (error) {
                      if (!mounted) return;
                      setState(() => _bootError = error.code);
                    }
                  }()),
                );
              }
              final body = _page(context, appearance, system);
              final kiosk = appearance.displayMode == DisplayMode.kiosk;
              final showBottomBar = appearance.menuStyle == ShellMenuStyle.bottomBar && !kiosk;
              final showRail = appearance.menuStyle == ShellMenuStyle.rail && !kiosk;
              return Stack(
                children: [
                  Scaffold(
                    appBar: kiosk
                        ? null
                        : AppBar(
                            toolbarHeight: 116,
                            titleSpacing: TokenSpace.md,
                            title: Semantics(
                              label: appearance.brand.name ?? 'SpaghettiLAB',
                              child: Image.asset(
                                'assets/logo.png',
                                height: 100,
                                fit: BoxFit.contain,
                                filterQuality: FilterQuality.high,
                              ),
                            ),
                            flexibleSpace: const FrostBar(child: SizedBox.expand()),
                          ),
                    bottomNavigationBar: showBottomBar
                        ? FrostBar(
                            child: NavigationBar(
                              backgroundColor: Colors.transparent,
                              selectedIndex: _navIndex,
                              onDestinationSelected: (i) => setState(() => _dest = _destinations[i].dest),
                              destinations: [
                                for (final d in _destinations)
                                  NavigationDestination(icon: Icon(d.icon), label: d.label),
                              ],
                            ),
                          )
                        : null,
                    body: showRail
                        ? Row(
                            children: [
                              NavigationRail(
                                selectedIndex: _navIndex,
                                onDestinationSelected: (i) => setState(() => _dest = _destinations[i].dest),
                                labelType: NavigationRailLabelType.all,
                                destinations: [
                                  for (final d in _destinations)
                                    NavigationRailDestination(icon: Icon(d.icon), label: Text(d.label)),
                                ],
                              ),
                              const VerticalDivider(width: 1),
                              Expanded(child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1200), child: body))),
                            ],
                          )
                        : Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 1200),
                              child: body,
                            ),
                          ),
                  ),
                  if (kiosk)
                    Positioned.fill(
                      child: KioskRadialMenu(
                        open: _kioskNavVisible,
                        onToggle: () => setState(() => _kioskNavVisible = !_kioskNavVisible),
                        items: [
                          for (final d in _destinations)
                            KioskRadialItem(
                              id: d.dest.name,
                              icon: d.icon,
                              label: d.label,
                              selected: d.dest == _dest,
                              onTap: () => setState(() {
                                _dest = d.dest;
                                _kioskNavVisible = false;
                              }),
                            ),
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _page(BuildContext context, DashboardAppearance appearance, LabSystem? system) {
    return switch (_dest) {
      _Dest.host => ConnectScreen(
          systems: _systems,
          canCreate: _allows(HostScopes.hostSystemManage),
          onOpen: (next) => unawaited(_bindSystem(next, dest: _Dest.overview)),
          onCreate: ({required String name, String address = ''}) async {
            final created = await widget.host.createSystem(name: name, address: address);
            final systems = await widget.host.listSystems();
            if (!mounted) return;
            setState(() => _systems = systems);
            await _bindSystem(created, dest: _Dest.overview);
          },
        ),
      _Dest.overview => OverviewScreen(
          system: system ?? _placeholderSystem,
          points: _points,
          onOpenCanvas: () => setState(() => _dest = _Dest.canvas),
          onOpenAppearance: _allows(HostScopes.dashboardAppearanceEdit)
              ? () => setState(() => _dest = _Dest.appearance)
              : null,
          onOpenMarketplace: _allows(HostScopes.dashboardMarketplace)
              ? () => setState(() => _dest = _Dest.packs)
              : null,
          onOpenSettings: () => setState(() => _dest = _Dest.settings),
          onRefresh: () async {
            final id = _id;
            final points = await widget.host.getPoints(id);
            if (mounted) setState(() => _points = points);
          },
          onOpenPoint: (point) {
            unawaited(
              openPointDetail(
                context,
                point: point,
                appearance: appearance,
                onCommand: _allows(HostScopes.dashboardCommand)
                    ? (value) => unawaited(_guarded(() => widget.host.sendCommand(_id, point.pointId, value)))
                    : null,
                loadHistory: () => widget.host.getPointHistory(_id, point.pointId),
              ),
            );
          },
        ),
      _Dest.canvas => _buildCanvas(context, appearance, system),
      _Dest.appearance => AppearanceScreen(
          appearance: appearance,
          previewPoints: _points,
          onChanged: (next) => unawaited(_appearance.save(next)),
          onReset: () => unawaited(_appearance.save(DashboardAppearance.lightDefaults)),
        ),
      _Dest.packs => MarketplaceScreen(
          packs: _packs,
          cardStyles: _cardStyles,
          onApply: (id) => unawaited(_appearance.applyPack(id)),
          onInstallStyle: _installCardStyle,
          onInstallExample: _installExamplePack,
          onInstallStore: _installStorePack,
          onEditStyle: _allows(HostScopes.dashboardMarketplace)
              ? (style) async {
                  await _editCardStyle(context, style);
                }
              : null,
          onCreateStyle: _allows(HostScopes.dashboardMarketplace) ? () => unawaited(_editCardStyle(context, newCustomCardStyle())) : null,
        ),
      _Dest.settings => SettingsScreen(
          appearance: appearance,
          system: system ?? _placeholderSystem,
          capabilities: _capabilities,
          session: _session,
          onLogout: () => unawaited(_logout()),
          onDisplayMode: (mode) {
            setState(() {
              if (mode != DisplayMode.kiosk) _kioskNavVisible = false;
            });
            unawaited(_appearance.save(appearance.copyWith(displayMode: mode)));
          },
          onOpenAppearance: _allows(HostScopes.dashboardAppearanceEdit)
              ? () => setState(() => _dest = _Dest.appearance)
              : null,
          onOpenMarketplace: _allows(HostScopes.dashboardMarketplace)
              ? () => setState(() => _dest = _Dest.packs)
              : null,
          host: widget.host,
          siteId: _session?.selectedSite?.siteId,
          canManageUsers: _allows(HostScopes.hostUserManage),
          canRequestSupport: _allows(HostScopes.hostSupportGrantApprove),
        ),
    };
  }

  Widget _buildCanvas(BuildContext context, DashboardAppearance appearance, LabSystem? system) {
    final renderer = _registry.resolve(_view.kind);
    if (renderer == null) return UnavailableView(kind: _view.kind);
    return renderer.build(
      context,
      ViewRenderContext(
        kind: _view.kind,
        appearance: appearance,
        points: _points,
        layout: _layout,
        scene: _scene,
        cardStyles: _cardStyles,
        canCommand: _allows(HostScopes.dashboardCommand),
        canEditLayout: _allows(HostScopes.dashboardLayoutEdit),
        canEditAppearance: _allows(HostScopes.dashboardAppearanceEdit),
        onCommand: (pointId, value) {
          unawaited(_guarded(() => widget.host.sendCommand(_id, pointId, value)));
        },
        onCustomizeAppearance: _allows(HostScopes.dashboardAppearanceEdit)
            ? () => setState(() => _dest = _Dest.appearance)
            : null,
        onAddWidget: _allows(HostScopes.dashboardLayoutEdit) ? () => unawaited(_addWidget(context)) : null,
        onChangeView: (kind) => unawaited(_setView(kind, system)),
        onSaveScene: _allows(HostScopes.dashboardLayoutEdit) ? (scene) => unawaited(_saveScene(scene)) : null,
        onSaveLayout: _allows(HostScopes.dashboardLayoutEdit) ? (layout) => unawaited(_saveLayout(layout)) : null,
        onEditCardStyle: _allows(HostScopes.dashboardMarketplace)
            ? (widget, point) => unawaited(_editWidgetStyle(context, widget, point))
            : null,
        onHistory: (pointId) => widget.host.getPointHistory(_id, pointId),
      ),
    );
  }

  Future<void> _addWidget(BuildContext context) async {
    final onCanvas = {
      for (final page in _layout?.pages ?? const <DashboardPage>[])
        for (final w in page.widgets) w.pointId,
    };
    final picked = await openWidgetPicker(
      context,
      points: _points,
      onCanvas: onCanvas,
      cardStyles: _cardStyles,
      onInstallStyle: _installCardStyle,
    );
    if (picked == null) return;
    final layout = _layout ?? await widget.host.getLayout(_id);
    final page = layout.pages.isEmpty
        ? const DashboardPage(pageId: 'home', title: 'Casa', widgets: [])
        : layout.pages.first;
    final next = DashboardLayout(
      pages: [
        DashboardPage(
          pageId: page.pageId,
          title: page.title,
          widgets: [
            ...page.widgets,
            DashboardWidget(
              widgetId: 'w-${page.widgets.length}',
              pointId: picked.point.pointId,
              visualHint: picked.style.hint.name,
              styleId: picked.style.styleId,
              height: cardSlotHeight(visualHint: picked.style.hint.name, style: picked.style),
              column: page.widgets.length % 2,
              row: page.widgets.length ~/ 2,
            ),
          ],
        ),
      ],
    );
    await widget.host.putLayout(_id, next);
    if (mounted) setState(() => _layout = next);
  }

  Future<void> _saveLayout(DashboardLayout layout) async {
    await widget.host.putLayout(_id, layout);
    if (mounted) setState(() => _layout = layout);
  }

  Future<void> _reloadView() async {
    final id = _id;
    final view = await widget.host.getView(id);
    final scene = view.sceneRef == null ? null : await widget.host.getScene(id, view.sceneRef!);
    if (mounted) {
      setState(() {
        _view = view;
        _scene = scene;
      });
    }
  }

  Future<void> _setView(ViewModeKind kind, LabSystem? system) async {
    final id = system?.systemId ?? _id;
    final view = switch (kind) {
      ViewModeKind.schematic => const ViewPreset(
          viewId: 'schema',
          kind: ViewModeKind.schematic,
          sceneRef: 'machine',
        ),
      _ => ViewPreset.cards,
    };
    await widget.host.putView(id, view);
    final scene = view.sceneRef == null ? null : await widget.host.getScene(id, view.sceneRef!);
    if (mounted) {
      setState(() {
        _view = view;
        _scene = scene;
      });
    }
  }

  Future<void> _saveScene(Scene scene) async {
    await widget.host.putScene(_id, scene);
    if (mounted) setState(() => _scene = scene);
  }

  Future<void> _installExamplePack() async {
    await widget.host.installLocalPack(exampleLocalWalkPack());
    final packs = await widget.host.listVisualPacks();
    if (mounted) setState(() => _packs = packs);
  }

  Future<void> _installStorePack(String packId) async {
    await widget.host.installStorePack(packId);
    final packs = await widget.host.listVisualPacks();
    if (mounted) setState(() => _packs = packs);
  }

  Future<void> _installCardStyle(String styleId) async {
    await widget.host.installCardStyle(styleId);
    final styles = await widget.host.listCardStyles();
    if (mounted) setState(() => _cardStyles = styles);
  }

  Future<CardStyle?> _editCardStyle(BuildContext context, CardStyle style, {ExposurePoint? preview}) async {
    final saved = await openCardStyleEditor(
      context,
      style: style,
      appearance: _appearance.appearance,
      previewPoint: preview,
    );
    if (saved == null) return null;
    await widget.host.putCardStyle(saved);
    final styles = await widget.host.listCardStyles();
    if (mounted) setState(() => _cardStyles = styles);
    return saved;
  }

  Future<void> _editWidgetStyle(BuildContext context, DashboardWidget canvasWidget, ExposurePoint point) async {
    final current = _cardStyles.where((s) => s.styleId == canvasWidget.styleId);
    final CardStyle base;
    if (current.isEmpty) {
      base = newCustomCardStyle().copyWith(hint: point.visualHint, effect: _effectFor(point));
    } else if (current.first.source == PackSource.local) {
      base = current.first;
    } else {
      base = current.first.copyWith(
        styleId: newCustomCardStyle().styleId,
        name: '${current.first.name} (custom)',
        source: PackSource.local,
        installed: true,
      );
    }
    final saved = await _editCardStyle(context, base, preview: point);
    if (saved == null || canvasWidget.styleId == saved.styleId) return;
    final layout = _layout;
    if (layout == null || layout.pages.isEmpty) return;
    final page = layout.pages.first;
    await _saveLayout(
      DashboardLayout(
        pages: [
          DashboardPage(
            pageId: page.pageId,
            title: page.title,
            widgets: [
              for (final w in page.widgets)
                if (w.widgetId == canvasWidget.widgetId)
                  DashboardWidget(
                    widgetId: w.widgetId,
                    pointId: w.pointId,
                    visualHint: w.visualHint,
                    styleId: saved.styleId,
                    column: w.column,
                    row: w.row,
                    width: w.width,
                    height: w.height,
                  )
                else
                  w,
            ],
          ),
        ],
      ),
    );
  }

  CardEffect _effectFor(ExposurePoint point) {
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
}

const _placeholderSystem = LabSystem(
  systemId: FakeHost.demoSystemId,
  name: 'Casa demo',
  connectionState: ConnectionStatus.connecting,
);

enum _Dest { host, overview, canvas, appearance, packs, settings }

