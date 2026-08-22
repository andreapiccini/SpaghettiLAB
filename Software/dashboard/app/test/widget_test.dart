import 'package:dashboard_app/app.dart';
import 'package:dashboard_app/theme/spaghetti_theme.dart';
import 'package:dashboard_app/widgets/app_states.dart';
import 'package:dashboard_app/widgets/edit_jiggle.dart';
import 'package:dashboard_domain/dashboard_domain.dart';
import 'package:dashboard_host/dashboard_host.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _pumpApp(WidgetTester tester, {required HostPort host}) async {
  await tester.binding.setSurfaceSize(const Size(1280, 800));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(DashboardApp(host: host));
  await tester.pump();
  await tester.pumpAndSettle();
}

Future<void> _openTab(WidgetTester tester, String label) async {
  await tester.tap(
    find.descendant(of: find.byType(NavigationBar), matching: find.text(label)),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('canvas shows demo temperature and pump', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    expect(find.text('Temperatura salotto'), findsOneWidget);
    expect(find.text('Pompa giardino'), findsOneWidget);
    expect(find.text('Ferma'), findsWidgets);
    await tester.tap(find.byType(Switch).first);
    await tester.pump();
    expect(find.text('In funzione'), findsOneWidget);
    expect(find.byKey(const ValueKey('pump-glyph')), findsOneWidget);
  });

  testWidgets('schema view shows machine scene', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Schema'));
    await tester.pumpAndSettle();
    expect(find.text('Schema'), findsWidgets);
    expect(find.text('Pompa'), findsWidgets);
  });

  testWidgets('schema edit jiggles cards and can remove one', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Schema'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Modifica'));
    await tester.pumpAndSettle();
    expect(find.byType(EditJiggle), findsWidgets);
    expect(find.byKey(const ValueKey('remove-node-pump')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('remove-node-pump')));
    await tester.pumpAndSettle();
    expect(find.text('Pompa'), findsNothing);
    final scene = await host.getScene(FakeHost.demoSystemId, 'machine');
    expect(scene.nodes.any((n) => n.nodeId == 'pump'), isFalse);
  });

  testWidgets('schema edit can add a node and remove a wire', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Schema'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Modifica'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('edge-handle-in-pump')));
    await tester.pumpAndSettle();
    expect(find.text('Aggiungi card'), findsOneWidget);
    expect(find.text('Aggiungi nodo'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('schema-add-node')));
    await tester.pumpAndSettle();
    expect(find.text('Nodo'), findsOneWidget);
    var scene = await host.getScene(FakeHost.demoSystemId, 'machine');
    expect(scene.nodes.any((n) => n.label == 'Nodo'), isTrue);
    expect(scene.edges.any((e) => e.from == 'in' && e.to == 'pump'), isFalse);

    await tester.tap(find.byKey(const ValueKey('edge-handle-temp-pump')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('schema-remove-edge')));
    await tester.pumpAndSettle();
    scene = await host.getScene(FakeHost.demoSystemId, 'machine');
    expect(scene.edges.any((e) => e.from == 'temp' && e.to == 'pump'), isFalse);
  });

  testWidgets('schema edit can add a card from the chrome', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Schema'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Modifica'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('view-add')));
    await tester.pumpAndSettle();
    expect(find.text('Aggiungi card'), findsOneWidget);
    await tester.tap(find.text('Luce ingresso'));
    await tester.pumpAndSettle();
    expect(find.text('Luce ingresso'), findsOneWidget);
    final scene = await host.getScene(FakeHost.demoSystemId, 'machine');
    expect(scene.nodes.any((n) => n.pointId == 'ingresso.luce'), isTrue);
  });

  testWidgets('canvas tap opens point detail', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Temperatura salotto'));
    await tester.pumpAndSettle();
    expect(find.text('Storico'), findsOneWidget);
  });

  testWidgets('overview shortcuts and appearance editor', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Panoramica');
    expect(find.text('Casa demo'), findsWidgets);
    expect(find.text('Nessun allarme'), findsOneWidget);
    await tester.tap(find.text('Aspetto').first);
    await tester.pumpAndSettle();
    expect(find.text('Ripristina default'), findsOneWidget);
  });

  testWidgets('marketplace apply asks confirmation', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Pack');
    expect(find.text('Stili card'), findsOneWidget);
    expect(find.text('Nuovo stile'), findsOneWidget);
    expect(find.text('Modifica'), findsWidgets);
    expect(find.text('Lampadina'), findsWidgets);
    await tester.tap(find.text('Installa esempio SDK'));
    await tester.pump();
    await tester.pump();
    final marketScroll = find.descendant(
      of: find.byKey(const ValueKey('marketplace-list')),
      matching: find.byType(Scrollable),
    );
    await tester.scrollUntilVisible(find.text('Numero grande'), 200, scrollable: marketScroll);
    expect(find.text('Scarica'), findsWidgets);
    await tester.scrollUntilVisible(find.text('Esempio SDK'), 200, scrollable: marketScroll);
    expect(find.text('Esempio SDK'), findsWidgets);
    await tester.scrollUntilVisible(find.text('Notte'), 200, scrollable: marketScroll);
    expect(find.text('Firmato'), findsWidgets);
    final install = find.byKey(const ValueKey('store-install-notte'));
    await tester.scrollUntilVisible(install, 200, scrollable: marketScroll);
    await tester.ensureVisible(install);
    await tester.pumpAndSettle();
    await tester.tap(install);
    await tester.pump();
    await tester.pump();
    expect(find.widgetWithText(FilledButton, 'Applica'), findsWidgets);
    await tester.tap(find.widgetWithText(FilledButton, 'Applica').hitTestable().first);
    await tester.pumpAndSettle();
    expect(find.text('Annulla'), findsOneWidget);
  });

  testWidgets('card style editor opens from marketplace', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Pack');
    await tester.tap(find.byKey(const ValueKey('card-style-new')));
    await tester.pumpAndSettle();
    expect(find.text('Stile card'), findsOneWidget);
    expect(find.text('Grafica'), findsOneWidget);
    expect(find.byKey(const ValueKey('card-style-preview')), findsOneWidget);
    await tester.fling(find.byKey(const ValueKey('card-style-controls')), const Offset(0, -500), 1200);
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('card-style-preview')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('card-style-save')));
    await tester.pumpAndSettle();
    expect((await host.listCardStyles()).any((s) => s.styleId.startsWith('custom.')), isTrue);
  });

  testWidgets('settings expose kiosk mode', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Impostazioni');
    expect(find.text('Kiosk'), findsOneWidget);
  });

  testWidgets('kiosk opens radial menu instead of bottom bar', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Impostazioni');
    await tester.tap(find.text('Kiosk'));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsNothing);
    expect(find.byKey(const ValueKey('kiosk-menu')), findsOneWidget);
    expect(find.byKey(const ValueKey('kiosk-radial-overview')), findsNothing);
    await tester.tap(find.byKey(const ValueKey('kiosk-menu')));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsNothing);
    expect(find.byKey(const ValueKey('kiosk-radial-overview')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('kiosk-radial-overview')));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('kiosk-radial-overview')), findsNothing);
    expect(find.byType(NavigationBar), findsNothing);
  });

  testWidgets('edit mode opens widget picker', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Modifica'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Aggiungi'));
    await tester.pumpAndSettle();
    expect(find.text('Cerca per nome'), findsOneWidget);
    expect(find.text('Sensori'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Luminosità'),
      120,
      scrollable: find.descendant(of: find.byKey(const ValueKey('picker-points')), matching: find.byType(Scrollable)),
    );
    await tester.tap(find.text('Luminosità'));
    await tester.pumpAndSettle();
    expect(find.text('Stile card'), findsOneWidget);
    expect(find.text('Gauge ad arco'), findsOneWidget);
    expect(find.text('Scarica dal marketplace'), findsOneWidget);
    expect(find.text('Numero grande'), findsOneWidget);
  });

  testWidgets('edit mode can reorder and remove cards', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.tap(find.text('Modifica'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('drag-w-0')), findsOneWidget);
    final from = tester.getCenter(find.byKey(const ValueKey('drag-w-0')));
    final to = tester.getCenter(find.byKey(const ValueKey('slot-w-1')));
    await tester.timedDrag(
      find.byKey(const ValueKey('drag-w-0')),
      to - from,
      const Duration(milliseconds: 280),
    );
    await tester.pumpAndSettle();
    expect(
      (await host.getLayout(FakeHost.demoSystemId)).pages.first.widgets.first.pointId,
      'giardino.pompa',
    );
    await tester.tap(find.byKey(const ValueKey('remove-w-1')));
    await tester.pumpAndSettle();
    expect(
      (await host.getLayout(FakeHost.demoSystemId)).pages.first.widgets.any((w) => w.widgetId == 'w-1'),
      isFalse,
    );
  });

  testWidgets('connect opens core live from protocol adapter', (tester) async {
    final host = CompositeHost(demo: FakeHost(), live: EdgeHost());
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Host');
    expect(find.text('Casa demo'), findsWidgets);
    expect(find.text('Core live'), findsOneWidget);
    await tester.tap(find.text('Core live'));
    await tester.pumpAndSettle();
    expect(find.text('Core live'), findsWidgets);
    await _openTab(tester, 'Canvas');
    expect(find.text('Temperatura salotto'), findsOneWidget);
    expect(find.text('Pompa giardino'), findsOneWidget);
    await host.sendCommand(EdgeHost.liveSystemId, 'giardino.pompa', true);
    await tester.pump();
    await tester.pump();
    expect(
      (await host.getPoints(EdgeHost.liveSystemId)).firstWhere((p) => p.pointId == 'giardino.pompa').visualState,
      'running',
    );
  });

  testWidgets('empty state shows action', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: spaghettiTheme(DashboardAppearance.darkDefaults),
        home: Scaffold(
          body: EmptyState(title: 'Vuoto', actionLabel: 'Ok', onAction: () {}),
        ),
      ),
    );
    expect(find.text('Vuoto'), findsOneWidget);
    expect(find.text('Ok'), findsOneWidget);
  });

  testWidgets('login required host shows Accedi then canvas', (tester) async {
    final host = FakeHost(requireLogin: true);
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    expect(find.byKey(const ValueKey('login-submit')), findsOneWidget);
    expect(find.text('Accedi'), findsWidgets);
    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoViewerEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'viewer');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Temperatura salotto'), findsOneWidget);
    expect(find.text('Pack'), findsNothing);
    expect(find.text('Aspetto'), findsNothing);
    expect(find.text('Modifica'), findsNothing);
    expect(tester.widget<Switch>(find.byType(Switch).first).onChanged, isNull);
  });

  testWidgets('operator can command but cannot edit layout', (tester) async {
    final host = FakeHost(requireLogin: true);
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoOperatorEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'operator');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Modifica'), findsNothing);
    expect(find.text('Pack'), findsNothing);
    await tester.tap(find.byType(Switch).first);
    await tester.pump();
    expect(find.text('In funzione'), findsOneWidget);
  });

  testWidgets('partner console lists portfolio, brand and grant request', (tester) async {
    final host = FakeHost(requireLogin: true);
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoPartnerEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'partner');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('partner-console')), findsOneWidget);
    expect(find.text('Serra nord'), findsOneWidget);
    expect(find.text('Cliente prospect'), findsOneWidget);
    expect(find.text('Showroom Blu'), findsNothing);

    await tester.tap(find.byKey(const ValueKey('request-access-site-prospect')));
    await tester.pumpAndSettle();
    expect(find.textContaining('Grant in attesa', skipOffstage: false), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('apply-brand-site-serra')));
    await tester.pumpAndSettle();
    expect(find.textContaining('brand garden', skipOffstage: false), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('queue-package-site-serra')));
    await tester.pumpAndSettle();
    expect(find.textContaining('Update in coda', skipOffstage: false), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('open-site-site-serra')));
    await tester.pumpAndSettle();
    expect(find.text('Temperatura salotto'), findsOneWidget);
    expect(find.text('Pack'), findsOneWidget);
  });

  testWidgets('logout returns to login', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Impostazioni');
    expect(find.text('Admin demo'), findsOneWidget);
    expect(find.byKey(const ValueKey('logout')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('logout')));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('login-screen')), findsOneWidget);
  });

  testWidgets('viewer cannot see site users tab', (tester) async {
    final host = FakeHost(requireLogin: true);
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoViewerEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'viewer');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    await _openTab(tester, 'Impostazioni');
    expect(find.text('Utenti'), findsNothing);
    expect(find.byKey(const ValueKey('invite-user')), findsNothing);
  });

  testWidgets('site admin invites and revokes users', (tester) async {
    final host = FakeHost();
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);
    await _openTab(tester, 'Impostazioni');
    expect(find.text('Utenti'), findsOneWidget);
    await tester.tap(find.text('Utenti'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('invite-user')), findsOneWidget);
    expect(find.text('Viewer demo'), findsOneWidget);
    expect(find.textContaining('Questa sessione', skipOffstage: false), findsOneWidget);
    final settingsScroll = find.descendant(
      of: find.byKey(const ValueKey('settings-list')),
      matching: find.byType(Scrollable),
    );

    await tester.tap(find.byKey(const ValueKey('invite-user')));
    await tester.pumpAndSettle();
    expect(find.text('Integratore'), findsNothing);
    await tester.enterText(find.byKey(const ValueKey('invite-email')), 'ospite@demo.local');
    await tester.tap(find.byKey(const ValueKey('invite-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Invito inviato'), findsOneWidget);
    await tester.tap(find.text('Ok'));
    await tester.pumpAndSettle();
    expect(find.textContaining('ospite@demo.local', skipOffstage: false), findsOneWidget);
    expect(find.textContaining('Invitato', skipOffstage: false), findsOneWidget);

    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('revoke-user-user-viewer')),
      200,
      scrollable: settingsScroll,
    );
    await tester.tap(find.byKey(const ValueKey('revoke-user-user-viewer')));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Revoca'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Revocato', skipOffstage: false), findsOneWidget);
  });

  testWidgets('support waits for grant then site admin can approve', (tester) async {
    final host = FakeHost(requireLogin: true);
    addTearDown(host.dispose);
    await _pumpApp(tester, host: host);

    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoSupportEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'support');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('awaiting-grant')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('awaiting-grant-logout')));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoAdminEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'admin');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    await _openTab(tester, 'Impostazioni');
    await tester.tap(find.text('Supporto'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('request-support')));
    await tester.pumpAndSettle();
    expect(find.textContaining('In attesa', skipOffstage: false), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('approve-grant-grant-1')));
    await tester.pumpAndSettle();
    expect(find.textContaining('Sessione attiva', skipOffstage: false), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('logout')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('login-email')), FakeHost.demoSupportEmail);
    await tester.enterText(find.byKey(const ValueKey('login-password')), 'support');
    await tester.tap(find.byKey(const ValueKey('login-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Temperatura salotto'), findsOneWidget);
    expect(find.text('Modifica'), findsNothing);
    expect(tester.widget<Switch>(find.byType(Switch).first).onChanged, isNull);
  });
}
